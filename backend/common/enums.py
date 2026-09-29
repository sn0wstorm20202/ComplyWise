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
    LLM_EXTRACTED = "LLM_EXTRACTED", "Extracted by AI"
    QUESTIONNAIRE_ANSWER = "QUESTIONNAIRE_ANSWER", "Answered in questionnaire"
    ADMIN_OVERRIDE = "ADMIN_OVERRIDE", "Admin override"


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


class AssessmentStatus(models.TextChoices):
    DRAFT = "DRAFT", "Draft"
    IN_PROGRESS = "IN_PROGRESS", "In progress"
    COMPLETED = "COMPLETED", "Completed"
    FAILED = "FAILED", "Failed"
    ARCHIVED = "ARCHIVED", "Archived"


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


class CaseStatus(models.TextChoices):
    """Lifecycle status of a ComplianceCase."""

    OPEN = "OPEN", "Open"
    IN_PROGRESS = "IN_PROGRESS", "In progress"
    ACTION_REQUIRED = "ACTION_REQUIRED", "Action required"
    HUMAN_REVIEW = "HUMAN_REVIEW", "Human review"
    SUBMITTED = "SUBMITTED", "Submitted"
    EXTERNAL_PROCESSING = "EXTERNAL_PROCESSING", "External processing"
    COMPLETED = "COMPLETED", "Completed"
    REJECTED = "REJECTED", "Rejected"
    CLOSED = "CLOSED", "Closed"


class WorkflowStepType(models.TextChoices):
    """Generic workflow step primitives, independent of specific regulatory bodies."""

    INFORMATION = "INFORMATION", "Information"
    DOCUMENT_COLLECTION = "DOCUMENT_COLLECTION", "Document collection"
    DOCUMENT_REVIEW = "DOCUMENT_REVIEW", "Document review"
    HUMAN_REVIEW = "HUMAN_REVIEW", "Human review"
    FORM_PREPARATION = "FORM_PREPARATION", "Form preparation"
    FORM_REVIEW = "FORM_REVIEW", "Form review"
    USER_SUBMISSION = "USER_SUBMISSION", "User submission"
    EXTERNAL_PROCESSING = "EXTERNAL_PROCESSING", "External processing"
    QUERY_RESOLUTION = "QUERY_RESOLUTION", "Query resolution"
    APPROVAL = "APPROVAL", "Approval"
    REJECTION = "REJECTION", "Rejection"
    COMPLETION = "COMPLETION", "Completion"


class StepStatus(models.TextChoices):
    """Status of an executed workflow step instance."""

    NOT_STARTED = "NOT_STARTED", "Not started"
    IN_PROGRESS = "IN_PROGRESS", "In progress"
    WAITING_FOR_INPUT = "WAITING_FOR_INPUT", "Waiting for input"
    COMPLETED = "COMPLETED", "Completed"
    SKIPPED = "SKIPPED", "Skipped"
    BLOCKED = "BLOCKED", "Blocked"


class ActorType(models.TextChoices):
    """Initiator or actor responsible for a workflow transition or review."""

    USER = "USER", "User"
    ADMIN = "ADMIN", "Admin"
    SYSTEM = "SYSTEM", "System"
    EXTERNAL = "EXTERNAL", "External"
    ANY = "ANY", "Any"


class ReviewType(models.TextChoices):
    """Distinction between automated validation and human expert oversight."""

    AI_PRECHECK = "AI_PRECHECK", "AI precheck"
    HUMAN_REVIEW = "HUMAN_REVIEW", "Human review"


class DocumentReviewStatus(models.TextChoices):
    """Review outcome of a document submission version."""

    PENDING = "PENDING", "Pending"
    PRECHECK_QUEUED = "PRECHECK_QUEUED", "Precheck queued"
    PRECHECK_PROCESSING = "PRECHECK_PROCESSING", "Precheck processing"
    PRECHECK_PASSED = "PRECHECK_PASSED", "Precheck passed"
    PRECHECK_FAILED = "PRECHECK_FAILED", "Precheck issues detected"
    PRECHECK_ERROR = "PRECHECK_ERROR", "Precheck technical error"
    PRECHECK_RETRYING = "PRECHECK_RETRYING", "Precheck retrying"
    INTERNAL_HUMAN_APPROVED = "INTERNAL_HUMAN_APPROVED", "Internal approved"
    INTERNAL_HUMAN_QUERY = "INTERNAL_HUMAN_QUERY", "Internal query raised"
    INTERNAL_HUMAN_REJECTED = "INTERNAL_HUMAN_REJECTED", "Internal rejected"


class AdminDisposition(models.TextChoices):
    """Admin operational case-level treatment for a requirement."""

    SYSTEM_REVIEW_PENDING = "SYSTEM_REVIEW_PENDING", "System review pending"
    CONFIRMED_REQUIRED = "CONFIRMED_REQUIRED", "Confirmed required"
    NOT_REQUIRED = "NOT_REQUIRED", "Not required"
    NEEDS_INFORMATION = "NEEDS_INFORMATION", "Needs information"
    REQUEST_USER_INFORMATION = "REQUEST_USER_INFORMATION", "Request user information"
    ADMIN_ASSIGNED = "ADMIN_ASSIGNED", "Admin assigned"
    ESCALATED = "ESCALATED", "Escalated"


class QueryStatus(models.TextChoices):
    """Lifecycle status of a CaseQuery."""

    OPEN = "OPEN", "Open"
    RESPONDED = "RESPONDED", "Responded"
    UNDER_REVIEW = "UNDER_REVIEW", "Under review"
    RESOLVED = "RESOLVED", "Resolved"
    CANCELLED = "CANCELLED", "Cancelled"


class QuerySeverity(models.TextChoices):
    """Urgency / severity of an objection or discrepancy query."""

    LOW = "LOW", "Low"
    MEDIUM = "MEDIUM", "Medium"
    HIGH = "HIGH", "High"
    CRITICAL = "CRITICAL", "Critical"


class QueryType(models.TextChoices):
    """Nature of clarification requested from user."""

    DOCUMENT_CORRECTION = "DOCUMENT_CORRECTION", "Document correction"
    INFORMATION_REQUEST = "INFORMATION_REQUEST", "Information request"
    SCOPE_CLARIFICATION = "SCOPE_CLARIFICATION", "Scope clarification"
    RENEWAL_REMINDER = "RENEWAL_REMINDER", "Renewal reminder"


class DeadlineStatus(models.TextChoices):
    """Status of compliance filing or submission deadline."""

    PENDING = "PENDING", "Pending"
    COMPLETED = "COMPLETED", "Completed"
    OVERDUE = "OVERDUE", "Overdue"
    CANCELLED = "CANCELLED", "Cancelled"


class DeadlineSource(models.TextChoices):
    """Origin of a deadline record."""

    SYSTEM_RULE = "SYSTEM_RULE", "System rule"
    ADMIN_SET = "ADMIN_SET", "Admin set"
    EXTERNAL_PORTAL = "EXTERNAL_PORTAL", "External portal"
    RENEWAL = "RENEWAL", "Renewal"


class OutboxStatus(models.TextChoices):
    """Status of transactional outbox dispatch."""

    PENDING = "PENDING", "Pending"
    PROCESSING = "PROCESSING", "Processing"
    DELIVERED = "DELIVERED", "Delivered"
    FAILED = "FAILED", "Failed"


class AdminRole(models.TextChoices):
    """Role-based access classification for administrative & review operations."""

    COMPLIANCE_OFFICER = "COMPLIANCE_OFFICER", "Compliance Officer"
    SENIOR_OFFICER = "SENIOR_OFFICER", "Senior Officer"
    AUDITOR = "AUDITOR", "Auditor"
    SUPER_ADMIN = "SUPER_ADMIN", "Super Admin"
    USER = "USER", "User"


class ExternalApplicationStatusEnum(models.TextChoices):
    """Status on the external government statutory portal. Completely separate from internal review."""

    SUBMITTED = "SUBMITTED", "Submitted"
    RECEIVED = "RECEIVED", "Received"
    PROCESSING = "PROCESSING", "Processing"
    QUERY_RAISED = "QUERY_RAISED", "Query raised"
    RESUBMISSION_REQUIRED = "RESUBMISSION_REQUIRED", "Resubmission required"
    ACCEPTED = "ACCEPTED", "Accepted"
    REJECTED = "REJECTED", "Rejected"
    APPROVED = "APPROVED", "Approved"
    UNKNOWN = "UNKNOWN", "Unknown"


class NotificationChannel(models.TextChoices):
    """Delivery destination channels for workflow and compliance events."""

    IN_APP = "IN_APP", "In-app"
    EMAIL = "EMAIL", "Email"
    PUSH = "PUSH", "Push"
    GOOGLE_CALENDAR = "GOOGLE_CALENDAR", "Google calendar"


class NotificationDeliveryStatus(models.TextChoices):
    PENDING = "PENDING", "Pending"
    SENT = "SENT", "Sent"
    FAILED = "FAILED", "Failed"


#: Statuses that must never be rendered or counted as a negative answer.
UNCERTAIN_APPLICABILITY_STATUSES = frozenset(
    {
        ApplicabilityStatus.NEEDS_INFORMATION,
        ApplicabilityStatus.CONFLICT_REVIEW,
        ApplicabilityStatus.UNVERIFIED,
    }
)
