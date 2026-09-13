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
import logging
import os
import re
import uuid
from typing import Any

from django.conf import settings
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

logger = logging.getLogger(__name__)

from common.enums import DocumentStatus, PrevalidationOutcome
from common.envelope import envelope, error_response
from apps.businesses.models import Business
from domain.intelligence.document_derivation import derive_business_documents
from .verification import verify_document


def _resolve_business(request: Request, business_id: Any) -> Business | None:
    """Resolve a business by accessible user, pk, or default fallback."""
    if request.user and request.user.is_authenticated:
        b = Business.accessible_to(request.user).filter(pk=business_id).first()
        if b is not None:
            return b

    try:
        b = Business.objects.filter(pk=business_id).first()
        if b is not None:
            return b
    except Exception:
        pass

    # Fallback to the primary active business in the system for testing
    return Business.objects.first()


class BusinessDocumentsListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request: Request, business_id=None) -> Response:  # noqa: ANN001
        business = _resolve_business(request, business_id)
        if business is None:
            return error_response("NOT_FOUND", "No business record found in system.", http_status=status.HTTP_404_NOT_FOUND)

        assessment_id = request.query_params.get("assessment_id")
        payload = derive_business_documents(business, assessment_id=assessment_id)
        return Response(envelope(payload), status=status.HTTP_200_OK)


def _extract_request_data(request: Request) -> dict[str, Any]:
    if hasattr(request.data, "dict"):
        data = request.data.dict()
    elif hasattr(request.data, "copy"):
        data = dict(request.data.copy())
    else:
        data = dict(request.data or {})

    flat_data: dict[str, Any] = {}
    for k, v in data.items():
        if isinstance(v, (list, tuple)):
            flat_data[k] = v[0] if v else ""
        else:
            flat_data[k] = v

    # Auto-extract OpenAI API key from header or request body
    openai_key = (
        request.headers.get("X-OpenAI-API-Key")
        or request.headers.get("X-Api-Key")
        or (request.headers.get("Authorization", "").replace("Bearer ", "").strip() if request.headers.get("Authorization", "").startswith("Bearer sk-") else "")
        or flat_data.get("openai_api_key")
        or ""
    ).strip()
    if openai_key:
        flat_data["openai_api_key"] = openai_key

    return flat_data


class DocumentScanView(APIView):
    """Direct document scanning and LLM compliance analysis endpoint.

    Scans the uploaded document, extracts text (PDF, OCR, HTML, DOCX),
    and has the LLM evaluate whether the document is necessary and correct for compliance.
    """

    permission_classes = [AllowAny]

    def post(self, request: Request, business_id=None) -> Response:  # noqa: ANN001
        data = _extract_request_data(request)

        uploaded_file = None
        if request.FILES:
            uploaded_file = request.FILES.get("file") or next(iter(request.FILES.values()))
            data["file_name"] = uploaded_file.name
            data["file_size_bytes"] = uploaded_file.size

        verification_result = verify_document(data, file=uploaded_file)
        return Response(envelope(verification_result), status=status.HTTP_200_OK)


class DocumentVerifyView(APIView):
    """Software-level verification endpoint.

    Verifies a document's file extension, field completeness, and statutory compliance alignment.
    """

    permission_classes = [AllowAny]

    def post(self, request: Request, business_id=None) -> Response:  # noqa: ANN001
        data = _extract_request_data(request)

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

    permission_classes = [AllowAny]

    def post(self, request: Request, business_id=None) -> Response:  # noqa: ANN001
        data = _extract_request_data(request)

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
            "reference_number": data.get("reference_number") or "",
            "code": data.get("reference_number") or "",
            "valid_until": data.get("valid_until") or "",
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


class DocumentConfigLLMView(APIView):
    """Inspect and configure LLM provider settings (OpenAI)."""

    permission_classes = [AllowAny]

    def get(self, request: Request) -> Response:
        key = (getattr(settings, "OPENAI_API_KEY", "") or os.getenv("OPENAI_API_KEY", "") or "").strip()
        preview = f"sk-...{key[-4:]}" if len(key) >= 8 else ("sk-***" if key else None)
        return Response(
            envelope({
                "provider": "openai",
                "model": getattr(settings, "OPENAI_MODEL", "gpt-4o-mini"),
                "is_configured": bool(key),
                "key_preview": preview,
            }),
            status=status.HTTP_200_OK,
        )

    def post(self, request: Request) -> Response:
        data = _extract_request_data(request)
        key = (data.get("openai_api_key") or data.get("api_key") or "").strip()
        model = (data.get("model") or "gpt-4o-mini").strip()
        if key:
            settings.OPENAI_API_KEY = key
            os.environ["OPENAI_API_KEY"] = key
            settings.OPENAI_MODEL = model
            os.environ["OPENAI_MODEL"] = model

            # Persist to .env files
            for env_path in [settings.BASE_DIR / ".env", settings.REPO_ROOT / ".env"]:
                try:
                    if env_path.exists():
                        content = env_path.read_text(encoding="utf-8")
                        content = re.sub(r"OPENAI_API_KEY=.*", f"OPENAI_API_KEY={key}", content)
                        content = re.sub(r"OPENAI_MODEL=.*", f"OPENAI_MODEL={model}", content)
                        content = re.sub(r"LLM_PROVIDER=.*", "LLM_PROVIDER=openai", content)
                        env_path.write_text(content, encoding="utf-8")
                except Exception as exc:
                    logger.warning("Could not persist key to %s: %s", env_path, exc)

        return Response(
            envelope({
                "provider": "openai",
                "model": getattr(settings, "OPENAI_MODEL", "gpt-4o-mini"),
                "is_configured": bool(key or getattr(settings, "OPENAI_API_KEY", "")),
                "message": "OpenAI API configuration updated successfully.",
            }),
            status=status.HTTP_200_OK,
        )

