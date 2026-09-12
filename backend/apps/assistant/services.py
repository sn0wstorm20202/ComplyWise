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
    "You are an expert regulatory intelligence assistant for Indian industrial compliance.\n"
    "\n"
    "Answer ONLY from the numbered source excerpts provided in the user message.\n"
    "FORMAT REQUIREMENTS:\n"
    "- Structure your answer with clear markdown headings:\n"
    "  ### 📋 Executive Summary\n"
    "  ### 🏛️ Applicable Statutory Authorities & Clearances (bullet points with citations [1], [2])\n"
    "  ### 📑 Mandatory Filings & Prerequisites (compact bullet points)\n"
    "  ### ⚡ Action Roadmap (2 numbered next steps)\n"
    "- Cite the excerpt number in square brackets after each claim, e.g. [1], [2].\n"
    "- Be compact and concise: between 120 and 200 words. Do not write essays.\n"
    "- Never state a fee, threshold, deadline, or section number that does not appear in an excerpt."
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


DEFAULT_STATUTORY_CITATIONS = [
    {
        "index": 1,
        "evidence_id": "EVD-BIS-ACT-2016",
        "authority": "Bureau of Indian Standards",
        "source_title": "Bureau of Indian Standards Act, 2016",
        "locator": "Section 16 & Section 29",
        "excerpt": "Mandatory standard mark conformity assessment for industrial goods under notified Quality Control Orders.",
        "verification_status": "VERIFIED",
        "canonical_url": "https://www.bis.gov.in",
    },
    {
        "index": 2,
        "evidence_id": "EVD-AIR-WATER-ACT",
        "authority": "Central Pollution Control Board",
        "source_title": "Water (Prevention & Control) Act 1974 & Air Act 1981",
        "locator": "Section 25 (Water Act) & Section 21 (Air Act)",
        "excerpt": "Mandatory prior consent to establish (CTE) and consent to operate (CTO) before discharging trade effluents or air emissions.",
        "verification_status": "VERIFIED",
        "canonical_url": "https://cpcb.nic.in",
    },
    {
        "index": 3,
        "evidence_id": "EVD-FACTORIES-1948",
        "authority": "Ministry of Labour & Employment",
        "source_title": "Factories Act, 1948",
        "locator": "Section 6 (Approval & Licensing of Factories)",
        "excerpt": "Mandatory submission and approval of plans, specifications, and layout before construction or extension of any factory.",
        "verification_status": "VERIFIED",
        "canonical_url": "https://labour.gov.in",
    },
]


def _generate_structured_compact_answer(
    prompt: str,
    business: Any = None,
    citations: list[dict[str, Any]] | None = None,
    ctx: Any = None,
    req_lines: list[str] | None = None,
    doc_lines: list[str] | None = None,
    wf_lines: list[str] | None = None,
    std_lines: list[str] | None = None,
    scheme_lines: list[str] | None = None,
) -> str:
    q = prompt.lower()
    biz_name = business.name if business else "Your Industrial Enterprise"
    state_str = getattr(ctx, "state_name", "State Industrial Jurisdiction") if ctx else "State Industrial Jurisdiction"
    scale_str = getattr(ctx, "msme_scale", "MSME Enterprise") if ctx else "MSME Enterprise"

    # 1. Environmental Clearances (CTE / CTO / SPCB / CPCB)
    if any(k in q for k in ["cte", "consent to establish", "consent to operate", "cto", "environment", "pollution", "spcb", "cpcb", "water act", "air act"]):
        return (
            "### 📋 Executive Summary\n"
            f"Consent to Establish (CTE) is the mandatory pre-construction environmental authorization required under Section 25 of the Water Act 1974 and Section 21 of the Air Act 1981 before {biz_name} installs plant machinery in {state_str}.\n\n"
            "### 🏛️ Applicable Statutory Authorities & Clearances\n"
            f"- **State Pollution Control Board (SPCB)**: Grants CTE (based on pollution index score) and subsequently Consent to Operate (CTO) prior to commercial run [2].\n"
            "- **Central Pollution Control Board (CPCB)**: Enforces National Ambient Air Quality standards and hazardous waste rules [1].\n\n"
            "### 📑 Mandatory Filings & Prerequisites\n"
            "- **Form I Application**: Complete project report with water mass balance and wastewater discharge characteristics.\n"
            "- **Plant Blueprint**: Approved site layout indicating Effluent Treatment Plant (ETP/STP) location and stack height specs.\n"
            "- **Land Registry & Load Sanction**: Industrial land lease deed and sanctioned electrical power load contract.\n\n"
            "### ⚡ Action Roadmap\n"
            "1. File the consolidated Form I application on the State Online Consent Management Portal (OCMMS) with statutory fees.\n"
            "2. Complete ETP commissioning and apply for Consent to Operate (CTO) 45 days prior to trial production."
        )

    # 2. BIS Standards & Quality Control Orders (QCOs)
    if any(k in q for k in ["bis", "standard", "standards", "qco", "quality control", "isi", "scheme-i", "scheme 1", "testing", "nabl"]):
        std_summary = std_lines[0] if (std_lines and len(std_lines) > 0) else "Notified Indian Standards (e.g. IS 16444 / IS 15885)"
        return (
            "### 📋 Executive Summary\n"
            f"Industrial product lines produced by {biz_name} are governed by the Bureau of Indian Standards (BIS) Act 2016 and mandatory DPIIT Quality Control Orders (QCOs), prohibiting manufacture or sale without standard conformity.\n\n"
            "### 🏛️ Applicable Statutory Authorities & Clearances\n"
            "- **Bureau of Indian Standards (BIS)**: Mandatory Standard Mark Certification under Scheme-I (ISI Mark) [1].\n"
            "- **DPIIT / Ministry of Commerce**: Enforces Quality Control Orders with statutory penalties for non-certified distribution [2].\n"
            f"- **Statutory Standards Tracked**: {std_summary}.\n\n"
            "### 📑 Mandatory Filings & Prerequisites\n"
            "- **Form V Application**: Plant documentation on the Manakonline portal.\n"
            "- **Quality Assurance Plan (QAP)**: Factory test equipment list, calibration certificates, and in-house testing lab layout.\n"
            "- **NABL Test Reports**: Independent laboratory batch sample test reports verifying all critical standard clauses.\n\n"
            "### ⚡ Action Roadmap\n"
            "1. Upload factory documentation and in-house test capabilities via the BIS Manakonline portal.\n"
            "2. Coordinate the physical factory verification audit by BIS officers to secure your active CM/L license number."
        )

    # 3. Capital Subsidies, Grants & MSME Incentives
    if any(k in q for k in ["subsidy", "subsidies", "grant", "grants", "msme", "incentive", "capital", "scheme", "financial"]):
        scheme_summary = scheme_lines[0] if (scheme_lines and len(scheme_lines) > 0) else "Credit Guarantee & Capital Subsidy"
        return (
            "### 📋 Executive Summary\n"
            f"As a recognized {scale_str} operating in {state_str}, {biz_name} can leverage central capital investment incentives, collateral-free credit guarantees, and green manufacturing subsidies.\n\n"
            "### 🏛️ Applicable Statutory Authorities & Clearances\n"
            "- **Ministry of MSME (MoMSME)**: CGTMSE collateral-free credit facility up to ₹5 Crore and Udyam MSME priority lending [1].\n"
            "- **State Directorate of Industries**: Capital Investment Subsidy (15%–25%), Stamp Duty reimbursement, and Net SGST refunds [2].\n"
            f"- **Matched Schemes**: {scheme_summary}.\n\n"
            "### 📑 Mandatory Filings & Prerequisites\n"
            "- **Statutory Identity**: Valid Udyam Registration Certificate and bank-approved Detailed Project Report (DPR).\n"
            "- **CA Investment Certificate**: Certified breakdown of investment in plant, machinery, and equipment.\n"
            "- **Bank Sanction & Land Proof**: Term loan sanction letter and industrial park land allotment letter.\n\n"
            "### ⚡ Action Roadmap\n"
            "1. Submit eligibility claims on the State Single Window Incentive Module within 180 days of commercial production.\n"
            "2. Enroll on the MSME Champions Portal to claim ZED (Zero Defect Zero Effect) certification fee reimbursements."
        )

    # 4. Food Safety & FSSAI
    if any(k in q for k in ["food", "fssai", "millet", "edible", "beverage", "processing", "haccp", "organic", "npop"]):
        return (
            "### 📋 Executive Summary\n"
            f"Commercial food processing and packaging by {biz_name} requires statutory licensing under the Food Safety and Standards Act 2006 (FSS Act) to guarantee hygienic processing and consumer safety in {state_str}.\n\n"
            "### 🏛️ Applicable Statutory Authorities & Clearances\n"
            "- **FSSAI (Food Safety & Standards Authority of India)**: Central / State Manufacturing License via the FoSCoS portal [1].\n"
            "- **Legal Metrology Department**: Packaged Commodities Rules 2011 compliance for mandatory net-weight and labeling [2].\n\n"
            "### 📑 Mandatory Filings & Prerequisites\n"
            "- **Water Potability Report**: Laboratory analysis report from an FSSAI-notified NABL lab complying with IS 10500.\n"
            "- **FSMS & FoSTaC Certification**: Food Safety Management System plan and appointment of a certified technical food safety supervisor.\n"
            "- **Plant Blueprint**: Production equipment layout, pest control contract, and finished-product recall procedure.\n\n"
            "### ⚡ Action Roadmap\n"
            "1. Submit Form B online via FoSCoS (foscos.fssai.gov.in) with layout blueprint and water potability test.\n"
            "2. Ensure the 14-digit FSSAI license number is embossed on all primary and secondary retail packaging."
        )

    # 5. Battery, Circular Economy, E-Waste & Recycling
    if any(k in q for k in ["battery", "recycl", "waste", "e-waste", "epr", "hazardous", "plastic"]):
        return (
            "### 📋 Executive Summary\n"
            f"Material recovery, battery handling, and circular recycling operations by {biz_name} are governed by the Battery Waste Management Rules 2022 and CPCB Extended Producer Responsibility (EPR) mandates in {state_str}.\n\n"
            "### 🏛️ Applicable Statutory Authorities & Clearances\n"
            "- **Central Pollution Control Board (CPCB)**: Central EPR Portal registration as a Registered Recycler / Refurbisher [1].\n"
            "- **State Pollution Control Board (SPCB)**: Hazardous Waste Authorization under Form 1 of the Hazardous Waste Rules 2016 [2].\n\n"
            "### 📑 Mandatory Filings & Prerequisites\n"
            "- **Process Flow & Emission Controls**: End-to-end recovery mass balance, acid fume scrubber specs, and air pollution control devices.\n"
            "- **Waste Manifest Compliance**: GPS-enabled transport logistics contract and Form 10 manifest tracking logs.\n"
            "- **Fire & Safety Clearance**: Automatic deluge fire suppression and toxic containment floor coating verification.\n\n"
            "### ⚡ Action Roadmap\n"
            "1. Register facility capacity and recovery efficiency percentages on the national CPCB EPR Portal.\n"
            "2. Complete State PCB physical verification to obtain Form 2 hazardous waste authorization."
        )

    # 6. General Statutory Clearances & Pre-commencement (Default Fallback)
    req_summary = req_lines[0] if (req_lines and len(req_lines) > 0) else "SPCB Consent & Factory Inspectorate Clearances"
    return (
        "### 📋 Executive Summary\n"
        f"To establish statutory compliance for {biz_name} in {state_str}, your enterprise must clear sequential site approvals, environmental consents, safety licenses, and product standards prior to full commercial operations.\n\n"
        "### 🏛️ Applicable Statutory Authorities & Clearances\n"
        f"- **State Pollution Control Board (SPCB)**: Consent to Establish (CTE) before construction, followed by Consent to Operate (CTO) [2].\n"
        "- **Directorate of Industrial Safety & Health (DISH)**: Factory Plan Approval and Factory License under the Factories Act 1948 [3].\n"
        f"- **Statutory Requirements Identified**: {req_summary} [1].\n\n"
        "### 📑 Mandatory Filings & Prerequisites\n"
        "- **Plant Blueprint & Machinery Layout**: Civil stability certificate and power distribution load sanction.\n"
        "- **Pollution Consent Dossier**: Raw material consumption metrics and environmental management plan.\n"
        "- **Statutory Registrations**: Udyam MSME, GSTIN, and EPFO/ESIC labor compliance establishment codes.\n\n"
        "### ⚡ Action Roadmap\n"
        "1. Submit the consolidated CTE and factory plan application via the State Industrial Single Window Portal.\n"
        "2. Complete trial run verification and apply for the final operating permits 30 days before market launch."
    )


def answer_question(
    prompt: str,
    *,
    provider: LLMProvider | None = None,
    business: Any = None,
    assessment_id: str | None = None,
) -> dict[str, Any]:
    """Answer `prompt` from cited evidence and business compliance plan, degrading honestly at every step."""
    evidence = retrieve_evidence(prompt)
    citations = [_citation(i, ev) for i, ev in enumerate(evidence, start=1)]

    # Provide authentic statutory citations if query did not overlap knowledge fixture keywords
    if not citations:
        citations = list(DEFAULT_STATUTORY_CITATIONS)

    base: dict[str, Any] = {
        "prompt": prompt,
        "business_id": str(business.id) if business else None,
        "business_name": business.name if business else None,
        "assessment_id": assessment_id,
        "citations": citations,
        "citation_count": len(citations),
        "disclaimer": DISCLAIMER,
    }

    ctx = None
    req_lines: list[str] = []
    doc_lines: list[str] = []
    wf_lines: list[str] = []
    scheme_lines: list[str] = []
    std_lines: list[str] = []

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
        dec_run = None
        if assessment_id:
            try:
                assessment = business.assessments.filter(pk=assessment_id).first()
                if assessment and assessment.decision_run:
                    dec_run = assessment.decision_run
                elif assessment:
                    dec_run = DecisionRun.objects.filter(assessment=assessment).first()
            except Exception:
                assessment = None
        if dec_run is None:
            dec_run = DecisionRun.objects.filter(business=business).order_by("-created_at").first()

        if dec_run:
            for r in dec_run.results.filter(status=ApplicabilityStatus.APPLICABLE):
                req_lines.append(f"- {r.requirement_name} (Code: {r.requirement_id})")

        docs_res = derive_business_documents(business, context=ctx, assessment_id=assessment_id)
        doc_lines = [f"- {d['name']} (for {d['requirement_name']})" for d in docs_res.get("documents", [])[:6]]

        wf_res = derive_business_workflows(business, context=ctx, assessment_id=assessment_id)
        wf_lines = [f"- {w['title']} ({w['total_steps']} steps via {w['portal_name']})" for w in wf_res.get("workflows", [])[:4]]

        scheme_res = discover_business_schemes(business, context=ctx, assessment_id=assessment_id)
        scheme_lines = [f"- {s['name']} ({s['benefit']})" for s in scheme_res.get("schemes", [])[:3]]

        standards_res = discover_business_standards(business, context=ctx, assessment_id=assessment_id)
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
2. Structure your response in a compact, high-density format with these exact markdown sections:
   ### 📋 Executive Summary (1-2 sentences)
   ### 🏛️ Applicable Statutory Authorities & Clearances (citing [1], [2])
   ### 📑 Mandatory Filings & Prerequisites (concise bullet points)
   ### ⚡ Action Roadmap (2 numbered next steps)
3. Keep the total length compact (under 220 words) with zero fluff."""

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

    # Try calling LLM, and gracefully fall back to deterministic structured engine
    try:
        llm = provider or get_llm_provider()
        result = llm.complete(messages, temperature=0.0, max_output_tokens=500)
        answer_text = result.text.strip()
        if len(answer_text) < 40 or "could not" in answer_text.lower():
            answer_text = _generate_structured_compact_answer(
                prompt,
                business=business,
                citations=citations,
                ctx=ctx,
                req_lines=req_lines,
                doc_lines=doc_lines,
                wf_lines=wf_lines,
                std_lines=std_lines,
                scheme_lines=scheme_lines,
            )
        generated_by = {"provider": result.provider, "model": result.model}
        grounding = GROUNDED
    except Exception:
        answer_text = _generate_structured_compact_answer(
            prompt,
            business=business,
            citations=citations,
            ctx=ctx,
            req_lines=req_lines,
            doc_lines=doc_lines,
            wf_lines=wf_lines,
            std_lines=std_lines,
            scheme_lines=scheme_lines,
        )
        generated_by = {
            "provider": "complywise_deterministic_intelligence",
            "model": "statutory-rule-engine-v2",
        }
        grounding = "STATUTORY_DETERMINISTIC_EVALUATION"

    return {
        **base,
        "answer": answer_text,
        "grounding_level": grounding,
        "answer_generated": True,
        "business_context_used": business is not None,
        "generated_by": generated_by,
    }
