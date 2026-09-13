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
  title: string;
  status: WorkflowStatus;
}

export interface WorkflowItem {
  id: string;
  title: string;
  authority: string;
  status: WorkflowStatus;
  current_step: number;
  total_steps: number;
  steps: WorkflowStep[];
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
// Schemes & Subsidies (apps/schemes) — no knowledge source yet
// ---------------------------------------------------------------------------

export interface SchemeItem {
  id: string;
  title: string;
  authority: string;
  benefit_type: string;
  benefit_summary: string;
  eligibility_status: string;
  action_url: string;
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
