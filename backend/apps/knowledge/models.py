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


class RequirementRevision(models.Model):
    """Reviewed procedural information with legal effective dates and recorded review time."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    requirement = models.ForeignKey(RequirementDefinition, on_delete=models.PROTECT, related_name="revisions")
    version = models.PositiveIntegerField()
    effective_from = models.DateField()
    effective_until = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=30, choices=KnowledgeStatus.choices, default=KnowledgeStatus.DRAFT)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, default="")
    metadata = models.JSONField(default=dict)
    evidence_refs = models.JSONField(default=list)
    review_record = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["requirement_id", "-effective_from", "-version"]
        constraints = [models.UniqueConstraint(fields=["requirement", "version"], name="unique_requirement_revision")]
        indexes = [models.Index(fields=["requirement", "effective_from"])]

    def save(self, *args, **kwargs):
        from django.core.exceptions import ValidationError
        if self.effective_until and self.effective_until < self.effective_from:
            raise ValidationError("A revision cannot end before it starts.")
        if not self._state.adding:
            previous = type(self).objects.get(pk=self.pk)
            immutable = ("requirement_id", "version", "effective_from", "effective_until", "name", "description",
                         "metadata", "evidence_refs", "review_record")
            if any(getattr(previous, field) != getattr(self, field) for field in immutable):
                raise ValidationError("Reviewed requirement information is immutable. Publish a new revision.")
        return super().save(*args, **kwargs)


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
    review_record = models.JSONField(default=dict, blank=True)
    requirement_revision = models.ForeignKey(RequirementRevision, on_delete=models.PROTECT, null=True, blank=True, related_name="rules")

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

    def save(self, *args, **kwargs):
        if not self._state.adding:
            previous = type(self).objects.filter(pk=self.pk).first()
            if previous and previous.review_record:
                immutable = ("rule_id", "version", "requirement_id", "condition_ast", "result", "evidence_refs",
                             "effective_from", "effective_until", "rule_type", "jurisdiction", "domain", "review_record", "requirement_revision_id")
                if any(getattr(previous, key) != getattr(self, key) for key in immutable):
                    from django.core.exceptions import ValidationError
                    raise ValidationError("Reviewed rules are immutable. Publish a new version.")
        return super().save(*args, **kwargs)
