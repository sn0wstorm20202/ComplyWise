"""Document Upload, Versioning, and AI Pre-validation Service.

Authority: Architectural Specification §3, §4, §5, §6, §7, §10, §35.
Enforces:
1. Versioned private storage: every upload is an immutable DocumentSubmission (v1, v2). Never overwrite.
2. Separation of AI precheck from Human Review: AI generates advisory findings; human officer makes review decisions.
3. Structured AI findings (finding_code, severity, field, expected_value, observed_value, source, confidence).
4. Technical AI/OCR failures produce PRECHECK_ERROR advisory, NEVER legal rejection.
5. User resubmission automatically links with open CaseQuery and advances case back to HUMAN_REVIEW.
"""

from __future__ import annotations

import hashlib
import logging
from typing import Any

from django.db import transaction
from django.utils import timezone

from common.enums import (
    ActorType,
    CaseStatus,
    DocumentReviewStatus,
    DocumentStatus,
    QueryStatus,
    ReviewType,
)
from apps.documents.models import (
    DocumentRequirement,
    DocumentReview,
    DocumentSubmission,
)
from apps.documents.services.storage_service import DocumentStorageService
from apps.documents.verification import verify_document
from apps.workflows.engine import GenericWorkflowEngine
from apps.workflows.models import CaseQuery, ComplianceCase, OutboxEvent

logger = logging.getLogger(__name__)


def build_structured_findings(verification_result: dict[str, Any], doc_req: DocumentRequirement) -> list[dict[str, Any]]:
    """Transform software-level verification and OCR results into canonical structured findings (§5)."""
    findings: list[dict[str, Any]] = []

    ocr_meta = verification_result.get("ocr_analysis") or {}
    llm_analysis = verification_result.get("llm_scan_analysis") or {}
    checks = verification_result.get("checks") or {}

    # 1. Check readability
    if ocr_meta.get("status") == "EMPTY" or not ocr_meta.get("has_readable_text", True):
        findings.append({
            "finding_code": "DOCUMENT_UNREADABLE",
            "severity": "WARNING",
            "field": "document_content",
            "expected_value": "Legible typed or scanned text with clear statutory seals",
            "observed_value": "No decipherable text extracted by OCR engine",
            "source": doc_req.name,
            "confidence": 0.90,
        })
    else:
        findings.append({
            "finding_code": "DOCUMENT_READABLE",
            "severity": "INFO",
            "field": "document_content",
            "expected_value": "Machine-readable document",
            "observed_value": f"Extracted {ocr_meta.get('word_count', 0)} words via OCR engine",
            "source": doc_req.name,
            "confidence": 0.95,
        })

    # 2. Check File Type
    file_type_check = checks.get("file_type") or {}
    if not file_type_check.get("passed", True):
        findings.append({
            "finding_code": "WRONG_DOCUMENT_TYPE",
            "severity": "WARNING",
            "field": "file_extension",
            "expected_value": ", ".join(file_type_check.get("expected_types", [".pdf"])),
            "observed_value": file_type_check.get("detected_type", "unknown"),
            "source": doc_req.name,
            "confidence": 0.99,
        })

    # 3. Check Mandatory Fields Completeness
    fields_check = checks.get("field_completeness") or {}
    missing_fields = fields_check.get("missing_fields") or []
    for mf in missing_fields:
        findings.append({
            "finding_code": "MISSING_FIELD",
            "severity": "WARNING",
            "field": mf,
            "expected_value": f"Mandatory field '{mf}' populated",
            "observed_value": "Field omitted or unpopulated in upload",
            "source": doc_req.name,
            "confidence": 0.92,
        })

    # 4. Check Format & Expiry
    format_expiry = checks.get("format_and_expiry") or {}
    if not format_expiry.get("passed", True):
        for iss in format_expiry.get("issues", []):
            code = "EXPIRED_DOCUMENT" if "expir" in iss.lower() else "FORMAT_NON_COMPLIANT"
            findings.append({
                "finding_code": code,
                "severity": "WARNING",
                "field": "validity_and_format",
                "expected_value": "Valid unexpired statutory certificate format",
                "observed_value": iss,
                "source": doc_req.name,
                "confidence": 0.88,
            })

    # 5. Check LLM Relevance & Identity Consistency
    ai_relevance = checks.get("ai_relevance") or {}
    if ai_relevance.get("irrelevant_document_flag"):
        findings.append({
            "finding_code": "WRONG_DOCUMENT_TYPE",
            "severity": "WARNING",
            "field": "document_content",
            "expected_value": f"Statutory evidence matching {doc_req.name}",
            "observed_value": ai_relevance.get("flag_message") or "Content does not match prescribed statutory standard",
            "source": doc_req.name,
            "confidence": 0.89,
        })

    # If all passed cleanly
    if not any(f["severity"] == "WARNING" for f in findings):
        findings.append({
            "finding_code": "FIELDS_VERIFIED",
            "severity": "INFO",
            "field": "overall",
            "expected_value": "Preliminary file checks passed",
            "observed_value": "All preliminary automated verification heuristics satisfied",
            "source": doc_req.name,
            "confidence": 0.96,
        })

    return findings


@transaction.atomic
def process_document_upload(
    *,
    document_requirement: DocumentRequirement,
    uploaded_file: Any = None,
    file_bytes: bytes | None = None,
    file_name: str = "",
    uploaded_by=None,
    extra_metadata: dict[str, Any] | None = None,
) -> tuple[DocumentSubmission, DocumentReview, dict[str, Any]]:
    """Process an uploaded document file: persist versioned submission,

    execute structured AI precheck, and trigger corresponding workflow transition.
    """
    document_requirement = DocumentRequirement.objects.select_for_update().select_related("case__business").get(pk=document_requirement.pk)
    case = document_requirement.case
    business = case.business
    extra_metadata = extra_metadata or {}

    # 1. Determine next version number (never overwrite existing submissions)
    last_sub = document_requirement.submissions.order_by("-version_number").first()
    next_version = (last_sub.version_number + 1) if last_sub else 1

    # Resolve filename & content
    if uploaded_file is not None:
        file_name = file_name or getattr(uploaded_file, "name", "document.pdf")
        if file_bytes is None and hasattr(uploaded_file, "read"):
            file_bytes = uploaded_file.read()
            if hasattr(uploaded_file, "seek"):
                uploaded_file.seek(0)
    elif file_bytes is not None:
        file_name = file_name or f"document_v{next_version}.pdf"
    else:
        file_bytes = b""
        file_name = file_name or f"document_v{next_version}.pdf"

    from pathlib import PurePosixPath
    file_name = PurePosixPath(file_name.replace("\\", "/")).name
    if not file_bytes:
        raise ValueError("A nonempty uploaded file is required.")

    # Compute SHA-256 checksum and size
    checksum = hashlib.sha256(file_bytes).hexdigest() if file_bytes else ""
    file_size = len(file_bytes) if file_bytes else 0

    # 2. Determine Storage Path and persist via DocumentStorageService
    storage_path = (
        f"businesses/{business.id}/cases/{case.id}/documents/{document_requirement.id}/v{next_version}_{file_name}"
    )

    try:
        DocumentStorageService.save_file(storage_path, uploaded_file or file_bytes)
    except Exception as exc:
        raise ValueError("Document storage failed. Please retry the upload.") from exc

    # Sanitize extra_metadata to prevent non-JSON serializable file objects
    clean_metadata: dict[str, Any] = {}
    for k, v in extra_metadata.items():
        if k not in ("file", "files") and not hasattr(v, "read") and not hasattr(v, "chunks"):
            if isinstance(v, (str, int, float, bool, list, dict)) or v is None:
                clean_metadata[k] = v
            else:
                clean_metadata[k] = str(v)

    # 3. Create immutable DocumentSubmission
    submission = DocumentSubmission.objects.create(
        document_requirement=document_requirement,
        version_number=next_version,
        file_name=file_name,
        storage_path=storage_path,
        file_size_bytes=file_size,
        mime_type=clean_metadata.get("mime_type", "application/pdf"),
        checksum=checksum,
        uploaded_by=uploaded_by,
        status_code=DocumentReviewStatus.PRECHECK_PROCESSING,
        metadata={
            **clean_metadata,
            "business_id": str(business.id),
            "case_id": str(case.id),
        },
    )

    # 4. Run Genuine Software & AI Precheck Pipeline with distinct technical error handling
    verification_payload = {
        "file_name": file_name,
        "file_size_bytes": file_size,
        "name": document_requirement.name,
        "category": document_requirement.document_type_code,
        "authority": case.metadata.get("authority", "Regulatory Authority"),
        "requirement_id": case.requirement_id_code,
        "requirement_name": case.metadata.get("requirement_name", case.requirement_id_code),
        "valid_until": extra_metadata.get("valid_until", ""),
        "reference_number": extra_metadata.get("reference_number", ""),
    }
    if file_bytes:
        verification_payload["file_content_bytes"] = file_bytes

    technical_error = False
    error_detail = ""
    try:
        verification_result = verify_document(verification_payload, file=uploaded_file)
        if (verification_result.get("ocr_analysis") or {}).get("source_type") == "OCR_UNAVAILABLE":
            raise RuntimeError("Image OCR is unavailable; document requires human review.")
    except Exception as exc:
        logger.warning("AI/OCR verification pipeline encountered technical error: %s", exc)
        technical_error = True
        error_detail = str(exc)
        verification_result = {
            "verified": False,
            "overall_status": "ERROR",
            "status": "NEEDS_REVIEW",
            "message": "AI precheck service temporarily unavailable. Document uploaded successfully. Awaiting human officer verification.",
            "issues": [f"Technical precheck advisory: {exc}"],
            "checks": {},
            "ocr_analysis": {"status": "UNAVAILABLE", "has_readable_text": True},
        }

    # 5. Build Canonical Structured Findings
    if technical_error:
        precheck_status = DocumentReviewStatus.PRECHECK_ERROR
        structured_findings = [{
            "finding_code": "PRECHECK_ERROR",
            "severity": "WARNING",
            "field": "system",
            "expected_value": "Automated AI pre-validation",
            "observed_value": f"Service temporarily busy or timed out ({error_detail}). Dispatched for direct human verification.",
            "source": document_requirement.name,
            "confidence": 0.50,
        }]
        comment = "AI validation temporarily unavailable. Your document was uploaded successfully and is queued for officer scrutiny."
    else:
        structured_findings = build_structured_findings(verification_result, document_requirement)
        has_critical_issues = any(f["severity"] == "WARNING" for f in structured_findings)
        precheck_status = (
            DocumentReviewStatus.PRECHECK_FAILED
            if has_critical_issues
            else DocumentReviewStatus.PRECHECK_PASSED
        )
        comment = verification_result.get(
            "message",
            "AI automated pre-validation completed with structured findings."
        )

    # 6. Record AI Precheck DocumentReview Record (Distinct from Human Review)
    review = DocumentReview.objects.create(
        submission=submission,
        review_type=ReviewType.AI_PRECHECK,
        reviewer_user=None,  # AI precheck has no human user
        status=precheck_status,
        findings=structured_findings,
        reviewer_comments=comment,
        reviewed_at=timezone.now(),
    )

    submission.status_code = precheck_status
    submission.save(update_fields=["status_code"])

    document_requirement.status_code = (
        DocumentStatus.UPLOADED
        if precheck_status == DocumentReviewStatus.PRECHECK_PASSED
        else DocumentStatus.NEEDS_REVIEW
    )
    document_requirement.save(update_fields=["status_code", "updated_at"])

    # 7. Check if resolving an open query on this document requirement
    open_query = CaseQuery.objects.filter(
        case=case,
        document_requirement=document_requirement,
        status__in=[QueryStatus.OPEN, QueryStatus.RESPONDED],
    ).first()

    if open_query:
        open_query.status = QueryStatus.UNDER_REVIEW
        open_query.document_submission = submission
        open_query.response_notes = f"User uploaded version {next_version}: {file_name}."
        open_query.save(update_fields=["status", "document_submission", "response_notes", "updated_at"])

    # 8. Record Outbox Event for Realtime / Async Notifications
    OutboxEvent.objects.create(
        event_type="DOCUMENT_UPLOADED",
        payload={
            "case_id": str(case.id),
            "document_requirement_id": str(document_requirement.id),
            "submission_id": str(submission.id),
            "version_number": next_version,
            "precheck_status": precheck_status,
            "uploaded_by_id": str(uploaded_by.id) if uploaded_by else None,
        },
        idempotency_key=f"doc_up_{submission.id}",
    )

    # 9. Trigger Workflow Engine Transition
    _trigger_post_upload_workflow_events(
        case,
        document_requirement,
        submission,
        precheck_status == DocumentReviewStatus.PRECHECK_PASSED,
        uploaded_by,
    )

    return submission, review, verification_result


def _trigger_post_upload_workflow_events(
    case: ComplianceCase,
    doc_req: DocumentRequirement,
    submission: DocumentSubmission,
    precheck_passed: bool,
    uploaded_by=None,
) -> None:
    """Evaluate whether case should advance in workflow based on upload and precheck."""
    instance = case.current_workflow_instance
    if not instance or not instance.current_step:
        return

    current_code = instance.current_step.code

    # Check if case is currently in ACTION_REQUIRED / QUERY state: user resubmission
    if case.status_code == CaseStatus.ACTION_REQUIRED or submission.version_number > 1:
        try:
            GenericWorkflowEngine.trigger_transition(
                compliance_case=case,
                event_code="QUERY_RESUBMITTED",
                actor_type=ActorType.USER,
                actor_user=uploaded_by,
                payload={
                    "document_id": str(doc_req.id),
                    "submission_id": str(submission.id),
                    "version_number": submission.version_number,
                    "precheck_passed": precheck_passed,
                },
                notes=f"User resubmitted version {submission.version_number} of {doc_req.name}. Returned to Compliance Officer scrutiny.",
            )
            return
        except Exception as exc:
            logger.debug("QUERY_RESUBMITTED transition did not match: %s", exc)

    # Initial upload progression:
    # If currently in DOCUMENT_COLLECTION:
    if current_code == "DOCUMENT_COLLECTION":
        try:
            # Advance to DOCUMENT_REVIEW
            GenericWorkflowEngine.trigger_transition(
                compliance_case=case,
                event_code="DOCUMENTS_UPLOADED",
                actor_type=ActorType.USER,
                actor_user=uploaded_by,
                payload={
                    "document_id": str(doc_req.id),
                    "submission_id": str(submission.id),
                },
                notes=f"Uploaded {doc_req.name} v{submission.version_number}.",
            )
            instance.refresh_from_db()
            current_code = instance.current_step.code if instance.current_step else ""
        except Exception as exc:
            logger.debug("DOCUMENTS_UPLOADED transition error: %s", exc)

    # If now in DOCUMENT_REVIEW: always advance to HUMAN_REVIEW for officer determination
    if current_code == "DOCUMENT_REVIEW":
        event_code = "AI_PRECHECK_PASSED"
        try:
            GenericWorkflowEngine.trigger_transition(
                compliance_case=case,
                event_code=event_code,
                actor_type=ActorType.SYSTEM,
                payload={
                    "precheck_passed": precheck_passed,
                    "document_id": str(doc_req.id),
                    "submission_id": str(submission.id),
                },
                notes=(
                    "AI Pre-Check analysis completed clean. Dispatched to Compliance Officer Scrutiny."
                    if precheck_passed
                    else "AI Pre-Check completed with advisory findings. Dispatched to Compliance Officer Scrutiny for human determination."
                ),
            )
        except Exception as exc:
            logger.debug("%s transition error: %s", event_code, exc)
