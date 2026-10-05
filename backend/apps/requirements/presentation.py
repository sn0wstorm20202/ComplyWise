"""Recorded requirement metadata and decision explanations shared by workspace APIs."""

from __future__ import annotations

from typing import Any

from apps.evidence.models import Evidence
from apps.evidence.presentation import evidence_projection
from apps.knowledge.models import RequirementDefinition


def evidence_citations(references: list[Any], records: dict[str, Evidence]) -> list[dict[str, Any]]:
    """Render only persisted source passages; preserve reference order."""
    citations = []
    for reference in references:
        evidence_id = reference.get("evidence_id") if isinstance(reference, dict) else reference
        evidence = records.get(str(evidence_id))
        if evidence and evidence.source:
            citations.append(evidence_projection(evidence))
    return citations


def primary_citation(citations: list[dict[str, Any]]) -> dict[str, Any]:
    """Choose one stored record so source title, identity and link stay bound."""
    return next((citation for citation in citations if citation.get("canonical_url")),
                citations[0] if citations else {})


def decision_presentation(decision, definition):
    """Downgrade legacy unsafe standard claims without mutating saved decisions."""
    from apps.applicability.engine import _confirmed_product_scope

    trace = dict(decision.explanation_trace or {})
    status = decision.status
    if definition and definition.category.strip().upper() == "STANDARD" and status == "APPLICABLE":
        rule = decision.rule_version
        matched = next((evaluation.get("trace", {}) for evaluation in trace.get("evaluations", [])
                        if rule and evaluation.get("rule_id") == rule.rule_id
                        and evaluation.get("version") == rule.version), {})
        scope = trace.get("scope_evaluation") or {}
        if not (_confirmed_product_scope(matched, rule.condition_ast if rule else None) or
                _confirmed_product_scope(scope, (definition.metadata or {}).get("scope_ast"))):
            status = "UNVERIFIED"
            trace.update(status=status, evidence_reason="PRODUCT_SCOPE_NOT_ESTABLISHED")
    return status, trace


def standard_mandatory_status(decision, definition) -> bool | None:
    """Keep standard relevance separate from a source-backed legal mandate.

    This is shared by the standards list and its derived documents/workflows.
    An applicable standard can remain voluntary or have unresolved mandatory
    status; a metadata flag alone must never make its preparation items required.
    """
    from apps.evidence.presentation import source_projection
    from common.enums import KnowledgeStatus, SourceStatus, VerificationStatus

    if definition is None or definition.category.strip().upper() != "STANDARD":
        return None
    metadata = definition.metadata if isinstance(definition.metadata, dict) else {}
    if metadata.get("is_mandatory") is False:
        return False
    if metadata.get("is_mandatory") is not True or decision is None:
        return None
    status, _ = decision_presentation(decision, definition)
    rule = decision.rule_version
    reference = metadata.get("mandatory_reference")
    if (status != "APPLICABLE" or rule is None
            or decision.requirement_id != definition.requirement_id
            or rule.requirement_id != definition.id
            or definition.status != KnowledgeStatus.PUBLISHED
            or rule.status != KnowledgeStatus.PUBLISHED
            or not isinstance(reference, dict)
            or reference.get("rule_id") != rule.rule_id):
        return None
    mandatory_ids = reference.get("evidence_ids")
    if (not isinstance(mandatory_ids, list) or not mandatory_ids
            or not all(isinstance(identifier, str) and identifier for identifier in mandatory_ids)):
        return None
    decision_ids = set()
    for evidence_reference in decision.evidence_refs or []:
        evidence_id = evidence_reference.get("evidence_id") if isinstance(evidence_reference, dict) else evidence_reference
        if isinstance(evidence_id, str):
            decision_ids.add(evidence_id)
    rule_ids = {identifier for identifier in rule.evidence_refs or [] if isinstance(identifier, str)}
    if (not set(mandatory_ids).issubset(decision_ids)
            or not set(mandatory_ids).issubset(rule_ids)):
        return None
    evidence = list(Evidence.objects.filter(
        evidence_id__in=mandatory_ids, verification_status=VerificationStatus.VERIFIED,
        source__status=SourceStatus.ACTIVE,
    ).select_related("source"))
    if {record.evidence_id for record in evidence} != set(mandatory_ids):
        return None
    if any(not record.excerpt.strip() or not source_projection(record.source, record)["reviewed"]
           for record in evidence):
        return None
    return True


#: Requirement metadata keys carrying procedural detail, when knowledge records it.
DOCUMENTS_KEY = "required_documents"
FEE_KEY = "statutory_fee"
VALIDITY_KEY = "validity_period"
STEPS_KEY = "application_steps"
PORTAL_KEY = "portal"

#: Shown wherever published knowledge records nothing for a field. Stated rather
#: than left blank so the screen distinguishes "nothing required" from "unknown".
NOT_RECORDED = "Not recorded in published knowledge for this requirement."


def metadata_string_list(value: Any) -> list[str]:
    """Coerce a metadata value to a list of non-empty strings, or an empty list."""
    if not isinstance(value, list):
        return []
    return [str(item).strip() for item in value if str(item).strip()]


#: Human-readable renderings of the engine's trace reasons. Keyed on the same
#: constants the engine writes, so the sentence a user reads is derived from the
#: recorded decision rather than re-asserted here.
_REASON_SUMMARIES = {
    "PRODUCT_SCOPE_NOT_ESTABLISHED": (
        "The product matched narrative keywords, but no typed product-scope condition "
        "establishes mandatory coverage. This candidate needs a reviewed scope rule."
    ),
    "PRODUCT_SCOPE_UNRESOLVED": "A required product-scope fact is missing; applicability remains unresolved.",
    "INVALID_PRODUCT_SCOPE": "The recorded product-scope predicate is invalid and requires review.",
    "JURISDICTION_UNRESOLVED": (
        "The business jurisdiction is missing or could not be recognised, so this "
        "state-level requirement could not be decided."
    ),
    "JURISDICTION_NOT_MATCHED": (
        "This requirement belongs to a jurisdiction other than the one recorded for "
        "the business, so it was not evaluated against the profile."
    ),
    "NO_PUBLISHED_RULE": (
        "No published applicability rule exists for this requirement, so applicability "
        "could not be determined."
    ),
    "OUTSIDE_EFFECTIVE_WINDOW": (
        "Every published rule for this requirement is outside its effective date "
        "window on the evaluation date."
    ),
    "ZERO_EVIDENCE": (
        "The matched rule carries no supporting evidence, so the requirement cannot be "
        "reported as applicable."
    ),
    "DANGLING_EVIDENCE_REF": (
        "The matched rule cites an evidence record that is not present in the knowledge base."
    ),
    "FUTURE_EFFECTIVE_EVIDENCE": (
        "The supporting evidence takes effect after the evaluation date."
    ),
    "EXPIRED_EVIDENCE": "The supporting evidence expired before the evaluation date.",
    "CONFLICTING_EVIDENCE": ("The supporting evidence is marked as conflicting and needs review."),
    "UNVERIFIED_EVIDENCE": (
        "The supporting evidence has not been verified, so applicability is reported as unverified."
    ),
}


def recorded_decision_facts(trace: dict[str, Any]) -> dict[str, Any]:
    """Facts read by this saved decision, never today's mutable business profile."""
    facts = {}

    def collect(node):
        for key, value in node.get("variables_used", {}).items():
            if value is not None:
                facts[key] = value
        for child in node.get("children", []):
            collect(child)

    matched_id = trace.get("matched_rule_id")
    matched_version = trace.get("matched_rule_version")
    for evaluation in trace.get("evaluations", []):
        if not matched_id or (evaluation.get("rule_id") == matched_id and
                              (matched_version is None or evaluation.get("version") == matched_version)):
            collect(evaluation.get("trace", {}))
    if trace.get("scope_evaluation"):
        collect(trace["scope_evaluation"])
    return facts


def _fact_summary(trace: dict[str, Any]) -> str:
    from domain.profile.variables import get_variable

    parts = []
    for key, value in recorded_decision_facts(trace).items():
        variable = get_variable(key)
        label = variable.label if variable else key.replace("_", " ").capitalize()
        rendered = "Yes" if value is True else "No" if value is False else str(value)
        # This is a profile summary, not an evidence quote or legal conclusion.
        parts.append(f"{label}: {rendered[:500]}")
    return " Recorded facts: " + "; ".join(parts) + "." if parts else ""


def requirement_reason_summary(trace: dict[str, Any] | None, req_def: RequirementDefinition) -> str:
    """Explain the recorded outcome, reading only what the engine wrote.

    Never restates the decision in stronger terms than the trace supports: an
    unevaluated requirement says so instead of implying a profile was assessed.
    """
    if not trace:
        return (
            "This requirement has not been evaluated for this business. Run a "
            "regulatory analysis to produce a decision."
        )

    reason = trace.get("reason")
    if reason in _REASON_SUMMARIES:
        return _REASON_SUMMARIES[reason]

    evidence_reason = trace.get("evidence_reason")
    if evidence_reason in _REASON_SUMMARIES:
        return _REASON_SUMMARIES[evidence_reason] + _fact_summary(trace)

    rule_id = trace.get("matched_rule_id")
    outcome = trace.get("status", "")
    if rule_id:
        version = trace.get("matched_rule_version")
        rule_ref = f"{rule_id} v{version}" if version else str(rule_id)
        return (
            f"Rule {rule_ref} ({trace.get('matched_rule_type', 'NORMAL')}) matched the "
            f"recorded business profile and yields {outcome}. "
            f"Authority: {req_def.authority}; jurisdiction: {req_def.jurisdiction}."
            + _fact_summary(trace)
        )
    if outcome:
        return (
            f"No published rule condition matched the recorded business profile, so "
            f"this requirement was evaluated as {outcome}." + _fact_summary(trace)
        )
    return "The evaluation produced no recorded reason for this requirement."
