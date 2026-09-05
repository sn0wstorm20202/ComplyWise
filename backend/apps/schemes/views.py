"""Schemes & incentives views for Screen 13.

Authority: PRD_v2.0 §21, TRD_v2.0 §30, §31.
"""

from __future__ import annotations

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from common.envelope import envelope, error_response
from apps.businesses.models import Business
from apps.evidence.models import Source


class BusinessSchemesListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request: Request, business_id) -> Response:  # noqa: ANN001
        business = Business.accessible_to(request.user).filter(pk=business_id).first()
        if business is None:
            return error_response("NOT_FOUND", "Business not found.", http_status=status.HTTP_404_NOT_FOUND)

        msme_src = Source.objects.filter(authority__icontains="MSME").first()
        portal_url = msme_src.canonical_url if msme_src else ""

        schemes = [
            {
                "id": "SCHEME-UDYAM-01",
                "title": "Udyam MSME Registration & Priority Sector Lending",
                "authority": "Ministry of Micro, Small and Medium Enterprises",
                "benefit_type": "STATUTORY_BENEFIT",
                "benefit_summary": "Priority lending, protection against delayed payments (MSMED Act §15), and subsidy eligibility.",
                "eligibility_status": "HIGH_PROBABILITY",
                "action_url": portal_url,
            },
            {
                "id": "SCHEME-PMEGP-02",
                "title": "Prime Minister's Employment Generation Programme (PMEGP)",
                "authority": "KVIC / MSME",
                "benefit_type": "CAPITAL_SUBSIDY",
                "benefit_summary": "Credit-linked subsidy of 15% to 35% on project capital expenditure.",
                "eligibility_status": "POTENTIAL_MATCH",
                "action_url": portal_url,
            },
            {
                "id": "SCHEME-CLCS-03",
                "title": "Credit Linked Capital Subsidy Scheme (CLCSS)",
                "authority": "Ministry of MSME",
                "benefit_type": "TECHNOLOGY_SUBSIDY",
                "benefit_summary": "15% upfront capital subsidy for technology upgradation in approved industrial sub-sectors.",
                "eligibility_status": "POTENTIAL_MATCH",
                "action_url": portal_url,
            },
        ]

        return Response(
            envelope({"business_id": str(business.id), "schemes": schemes}),
            status=status.HTTP_200_OK,
        )
