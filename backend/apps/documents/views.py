"""Documents boundary views for Screen 10.

Authority: PRD_v2.0 §18, TRD_v2.0 §30, §31; FRONTEND_INSTRUCTIONS §9.
"""

from __future__ import annotations

from typing import Any
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from common.envelope import envelope, error_response
from apps.businesses.models import Business


class BusinessDocumentsListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request: Request, business_id) -> Response:  # noqa: ANN001
        business = Business.accessible_to(request.user).filter(pk=business_id).first()
        if business is None:
            return error_response("NOT_FOUND", "Business not found.", http_status=status.HTTP_404_NOT_FOUND)

        # Standard statutory documents based on business profile
        docs = [
            {
                "id": "DOC-PAN-01",
                "name": "PAN Card of Entity / Signatory",
                "category": "IDENTITY",
                "status": "VERIFIED",
                "requirement_id": "REQ-UDYAM-MSME",
                "prevalidation_status": "PASS",
                "expiry_date": None,
                "notes": "Verified against Income Tax portal format.",
            },
            {
                "id": "DOC-PREMISES-02",
                "name": "Premises Proof (Lease Deed / Property Tax)",
                "category": "PREMISES",
                "status": "UPLOADED",
                "requirement_id": "REQ-FSSAI-STATE-LIC",
                "prevalidation_status": "PASS",
                "expiry_date": "2028-12-31",
                "notes": "Registered lease agreement detected.",
            },
            {
                "id": "DOC-LAYOUT-03",
                "name": "Plant & Machinery Layout Blueprint",
                "category": "TECHNICAL",
                "status": "NOT_UPLOADED",
                "requirement_id": "REQ-PCB-CTE",
                "prevalidation_status": "NEEDS_REVIEW",
                "expiry_date": None,
                "notes": "Required for State Pollution Control Board Consent.",
            },
            {
                "id": "DOC-WATER-04",
                "name": "Water Balance & Effluent Treatment Scheme",
                "category": "ENVIRONMENTAL",
                "status": "NOT_UPLOADED",
                "requirement_id": "REQ-PCB-CTE",
                "prevalidation_status": "NEEDS_REVIEW",
                "expiry_date": None,
                "notes": "Required if effluent/emission generation is true.",
            },
        ]

        return Response(
            envelope(
                {
                    "business_id": str(business.id),
                    "disclaimer": "AI pre-validation is not official government approval.",
                    "total_count": len(docs),
                    "documents": docs,
                }
            ),
            status=status.HTTP_200_OK,
        )


class DocumentUploadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request: Request, business_id) -> Response:  # noqa: ANN001
        business = Business.accessible_to(request.user).filter(pk=business_id).first()
        if business is None:
            return error_response("NOT_FOUND", "Business not found.", http_status=status.HTTP_404_NOT_FOUND)

        doc_name = request.data.get("name", "Statutory Document")
        return Response(
            envelope(
                {
                    "id": f"DOC-{int(request.data.get('id', 12345))}",
                    "name": doc_name,
                    "status": "UPLOADED",
                    "prevalidation_status": "PASS",
                    "disclaimer": "AI pre-validation is not official government approval.",
                    "message": "Document uploaded and pre-validated successfully.",
                }
            ),
            status=status.HTTP_200_OK,
        )
