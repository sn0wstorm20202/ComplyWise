"""Compliance requirements views for Screen 08 & Screen 09.

Authority: PRD_v2.0 §15, §16, §P5; TRD_v2.0 §30, §31.

The detail view answers the four core questions strictly from what the system holds:
the decision trace explains applicability, and the document checklist, fee, validity
and filing procedure are read from requirement metadata. Where metadata is silent the
field is reported as not recorded rather than filled with a plausible default — a
generic "Identity & Address Proof / Partnership Deed / ₹variable / 1 to 5 years"
checklist reads as an authority's actual requirement list while citing nothing.
"""

from __future__ import annotations

from typing import Any
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from common.envelope import envelope, error_response
from apps.applicability.models import DecisionResult, DecisionRun
from apps.businesses.models import Business
from apps.evidence.models import Evidence
from apps.knowledge.models import RequirementDefinition


class _BusinessScopedView(APIView):
    permission_classes = [IsAuthenticated]

    def get_business(self, request: Request, business_id) -> Business | None:  # noqa: ANN001
        return Business.accessible_to(request.user).filter(pk=business_id).first()


#: Requirement metadata keys carrying procedural detail, when knowledge records it.
DOCUMENTS_KEY = "required_documents"
FEE_KEY = "statutory_fee"
VALIDITY_KEY = "validity_period"
STEPS_KEY = "application_steps"
PORTAL_KEY = "portal"

#: Shown wherever published knowledge records nothing for a field. Stated rather
#: than left blank so the screen distinguishes "nothing required" from "unknown".
NOT_RECORDED = "Not recorded in published knowledge for this requirement."


def _str_list(value: Any) -> list[str]:
    """Coerce a metadata value to a list of non-empty strings, or an empty list."""
    if not isinstance(value, list):
        return []
    return [str(item).strip() for item in value if str(item).strip()]


#: Human-readable renderings of the engine's trace reasons. Keyed on the same
#: constants the engine writes, so the sentence a user reads is derived from the
#: recorded decision rather than re-asserted here.
_REASON_SUMMARIES = {
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
        "The matched rule cites an evidence record that is not present in the "
        "knowledge base."
    ),
    "FUTURE_EFFECTIVE_EVIDENCE": (
        "The supporting evidence takes effect after the evaluation date."
    ),
    "EXPIRED_EVIDENCE": "The supporting evidence expired before the evaluation date.",
    "CONFLICTING_EVIDENCE": (
        "The supporting evidence is marked as conflicting and needs review."
    ),
    "UNVERIFIED_EVIDENCE": (
        "The supporting evidence has not been verified, so applicability is reported "
        "as unverified."
    ),
}


def _why_summary(trace: dict[str, Any] | None, req_def: RequirementDefinition) -> str:
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
        return _REASON_SUMMARIES[evidence_reason]

    rule_id = trace.get("matched_rule_id")
    outcome = trace.get("status", "")
    if rule_id:
        version = trace.get("matched_rule_version")
        rule_ref = f"{rule_id} v{version}" if version else str(rule_id)
        return (
            f"Rule {rule_ref} ({trace.get('matched_rule_type', 'NORMAL')}) matched the "
            f"recorded business profile and yields {outcome}. "
            f"Authority: {req_def.authority}; jurisdiction: {req_def.jurisdiction}."
        )
    if outcome:
        return (
            f"No published rule condition matched the recorded business profile, so "
            f"this requirement was evaluated as {outcome}."
        )
    return "The evaluation produced no recorded reason for this requirement."


class BusinessComplianceListView(_BusinessScopedView):
    """List compliance requirements for a business with status and category filtering."""

    def get(self, request: Request, business_id) -> Response:  # noqa: ANN001
        business = self.get_business(request, business_id)
        if business is None:
            return error_response("NOT_FOUND", "Business not found.", http_status=status.HTTP_404_NOT_FOUND)

        assessment_id = request.query_params.get("assessment_id")
        run = None
        if assessment_id:
            assessment = business.assessments.filter(pk=assessment_id).first()
            if assessment and assessment.decision_run:
                run = assessment.decision_run
            elif assessment:
                run = DecisionRun.objects.filter(assessment=assessment).prefetch_related("results").first()
        if run is None:
            run = (
                DecisionRun.objects.filter(business=business)
                .prefetch_related("results")
                .order_by("-created_at")
                .first()
            )
        latest_run = run

        status_filter = request.query_params.get("status")
        authority_filter = request.query_params.get("authority")
        category_filter = request.query_params.get("category")

        items: list[dict[str, Any]] = []

        if latest_run:
            results = latest_run.results.all()
            if status_filter:
                results = results.filter(status=status_filter.upper())

            req_ids = [r.requirement_id for r in results]
            req_defs = {
                rd.requirement_id: rd
                for rd in RequirementDefinition.objects.filter(requirement_id__in=req_ids)
            }

            for r in results:
                req_def = req_defs.get(r.requirement_id)
                auth = req_def.authority if req_def else "Authority"
                cat = req_def.category if req_def else "GENERAL"
                jur = req_def.jurisdiction if req_def else "CENTRAL"

                if authority_filter and auth.upper() != authority_filter.upper():
                    continue
                if category_filter and cat.upper() != category_filter.upper():
                    continue

                items.append(
                    {
                        "requirement_id": r.requirement_id,
                        "name": r.requirement_name,
                        "authority": auth,
                        "category": cat,
                        "jurisdiction": jur,
                        "status": r.status,
                        "matched_rule_id": r.explanation_trace.get("matched_rule_id"),
                        "matched_rule_type": r.explanation_trace.get("matched_rule_type"),
                        "evidence_count": len(r.evidence_refs or []),
                        "explanation_reason": r.explanation_trace.get("reason"),
                        "notes": r.explanation_trace.get("note", ""),
                    }
                )

        return Response(
            envelope(
                {
                    "business_id": str(business.id),
                    "latest_run_id": str(latest_run.id) if latest_run else None,
                    "count": len(items),
                    "requirements": items,
                }
            ),
            status=status.HTTP_200_OK,
        )


class BusinessRequirementDetailView(_BusinessScopedView):
    """Detailed view for a specific compliance requirement answering the 4 core questions:
    
    1. Why does this apply?
    2. What do I need?
    3. What do I do next?
    4. Where did this come from?
    """

    def get(self, request: Request, business_id, requirement_id: str) -> Response:  # noqa: ANN001
        business = self.get_business(request, business_id)
        if business is None:
            return error_response("NOT_FOUND", "Business not found.", http_status=status.HTTP_404_NOT_FOUND)

        req_def = RequirementDefinition.objects.filter(requirement_id=requirement_id).first()
        if req_def is None:
            return error_response("NOT_FOUND", "Requirement not found.", http_status=status.HTTP_404_NOT_FOUND)

        assessment_id = request.query_params.get("assessment_id")
        run = None
        if assessment_id:
            assessment = business.assessments.filter(pk=assessment_id).first()
            if assessment and assessment.decision_run:
                run = assessment.decision_run
            elif assessment:
                run = DecisionRun.objects.filter(assessment=assessment).prefetch_related("results").first()
        if run is None:
            run = (
                DecisionRun.objects.filter(business=business)
                .prefetch_related("results")
                .order_by("-created_at")
                .first()
            )
        latest_run = run

        decision_result: DecisionResult | None = None
        if latest_run:
            decision_result = latest_run.results.filter(requirement_id=requirement_id).first()

        # Gather evidence details
        evidence_items = []
        ev_refs = (decision_result.evidence_refs if decision_result else []) or []
        for ref in ev_refs:
            ev_id = ref.get("evidence_id") if isinstance(ref, dict) else ref
            ev_obj = Evidence.objects.filter(evidence_id=ev_id).select_related("source").first()
            if ev_obj:
                evidence_items.append(
                    {
                        "evidence_id": ev_obj.evidence_id,
                        "source_title": ev_obj.source.title,
                        "authority": ev_obj.source.authority,
                        "locator": ev_obj.locator,
                        "excerpt": ev_obj.excerpt,
                        "verification_status": ev_obj.verification_status,
                        "canonical_url": ev_obj.source.canonical_url,
                    }
                )

        eval_status = decision_result.status if decision_result else "UNVERIFIED"
        trace: dict[str, Any] = (decision_result.explanation_trace or {}) if decision_result else {}
        metadata: dict[str, Any] = req_def.metadata or {}

        # Procedural detail is regulatory content: it is served only where the
        # requirement's own metadata records it. `documents_available` lets the
        # frontend show "not recorded" instead of an empty checklist that reads
        # as "no documents needed".
        documents = _str_list(metadata.get(DOCUMENTS_KEY))
        steps = _str_list(metadata.get(STEPS_KEY))
        portal = str(metadata.get(PORTAL_KEY) or "").strip()

        detail_data = {
            "requirement_id": req_def.requirement_id,
            "name": req_def.name,
            "authority": req_def.authority,
            "category": req_def.category,
            "jurisdiction": req_def.jurisdiction,
            "domain": req_def.domain,
            "description": req_def.description,
            "status": eval_status,
            "evaluated": decision_result is not None,
            "evaluation_date": str(latest_run.evaluation_date) if latest_run else None,
            # Question 1: Why does this apply? — read from the recorded trace.
            "why_it_applies": {
                "summary": _why_summary(trace, req_def),
                "matched_rule_id": trace.get("matched_rule_id"),
                "matched_rule_type": trace.get("matched_rule_type"),
                "matched_rule_version": trace.get("matched_rule_version"),
                "reason_code": trace.get("reason") or trace.get("evidence_reason"),
                "evaluation_notes": trace.get("note"),
                # The per-rule evaluation list, so the user can inspect every rule
                # that was considered rather than only the one that matched.
                "rule_evaluations": trace.get("evaluations", []),
                "conflicts": trace.get("conflicts", []),
            },
            # Question 2: What do I need? — from requirement metadata only.
            "what_you_need": {
                "documents": documents,
                "documents_available": bool(documents),
                "statutory_fee_estimate": str(metadata.get(FEE_KEY) or "").strip() or NOT_RECORDED,
                "validity_period": str(metadata.get(VALIDITY_KEY) or "").strip() or NOT_RECORDED,
                "renewal_period_years": metadata.get("renewal_period_years"),
                "not_recorded_note": (
                    None
                    if documents
                    else (
                        "No document checklist, fee schedule or validity period has been "
                        "ingested for this requirement. Consult the authority's official "
                        "notification via the evidence links below."
                    )
                ),
            },
            # Question 3: What do I do next? — recorded steps, or the portal alone.
            "what_to_do_next": {
                "steps": steps,
                "steps_available": bool(steps),
                "official_portal": portal,
                "not_recorded_note": (
                    None
                    if steps
                    else (
                        "No filing procedure has been ingested for this requirement. The "
                        "steps an authority requires vary by state and scale and are not "
                        "inferred."
                    )
                ),
            },
            # Question 4: Where did this come from?
            "statutory_evidence": evidence_items,
            "evidence_count": len(evidence_items),
        }

        return Response(envelope(detail_data), status=status.HTTP_200_OK)
