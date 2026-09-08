"""Models for the regulatory discovery and source acquisition boundary.

Authority: Milestone Task — Parts C, D, E, F, J; PRD_v2.0 §27A; TRD_v2.0 §11A.

DiscoveryRun: Audit trail of Firecrawl searches, candidate URL captures and scraping passes.
CandidateRequirement: Quarantined regulatory claims extracted from discovered official sources.
                      UNVERIFIED discoveries cannot produce APPLICABLE decisions.
"""

from __future__ import annotations

import uuid
from django.db import models
from common.enums import VerificationStatus
from apps.businesses.models import Business
from apps.evidence.models import Evidence, Source


class DiscoveryRun(models.Model):
    """An execution of regulatory source discovery for an unseen business."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    business = models.ForeignKey(
        Business,
        on_delete=models.CASCADE,
        related_name="discovery_runs",
    )
    provider = models.CharField(max_length=50, default="firecrawl")
    status = models.CharField(
        max_length=30,
        default="PENDING",
        help_text="PENDING, RUNNING, COMPLETED, FAILED, PARTIAL, UNAVAILABLE",
        db_index=True,
    )
    queries = models.JSONField(default=list, help_text="Generated query strings")
    candidate_urls = models.JSONField(default=list, help_text="List of candidate URL records")
    scraped_urls = models.JSONField(default=list, help_text="List of scraped URL records")
    candidate_count = models.IntegerField(default=0)
    scraped_count = models.IntegerField(default=0)
    official_source_count = models.IntegerField(default=0)
    verified_count = models.IntegerField(default=0)
    error = models.TextField(blank=True, default="")
    summary = models.JSONField(default=dict, blank=True)
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["business", "-created_at"]),
        ]

    def __str__(self) -> str:
        return f"DiscoveryRun {self.id} for {self.business.name} [{self.status}]"


class CandidateRequirement(models.Model):
    """Quarantined regulatory requirement extracted from discovered sources."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    discovery_run = models.ForeignKey(
        DiscoveryRun,
        on_delete=models.CASCADE,
        related_name="candidate_requirements",
    )
    business = models.ForeignKey(
        Business,
        on_delete=models.CASCADE,
        related_name="candidate_requirements",
    )
    requirement_name = models.CharField(max_length=255)
    category = models.CharField(max_length=50, default="GENERAL")
    authority = models.CharField(max_length=150)
    jurisdiction = models.CharField(max_length=50, default="CENTRAL")
    applicability_statement = models.TextField()
    prerequisite = models.TextField(blank=True, default="")
    document_requirements = models.JSONField(default=list, blank=True)
    fee_info = models.CharField(max_length=200, blank=True, default="")
    deadline_info = models.CharField(max_length=200, blank=True, default="")
    validity_info = models.CharField(max_length=200, blank=True, default="")
    source = models.ForeignKey(
        Source,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="candidate_requirements",
    )
    evidence = models.ForeignKey(
        Evidence,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="candidate_requirements",
    )
    verification_status = models.CharField(
        max_length=30,
        choices=VerificationStatus.choices,
        default=VerificationStatus.UNVERIFIED,
        db_index=True,
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["requirement_name"]
        indexes = [
            models.Index(fields=["discovery_run", "verification_status"]),
            models.Index(fields=["business", "verification_status"]),
        ]

    def __str__(self) -> str:
        return f"CandidateRequirement: {self.requirement_name} ({self.authority}) [{self.verification_status}]"
