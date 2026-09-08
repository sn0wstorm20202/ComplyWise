"""Canonical ComplyWise status vocabulary.

Authority: PRD_v2.0 §36 / §17, TRD_v2.0 §17, §25, §23, §33, §36, §48.

These enums are the shared contract between the engine, the API and the
frontend. `frontend/types/index.ts` mirrors them verbatim and
`backend/tests/test_status_contract.py` fails the build if the two drift.

Two rules apply to every enum in this file:

1. Do not rename a member for presentation convenience. Labels are for display;
   values are the contract.
2. Do not collapse applicability, workflow and document status into one field.
   They are three independent dimensions (PRD_v2.0 §P8).
"""

from __future__ import annotations

from django.db import models


class RuleType(models.TextChoices):
    """Categorization of a rule governing precedence and obligation suppression."""

    NORMAL = "NORMAL", "Normal"
    EXCEPTION = "EXCEPTION", "Exception"
    OVERRIDE = "OVERRIDE", "Override"
    EXEMPTION = "EXEMPTION", "Exemption"


class ApplicabilityStatus(models.TextChoices):
    """Outcome of evaluating published rules against a business context.

    `NEEDS_INFORMATION`, `CONFLICT_REVIEW` and `UNVERIFIED` must never be
    presented or stored as equivalent to `NOT_APPLICABLE` (PRD_v2.0 §P4).
    """

    APPLICABLE = "APPLICABLE", "Applicable"
    NOT_APPLICABLE = "NOT_APPLICABLE", "Not applicable"
    NEEDS_INFORMATION = "NEEDS_INFORMATION", "More information needed"
    CONFLICT_REVIEW = "CONFLICT_REVIEW", "Review required"
    UNVERIFIED = "UNVERIFIED", "Verification required"


class WorkflowStatus(models.TextChoices):
    NOT_STARTED = "NOT_STARTED", "Not started"
    IN_PROGRESS = "IN_PROGRESS", "In progress"
    WAITING_FOR_USER = "WAITING_FOR_USER", "Waiting for you"
    UNDER_REVIEW = "UNDER_REVIEW", "Under review"
    NEEDS_CORRECTION = "NEEDS_CORRECTION", "Needs correction"
    READY = "READY", "Ready"
    SUBMITTED = "SUBMITTED", "Submitted"
    COMPLETED = "COMPLETED", "Completed"
    OVERDUE = "OVERDUE", "Overdue"
    BLOCKED = "BLOCKED", "Blocked"


class DocumentStatus(models.TextChoices):
    NOT_UPLOADED = "NOT_UPLOADED", "Not uploaded"
    UPLOADED = "UPLOADED", "Uploaded"
    PROCESSING = "PROCESSING", "Processing"
    VERIFIED = "VERIFIED", "Verified"
    ISSUE = "ISSUE", "Issue found"
    NEEDS_REVIEW = "NEEDS_REVIEW", "Needs review"
    EXPIRED = "EXPIRED", "Expired"
    REPLACEMENT_REQUIRED = "REPLACEMENT_REQUIRED", "Replacement required"


class PrevalidationOutcome(models.TextChoices):
    """AI document pre-validation result. Never an official approval."""

    PASS = "PASS", "Pass"
    ISSUE = "ISSUE", "Issue"
    NEEDS_REVIEW = "NEEDS_REVIEW", "Needs review"


class KnowledgeStatus(models.TextChoices):
    """Knowledge publication lifecycle — TRD_v2.0 §25.

    Runtime invariant: only `PUBLISHED` records may influence a compliance
    decision.
    """

    DRAFT = "DRAFT", "Draft"
    VALIDATION_PENDING = "VALIDATION_PENDING", "Validation pending"
    UNDER_REVIEW = "UNDER_REVIEW", "Under review"
    APPROVED = "APPROVED", "Approved"
    PUBLISHED = "PUBLISHED", "Published"
    SUPERSEDED = "SUPERSEDED", "Superseded"
    ARCHIVED = "ARCHIVED", "Archived"
    REJECTED = "REJECTED", "Rejected"


class SourceStatus(models.TextChoices):
    ACTIVE = "ACTIVE", "Active"
    UPDATED = "UPDATED", "Updated"
    SUPERSEDED = "SUPERSEDED", "Superseded"
    EXPIRED = "EXPIRED", "Expired"
    WITHDRAWN = "WITHDRAWN", "Withdrawn"
    CONFLICTING = "CONFLICTING", "Conflicting"
    #: Captured by automated discovery awaiting human verification. Never usable
    #: as decision evidence: the engine requires ACTIVE, and assistant retrieval
    #: only reads ACTIVE sources.
    DISCOVERED = "DISCOVERED", "Discovered (unverified)"


class VerificationStatus(models.TextChoices):
    VERIFIED = "VERIFIED", "Verified"
    UNVERIFIED = "UNVERIFIED", "Unverified"
    CONFLICTING = "CONFLICTING", "Conflicting"


class VariableOrigin(models.TextChoices):
    """Provenance of a business-profile value — TRD_v2.0 §8.

    A derived or looked-up value must never overwrite the user's own input.
    """

    USER_PROVIDED = "USER_PROVIDED", "Provided by you"
    DERIVED = "DERIVED", "Derived"
    LOOKUP = "LOOKUP", "Looked up"


class VariableRelevance(models.TextChoices):
    CORE = "CORE", "Core"
    CONDITIONAL = "CONDITIONAL", "Conditional"
    OPTIONAL = "OPTIONAL", "Optional"
    NOT_NEEDED = "NOT_NEEDED", "Not needed"


class DecisionRunStatus(models.TextChoices):
    PENDING = "PENDING", "Pending"
    RUNNING = "RUNNING", "Running"
    COMPLETED = "COMPLETED", "Completed"
    PARTIAL = "PARTIAL", "Partial"
    FAILED = "FAILED", "Failed"


class Priority(models.TextChoices):
    """Operational urgency. Never a substitute for applicability."""

    HIGH = "HIGH", "High"
    MEDIUM = "MEDIUM", "Medium"
    LOW = "LOW", "Low"


class RequirementType(models.TextChoices):
    LICENSE = "LICENSE", "Licence"
    REGISTRATION = "REGISTRATION", "Registration"
    CONSENT = "CONSENT", "Consent"
    CERTIFICATION = "CERTIFICATION", "Certification"
    STANDARD = "STANDARD", "Standard"
    REPORTING = "REPORTING", "Reporting"
    RENEWAL = "RENEWAL", "Renewal"
    NOTIFICATION = "NOTIFICATION", "Notification"
    DOCUMENT = "DOCUMENT", "Document"
    OTHER = "OTHER", "Other"


class CalendarEventType(models.TextChoices):
    STATUTORY_DEADLINE = "STATUTORY_DEADLINE", "Statutory deadline"
    SUBMISSION_DEADLINE = "SUBMISSION_DEADLINE", "Submission deadline"
    RENEWAL = "RENEWAL", "Renewal"
    REMINDER = "REMINDER", "Reminder"
    WORKFLOW_MILESTONE = "WORKFLOW_MILESTONE", "Workflow milestone"


class SchemeEligibility(models.TextChoices):
    """PRD_v2.0 §21.2. `VERIFIED_ELIGIBLE` requires supporting evidence."""

    POTENTIALLY_ELIGIBLE = "POTENTIALLY_ELIGIBLE", "Potentially eligible"
    MORE_INFORMATION_NEEDED = "MORE_INFORMATION_NEEDED", "More information needed"
    NOT_ELIGIBLE = "NOT_ELIGIBLE", "Not eligible"
    VERIFIED_ELIGIBLE = "VERIFIED_ELIGIBLE", "Verified eligible"


class AnswerClassification(models.TextChoices):
    """Assistant answer classification — TRD_v2.0 §44."""

    FACT = "FACT", "Fact"
    SOURCE = "SOURCE", "Source"
    AI_INTERPRETATION = "AI_INTERPRETATION", "AI interpretation"
    VERIFICATION_REQUIRED = "VERIFICATION_REQUIRED", "Verification required"


class ReviewReason(models.TextChoices):
    SOURCE_CONFLICT = "SOURCE_CONFLICT", "Sources conflict"
    MISSING_EVIDENCE = "MISSING_EVIDENCE", "Evidence missing"
    AMBIGUOUS_CLASSIFICATION = "AMBIGUOUS_CLASSIFICATION", "Classification ambiguous"
    LOCAL_APPLICABILITY_UNVERIFIED = (
        "LOCAL_APPLICABILITY_UNVERIFIED",
        "Local applicability unverified",
    )
    EXPERT_INTERPRETATION = "EXPERT_INTERPRETATION", "Expert interpretation required"


class ReviewStatus(models.TextChoices):
    OPEN = "OPEN", "Open"
    IN_REVIEW = "IN_REVIEW", "In review"
    RESOLVED = "RESOLVED", "Resolved"
    REJECTED = "REJECTED", "Rejected"


class AuditAction(models.TextChoices):
    """TRD_v2.0 §62."""

    PROFILE_CREATED = "PROFILE_CREATED", "Profile created"
    PROFILE_UPDATED = "PROFILE_UPDATED", "Profile updated"
    DECISION_RUN_CREATED = "DECISION_RUN_CREATED", "Decision run created"
    DECISION_RUN_COMPLETED = "DECISION_RUN_COMPLETED", "Decision run completed"
    KNOWLEDGE_PUBLISHED = "KNOWLEDGE_PUBLISHED", "Knowledge published"
    KNOWLEDGE_SUPERSEDED = "KNOWLEDGE_SUPERSEDED", "Knowledge superseded"
    RULE_REVIEWED = "RULE_REVIEWED", "Rule reviewed"
    DOCUMENT_UPLOADED = "DOCUMENT_UPLOADED", "Document uploaded"
    DOCUMENT_VALIDATED = "DOCUMENT_VALIDATED", "Document validated"
    WORKFLOW_STARTED = "WORKFLOW_STARTED", "Workflow started"
    WORKFLOW_STEP_UPDATED = "WORKFLOW_STEP_UPDATED", "Workflow step updated"
    ASSISTANT_QUERY = "ASSISTANT_QUERY", "Assistant query"


#: Statuses that must never be rendered or counted as a negative answer.
UNCERTAIN_APPLICABILITY_STATUSES = frozenset(
    {
        ApplicabilityStatus.NEEDS_INFORMATION,
        ApplicabilityStatus.CONFLICT_REVIEW,
        ApplicabilityStatus.UNVERIFIED,
    }
)
