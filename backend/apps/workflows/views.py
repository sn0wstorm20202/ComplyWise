"""Workflows views for Screen 11.

Authority: PRD_v2.0 §19, TRD_v2.0 §30, §31.
"""

from __future__ import annotations

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from common.envelope import envelope, error_response
from apps.businesses.models import Business


class BusinessWorkflowsListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request: Request, business_id) -> Response:  # noqa: ANN001
        business = Business.accessible_to(request.user).filter(pk=business_id).first()
        if business is None:
            return error_response("NOT_FOUND", "Business not found.", http_status=status.HTTP_404_NOT_FOUND)

        workflows = [
            {
                "id": "WF-FSSAI-01",
                "title": "FSSAI State Licence Application Workflow",
                "authority": "FSSAI",
                "status": "IN_PROGRESS",
                "current_step": 2,
                "total_steps": 4,
                "steps": [
                    {"step": 1, "title": "Eligibility & Documentation Check", "status": "COMPLETED"},
                    {"step": 2, "title": "Online FoSCoS Portal Submission", "status": "IN_PROGRESS"},
                    {"step": 3, "title": "Authority Query & Inspection", "status": "WAITING_FOR_USER"},
                    {"step": 4, "title": "Licence Grant & Display Mandate", "status": "NOT_STARTED"},
                ],
            },
            {
                "id": "WF-PCB-02",
                "title": "Pollution Control Board Consent to Establish (CTE)",
                "authority": "State SPCB",
                "status": "READY",
                "current_step": 1,
                "total_steps": 5,
                "steps": [
                    {"step": 1, "title": "Site Inspection & NOC", "status": "READY"},
                    {"step": 2, "title": "Effluent Treatment Proposal", "status": "NOT_STARTED"},
                    {"step": 3, "title": "CTE Application Online", "status": "NOT_STARTED"},
                    {"step": 4, "title": "Board Scrutiny & Hearing", "status": "BLOCKED"},
                    {"step": 5, "title": "CTE Issuance", "status": "BLOCKED"},
                ],
            },
        ]

        return Response(
            envelope({"business_id": str(business.id), "workflows": workflows}),
            status=status.HTTP_200_OK,
        )
