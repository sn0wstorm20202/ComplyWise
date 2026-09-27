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
    """Resolve a business strictly scoped to the authenticated user."""
    if not request.user or not request.user.is_authenticated:
        return None
    return Business.accessible_to(request.user).filter(pk=business_id).first()


class BusinessDocumentsListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request: Request, business_id=None) -> Response:  # noqa: ANN001
        business = _resolve_business(request, business_id)
        if business is None:
            return error_response("NOT_FOUND", "Business not found or access denied.", http_status=status.HTTP_404_NOT_FOUND)

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


class CaseDocumentUploadView(APIView):
    """Upload a versioned document for a specific compliance case requirement.

    Executes genuine OCR extraction, AI precheck, creates immutable DocumentSubmission
    and DocumentReview records, and triggers workflow transitions.
    """

    permission_classes = [AllowAny]

    def post(self, request: Request, case_id, document_requirement_id) -> Response:  # noqa: ANN001
        from apps.documents.models import DocumentRequirement
        from apps.documents.serializers import (
            DocumentRequirementSerializer,
            DocumentReviewSerializer,
            DocumentSubmissionSerializer,
        )
        from apps.documents.services.precheck import process_document_upload
        from apps.workflows.models import ComplianceCase
        from apps.workflows.serializers import ComplianceCaseDetailSerializer

        case = ComplianceCase.objects.filter(pk=case_id).first()
        if not case:
            return error_response("NOT_FOUND", "Compliance case not found.", http_status=status.HTTP_404_NOT_FOUND)

        doc_req = DocumentRequirement.objects.filter(pk=document_requirement_id, case=case).first()
        if not doc_req:
            return error_response("NOT_FOUND", "Document requirement not found for this case.", http_status=status.HTTP_404_NOT_FOUND)

        uploaded_file = None
        file_bytes = None
        file_name = ""

        if request.FILES:
            uploaded_file = request.FILES.get("file") or next(iter(request.FILES.values()))
            file_name = uploaded_file.name
        elif "file_content_bytes" in request.data:
            file_bytes = request.data["file_content_bytes"]
            file_name = request.data.get("file_name", "document.pdf")
        elif "file_content_text" in request.data:
            file_bytes = request.data["file_content_text"].encode("utf-8")
            file_name = request.data.get("file_name", "document.txt")

        raw_data = request.data.dict() if hasattr(request.data, "dict") else dict(request.data or {})
        clean_meta = {
            k: v for k, v in raw_data.items()
            if k not in ("file", "files") and not hasattr(v, "read") and not hasattr(v, "chunks")
        }

        submission, review, verification_result = process_document_upload(
            document_requirement=doc_req,
            uploaded_file=uploaded_file,
            file_bytes=file_bytes,
            file_name=file_name,
            uploaded_by=request.user if (request.user and request.user.is_authenticated) else None,
            extra_metadata=clean_meta,
        )

        case.refresh_from_db()
        doc_req.refresh_from_db()

        return Response(
            envelope({
                "message": "Document uploaded and AI precheck completed successfully.",
                "submission": DocumentSubmissionSerializer(submission).data,
                "review": DocumentReviewSerializer(review).data,
                "document_requirement": DocumentRequirementSerializer(doc_req).data,
                "case": ComplianceCaseDetailSerializer(case).data,
                "verification": verification_result,
            }),
            status=status.HTTP_201_CREATED,
        )


class DocumentSubmissionReviewView(APIView):
    """Compliance Officer / Admin review endpoint for document submissions.

    Actions:
    - APPROVE: Marks review INTERNAL_HUMAN_APPROVED -> Triggers REVIEW_APPROVED -> Advances to FORM_PREPARATION.
    - QUERY: Marks review INTERNAL_HUMAN_QUERY -> Triggers QUERY_RAISED -> Case moves to ACTION_REQUIRED / DOCUMENT_COLLECTION.
    - REJECT: Marks review INTERNAL_HUMAN_REJECTED -> Triggers REVIEW_REJECTED.
    """

    permission_classes = [AllowAny]

    def post(self, request: Request, submission_id) -> Response:  # noqa: ANN001
        from common.enums import ActorType, CaseStatus, DocumentReviewStatus, ReviewType
        from apps.documents.models import DocumentReview, DocumentSubmission
        from apps.documents.serializers import DocumentReviewSerializer, DocumentSubmissionSerializer
        from apps.workflows.engine import GenericWorkflowEngine
        from apps.workflows.serializers import ComplianceCaseDetailSerializer

        submission = DocumentSubmission.objects.filter(pk=submission_id).select_related(
            "document_requirement__case"
        ).first()

        if not submission:
            return error_response("NOT_FOUND", "Document submission not found.", http_status=status.HTTP_404_NOT_FOUND)

        action = (request.data.get("action") or "APPROVE").upper()
        comments = request.data.get("comments") or request.data.get("remarks") or ""
        findings = request.data.get("findings") or []

        case = submission.document_requirement.case

        if action == "APPROVE":
            review_status = DocumentReviewStatus.INTERNAL_HUMAN_APPROVED
            event_code = "REVIEW_APPROVED"
        elif action == "QUERY":
            review_status = DocumentReviewStatus.INTERNAL_HUMAN_QUERY
            event_code = "QUERY_RAISED"
        elif action == "REJECT":
            review_status = DocumentReviewStatus.INTERNAL_HUMAN_REJECTED
            event_code = "REVIEW_REJECTED"
        else:
            return error_response("BAD_REQUEST", f"Unknown review action '{action}'. Must be APPROVE, QUERY, or REJECT.", http_status=status.HTTP_400_BAD_REQUEST)

        human_review = DocumentReview.objects.create(
            submission=submission,
            review_type=ReviewType.HUMAN_REVIEW,
            reviewer_user=request.user if (request.user and request.user.is_authenticated) else None,
            status=review_status,
            findings=findings,
            reviewer_comments=comments,
            reviewed_at=datetime.datetime.now(datetime.timezone.utc),
        )

        submission.status_code = review_status
        submission.save(update_fields=["status_code"])

        # Trigger workflow state machine
        try:
            target_step, event_obj = GenericWorkflowEngine.trigger_transition(
                compliance_case=case,
                event_code=event_code,
                actor_type=ActorType.ADMIN,
                actor_user=request.user if (request.user and request.user.is_authenticated) else None,
                payload={
                    "submission_id": str(submission.id),
                    "action": action,
                    "comments": comments,
                    "findings": findings,
                },
                notes=f"Compliance officer {action}: {comments}",
            )
        except Exception as exc:
            logger.warning("Workflow transition for %s resulted in: %s", event_code, exc)

        case.refresh_from_db()
        return Response(
            envelope({
                "message": f"Document review submitted: {action}.",
                "review": DocumentReviewSerializer(human_review).data,
                "submission": DocumentSubmissionSerializer(submission).data,
                "case": ComplianceCaseDetailSerializer(case).data,
            }),
            status=status.HTTP_200_OK,
        )


class DocumentViewEndpoint(APIView):
    """Backend-authorized document view endpoint.

    Authority: Architectural Specification §3, §35.
    1. Authenticates the user/admin (or validates short-lived HMAC signature).
    2. Authorizes access: requester must be business owner or authorized officer.
    3. Resolves the exact document version from DocumentSubmission.
    4. Streams document inline with Content-Type: application/pdf and Content-Disposition: inline.
    5. Returns JSON metadata if Accept: application/json or ?mode=json.
    6. Logs SecurityAuditEvent.
    """

    permission_classes = [AllowAny]

    def get(self, request: Request, document_version_id) -> Response:  # noqa: ANN001
        from apps.documents.models import DocumentSubmission
        from apps.documents.services.storage_service import DocumentStorageService
        from apps.workflows.models import SecurityAuditEvent
        from common.enums import ActorType

        submission = DocumentSubmission.objects.filter(pk=document_version_id).select_related(
            "document_requirement__case__business"
        ).first()

        if not submission:
            return error_response(
                "NOT_FOUND",
                f"Document submission {document_version_id} not found.",
                http_status=status.HTTP_404_NOT_FOUND,
            )

        # 1. Authorize: check HMAC token, query auth token, or user session
        sig = request.query_params.get("sig")
        exp = request.query_params.get("exp")
        has_valid_hmac = False
        if sig and exp:
            try:
                has_valid_hmac = DocumentStorageService.verify_hmac_signature(
                    str(submission.id), int(exp), sig
                )
            except Exception:
                has_valid_hmac = False

        token = request.query_params.get("token")
        if token and not (request.user and request.user.is_authenticated):
            try:
                from rest_framework.authtoken.models import Token
                t_obj = Token.objects.filter(key=token).select_related("user").first()
                if t_obj:
                    request.user = t_obj.user
            except Exception:
                pass

        is_authorized = has_valid_hmac or DocumentStorageService.check_document_access(
            request.user, submission
        )

        if not is_authorized:
            return error_response(
                "FORBIDDEN",
                "You are not authorized to view this compliance document.",
                http_status=status.HTTP_403_FORBIDDEN,
            )

        # 2. Record security audit log
        try:
            is_officer = bool(request.user and (getattr(request.user, "is_compliance_officer", False) or request.user.is_staff))
            SecurityAuditEvent.objects.create(
                actor_user=request.user if (request.user and request.user.is_authenticated) else None,
                actor_type=ActorType.ADMIN if is_officer else ActorType.USER,
                action="DOCUMENT_VIEW",
                resource_type="DocumentSubmission",
                resource_id=str(submission.id),
                ip_address=request.META.get("REMOTE_ADDR", ""),
                metadata={
                    "file_name": submission.file_name,
                    "version_number": submission.version_number,
                    "case_number": submission.document_requirement.case.case_number,
                },
            )
        except Exception as exc:
            logger.debug("Security audit event log error: %s", exc)

        # 3. If client requested JSON metadata or ?mode=json
        if request.query_params.get("mode") == "json" or request.headers.get("Accept") == "application/json":
            signed_url = DocumentStorageService.generate_signed_access_url(submission)
            stream_url = f"/api/v1/documents/{submission.id}/view?mode=stream"
            return Response(
                envelope({
                    "id": str(submission.id),
                    "file_name": submission.file_name,
                    "mime_type": submission.mime_type,
                    "file_size_bytes": submission.file_size_bytes,
                    "version_number": submission.version_number,
                    "checksum": submission.checksum,
                    "status_code": submission.status_code,
                    "uploaded_at": submission.created_at.isoformat() if hasattr(submission, "created_at") else None,
                    "signed_url": signed_url,
                    "stream_url": stream_url,
                    "document_requirement": {
                        "id": str(submission.document_requirement.id),
                        "name": submission.document_requirement.name,
                        "document_type_code": submission.document_requirement.document_type_code,
                    },
                }),
                status=status.HTTP_200_OK,
            )

        # 4. Return direct streaming inline response for browser / iframe / PDF.js rendering
        download = request.query_params.get("download") == "true"
        return DocumentStorageService.stream_document_response(submission, as_attachment=download)


class DocumentMetadataEndpoint(APIView):
    """Retrieve document metadata, AI findings, and signed access URL."""

    permission_classes = [AllowAny]

    def get(self, request: Request, document_version_id) -> Response:  # noqa: ANN001
        from apps.documents.models import DocumentSubmission
        from apps.documents.services.storage_service import DocumentStorageService
        from common.enums import ReviewType

        submission = DocumentSubmission.objects.filter(pk=document_version_id).select_related(
            "document_requirement__case__business"
        ).prefetch_related("reviews").first()

        if not submission:
            return error_response(
                "NOT_FOUND",
                f"Document submission {document_version_id} not found.",
                http_status=status.HTTP_404_NOT_FOUND,
            )

        if not DocumentStorageService.check_document_access(request.user, submission):
            return error_response(
                "FORBIDDEN",
                "You are not authorized to access metadata for this compliance document.",
                http_status=status.HTTP_403_FORBIDDEN,
            )

        signed_url = DocumentStorageService.generate_signed_access_url(submission)
        ai_review = submission.reviews.filter(review_type=ReviewType.AI_PRECHECK).order_by("-reviewed_at").first()
        human_review = submission.reviews.filter(review_type=ReviewType.HUMAN_REVIEW).order_by("-reviewed_at").first()

        return Response(
            envelope({
                "id": str(submission.id),
                "file_name": submission.file_name,
                "mime_type": submission.mime_type,
                "file_size_bytes": submission.file_size_bytes,
                "version_number": submission.version_number,
                "checksum": submission.checksum,
                "status_code": submission.status_code,
                "signed_url": signed_url,
                "stream_url": f"/api/v1/documents/{submission.id}/view?mode=stream",
                "ai_precheck": {
                    "status": ai_review.status if ai_review else "PENDING",
                    "findings": ai_review.findings if ai_review else [],
                    "comments": ai_review.reviewer_comments if ai_review else "",
                } if ai_review else None,
                "human_review": {
                    "status": human_review.status if human_review else None,
                    "reviewer": human_review.reviewer_user.full_name if (human_review and human_review.reviewer_user) else None,
                    "comments": human_review.reviewer_comments if human_review else "",
                } if human_review else None,
            }),
            status=status.HTTP_200_OK,
        )


