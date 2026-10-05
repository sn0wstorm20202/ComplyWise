// ---------------------------------------------------------------------------
// Canonical Status Enums (common/enums.py verbatim)
// ---------------------------------------------------------------------------

export type ApplicabilityStatus =
  | "APPLICABLE"
  | "NOT_APPLICABLE"
  | "NEEDS_INFORMATION"
  | "CONFLICT_REVIEW"
  | "UNVERIFIED";

export type WorkspaceRequirementStatus = ApplicabilityStatus | "SUGGESTED";

export type WorkflowStatus =
  | "NOT_STARTED"
  | "IN_PROGRESS"
  | "WAITING_FOR_USER"
  | "UNDER_REVIEW"
  | "NEEDS_CORRECTION"
  | "READY"
  | "SUBMITTED"
  | "COMPLETED"
  | "OVERDUE"
  | "BLOCKED";

export type DocumentStatus =
  | "NOT_UPLOADED"
  | "UPLOADED"
  | "PROCESSING"
  | "VERIFIED"
  | "ISSUE"
  | "NEEDS_REVIEW"
  | "EXPIRED"
  | "REPLACEMENT_REQUIRED";

export type PrevalidationOutcome = "PASS" | "ISSUE" | "NEEDS_REVIEW";

export type KnowledgeStatus =
  | "DRAFT"
  | "VALIDATION_PENDING"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "PUBLISHED"
  | "SUPERSEDED"
  | "ARCHIVED"
  | "REJECTED";

export type SourceStatus =
  | "ACTIVE"
  | "UPDATED"
  | "SUPERSEDED"
  | "EXPIRED"
  | "WITHDRAWN"
  | "CONFLICTING"
  | "DISCOVERED";

export type VerificationStatus = "VERIFIED" | "UNVERIFIED" | "CONFLICTING";

export type VariableOrigin = "USER_PROVIDED" | "DERIVED" | "LOOKUP";

export type VariableRelevance = "CORE" | "CONDITIONAL" | "OPTIONAL" | "NOT_NEEDED";

export type DecisionRunStatus =
  | "PENDING"
  | "RUNNING"
  | "COMPLETED"
  | "PARTIAL"
  | "FAILED";

export type AssessmentStatus =
  | "DRAFT"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "FAILED"
  | "ARCHIVED";

export type CaseStatus =
  | "OPEN"
  | "IN_PROGRESS"
  | "ACTION_REQUIRED"
  | "HUMAN_REVIEW"
  | "SUBMITTED"
  | "EXTERNAL_PROCESSING"
  | "COMPLETED"
  | "REJECTED"
  | "CLOSED";

export type WorkflowStepType =
  | "INFORMATION"
  | "DOCUMENT_COLLECTION"
  | "DOCUMENT_REVIEW"
  | "HUMAN_REVIEW"
  | "FORM_PREPARATION"
  | "FORM_REVIEW"
  | "USER_SUBMISSION"
  | "EXTERNAL_PROCESSING"
  | "QUERY_RESOLUTION"
  | "APPROVAL"
  | "REJECTION"
  | "COMPLETION";

export type StepStatus =
  | "NOT_STARTED"
  | "IN_PROGRESS"
  | "WAITING_FOR_INPUT"
  | "COMPLETED"
  | "SKIPPED"
  | "BLOCKED";

export type ActorType = "USER" | "ADMIN" | "SYSTEM" | "EXTERNAL" | "ANY";

export type ReviewType = "AI_PRECHECK" | "HUMAN_REVIEW";

export type DocumentReviewStatus =
  | "PENDING"
  | "PRECHECK_QUEUED"
  | "PRECHECK_PROCESSING"
  | "PRECHECK_PASSED"
  | "PRECHECK_FAILED"
  | "PRECHECK_ERROR"
  | "PRECHECK_RETRYING"
  | "INTERNAL_HUMAN_APPROVED"
  | "INTERNAL_HUMAN_QUERY"
  | "INTERNAL_HUMAN_REJECTED";


export type ExternalApplicationStatusEnum =
  | "SUBMITTED"
  | "RECEIVED"
  | "PROCESSING"
  | "QUERY_RAISED"
  | "RESUBMISSION_REQUIRED"
  | "ACCEPTED"
  | "REJECTED"
  | "APPROVED"
  | "UNKNOWN";

export type NotificationChannel =
  | "IN_APP"
  | "EMAIL"
  | "PUSH"
  | "GOOGLE_CALENDAR";

export type NotificationDeliveryStatus = "PENDING" | "SENT" | "FAILED";

