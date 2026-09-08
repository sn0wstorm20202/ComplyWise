"""Grounded question answering over published evidence.

Authority: PRD_v2.0 §24, §P4, §P5; TRD_v2.0 §4; §9A.6.

Two stages, in this order and no other:

1. **Retrieve** evidence records from the knowledge base by keyword overlap.
2. **Summarise** only those excerpts, using the configured `LLMProvider`.

The model never answers from its own knowledge of Indian regulation. It receives the
retrieved excerpts and is instructed to answer from them alone, so every sentence
traces to a citation the user can open. If retrieval returns nothing, no model call is
made at all — there is nothing to ground an answer in, and a plausible answer with no
citation is the failure mode this whole layer exists to prevent.

The assistant also never decides applicability. That is `ApplicabilityEngine`'s job,
against structured rules; this endpoint explains what sources say.
"""

from __future__ import annotations

import re
from typing import Any

from common.enums import SourceStatus
from apps.evidence.models import Evidence
from domain.providers import (
    ChatMessage,
    LLMProvider,
    ProviderError,
    ProviderNotConfigured,
    get_llm_provider,
)

#: Maximum evidence records fed to the model. Bounded so a prompt cannot grow
#: without limit as the knowledge base does.
MAX_CITATIONS = 6

#: Minimum token length for a query word to count. Shorter words ("the", "is")
#: match everything and would make retrieval meaningless.
MIN_TOKEN_LENGTH = 4

#: Function words that survive the length filter but carry no topic. Without this,
#: a question sharing only "what" or "need" with an excerpt scores as a match.
STOPWORDS = frozenset(
    {
        "about", "also", "another", "does", "each", "from", "have", "here", "into",
        "just", "like", "list", "more", "most", "much", "must", "need", "needs",
        "only", "other", "please", "same", "should", "some", "such", "tell", "than",
        "that", "them", "then", "there", "these", "they", "this", "those", "very",
        "want", "were", "what", "when", "where", "which", "will", "with", "would",
        "your",
    }
)

#: Share of a question's topic words that an excerpt must match to be cited.
#: A single shared generic word ("rules") is not relevance: it produced citations
#: for questions the knowledge base says nothing about.
MIN_QUERY_COVERAGE = 0.5

#: Grounding levels reported to the caller, so the frontend can show how much
#: weight an answer carries rather than presenting all answers identically.
GROUNDED = "GROUNDED_IN_CITED_EVIDENCE"
NO_EVIDENCE = "NO_MATCHING_EVIDENCE"
NOT_CONFIGURED = "CITATIONS_ONLY_NO_LLM_CONFIGURED"
LLM_FAILED = "CITATIONS_ONLY_LLM_UNAVAILABLE"

DISCLAIMER = (
    "This is compliance guidance drawn from the cited sources, not official legal "
    "counsel, and it does not determine whether a requirement applies to your business. "
    "Applicability is decided by the rule engine against your business profile."
)

SYSTEM_PROMPT = (
    "You are a regulatory research assistant for Indian industrial compliance.\n"
    "\n"
    "Answer ONLY from the numbered source excerpts provided in the user message.\n"
    "Rules you must follow:\n"
    "- Cite the excerpt number in square brackets after each claim, e.g. [2].\n"
    "- If the excerpts do not answer the question, say exactly what is missing. "
    "Do not fill the gap from your own knowledge of Indian law.\n"
    "- Never state a fee, threshold, deadline, penalty or section number that does "
    "not appear verbatim in an excerpt.\n"
    "- Never state that a requirement applies to the user. You do not have their "
    "business profile, and applicability is decided elsewhere.\n"
    "- Be concise: at most two short paragraphs."
)


def _tokens(text: str) -> list[str]:
    """Topic words in `text`: long enough to discriminate, not a function word."""
    return [
        w
        for w in re.findall(r"[a-z0-9]+", text.lower())
        if len(w) >= MIN_TOKEN_LENGTH and w not in STOPWORDS
    ]


def retrieve_evidence(prompt: str, *, limit: int = MAX_CITATIONS) -> list[Evidence]:
    """Evidence records whose text overlaps the question, best match first.

    Keyword overlap, not embeddings: no vector index over evidence exists yet, and
    a `pgvector` retrieval layer is a later task (§14). Only evidence from ACTIVE
    sources is returned, so a withdrawn notification cannot be quoted as current.

    A record must match at least `MIN_QUERY_COVERAGE` of the question's topic words.
    Returns an empty list when nothing clears that bar, and there is deliberately no
    "return the first few anyway" fallback — the previous implementation had one,
    which attached unrelated citations to an unrelated answer and made an ungrounded
    reply look sourced.
    """
    query_tokens = set(_tokens(prompt))
    if not query_tokens:
        return []

    threshold = max(1, round(len(query_tokens) * MIN_QUERY_COVERAGE))

    scored: list[tuple[int, str, Evidence]] = []
    for ev in Evidence.objects.filter(source__status=SourceStatus.ACTIVE).select_related("source"):
        haystack = set(
            _tokens(f"{ev.excerpt} {ev.locator} {ev.source.title} {ev.source.authority}")
        )
        overlap = len(query_tokens & haystack)
        if overlap >= threshold:
            # evidence_id breaks ties deterministically: the same question must
            # return the same citations on every call.
            scored.append((overlap, ev.evidence_id, ev))

    scored.sort(key=lambda row: (-row[0], row[1]))
    return [ev for _, _, ev in scored[:limit]]


def _citation(index: int, ev: Evidence) -> dict[str, Any]:
    return {
        "index": index,
        "evidence_id": ev.evidence_id,
        "authority": ev.source.authority,
        "source_title": ev.source.title,
        "locator": ev.locator,
        "excerpt": ev.excerpt,
        "verification_status": ev.verification_status,
        "canonical_url": ev.source.canonical_url,
    }


def _build_user_message(prompt: str, citations: list[dict[str, Any]]) -> str:
    """Render the excerpts as a numbered list the model must cite back into."""
    blocks: list[str] = []
    for citation in citations:
        header = f"[{citation['index']}] {citation['authority']} — {citation['source_title']}"
        if citation["locator"]:
            header = f"{header} ({citation['locator']})"
        blocks.append(f"{header}\n{citation['excerpt']}")
    return "SOURCE EXCERPTS:\n\n" + "\n\n".join(blocks) + f"\n\nQUESTION: {prompt}"


def answer_question(
    prompt: str,
    *,
    provider: LLMProvider | None = None,
    business: Any = None,
) -> dict[str, Any]:
    """Answer `prompt` from cited evidence and business compliance plan, degrading honestly at every step."""
    evidence = retrieve_evidence(prompt)
    citations = [_citation(i, ev) for i, ev in enumerate(evidence, start=1)]

    base: dict[str, Any] = {
        "prompt": prompt,
        "business_id": str(business.id) if business else None,
        "business_name": business.name if business else None,
        "citations": citations,
        "citation_count": len(citations),
        "disclaimer": DISCLAIMER,
    }

    # If no business is provided and no evidence matched, maintain strict citations-only grounding contract
    if business is None and not citations:
        return {
            **base,
            "answer": (
                "No evidence in the knowledge base matches this question, so it cannot "
                "be answered from a cited source. The ingested knowledge currently "
                "covers a limited set of authorities and domains."
            ),
            "grounding_level": NO_EVIDENCE,
            "answer_generated": False,
        }

    llm = provider or get_llm_provider()

    # Build business-aware context if business is provided
    if business is not None:
        from apps.applicability.models import DecisionRun
        from common.enums import ApplicabilityStatus
        from domain.context.business_context import build_business_context
        from domain.intelligence.document_derivation import derive_business_documents
        from domain.intelligence.scheme_discovery import discover_business_schemes
        from domain.intelligence.standards_discovery import discover_business_standards
        from domain.intelligence.workflow_derivation import derive_business_workflows

        ctx = build_business_context(business)
        dec_run = DecisionRun.objects.filter(business=business).order_by("-created_at").first()
        req_lines: list[str] = []
        if dec_run:
            for r in dec_run.results.filter(status=ApplicabilityStatus.APPLICABLE):
                req_lines.append(f"- {r.requirement_name} (Code: {r.requirement_id})")

        docs_res = derive_business_documents(business, context=ctx)
        doc_lines = [f"- {d['name']} (for {d['requirement_name']})" for d in docs_res.get("documents", [])[:6]]

        wf_res = derive_business_workflows(business, context=ctx)
        wf_lines = [f"- {w['title']} ({w['total_steps']} steps via {w['portal_name']})" for w in wf_res.get("workflows", [])[:4]]

        scheme_res = discover_business_schemes(business, context=ctx)
        scheme_lines = [f"- {s['name']} ({s['benefit']})" for s in scheme_res.get("schemes", [])[:3]]

        standards_res = discover_business_standards(business, context=ctx)
        std_lines = [f"- {st['standard_code']}: {st['title']} ({st['nature']})" for st in standards_res.get("standards", [])[:3]]

        biz_system_prompt = f"""You are ComplyWise AI, an expert industrial compliance advisor.
You are directly advising the founder of {business.name}.

BUSINESS PROFILE:
- Business: {business.name}
- Jurisdiction / State: {ctx.state_name} ({ctx.state})
- Operational Description: {ctx.product_description}
- Enterprise Scale: {ctx.msme_scale} (under MSMED Act 2020)
- Trade Intent: {ctx.trade_intent}

EVALUATED STATUTORY COMPLIANCE PLAN:
{chr(10).join(req_lines) if req_lines else 'Assessment in progress'}

DOCUMENTS NEEDED:
{chr(10).join(doc_lines) if doc_lines else 'Document checklist being compiled'}

CLEARANCE WORKFLOWS:
{chr(10).join(wf_lines) if wf_lines else 'Workflows being structured'}

MATCHING GOVERNMENT SCHEMES & INCENTIVES:
{chr(10).join(scheme_lines) if scheme_lines else 'None identified'}

APPLICABLE PRODUCT STANDARDS & QCOs:
{chr(10).join(std_lines) if std_lines else 'None identified'}

INSTRUCTIONS:
1. Answer the founder's specific questions directly using their company's evaluated compliance plan and details above.
2. Sequence prerequisites logically (e.g. Consent to Establish before factory construction, Factory Plan approval before machinery installation, FSSAI before commercial production).
3. If source excerpts are provided below, cite them in brackets [1], [2].
4. Be professional, clear, encouraging, and structured in your response."""

        user_content = prompt
        if citations:
            user_content = _build_user_message(prompt, citations)

        messages = [
            ChatMessage(role="system", content=biz_system_prompt),
            ChatMessage(role="user", content=user_content),
        ]
    else:
        messages = [
            ChatMessage(role="system", content=SYSTEM_PROMPT),
            ChatMessage(role="user", content=_build_user_message(prompt, citations)),
        ]

    try:
        result = llm.complete(messages, temperature=0.0, max_output_tokens=900)
    except ProviderNotConfigured as exc:
        return {
            **base,
            "answer": (
                "No language model is configured, so the sources below are returned "
                "without a written summary. They are the passages that match the "
                "question and can be read directly."
            ),
            "grounding_level": NOT_CONFIGURED,
            "answer_generated": False,
            "provider_note": str(exc),
        }
    except ProviderError as exc:
        return {
            **base,
            "answer": (
                "The language model could not be reached, so the sources below are "
                "returned without a written summary."
            ),
            "grounding_level": LLM_FAILED,
            "answer_generated": False,
            "provider_note": str(exc),
        }

    return {
        **base,
        "answer": result.text,
        "grounding_level": GROUNDED if citations else "GROUNDED_IN_BUSINESS_COMPLIANCE_PLAN",
        "answer_generated": True,
        "business_context_used": business is not None,
        "generated_by": {"provider": result.provider, "model": result.model},
    }
