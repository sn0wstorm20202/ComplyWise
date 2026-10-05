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
from knowledge_packs.catalogs import resolve_statutory_portal


class _BusinessScopedView(APIView):
    permission_classes = [IsAuthenticated]

    def get_business(self, request: Request, business_id) -> Business | None:  # noqa: ANN001
        return Business.resolve_safely(business_id, request.user)


from apps.requirements.presentation import (
    DOCUMENTS_KEY, FEE_KEY, VALIDITY_KEY, STEPS_KEY, PORTAL_KEY,
    NOT_RECORDED, metadata_string_list, requirement_reason_summary, evidence_citations, primary_citation, decision_presentation,
)

from apps.requirements.selectors import load_requirement_evidence


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
            results = list(latest_run.results.all())

            req_defs, evidences_map = load_requirement_evidence(results)

            for r in results:
                req_def = req_defs.get(r.requirement_id)
                display_status, display_trace = decision_presentation(r, req_def)
                if status_filter and display_status != status_filter.upper():
                    continue
                auth = req_def.authority if req_def else "Authority"
                cat = req_def.category if req_def else "GENERAL"
                jur = req_def.jurisdiction if req_def else "CENTRAL"

                if authority_filter and auth.upper() != authority_filter.upper():
                    continue
                if category_filter and cat.upper() != category_filter.upper():
                    continue

                metadata = (req_def.metadata or {}) if req_def else {}
                raw_portal = str(metadata.get(PORTAL_KEY) or "").strip()
                statutory_act = str(metadata.get("statutory_act") or "").strip()

                portal_info = resolve_statutory_portal(
                    authority=auth,
                    requirement_name=r.requirement_name,
                    requirement_id=r.requirement_id,
                    raw_portal=raw_portal,
                )
                canonical_source_url = portal_info["url"]
                portal_name = portal_info["name"]

                citations = evidence_citations(r.evidence_refs or [], evidences_map)

                items.append(
                    {
                        "requirement_id": r.requirement_id,
                        "result_origin": "DETERMINISTIC_KB_RESULT",
                        "name": r.requirement_name,
                        "authority": auth,
                        "category": cat,
                        "jurisdiction": jur,
                        "domain": req_def.domain if req_def else "GENERAL",
                        "description": requirement_reason_summary(display_trace, req_def) if req_def else "",
                        "status": display_status,
                        "recorded_status": r.status,
                        "matched_rule_id": r.explanation_trace.get("matched_rule_id"),
                        "matched_rule_type": r.explanation_trace.get("matched_rule_type"),
                        "evidence_count": len(r.evidence_refs or []),
                        "explanation_reason": r.explanation_trace.get("reason"),
                        "reason_summary": requirement_reason_summary(display_trace, req_def) if req_def else "",
                        "notes": r.explanation_trace.get("note", ""),
                        "portal": canonical_source_url,
                        "portal_url": canonical_source_url,
                        "portal_name": portal_name,
                        "source_url": primary_citation(citations).get("canonical_url") or "",
                        "source_title": primary_citation(citations).get("source_title", ""),
                        "statutory_act": statutory_act or (citations[0]["locator"] if citations else ""),
                        "citations": citations,
                        "citation_count": len(citations),
                        "required_documents": _str_list(metadata.get(DOCUMENTS_KEY)),
                        "application_steps": _str_list(metadata.get(STEPS_KEY)),
                        "timeline": str(metadata.get("timeline") or metadata.get(VALIDITY_KEY) or "").strip(),
                        "statutory_fee": str(metadata.get(FEE_KEY) or "").strip(),
                    }
                )

        from domain.intelligence.workspace_guidance import compliance_rows
        for item in compliance_rows(business, assessment_id):
            if status_filter and item["status"] != status_filter.upper():
                continue
            if authority_filter and item["authority"] != authority_filter:
                continue
            if category_filter and item["category"] != category_filter:
                continue
            items.append(item)

        from apps.workflows.services.disposition_service import reviewed_requirement_treatment
        treatments = reviewed_requirement_treatment(business, assessment_id,
            latest_run.profile_version_id if latest_run else None)
        from apps.workflows.services.disposition_service import reviewer_assigned_requirements
        present = {item["requirement_id"] for item in items}
        for assigned in reviewer_assigned_requirements(business, assessment_id,
                latest_run.profile_version_id if latest_run else None):
            if assigned["requirement_id"] in present:
                item = next(item for item in items if item["requirement_id"] == assigned["requirement_id"])
                item.update(system_applicability_status=item["status"], result_origin="HUMAN_REVIEW_RESULT")
            elif not status_filter or status_filter.upper() == assigned["status"]:
                if (not authority_filter or authority_filter.upper() == assigned["authority"].upper()) and (not category_filter or category_filter.upper() == assigned["category"].upper()):
                    items.append(assigned)
        for item in items:
            item.update(treatments.get(item["requirement_id"], {}))

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

        from domain.intelligence.workspace_guidance import compliance_rows, get_workspace
        assessment_id = request.query_params.get("assessment_id")
        guidance = next((r for r in compliance_rows(business, assessment_id) if r["id"] == requirement_id), None)
        if guidance:
            from apps.workflows.services.disposition_service import reviewed_requirement_treatment
            guidance.update(reviewed_requirement_treatment(business, assessment_id).get(requirement_id, {}))
            workspace = get_workspace(business, assessment_id)
            docs = [d["title"] for d in workspace["documents"] if d["requirement_id"] == requirement_id]
            workflow = next((w for w in workspace["workflows"] if w["requirement_id"] == requirement_id), None)
            return Response(envelope({**guidance, "business_id": str(business.id),
                "requirement_name": guidance["title"], "why_it_applies": {"summary": guidance["why_it_may_apply"],
                    "reason": guidance["why_it_may_apply"], "result_origin": guidance["result_origin"]},
                "what_you_need": {"documents": docs, "documents_available": bool(docs),
                    "statutory_fee_estimate": "Confirm with the relevant authority", "validity_period": "Confirm with the relevant authority"},
                "what_to_do_next": {"steps": workflow["steps"] if workflow else [guidance["recommended_next_step"]],
                    "steps_available": True, "official_portal": None, "portal_url": None, "portal_name": ""},
                "statutory_evidence": [], "source_reference": guidance["source_reference"]}))

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
        if run is None and not assessment_id:
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
                from apps.evidence.presentation import evidence_projection
                evidence_items.append(evidence_projection(ev_obj))

        eval_status = decision_result.status if decision_result else "UNVERIFIED"
        trace: dict[str, Any] = (decision_result.explanation_trace or {}) if decision_result else {}
        if decision_result:
            eval_status, trace = decision_presentation(decision_result, req_def)
        metadata: dict[str, Any] = req_def.metadata or {}

        # Procedural detail is regulatory content: it is served only where the
        # requirement's own metadata records it. `documents_available` lets the
        # frontend show "not recorded" instead of an empty checklist that reads
        # as "no documents needed".
        documents = metadata_string_list(metadata.get(DOCUMENTS_KEY))
        steps = metadata_string_list(metadata.get(STEPS_KEY))
        raw_portal = str(metadata.get(PORTAL_KEY) or "").strip()

        portal_info = resolve_statutory_portal(
            authority=req_def.authority,
            requirement_name=req_def.name,
            requirement_id=req_def.requirement_id,
            raw_portal=raw_portal,
        )

        detail_data = {
            "requirement_id": req_def.requirement_id,
            "name": req_def.name,
            "authority": req_def.authority,
            "category": req_def.category,
            "jurisdiction": req_def.jurisdiction,
            "domain": req_def.domain,
            "description": requirement_reason_summary(trace, req_def),
            "status": eval_status,
            "evaluated": decision_result is not None,
            "evaluation_date": str(latest_run.evaluation_date) if latest_run else None,
            "portal": portal_info["url"],
            "portal_url": portal_info["url"],
            "portal_name": portal_info["name"],
            "source_url": primary_citation(evidence_items).get("canonical_url") or "",
            # Question 1: Why does this apply? — read from the recorded trace.
            "why_it_applies": {
                "summary": requirement_reason_summary(trace, req_def),
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
                "official_portal": portal_info["url"],
                "portal_url": portal_info["url"],
                "portal_name": portal_info["name"],
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

        from apps.workflows.services.disposition_service import reviewed_requirement_treatment
        detail_data.update(reviewed_requirement_treatment(business, assessment_id,
            latest_run.profile_version_id if latest_run else None).get(requirement_id, {}))
        if detail_data.get("treatment_source") == "ADMIN_ASSIGNED":
            detail_data["result_origin"] = "HUMAN_REVIEW_RESULT"
            detail_data["reviewer_assignment"] = True
        return Response(envelope(detail_data), status=status.HTTP_200_OK)
