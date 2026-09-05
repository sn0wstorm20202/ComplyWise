"""Compliance requirements views for Screen 08 & Screen 09.

Authority: PRD_v2.0 §15, §16; TRD_v2.0 §30, §31.
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


class BusinessComplianceListView(_BusinessScopedView):
    """List compliance requirements for a business with status and category filtering."""

    def get(self, request: Request, business_id) -> Response:  # noqa: ANN001
        business = self.get_business(request, business_id)
        if business is None:
            return error_response("NOT_FOUND", "Business not found.", http_status=status.HTTP_404_NOT_FOUND)

        latest_run = (
            DecisionRun.objects.filter(business=business)
            .prefetch_related("results")
            .order_by("-created_at")
            .first()
        )

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

        latest_run = (
            DecisionRun.objects.filter(business=business)
            .prefetch_related("results")
            .order_by("-created_at")
            .first()
        )

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

        detail_data = {
            "requirement_id": req_def.requirement_id,
            "name": req_def.name,
            "authority": req_def.authority,
            "category": req_def.category,
            "jurisdiction": req_def.jurisdiction,
            "status": eval_status,
            # Question 1: Why does this apply?
            "why_it_applies": {
                "summary": (
                    f"Requirement evaluated as {eval_status} based on registered jurisdiction ({req_def.jurisdiction}) "
                    f"and business profile parameters."
                ),
                "matched_rule_id": decision_result.explanation_trace.get("matched_rule_id") if decision_result else None,
                "matched_rule_type": decision_result.explanation_trace.get("matched_rule_type") if decision_result else None,
                "evaluation_notes": decision_result.explanation_trace.get("note") if decision_result else None,
            },
            # Question 2: What do I need?
            "what_you_need": {
                "documents": [
                    "Identity & Address Proof of Authorized Signatory",
                    "Entity Constitution Document (Partnership Deed / MOA & AOA)",
                    "Premises Proof (Lease Agreement / Property Tax Receipt)",
                    "Plant & Machinery Layout Plan",
                ],
                "statutory_fee_estimate": "Variable by scale (see authority fee schedule)",
                "validity_period": "1 to 5 years with periodic renewal",
            },
            # Question 3: What do I do next?
            "what_to_do_next": {
                "step_1": "Prepare mandatory statutory documents listed above.",
                "step_2": f"Access the {req_def.authority} official portal to initiate application filing.",
                "step_3": "Track workflow application status and inspection notifications.",
            },
            # Question 4: Where did this come from?
            "statutory_evidence": evidence_items,
        }

        return Response(envelope(detail_data), status=status.HTTP_200_OK)
