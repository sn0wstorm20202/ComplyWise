"""Models for the onboarding and adaptive questioning boundary.

Authority: Milestone Task — Part A; PRD_v2.0 §10, §11; TRD_v2.0 §8, §12.

Persists adaptive smart question plans and instances per business.
Every question instance maps to a canonical variable key (V01-V19).
"""

from __future__ import annotations

import uuid
from django.db import models
from apps.businesses.models import Business


class SmartQuestionPlan(models.Model):
    """Execution plan for an adaptive smart questioning session."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    business = models.ForeignKey(
        Business,
        on_delete=models.CASCADE,
        related_name="question_plans",
    )
    assessment = models.ForeignKey(
        "businesses.Assessment",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="question_plan_records",
    )
    round_number = models.PositiveIntegerField(default=1)
    status = models.CharField(
        max_length=30,
        default="ACTIVE",
        help_text="ACTIVE, COMPLETED, SUPERSEDED",
        db_index=True,
    )
    stopping_reason = models.CharField(max_length=100, blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"SmartQuestionPlan {self.id} for {self.business.name} (Round {self.round_number}) [{self.status}]"


class SmartQuestionInstance(models.Model):
    """An individual adaptive question presented to the user."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    question_id = models.CharField(max_length=100, blank=True, default="")
    plan = models.ForeignKey(
        SmartQuestionPlan,
        on_delete=models.CASCADE,
        related_name="questions",
    )
    business = models.ForeignKey(
        Business,
        on_delete=models.CASCADE,
        related_name="smart_questions",
    )
    variable_key = models.CharField(
        max_length=100,
        db_index=True,
        help_text="Canonical variable key (V01-V19) in the profile registry.",
    )
    question_text = models.TextField()
    why_it_matters = models.TextField(blank=True, default="")
    reason = models.TextField(blank=True, default="")
    domains = models.JSONField(default=list, blank=True)
    data_type = models.CharField(max_length=30, default="TEXT")
    options = models.JSONField(default=list, blank=True)
    unit = models.CharField(max_length=30, blank=True, default="")
    priority = models.CharField(max_length=20, default="HIGH")
    information_gain = models.FloatField(default=1.0)
    rule_dependency_count = models.IntegerField(default=0)
    is_answered = models.BooleanField(default=False)
    answer_value = models.JSONField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-priority", "-information_gain", "created_at"]
        indexes = [
            models.Index(fields=["business", "variable_key"]),
            models.Index(fields=["plan", "is_answered"]),
        ]

    def __str__(self) -> str:
        return f"Question({self.variable_key}): {self.question_text[:50]}... [{self.priority}]"
