"""Models for the Central and Maharashtra Government Schemes pipeline.

Authority: PRD_v2.0 §21, §P5; TRD_v2.0 §30, §31.

This boundary manages:
1. Canonical Scheme registries (Central MSME, DPIIT, Champions, Maharashtra MCED).
2. Immutable SchemeVersion records with SHA-256 content hashes, source citations,
   effective dates, and diff history.
3. SchemeSourceSnapshot captures for audit trails and hash-change detection.
4. SchemeRollbackLog for reverting corrupted or erroneous updates safely.
"""

from __future__ import annotations

import uuid
from django.db import models
from django.utils import timezone


class Scheme(models.Model):
    """Canonical registry identity for a government support or incentive scheme."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    scheme_code = models.CharField(max_length=100, unique=True, db_index=True)
    title = models.CharField(max_length=300)
    authority = models.CharField(max_length=200, db_index=True)
    jurisdiction = models.CharField(
        max_length=50,
        default="CENTRAL",
        db_index=True,
        help_text="CENTRAL, MH (Maharashtra), etc.",
    )
    source_url = models.URLField(max_length=500)
    source_domain = models.CharField(max_length=150, db_index=True)
    current_version_number = models.PositiveIntegerField(default=1)
    is_active = models.BooleanField(default=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["jurisdiction", "title"]
        indexes = [
            models.Index(fields=["jurisdiction", "is_active"]),
            models.Index(fields=["authority", "is_active"]),
        ]

    def __str__(self) -> str:
        return f"{self.scheme_code} — {self.title} [{self.jurisdiction}] (v{self.current_version_number})"

    @property
    def current_version(self) -> SchemeVersion | None:
        return self.versions.filter(version_number=self.current_version_number, is_active=True).first() or self.versions.order_by("-version_number").first()


class SchemeVersion(models.Model):
    """Immutable version snapshot of an official government scheme.

    Each published version is tamper-evident and retains its own source citations,
    content hash, eligibility criteria, and diff record from prior versions.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    scheme = models.ForeignKey(
        Scheme,
        on_delete=models.CASCADE,
        related_name="versions",
    )
    version_number = models.PositiveIntegerField(db_index=True)
    content_hash = models.CharField(
        max_length=64,
        db_index=True,
        help_text="SHA-256 fingerprint of the normalized scheme metadata.",
    )
    title = models.CharField(max_length=300)
    authority = models.CharField(max_length=200)
    jurisdiction = models.CharField(max_length=50, default="CENTRAL")
    summary = models.TextField()

    benefit_type = models.CharField(
        max_length=60,
        default="INCENTIVE_SCHEME",
        help_text="CAPITAL_SUBSIDY, INTEREST_SUBVENTION, CREDIT_GUARANTEE, DUTY_REMISSION, TAX_EXEMPTION, QUALITY_CERTIFICATION, etc.",
    )
    benefit_summary = models.TextField()
    benefit_details = models.JSONField(
        default=dict,
        blank=True,
        help_text="Structured quantitative terms: subsidy_rate, ceiling_amount, moratorium, etc.",
    )

    eligibility_statement = models.TextField()
    eligibility_criteria = models.JSONField(
        default=dict,
        blank=True,
        help_text="Machine-evaluable criteria: min_investment, max_investment, turnover_cap, activities, required_certifications.",
    )
    sectors = models.JSONField(
        default=list,
        blank=True,
        help_text="List of targeted sectors, e.g. ['MANUFACTURING', 'TEXTILE', 'FOOD_PROCESSING', 'ALL'].",
    )
    scale_match = models.JSONField(
        default=list,
        blank=True,
        help_text="List of eligible MSME scales, e.g. ['MICRO', 'SMALL', 'MEDIUM'].",
    )

    application_route = models.TextField(blank=True, default="")
    application_url = models.URLField(max_length=500, blank=True, default="")
    source_url = models.URLField(max_length=500)
    source_domain = models.CharField(max_length=150, blank=True, default="")
    evidence_snippet = models.TextField(
        blank=True,
        default="",
        help_text="Verbatim quote or clause from official publication citing source fact.",
    )

    effective_from = models.DateField(null=True, blank=True)
    effective_to = models.DateField(null=True, blank=True)
    published_date = models.DateField(null=True, blank=True)
    last_verified_at = models.DateTimeField(default=timezone.now)

    verification_status = models.CharField(
        max_length=30,
        default="VERIFIED",
        db_index=True,
        help_text="VERIFIED, PENDING_REVIEW, ARCHIVED",
    )
    is_active = models.BooleanField(default=True, db_index=True)
    diff_summary = models.JSONField(
        default=dict,
        blank=True,
        help_text="Diff details comparing this version against version_number - 1.",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["scheme", "-version_number"]
        unique_together = [("scheme", "version_number")]
        indexes = [
            models.Index(fields=["scheme", "is_active"]),
            models.Index(fields=["jurisdiction", "verification_status"]),
            models.Index(fields=["content_hash"]),
        ]

    def __str__(self) -> str:
        return f"{self.scheme.scheme_code} v{self.version_number} ({self.verification_status})"


class SchemeSourceSnapshot(models.Model):
    """Audit log of raw crawl snapshots fetched from official government portals."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    source_key = models.CharField(
        max_length=60,
        db_index=True,
        help_text="CENTRAL_MSME, MSME_CHAMPIONS, DPIIT_OFFERINGS, MAHARASHTRA_MCED, MAITRI_PORTAL",
    )
    source_url = models.URLField(max_length=500)
    source_domain = models.CharField(max_length=150)
    content_hash = models.CharField(
        max_length=64,
        db_index=True,
        help_text="SHA-256 of the raw snapshot payload.",
    )
    status = models.CharField(
        max_length=30,
        default="SUCCESS",
        help_text="SUCCESS, UNCHANGED, FAILED",
    )
    scheme_count = models.PositiveIntegerField(default=0)
    fetched_at = models.DateTimeField(auto_now_add=True)
    raw_content = models.TextField(blank=True, default="")
    error_message = models.TextField(blank=True, default="")

    class Meta:
        ordering = ["-fetched_at"]
        indexes = [
            models.Index(fields=["source_key", "-fetched_at"]),
            models.Index(fields=["content_hash"]),
        ]

    def __str__(self) -> str:
        return f"Snapshot {self.source_key} [{self.status}] at {self.fetched_at.strftime('%Y-%m-%d %H:%M')}"


class SchemeRollbackLog(models.Model):
    """Safety audit trail for reverting scheme versions."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    scheme = models.ForeignKey(
        Scheme,
        on_delete=models.CASCADE,
        related_name="rollback_logs",
    )
    from_version = models.PositiveIntegerField()
    to_version = models.PositiveIntegerField()
    reason = models.TextField()
    reverted_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-reverted_at"]

    def __str__(self) -> str:
        return f"Rollback {self.scheme.scheme_code}: v{self.from_version} -> v{self.to_version}"
