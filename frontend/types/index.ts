/**
 * ComplyWise Frontend Canonical Types
 *
 * Authority: TRD_v2.0 §30, §31, §32; FRONTEND_INSTRUCTIONS.md §5; common.enums
 *
 * Exactly mirrors the backend models, serializers, and canonical enums.
 * Any modification here must be verified by backend/tests/test_status_contract.py.
 */

// ---------------------------------------------------------------------------
// Canonical Status Enums (common/enums.py verbatim)
// ---------------------------------------------------------------------------

export type ApplicabilityStatus =
  | "APPLICABLE"
  | "NOT_APPLICABLE"
  | "NEEDS_INFORMATION"
  | "CONFLICT_REVIEW"
  | "UNVERIFIED";

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

// ---------------------------------------------------------------------------
// API Envelope & Error Types (TRD_v2.0 §30, common/envelope.py)
// ---------------------------------------------------------------------------

export interface ApiEnvelope<T> {
  data: T;
  meta?: Record<string, unknown>;
}

export interface ApiErrorDetail {
  field?: string;
  messages: string[];
}

export interface ApiErrorBody {
  code: string;
  message: string;
  details?: ApiErrorDetail[];
}

export interface ApiErrorEnvelope {
  error: ApiErrorBody;
}

export type ApiResponse<T> = ApiEnvelope<T>;

// ---------------------------------------------------------------------------
// Health & System Types (common/health.py)
// ---------------------------------------------------------------------------

export interface HealthData {
  status: string;
  service: string;
  version: string;
  api_version: string;
}

export interface DependencyCheck {
  status: "ok" | "degraded" | "unavailable" | "not_configured";
  engine?: string;
  is_target_engine?: boolean;
  installed?: boolean;
  note?: string;
  error?: string;
  [key: string]: unknown;
}

export interface KnowledgePacksCheck {
  status: "ok" | "degraded" | "not_configured";
  pack_count: number;
  file_count: number;
  packs?: string[];
  malformed_count?: number;
  note?: string;
}

export interface IntegrationsCheck {
  openai_api_key: boolean;
  openai_model: boolean;
  openai_embedding_model: boolean;
  azure_storage: boolean;
  firecrawl_api_key: boolean;
}

export interface ReadinessData {
  status: "ok" | "degraded" | "unavailable";
  service: string;
  version: string;
  checks: {
    database: DependencyCheck;
    pgvector: DependencyCheck;
    knowledge_packs: KnowledgePacksCheck;
    integrations: IntegrationsCheck;
  };
}

// ---------------------------------------------------------------------------
// Accounts & Identity (apps/accounts/serializers.py)
// ---------------------------------------------------------------------------

export interface User {
  id: string;
  email: string;
  full_name: string;
  phone_number?: string;
  is_staff?: boolean;
  is_superuser?: boolean;
  date_joined: string;
}

export interface AuthSession {
  user: User;
  token: string;
}

// ---------------------------------------------------------------------------
// Business & Profile Models (apps/businesses/serializers.py)
// ---------------------------------------------------------------------------

export interface Business {
  id: string;
  name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  profile_version: number | null;
  state?: string;
  primary_state?: string;
  district?: string;
  incorporation_type?: string;
  active_profile_version_number?: number;
  current_profile_version?: number;
  legal_structure?: string;
  business_type?: string;
  owner_id?: string;
  owner_email?: string;
  owner_name?: string;
  cases_count?: number;
  documents_count?: number;
  pending_reviews_count?: number;
}

export interface ProfileVariableValue {
  value: string | number | boolean | string[] | null;
  origin: VariableOrigin;
  confidence: number | null;
  derived_from: string[];
  recorded_at: string;
}

export interface BusinessProfileVersion {
  id: string;
  business: string;
  version: number;
  variables: Record<string, ProfileVariableValue>;
  change_note: string;
  created_at: string;
  created_by_email: string | null;
  missing_core_variables: string[];
}

export interface ProfileVariableChoice {
  value: string;
  label: string;
}

export interface ProfileVariableDefinition {
  code: string;
  key: string;
  label: string;
  data_type: string;
  why_it_matters: string;
  unit: string | null;
  default_relevance: VariableRelevance;
  options: ProfileVariableChoice[];
}

export interface BusinessProfileData {
  business_id: string;
  current_version: BusinessProfileVersion | null;
  variable_definitions: ProfileVariableDefinition[];
  missing_core_variables: string[];
}

export interface AssessmentSummary {
  id: string;
  business_id: string;
  business_name: string;
  assessment_number: number;
  title: string;
  status: AssessmentStatus;
  current_step: number;
  readiness_score?: number | null;
  requirements_count?: number;
  profile_version_id?: string | null;
  profile_version_number?: number | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  summary: {
    total_requirements_evaluated?: number;
    requirements_identified?: number;
    requirements_action_needed?: number;
    documents_count?: number;
    workflows_count?: number;
    schemes_count?: number;
    standards_count?: number;
    upcoming_deadlines?: number;
    [key: string]: any;
  };
  [key: string]: any;
}

export interface Assessment extends AssessmentSummary {
  created_by_email?: string | null;
  profile_version_id: string | null;
  profile_version_number: number | null;
  decision_run_id: string | null;
  discovery_run_id: string | null;
  question_plan_id: string | null;
  step_state: Record<string, any>;
}

export interface BusinessSummary {
  id: string;
  name: string;
  is_active?: boolean;
  state?: string | null;
  state_name?: string | null;
  district?: string | null;
  industry?: string | null;
  msme_scale?: string | null;
  turnover?: string | null;
  latest_profile_version?: number | null;
  profile_version?: number | null;
  product_description?: string | null;
  assessment_count: number;
  latest_assessment?: AssessmentSummary | null;
  last_assessed_at?: string | null;
  created_at: string;
  updated_at: string;
  [key: string]: any;
}

export interface UserProfileHome {
  user: {
    id: string;
    email: string;
    full_name: string;
  };
  businesses: BusinessSummary[];
  recent_assessments: AssessmentSummary[];
  total_businesses: number;
  total_assessments: number;
}

// ---------------------------------------------------------------------------
// Applicability & Decisions (apps/applicability/serializers.py)
// ---------------------------------------------------------------------------

export interface DecisionResult {
  id: string;
  requirement_id: string;
  requirement_name: string;
  status: ApplicabilityStatus;
  explanation_trace: Record<string, unknown>;
  evidence_refs: Array<Record<string, unknown>>;
  created_at: string;
}

export interface DecisionRun {
  id: string;
  business: string;
  profile_version: string;
  profile_version_number: number;
  status: DecisionRunStatus;
  evaluation_date: string;
  created_at: string;
  results: DecisionResult[];
}

// ---------------------------------------------------------------------------
// Onboarding Types (apps/onboarding/serializers.py)
// ---------------------------------------------------------------------------

export interface SmartQuestionChoice {
  value: string;
  label: string;
}

export interface SmartQuestion {
  /** Registry code, e.g. "V07". */
  code: string;
  /** Machine key; identical to `variable_key`. */
  key: string;
  variable_key: string;
  label: string;
  /** Ready-to-render prompt generated from the variable label. */
  question: string;
  question_text?: string;
  data_type: string;
  why_it_matters: string;
  reason?: string;
  expected_discovery_impact?: string;
  unit: string | null;
  options: SmartQuestionChoice[];
  current_value?: string | number | boolean | string[] | null;
  /** True when the variable is a CORE profile variable. */
  required: boolean;
  /** How many candidate published rules reference this variable. */
  rule_dependency_count: number;
  candidate_rules_count: number;
}

/** GET /businesses/{id}/onboarding/questions (apps/onboarding/services.py). */
export interface SmartQuestionsResponse {
  business_id: string;
  business_name: string;
  questions: SmartQuestion[];
  /** Number of decision-critical variables still unanswered. */
  total_missing: number;
  known_variables_count: number;
  /** Rule-referenced variables with no profile definition (knowledge drift). */
  unresolvable_variables: string[];
}

/** GET /businesses/{id}/onboarding/questions/next & POST /questions/next response. */
export interface SequentialQuestionResponse {
  is_complete: boolean;
  question?: SmartQuestion | null;
  next_question?: SmartQuestion | null;
  profile_version?: number;
  answered_variable?: string;
}

export interface SequentialAnswerPayload {
  variable_key: string;
  value: string | number | boolean | string[];
  answer_value?: string | number | boolean | string[];
  assessment_id?: string;
}

/** POST /businesses/{id}/onboarding/answers response body. */
export interface SmartQuestionAnswerResponse {
  message: string;
  profile_version: BusinessProfileVersion;
}

export interface SmartQuestionAnswerPayload {
  answers: Record<string, string | number | boolean | string[]>;
}

export interface ProductsActivitiesPayload {
  product_description: string;
  /**
   * Canonical value of the `import_export_intent` variable. Deliberately a plain
   * string rather than a literal union: the valid values are served by
   * GET /profile/variables, and duplicating them here would let the two drift.
   * Omit the field entirely when the user did not answer.
   */
  import_export_intent?: string;
}

export interface ProductsActivitiesResponse {
  profile_version: number;
  product_description: string;
  import_export_intent: string | null;
  /** Published-knowledge activity terms found in the description (may be empty). */
  detected_activities: string[];
}

/**
 * Onboarding progress as reported by GET /businesses/{id}/onboarding/status
 * (apps/onboarding/views.py). Field names are the backend's; do not rename.
 */
export interface OnboardingStatus {
  business_id: string;
  business_name: string;
  has_profile: boolean;
  profile_version: number | null;
  has_products: boolean;
  variables_count: number;
  has_evaluation: boolean;
  latest_run_id: string | null;
  current_step: number;
}

// ---------------------------------------------------------------------------
// Dashboard Types (apps/dashboard/services.py)
// ---------------------------------------------------------------------------

/**
 * Counts derived from the latest DecisionRun.
 *
 * Every count is nullable: before an evaluation exists the value is unknown, and
 * rendering 0 would assert "no requirements apply to you". Show "Not yet
 * calculated" for null. `benefits_count` is always null until scheme eligibility
 * is evaluated by a rule.
 */
export interface DashboardMetrics {
  applicable_count: number | null;
  action_required_count: number | null;
  due_soon_count: number | null;
  benefits_count: number | null;
  needs_information_count: number | null;
  conflict_review_count: number | null;
  unverified_count: number | null;
  not_applicable_count: number | null;
  total_evaluated: number;
}

export interface PriorityAction {
  requirement_id: string;
  requirement_name: string;
  authority: string;
  status: ApplicabilityStatus;
  category: string;
  /** Derived from `status`, not a separate severity judgement. */
  action_type: string;
  evidence_count: number;
  source_url?: string;
  portal_url?: string;
  portal_name?: string;
}

/**
 * A renewal cycle stated by published knowledge. Only emitted for requirements
 * whose metadata records `renewal_period_years`; the platform does not infer
 * filing due dates it has no statutory basis for, and carries no penalty data.
 */
export interface StatutoryDeadline {
  requirement_id: string;
  title: string;
  due_date: string;
  days_remaining: number;
  type: "STATUTORY_RENEWAL_CYCLE";
  status: "UPCOMING";
  /** Human-readable citation of where the cycle length came from. */
  basis: string;
  anchored_on: string;
}

export interface DashboardSummary {
  business_id: string;
  business_name: string;
  assessment_id?: string | null;
  assessment_number?: number;
  assessment_title?: string | null;
  assessment_status?: AssessmentStatus | null;
  has_evaluation: boolean;
  latest_run_id?: string;
  evaluation_date?: string;
  profile_version: number | null;
  /** Share of requirements the engine could determine. Null before evaluation. */
  compliance_readiness: number | null;
  /** Honest label for the readiness number, e.g. "Assessment completeness". */
  readiness_label?: string;
  /** Backend sentence explaining exactly what the readiness number measures. */
  readiness_basis?: string;
  metrics: DashboardMetrics;
  priority_actions: PriorityAction[];
  upcoming_deadlines: StatutoryDeadline[];
  /** Requirement count keyed by category, e.g. `{ LICENCE: 4, CONSENT: 2 }`. */
  category_breakdown: Record<string, number>;
  jurisdiction_breakdown: Record<string, number>;
  total_documents_needed?: number;
  total_workflows_count?: number;
  schemes_preview?: Array<{ id: string; name: string; title?: string; authority: string; benefit_type?: string; benefit?: string; benefit_summary?: string }>;
  standards_preview?: Array<{ standard_code?: string; title: string; authority: string; is_mandatory?: boolean }>;
  /** Always empty: no regulatory-change ingestion exists yet. */
  recent_updates: never[];
  recent_updates_available: boolean;
}

// ---------------------------------------------------------------------------
// Unavailable capabilities (backend common/capability.py)
// ---------------------------------------------------------------------------

/**
 * Returned by boundaries that are routed and typed but have no knowledge source.
 *
 * `available: false` is not an error — it is the honest state of a screen whose
 * data has not been ingested. Render `reason` rather than an empty table, and
 * never substitute sample rows: a user cannot tell fabricated regulatory content
 * from verified content once it is on screen.
 */
export interface CapabilityUnavailable {
  capability: string;
  available: false;
  reason: string;
  requires: string;
  count: 0;
}

// ---------------------------------------------------------------------------
// Compliance Requirements (apps/requirements)
// ---------------------------------------------------------------------------

export interface ComplianceRequirementItem {
  requirement_id: string;
  name: string;
  authority: string;
  category: string;
  jurisdiction: string;
  status: ApplicabilityStatus;
  matched_rule_id?: string | null;
  matched_rule_type?: string | null;
  evidence_count: number;
  explanation_reason?: string | null;
  notes?: string;
  domain?: string;
  description?: string;
  reason_summary?: string;
  portal?: string;
  portal_url?: string;
  portal_name?: string;
  source_url?: string;
  statutory_act?: string;
  citations?: StatutoryEvidenceItem[];
  citation_count?: number;
  required_documents?: string[];
  application_steps?: string[];
  timeline?: string;
  statutory_fee?: string;
}

export interface StatutoryEvidenceItem {
  evidence_id: string;
  source_title: string;
  authority: string;
  locator: string;
  excerpt: string;
  verification_status: VerificationStatus;
  canonical_url: string;
}

/** One rule the engine considered, from the recorded explanation trace. */
export interface RuleEvaluationTrace {
  rule_id: string;
  version: number;
  rule_type: string;
  /** Kleene truth value as a string: "TRUE" | "FALSE" | "UNKNOWN". */
  truth_value: string;
  configured_result: ApplicabilityStatus;
  trace: Record<string, unknown>;
}

export interface RequirementDetail {
  requirement_id: string;
  name: string;
  authority: string;
  category: string;
  jurisdiction: string;
  domain: string;
  description: string;
  status: ApplicabilityStatus;
  /** False when no decision run has covered this requirement yet. */
  evaluated: boolean;
  evaluation_date: string | null;
  why_it_applies: {
    /** Derived from the recorded trace, never restated more strongly than it. */
    summary: string;
    matched_rule_id?: string | null;
    matched_rule_type?: string | null;
    matched_rule_version?: number | null;
    /** Engine reason code, e.g. `JURISDICTION_NOT_MATCHED`, `ZERO_EVIDENCE`. */
    reason_code?: string | null;
    evaluation_notes?: string | null;
    /** Every rule considered, not only the one that matched. */
    rule_evaluations: RuleEvaluationTrace[];
    conflicts: string[];
  };
  /**
   * Read from requirement metadata only. `documents_available: false` means no
   * checklist has been ingested — render `not_recorded_note`, not "no documents
   * required". Fee and validity carry a "not recorded" sentence when absent.
   */
  what_you_need: {
    documents: string[];
    documents_available: boolean;
    statutory_fee_estimate: string;
    validity_period: string;
    renewal_period_years: number | null;
    not_recorded_note: string | null;
  };
  source_url?: string;
  portal_url?: string;
  portal_name?: string;
  what_to_do_next: {
    steps: string[];
    steps_available: boolean;
    official_portal: string;
    portal_url?: string;
    portal_name?: string;
    not_recorded_note: string | null;
  };
  statutory_evidence: StatutoryEvidenceItem[];
  evidence_count: number;
}

// ---------------------------------------------------------------------------
// Documents (apps/documents)
// ---------------------------------------------------------------------------

/**
 * A checklist row derived from an applicable requirement's metadata.
 *
 * There is no document table: `id` is composed from the requirement, `status` is
 * always NOT_UPLOADED, and `prevalidation_status` is always NEEDS_REVIEW because
 * no pre-validation runs. See `DocumentsListResponse.upload_available`.
 */
export interface DocumentItem {
  id: string;
  name: string;
  requirement_id: string;
  requirement_name: string;
  authority: string;
  category: string;
  status: DocumentStatus;
  prevalidation_status: PrevalidationOutcome;
  expiry_date: string | null;
  notes: string;
  portal_uploaded?: boolean;
  code?: string;
  valid_until?: string;
  file_format?: string;
  file_size_bytes?: number;
  verification?: any;
}

// ---------------------------------------------------------------------------
// Workflows (apps/workflows) — no knowledge source yet
// ---------------------------------------------------------------------------

export interface WorkflowStep {
  step: number;
  step_number?: number;
  title: string;
  description?: string;
  duration?: string;
  status: string;
  documents_required?: string[];
  portal_url?: string;
  user_reference?: string;
  notes?: string;
  completed_at?: string | null;
}

export interface WorkflowItem {
  id: string;
  requirement_id?: string;
  case_id?: string | null;
  case_number?: string | null;
  category?: "COMPLIANCE" | "STANDARD" | "SCHEME" | string;
  domain?: string;
  title: string;
  authority: string;
  portal_name?: string;
  portal_url?: string;
  estimated_duration?: string;
  status: string;
  current_step: number;
  current_step_title?: string;
  total_steps: number;
  progress_percent?: number;
  documents_required?: string[];
  prerequisites?: string;
  updated_at?: string;
  steps: WorkflowStep[];
}

// ---------------------------------------------------------------------------
// Compliance Cases & Generic Workflow Execution (Architectural Spec §1-§40)
// ---------------------------------------------------------------------------

export interface StructuredFinding {
  finding_code: string;
  severity: "CRITICAL" | "ERROR" | "WARNING" | "INFO";
  field: string;
  expected_value?: any;
  observed_value?: any;
  source?: string;
  confidence?: number;
  message?: string;
}

export interface DocumentReviewItem {
  id: string;
  review_type: ReviewType;
  reviewer_email?: string | null;
  status: DocumentReviewStatus;
  findings: Array<StructuredFinding | { code?: string; message: string; [key: string]: any }>;
  reviewer_comments?: string;
  reviewed_at: string;
  created_at: string;
}

export interface DocumentSubmissionItem {
  id: string;
  version_number: number;
  file_name: string;
  storage_path: string;
  file_size_bytes: number;
  mime_type: string;
  checksum: string;
  uploaded_by_email?: string | null;
  status_code: DocumentReviewStatus | string;
  metadata?: Record<string, any>;
  created_at: string;
  reviews?: DocumentReviewItem[];
  latest_review?: DocumentReviewItem | null;
  view_url?: string;
  metadata_url?: string;
}


export interface DocumentRequirementItem {
  id: string;
  document_type_code: string;
  name: string;
  description: string;
  required: boolean;
  status_code: DocumentStatus;
  configuration?: Record<string, any>;
  submissions?: DocumentSubmissionItem[];
  latest_submission?: DocumentSubmissionItem | null;
  has_submission: boolean;
  created_at: string;
  updated_at: string;
}

export interface WorkflowStepDefinitionItem {
  id: string;
  code: string;
  name: string;
  step_type: WorkflowStepType;
  description: string;
  sequence: number;
  is_required: boolean;
  configuration?: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface WorkflowTransitionDefinitionItem {
  id: string;
  from_step_code: string;
  to_step_code: string;
  event_code: string;
  allowed_actor_type: ActorType;
  priority: number;
  condition?: Record<string, any>;
}

export interface WorkflowStepInstanceItem {
  id: string;
  step_code: string;
  step_name: string;
  step_type: WorkflowStepType;
  sequence: number;
  status_code: StepStatus;
  started_at: string;
  completed_at?: string | null;
  assigned_role?: string;
  data?: Record<string, any>;
  result?: Record<string, any>;
}

export interface WorkflowInstanceItem {
  id: string;
  status_code: WorkflowStatus;
  started_at: string;
  completed_at?: string | null;
  current_step?: WorkflowStepDefinitionItem | null;
  step_instances?: WorkflowStepInstanceItem[];
  metadata?: Record<string, any>;
}

export interface WorkflowEventItem {
  id: string;
  from_step_code?: string | null;
  to_step_code?: string | null;
  event_code: string;
  actor_type: ActorType;
  actor_email?: string | null;
  payload: Record<string, any>;
  notes: string;
  created_at: string;
}

export interface ApplicationFormItem {
  id: string;
  code: string;
  name: string;
  description: string;
  schema: Record<string, any>;
  version: number;
}

export interface FormSubmissionItem {
  id: string;
  form_code: string;
  version_number: number;
  form_data: Record<string, any>;
  status_code: string;
  submitted_by_email?: string | null;
  submitted_at: string;
}

export interface ExternalApplicationStatusItem {
  id: string;
  portal_name: string;
  application_reference_number: string;
  status_code: ExternalApplicationStatusEnum;
  status_date: string;
  portal_remarks: string;
  next_followup_date?: string | null;
  raw_response?: Record<string, any>;
}

export interface ComplianceCaseItem {
  id: string;
  case_number: string;
  business: string;
  business_name?: string;
  requirement_id_code: string;
  requirement_name: string;
  authority: string;
  status_code: CaseStatus;
  priority: "HIGH" | "MEDIUM" | "LOW";
  profile_version?: number;
  current_step_code?: string;
  current_step_name?: string;
  current_step_type?: WorkflowStepType;
  current_step_number?: number;
  documents_count: number;
  documents_verified_count: number;
  document_requirements?: DocumentRequirementItem[];
  opened_at: string;
  completed_at?: string | null;
  updated_at: string;
}

export interface ReviewTaskItem {
  id: string;
  case: string;
  assigned_admin_email?: string | null;
  assigned_admin_name?: string | null;
  review_type: "AI_PRECHECK" | "DOCUMENT_REVIEW" | "FORM_REVIEW" | "FINAL_REVIEW" | string;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "ESCALATED" | string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT" | string;
  started_at?: string | null;
  completed_at?: string | null;
  created_at: string;
}

export interface HumanReviewItem {
  id: string;
  decision: "APPROVE" | "QUERY" | "REJECT" | string;
  reason?: string;
  required_action?: string;
  reviewer_email?: string | null;
  reviewer_name?: string | null;
  reviewed_at: string;
  created_at: string;
}

export interface CaseQueryItem {
  id: string;
  case: string;
  document_requirement?: string | null;
  document_name?: string | null;
  document_submission?: string | null;
  raised_by?: string | null;
  raised_by_email?: string | null;
  raised_by_name?: string | null;
  query_type: "DOCUMENT_CORRECTION" | "ADDITIONAL_EVIDENCE" | "DATA_DISCREPANCY" | "GENERAL_CLARIFICATION" | string;
  title: string;
  message: string;
  required_action: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED" | "ESCALATED";
  due_at?: string | null;
  resolved_at?: string | null;
  resolved_by?: string | null;
  resolved_by_email?: string | null;
  response_notes?: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface CaseRequirementDispositionItem {
  id: string;
  case: string;
  requirement?: string | null;
  requirement_id_code: string;
  requirement_name?: string;
  authority?: string;
  original_applicability_status: string;
  admin_disposition: "CONFIRMED_REQUIRED" | "NOT_REQUIRED" | "UNDER_SCRUTINY" | "DEFERRED";
  source: string;
  reason: string;
  reviewer?: string | null;
  reviewer_name?: string | null;
  reviewer_email?: string | null;
  evidence_refs: any[];
  user_visible: boolean;
  user_action_required: boolean;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface DeadlineItem {
  id: string;
  case?: string | null;
  case_number?: string | null;
  business?: string | null;
  business_name?: string | null;
  requirement?: string | null;
  requirement_id_code: string;
  title: string;
  description: string;
  due_at: string;
  source: "SYSTEM_CALCULATED" | "ADMIN_SET" | "STATUTORY_RULE" | string;
  status: "PENDING" | "MET" | "MISSED" | "CANCELLED" | "EXTENDED";
  priority: "HIGH" | "MEDIUM" | "LOW";
  reminder_policy?: Record<string, any>;
  google_calendar_event_id?: string | null;
  email_notification_enabled: boolean;
  calendar_notification_enabled: boolean;
  in_app_notification_enabled: boolean;
  notes: string;
  metadata?: Record<string, any>;
  created_by?: string | null;
  created_by_name?: string | null;
  created_by_email?: string | null;
  is_overdue?: boolean;
  days_remaining?: number;
  created_at: string;
  updated_at: string;
}

export interface ComplianceCaseDetail extends ComplianceCaseItem {
  business_id?: string;
  concurrency_version?: number;
  assigned_reviewer?: string | null;
  assigned_reviewer_email?: string | null;
  assigned_reviewer_name?: string | null;
  metadata?: Record<string, any>;
  business_context?: {
    business_name: string;
    state: string;
    district: string;
    business_type: string;
    product: string;
    workers: string | number;
    power_load: string;
    profile_version?: number;
    profile_version_id?: string | null;
    profile_change_note?: string;
    profile_created_at?: string | null;
    investment?: string;
    turnover?: string;
    uses_hazardous_substances?: boolean;
    generates_hazardous_waste?: boolean;
    answered_variables?: Array<{
      key: string;
      label: string;
      value: any;
      origin: string;
      unit?: string | null;
      recorded_at?: string | null;
    }>;
  };
  why_applicable?: string;
  current_task?: {
    action_type: string;
    title: string;
    description: string;
    is_action_required: boolean;
    button_label?: string | null;
  };
  active_review_task?: ReviewTaskItem | null;
  human_reviews?: HumanReviewItem[];
  active_queries?: CaseQueryItem[];
  dispositions?: CaseRequirementDispositionItem[];
  deadlines?: DeadlineItem[];
  workflow_instance?: WorkflowInstanceItem | null;
  workflow_steps: WorkflowStepDefinitionItem[];
  document_requirements: DocumentRequirementItem[];
  form_submissions: FormSubmissionItem[];
  external_statuses: ExternalApplicationStatusItem[];
  available_transitions: WorkflowTransitionDefinitionItem[];
  created_at: string;
}

export interface ReviewPacket {
  case: ComplianceCaseDetail;
  concurrency_version: number;
  business: {
    id: string | null;
    name: string;
    owner_name?: string | null;
    owner_email?: string | null;
    profile_variables?: Array<{ key: string; label: string; value: any }>;
  };
  document_requirements: DocumentRequirementItem[];
  queries: CaseQueryItem[];
  dispositions: CaseRequirementDispositionItem[];
  deadlines: DeadlineItem[];
  audit_events: WorkflowEventItem[];
  security_audits?: Array<{
    id: string;
    action: string;
    actor_type: string;
    actor_email?: string | null;
    resource_type: string;
    resource_id: string;
    created_at: string;
    metadata?: Record<string, any>;
  }>;
}


export interface BusinessCasesResponse {
  business_id: string;
  business_name: string;
  total_cases: number;
  status_summary: Record<CaseStatus, number>;
  priority_summary: Record<string, number>;
  cases: ComplianceCaseItem[];
}

export interface AdminCasesSummary {
  total_cases: number;
  pending_reviews?: number;
  pending_review_count?: number;
  in_human_review: number;
  queries_awaiting?: number;
  queries_raised: number;
  forms_ready?: number;
  external_processing?: number;
  in_government_scrutiny: number;
  completed_cases: number;
  approved_count?: number;
  rejected_cases?: number;
  overdue_cases?: number;
}

// ---------------------------------------------------------------------------
// Calendar (apps/calendar)
// ---------------------------------------------------------------------------

/**
 * A date with a statutory basis. Currently only renewal cycles qualify: `basis`
 * cites where the cycle length came from. No penalty field — none is held.
 */
export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  type: "STATUTORY_RENEWAL_CYCLE";
  authority: string;
  status: string;
  days_remaining: number;
  basis: string;
  anchored_on: string;
}

// ---------------------------------------------------------------------------
// Schemes & Incentives Pipeline (apps/schemes) — Central & Maharashtra Pipeline
// ---------------------------------------------------------------------------

export interface SchemeItem {
  id: string;
  scheme_code?: string;
  title: string;
  name?: string;
  authority: string;
  jurisdiction?: string;
  jurisdiction_code?: string;
  benefit_type: string;
  benefit?: string;
  benefit_summary: string;
  benefit_details?: Record<string, any>;
  eligibility?: string;
  eligibility_status: string;
  effective_dates?: string;
  effective_from?: string | null;
  effective_to?: string | null;
  published_date?: string | null;
  last_verified_at?: string;
  version?: string;
  version_number?: number;
  content_hash?: string;
  source_url?: string;
  source_domain?: string;
  action_url: string;
  portal_url?: string;
  application_route?: string;
  evidence_snippet?: string;
  relevance_rationale?: string;
  is_universal?: boolean;
  sector_category?: string;
  is_state_specific?: boolean;
  is_active?: boolean;
}

export interface SchemeVersionRecord {
  version_number: number;
  content_hash: string;
  title: string;
  authority: string;
  benefit_summary: string;
  benefit_details?: Record<string, any>;
  eligibility_statement?: string;
  sectors?: string[];
  scale_match?: string[];
  application_url?: string;
  source_url?: string;
  evidence_snippet?: string;
  effective_from?: string | null;
  effective_to?: string | null;
  last_verified_at?: string;
  verification_status?: string;
  is_active?: boolean;
  diff_summary?: Record<string, any>;
  created_at: string;
}

export interface SchemePipelineStatus {
  total_schemes: number;
  active_schemes: number;
  maharashtra_schemes_count: number;
  central_schemes_count: number;
  total_version_snapshots: number;
  registered_sources: Array<{
    key: string;
    name: string;
    jurisdiction: string;
    domain: string;
    primary_url: string;
  }>;
  recent_snapshots: Array<{
    id: string;
    source_key: string;
    source_url: string;
    content_hash: string;
    status: string;
    scheme_count: number;
    fetched_at: string;
  }>;
  recent_rollbacks: Array<{
    scheme__scheme_code: string;
    from_version: number;
    to_version: number;
    reason: string;
    reverted_at: string;
  }>;
}

// ---------------------------------------------------------------------------
// Standards & BIS (apps/standards)
// ---------------------------------------------------------------------------

/**
 * A published STANDARD-category requirement. Not a BIS catalogue entry: product
 * scopes and testing parameters are not ingested, so they are not fields here.
 */
export interface StandardItem {
  requirement_id: string;
  title: string;
  authority: string;
  jurisdiction: string;
  domain: string;
  description: string;
  category: string;
  citations: StatutoryEvidenceItem[];
  citation_count: number;
}

// ---------------------------------------------------------------------------
// Regulatory Updates (apps/regulatory_updates) — no ingestion exists
// ---------------------------------------------------------------------------

export interface RegulatoryUpdateItem {
  id: string;
  title: string;
  authority: string;
  published_date: string;
  effective_date: string;
  impact_level: string;
  affected_domains: string[];
  summary: string;
  official_url: string;
}

// ---------------------------------------------------------------------------
// Assistant / AI Copilot (apps/assistant)
// ---------------------------------------------------------------------------

export interface AssistantCitation {
  /** 1-based index the answer text cites as `[n]`. */
  index: number;
  evidence_id: string;
  authority: string;
  source_title: string;
  locator: string;
  excerpt: string;
  verification_status: VerificationStatus;
  canonical_url: string;
}

/**
 * How much weight an answer carries.
 *
 * - `GROUNDED_IN_CITED_EVIDENCE` — a model summarised the citations below.
 * - `NO_MATCHING_EVIDENCE` — nothing in the knowledge base matched; no answer.
 * - `CITATIONS_ONLY_NO_LLM_CONFIGURED` — citations found, no model configured.
 * - `CITATIONS_ONLY_LLM_UNAVAILABLE` — citations found, the model call failed.
 */
export type AssistantGroundingLevel =
  | "GROUNDED_IN_CITED_EVIDENCE"
  | "NO_MATCHING_EVIDENCE"
  | "CITATIONS_ONLY_NO_LLM_CONFIGURED"
  | "CITATIONS_ONLY_LLM_UNAVAILABLE";

export interface AssistantChatResponse {
  prompt: string;
  answer: string;
  citations: AssistantCitation[];
  citation_count: number;
  grounding_level: AssistantGroundingLevel;
  /** False when `answer` is a status message rather than a generated summary. */
  answer_generated: boolean;
  disclaimer: string;
  /** Present only when a model generated the prose. */
  generated_by?: { provider: string; model: string };
  provider_note?: string;
}

// ---------------------------------------------------------------------------
// Regulatory Discovery & Ingestion (apps/ingestion)
// ---------------------------------------------------------------------------

export interface DiscoveryCandidateUrl {
  url: string;
  title: string;
  authority_tier: string;
  rank_score: number;
  query: string;
}

export interface CandidateRequirement {
  id: string;
  name?: string;
  requirement_name?: string;
  authority: string;
  category: string;
  jurisdiction?: string;
  applicability_statement: string;
  prerequisite?: string;
  document_requirements?: string[];
  fee_info?: string;
  deadline_info?: string;
  validity_info?: string;
  status?: string;
  verification_status?: VerificationStatus;
  source_id?: string;
  source_url?: string;
  evidence_excerpt?: string;
}

export interface DiscoveryRun {
  id: string;
  business_id?: string;
  provider: string;
  status: string;
  queries: string[];
  candidate_urls?: DiscoveryCandidateUrl[];
  candidate_count: number;
  scraped_count: number;
  official_source_count: number;
  verified_count: number;
  candidate_requirements?: CandidateRequirement[];
  summary?: Record<string, unknown>;
  error?: string;
  created_at: string;
  completed_at?: string;
}

export interface DiscoveryRunResult {
  ran: boolean;
  run_id: string;
  cached?: boolean;
  status: string;
  discovery_available: boolean;
  reason?: string | null;
  coverage: {
    status: string;
    message: string;
    jurisdiction_resolved: boolean;
    state_code?: string;
    state_name?: string;
    published_requirements_total: number;
    central_requirement_count: number;
    state_requirement_count: number;
    activity_terms_matched: string[];
    discovery_available: boolean;
  };
  queries: string[];
  candidate_urls_count: number;
  sources_scraped: number;
  official_sources_count: number;
  verified_count: number;
  candidate_requirements_count: number;
  candidate_requirements: CandidateRequirement[];
  errors: string[];
  note: string;
}

export interface DiscoveryStatusData {
  business_id: string;
  coverage: {
    status: string;
    message: string;
    jurisdiction_resolved: boolean;
    state_code?: string;
    state_name?: string;
    published_requirements_total: number;
    central_requirement_count: number;
    state_requirement_count: number;
    activity_terms_matched: string[];
    discovery_available: boolean;
  };
  discovery_available: boolean;
  latest_run?: {
    id: string;
    status: string;
    candidate_count: number;
    scraped_count: number;
    official_source_count: number;
    created_at: string;
  } | null;
  candidate_requirements_count: number;
}

// ---------------------------------------------------------------------------
// Admin Scrutiny & Assessment Truth Types
// ---------------------------------------------------------------------------

export interface AdminScrutinyEvidenceRecord {
  evidence_id: string;
  source_id: string;
  source_title: string;
  authority: string;
  source_type: string;
  canonical_url: string;
  locator: string;
  excerpt: string;
  verification_status: string;
  content_hash: string;
  effective_from: string | null;
  effective_until: string | null;
}

export interface AdminScrutinyActionDestination {
  action_type: string;
  action_label: string;
  destination_url: string;
  authoritative_source_url: string;
  portal_name: string;
  is_verified_destination: boolean;
  notes?: string;
}

export interface AdminScrutinyEngine2Item {
  id: string;
  requirement_id: string;
  requirement_name: string;
  status: ApplicabilityStatus;
  authority: string;
  jurisdiction: string;
  domain: string;
  portal_url: string;
  rule_version: {
    rule_id: string;
    version: number;
    rule_type: string;
  } | null;
  explanation_trace: Record<string, any>;
  evidence_records: AdminScrutinyEvidenceRecord[];
  evidence_count: number;
  action_destination: AdminScrutinyActionDestination | null;
  human_disposition: {
    disposition_id: string;
    admin_disposition: string;
    reason: string;
    reviewer_email?: string | null;
    reviewer_name?: string | null;
    case_id: string;
    case_number: string;
    updated_at: string | null;
  } | null;
  evaluated_at: string | null;
}

export interface AdminScrutinyFactProvenanceItem {
  key: string;
  label: string;
  value: any;
  unit?: string | null;
  origin: "USER_PROVIDED" | "USER_TYPED" | "LLM_EXTRACTED" | "QUESTIONNAIRE_ANSWER" | "DOCUMENT_OCR" | "ADMIN_OVERRIDE" | string;
  confidence: number;
  source_excerpt?: string;
  is_confirmed: boolean;
  recorded_at?: string | null;
  override_metadata?: Record<string, any>;
}

export interface AdminScrutinyData {
  business: Business & { owner_id?: string; owner_email?: string; owner_name?: string };
  selected_assessment: {
    id: string;
    assessment_number: number;
    title: string;
    status: AssessmentStatus;
    current_step: number;
    profile_version_id?: string | null;
    decision_run_id?: string | null;
    created_at?: string | null;
    completed_at?: string | null;
  } | null;
  assessments: Array<{
    id: string;
    assessment_number: number;
    title: string;
    status: AssessmentStatus;
    current_step: number;
    profile_version_id?: string | null;
    decision_run_id?: string | null;
    created_at?: string | null;
    completed_at?: string | null;
  }>;
  profile: {
    version_number: number;
    change_note: string;
    created_at: string | null;
    answered_variables: AdminScrutinyFactProvenanceItem[];
  };
  profile_history: Array<{
    id: string;
    version: number;
    change_note: string;
    variables_count: number;
    created_at: string | null;
  }>;
  decision_run: {
    id: string;
    status: string;
    evaluation_date: string | null;
    created_at: string | null;
  } | null;
  engine2_results: AdminScrutinyEngine2Item[];
  cir: {
    cir_id: string;
    business_id: string;
    assessment_id?: string;
    profile_version_id?: string;
    decision_run_id: string;
    determinations: Array<{
      requirement_id: string;
      title: string;
      status: string;
      authority: string;
      evidence_chunk_id: string;
      official_url: string;
      explanation: string;
      action_destination: any;
    }>;
    metrics: {
      applicable_count: number;
      not_applicable_count: number;
      needs_info_count: number;
    };
    content_hash: string;
    authority_signature: string;
    created_at: string;
  } | null;
  cir_is_valid: boolean;
  schemes: any[];
  standards: any[];
  calendar: {
    statutory_events: any[];
    admin_deadlines: any[];
  };
  uploaded_documents: any[];
  compliance_cases: any[];
  metrics: {
    automated: {
      applicable_count: number;
      not_applicable_count: number;
      needs_info_count: number;
      unverified_count: number;
      conflict_review_count: number;
      total_evaluated: number;
    };
    workflow: {
      pending_review_count: number;
      submitted_count: number;
      query_raised_count: number;
      approved_count: number;
      rejected_count: number;
      total_cases: number;
    };
    total_uploaded_documents: number;
  };
  summary: {
    total_compliances: number;
    mandated_compliances: number;
    pending_reviews: number;
    action_required: number;
    completed: number;
    total_uploaded_documents: number;
  };
}
