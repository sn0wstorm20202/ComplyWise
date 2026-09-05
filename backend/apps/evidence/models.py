"""Models for the evidence and provenance boundary.

Authority: TRD_v2.0 §23, §24, §66; PRD_v2.0 §P6.

Source: The published legal or official instrument.
Evidence: The granular verified factual claim extracted from a Source.
"""

from __future__ import annotations

import uuid

from django.db import models

from common.enums import SourceStatus, VerificationStatus


class Source(models.Model):
    """An authoritative regulatory source document or official portal instrument."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    source_id = models.CharField(max_length=100, unique=True, db_index=True)
    authority = models.CharField(max_length=100, db_index=True)
    title = models.CharField(max_length=300)
    source_type = models.CharField(
        max_length=50,
        default="REGULATION",
        help_text="ACT, REGULATION, NOTIFICATION, OFFICIAL_PORTAL, CIRCULAR, etc.",
    )
    canonical_url = models.URLField(max_length=500, blank=True, default="")
    publication_date = models.DateField(null=True, blank=True)
    effective_date = models.DateField(null=True, blank=True)
    status = models.CharField(
        max_length=30,
        choices=SourceStatus.choices,
        default=SourceStatus.ACTIVE,
        db_index=True,
    )
    content_hash = models.CharField(max_length=64, blank=True, default="")
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["authority", "title"]

    def __str__(self) -> str:
        return f"{self.source_id}: {self.title} ({self.authority})"


class Evidence(models.Model):
    """Granular verified claim linked to an authoritative source."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    evidence_id = models.CharField(max_length=100, unique=True, db_index=True)
    source = models.ForeignKey(
        Source,
        on_delete=models.CASCADE,
        related_name="evidence_records",
    )
    locator = models.CharField(
        max_length=200,
        blank=True,
        default="",
        help_text="Section, Schedule, Clause or Page locator in the source document.",
    )
    excerpt = models.TextField(help_text="Verbatim quote or structured extract from source.")
    structured_fact = models.JSONField(default=dict, blank=True)
    verification_status = models.CharField(
        max_length=30,
        choices=VerificationStatus.choices,
        default=VerificationStatus.UNVERIFIED,
        db_index=True,
    )
    effective_from = models.DateField(null=True, blank=True)
    effective_until = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["evidence_id"]
        indexes = [
            models.Index(fields=["source", "verification_status"]),
        ]

    def __str__(self) -> str:
        return f"{self.evidence_id} [{self.verification_status}] ({self.locator})"
