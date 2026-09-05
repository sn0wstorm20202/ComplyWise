"""Models for the knowledge boundary.

Authority: TRD_v2.0 §10, §11, §25, §26, §66; PRD_v2.0 §P3, §P7.

RequirementDefinition: Catalog of all possible regulatory requirements.
RuleVersion: Structured, versioned applicability rule with AST logic and publication lifecycle.
"""

from __future__ import annotations

import uuid

from django.db import models

from common.enums import ApplicabilityStatus, KnowledgeStatus, RuleType


class RequirementDefinition(models.Model):
    """Canonical definition of a compliance requirement, license, approval, or standard."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    requirement_id = models.CharField(max_length=100, unique=True, db_index=True)
    name = models.CharField(max_length=255)
    category = models.CharField(
        max_length=50,
        default="LICENCE",
        help_text="LICENCE, REGISTRATION, CONSENT, COMPLIANCE, STANDARD, APPROVAL, etc.",
    )
    authority = models.CharField(max_length=100, db_index=True)
    jurisdiction = models.CharField(
        max_length=50,
        db_index=True,
        help_text="Jurisdiction code (e.g. CENTRAL or state/union territory code).",
    )
    domain = models.CharField(
        max_length=50,
        db_index=True,
        help_text="FOOD, ELECTRONICS, ENVIRONMENT, TRADE, AUTOMOTIVE, LABOR, etc.",
    )
    description = models.TextField(blank=True, default="")
    status = models.CharField(
        max_length=30,
        choices=KnowledgeStatus.choices,
        default=KnowledgeStatus.DRAFT,
        db_index=True,
    )
    evidence_refs = models.JSONField(
        default=list,
        blank=True,
        help_text="List of evidence_id strings supporting this requirement.",
    )
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["authority", "name"]

    def __str__(self) -> str:
        return f"{self.requirement_id}: {self.name} ({self.authority})"


class RuleVersion(models.Model):
    """A versioned, structured condition rule governing applicability of a requirement.

    Hard Invariant (TRD_v2.0 §11):
    Only `PUBLISHED` rules may ever be evaluated for runtime compliance decisions.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    rule_id = models.CharField(max_length=100, db_index=True)
    version = models.PositiveIntegerField(default=1)
    domain = models.CharField(max_length=50, db_index=True)
    jurisdiction = models.CharField(max_length=50, db_index=True)
    rule_type = models.CharField(
        max_length=20,
        choices=RuleType.choices,
        default=RuleType.NORMAL,
        db_index=True,
        help_text="Precedence level: OVERRIDE > EXEMPTION > EXCEPTION > NORMAL.",
    )
    effective_from = models.DateField(null=True, blank=True)
    effective_until = models.DateField(null=True, blank=True)
    status = models.CharField(
        max_length=30,
        choices=KnowledgeStatus.choices,
        default=KnowledgeStatus.DRAFT,
        db_index=True,
    )
    requirement = models.ForeignKey(
        RequirementDefinition,
        on_delete=models.CASCADE,
        related_name="rules",
    )
    condition_ast = models.JSONField(
        help_text="Structured condition AST evaluated by domain.evaluation.evaluator.",
    )
    result = models.CharField(
        max_length=50,
        choices=ApplicabilityStatus.choices,
        default=ApplicabilityStatus.APPLICABLE,
        help_text="Outcome when condition AST evaluates to TRUE.",
    )
    evidence_refs = models.JSONField(
        default=list,
        blank=True,
        help_text="List of evidence_id strings supporting this rule version.",
    )
    supersedes = models.ForeignKey(
        "self",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="superseded_by",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["rule_id", "-version"]
        constraints = [
            models.UniqueConstraint(
                fields=["rule_id", "version"],
                name="unique_rule_version",
            ),
        ]
        indexes = [
            models.Index(fields=["status", "effective_from", "effective_until"]),
            models.Index(fields=["jurisdiction", "domain", "status"]),
        ]

    def __str__(self) -> str:
        return f"{self.rule_id} v{self.version} [{self.status}] -> {self.requirement.requirement_id}"

    @property
    def is_published(self) -> bool:
        return self.status == KnowledgeStatus.PUBLISHED
