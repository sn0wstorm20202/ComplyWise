"""Models for the applicability and decision evaluation boundary.

Authority: TRD_v2.0 §14, §17, §24, §66; PRD_v2.0 §P3, §P5, §P8.

DecisionRun: Audit record of an evaluation execution tied to an immutable profile version.
DecisionResult: Concrete applicability determination for a requirement with full explanation trace.
"""

from __future__ import annotations

import uuid

from django.db import models
from django.utils import timezone

from common.enums import ApplicabilityStatus, DecisionRunStatus
from apps.businesses.models import Business, BusinessProfileVersion
from apps.knowledge.models import RuleVersion


class DecisionRun(models.Model):
    """An execution of the applicability engine against an immutable business profile version."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    business = models.ForeignKey(
        Business,
        on_delete=models.CASCADE,
        related_name="decision_runs",
    )
    profile_version = models.ForeignKey(
        BusinessProfileVersion,
        on_delete=models.CASCADE,
        related_name="decision_runs",
    )
    status = models.CharField(
        max_length=30,
        choices=DecisionRunStatus.choices,
        default=DecisionRunStatus.PENDING,
        db_index=True,
    )
    evaluation_date = models.DateField(default=timezone.localdate)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["business", "created_at"]),
        ]

    def __str__(self) -> str:
        return f"DecisionRun {self.id} for {self.business.name} (v{self.profile_version.version}) [{self.status}]"


class DecisionResult(models.Model):
    """The applicability status and explanation trace for one requirement in a decision run."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    decision_run = models.ForeignKey(
        DecisionRun,
        on_delete=models.CASCADE,
        related_name="results",
    )
    requirement_id = models.CharField(max_length=100, db_index=True)
    requirement_name = models.CharField(max_length=255)
    rule_version = models.ForeignKey(
        RuleVersion,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="decision_results",
    )
    status = models.CharField(
        max_length=30,
        choices=ApplicabilityStatus.choices,
        default=ApplicabilityStatus.UNVERIFIED,
        db_index=True,
    )
    explanation_trace = models.JSONField(
        default=dict,
        help_text="Detailed trace: rule ID, conditions evaluated, variables used, values, and result.",
    )
    evidence_refs = models.JSONField(
        default=list,
        blank=True,
        help_text="Evidence records backing this determination.",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["requirement_id"]
        indexes = [
            models.Index(fields=["decision_run", "status"]),
            models.Index(fields=["requirement_id", "status"]),
        ]

    def __str__(self) -> str:
        return f"{self.requirement_id}: {self.status} (Run {self.decision_run_id})"
