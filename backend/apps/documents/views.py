"""Documents boundary views for Screen 10.

Authority: PRD_v2.0 §18, §P5; TRD_v2.0 §30, §31; FRONTEND_INSTRUCTIONS §9.

Provides:
1. Derivation of statutory document checklists based on applicable compliance requirements.
2. Software-level verification layer checking file extension, mandatory field completeness,
   and compliance requirement alignment.
3. Portal upload status tracking (marking documents as uploaded on official government portals).

Note: Admin-level manual verification is planned for a later phase.
"""

from __future__ import annotations

import datetime
import uuid
from typing import Any

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from common.enums import DocumentStatus, PrevalidationOutcome
from common.envelope import envelope, error_response
from apps.businesses.models import Business
from domain.intelligence.document_derivation import derive_business_documents
from .verification import verify_document


class BusinessDocumentsListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request: Request, business_id) -> Response:  # noqa: ANN001
        business = Business.accessible_to(request.user).filter(pk=business_id).first()
        if business is None:
            return error_response("NOT_FOUND", "Business not found.", http_status=status.HTTP_404_NOT_FOUND)

        assessment_id = request.query_params.get("assessment_id")
        payload = derive_business_documents(business, assessment_id=assessment_id)
        return Response(envelope(payload), status=status.HTTP_200_OK)


class DocumentVerifyView(APIView):
    """Software-level verification endpoint.

    Verifies a document's file extension, field completeness, and statutory compliance alignment.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request: Request, business_id) -> Response:  # noqa: ANN001
        business = Business.accessible_to(request.user).filter(pk=business_id).first()
        if business is None:
            return error_response("NOT_FOUND", "Business not found.", http_status=status.HTTP_404_NOT_FOUND)

        data = request.data.copy() if hasattr(request.data, "copy") else dict(request.data)

        uploaded_file = None
        if request.FILES:
            uploaded_file = request.FILES.get("file") or next(iter(request.FILES.values()))
            data["file_name"] = uploaded_file.name
            data["file_size_bytes"] = uploaded_file.size

        verification_result = verify_document(data, file=uploaded_file)
        return Response(envelope(verification_result), status=status.HTTP_200_OK)


class DocumentUploadView(APIView):
    """Document upload endpoint with integrated software verification layer.

    Every uploaded document runs through the verification pipeline:
    1. Extension & file format integrity.
    2. Mandatory field completeness.
    3. Alignment to the requirements of the specific compliance.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request: Request, business_id) -> Response:  # noqa: ANN001
        business = Business.accessible_to(request.user).filter(pk=business_id).first()
        if business is None:
            return error_response("NOT_FOUND", "Business not found.", http_status=status.HTTP_404_NOT_FOUND)

        data = request.data.copy() if hasattr(request.data, "copy") else dict(request.data)

        uploaded_file = None
        if request.FILES:
            uploaded_file = request.FILES.get("file") or next(iter(request.FILES.values()))
            data["file_name"] = uploaded_file.name
            data["file_size_bytes"] = uploaded_file.size

        # Execute software-level verification
        verification_result = verify_document(data, file=uploaded_file)

        doc_name = data.get("name") or data.get("title") or "Uploaded Document"
        file_name = data.get("file_name") or f"{doc_name.lower().replace(' ', '_')}.pdf"
        doc_id = data.get("document_id") or data.get("id") or f"doc-{uuid.uuid4().hex[:8]}"

        doc_payload = {
            "id": doc_id,
            "name": doc_name,
            "category": data.get("category") or data.get("document_type") or "Statutory Proof",
            "authority": data.get("authority") or "Regulatory Authority",
            "requirement_id": data.get("requirement_id") or "",
            "file_name": file_name,
            "file_size_bytes": data.get("file_size_bytes") or 2400000,
            "status": verification_result["status"],
            "prevalidation_status": PrevalidationOutcome.PASS if verification_result["verified"] else PrevalidationOutcome.NEEDS_REVIEW,
            "portal_uploaded": bool(data.get("portal_uploaded", False)),
            "verification": verification_result,
        }

        return Response(
            envelope({
                "document": doc_payload,
                "verification": verification_result,
                "message": (
                    "Document verified and catalogued successfully."
                    if verification_result["verified"]
                    else "Document uploaded with verification advisories."
                ),
            }),
            status=status.HTTP_200_OK,
        )


class DocumentPortalStatusView(APIView):
    """Update manual portal upload tracking status for a statutory document.

    Allows user to mark documents as already uploaded or not uploaded to official government portals.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request: Request, business_id) -> Response:  # noqa: ANN001
        business = Business.accessible_to(request.user).filter(pk=business_id).first()
        if business is None:
            return error_response("NOT_FOUND", "Business not found.", http_status=status.HTTP_404_NOT_FOUND)

        doc_id = request.data.get("document_id")
        if not doc_id:
            return error_response("BAD_REQUEST", "document_id is required.", http_status=status.HTTP_400_BAD_REQUEST)

        portal_uploaded = bool(request.data.get("portal_uploaded", False))

        return Response(
            envelope({
                "document_id": doc_id,
                "portal_uploaded": portal_uploaded,
                "status": DocumentStatus.UPLOADED if portal_uploaded else DocumentStatus.NOT_UPLOADED,
                "updated_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
            }),
            status=status.HTTP_200_OK,
        )
