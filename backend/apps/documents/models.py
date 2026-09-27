"""Models for the documents boundary.

Authority: Architectural Specification §13-§21.
Enforces:
1. Documents attach to the central ComplianceCase.
2. Versioned uploads: every upload is an immutable DocumentSubmission (v1, v2, ...). Never overwrite v1.
3. Dedicated DocumentReview records for AI precheck and human review.
4. Internal review status (INTERNAL_HUMAN_APPROVED, INTERNAL_HUMAN_QUERY, INTERNAL_HUMAN_REJECTED).
"""

from __future__ import annotations

import uuid

from django.conf import settings
from django.db import models
from django.utils import timezone

from common.enums import DocumentReviewStatus, DocumentStatus, ReviewType
from common.models import AppendOnlyModel, BaseModel


class DocumentRequirement(BaseModel):
    """Specification of a document mandated by a compliance case or workflow step."""

    case = models.ForeignKey(
        "workflows.ComplianceCase",
        on_delete=models.CASCADE,
        related_name="document_requirements",
        db_index=True,
    )
    workflow_step_instance = models.ForeignKey(
        "workflows.WorkflowStepInstance",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="document_requirements",
    )
    document_type_code = models.CharField(max_length=100, db_index=True)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, default="")
    required = models.BooleanField(default=True)
    status_code = models.CharField(
        max_length=50,
        choices=DocumentStatus.choices,
        default=DocumentStatus.NOT_UPLOADED,
    )
    configuration = models.JSONField(default=dict, blank=True)

    class Meta:
        db_table = "documents_requirement"
        ordering = ["case", "name"]

    def __str__(self) -> str:
        return f"{self.name} ({self.document_type_code}) for Case {self.case.case_number}"

    @property
    def latest_submission(self) -> DocumentSubmission | None:
        return self.submissions.order_by("-version_number").first()


class DocumentSubmission(AppendOnlyModel):
    """An immutable versioned upload for a document requirement (e.g. v1, v2)."""

    document_requirement = models.ForeignKey(
        DocumentRequirement,
        on_delete=models.CASCADE,
        related_name="submissions",
    )
    version_number = models.PositiveIntegerField(default=1)
    file_name = models.CharField(max_length=255)
    storage_path = models.CharField(max_length=500)
    file_size_bytes = models.PositiveIntegerField(default=0)
    mime_type = models.CharField(max_length=100, default="application/pdf")
    checksum = models.CharField(max_length=64, blank=True, default="")
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="+",
    )
    status_code = models.CharField(
        max_length=50,
        choices=DocumentReviewStatus.choices,
        default=DocumentReviewStatus.PENDING,
    )
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        db_table = "documents_submission"
        ordering = ["document_requirement", "-version_number"]
        constraints = [
            models.UniqueConstraint(
                fields=["document_requirement", "version_number"],
                name="uniq_doc_submission_version",
            )
        ]

    def __str__(self) -> str:
        return f"{self.document_requirement.name} v{self.version_number} [{self.status_code}]"

    @property
    def latest_review(self) -> DocumentReview | None:
        return self.reviews.order_by("-reviewed_at").first()


class DocumentReview(BaseModel):
    """Review outcome (AI precheck or Human review) for a document submission."""

    submission = models.ForeignKey(
        DocumentSubmission,
        on_delete=models.CASCADE,
        related_name="reviews",
    )
    review_type = models.CharField(
        max_length=30,
        choices=ReviewType.choices,
        default=ReviewType.AI_PRECHECK,
    )
    reviewer_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="+",
    )
    status = models.CharField(
        max_length=50,
        choices=DocumentReviewStatus.choices,
        default=DocumentReviewStatus.PENDING,
    )
    findings = models.JSONField(default=list, blank=True)
    reviewer_comments = models.TextField(blank=True, default="")
    reviewed_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = "documents_review"
        ordering = ["-reviewed_at"]

    def __str__(self) -> str:
        return f"{self.review_type} [{self.status}] on {self.submission}"
