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
  | "CONFLICTING";

export type VerificationStatus = "VERIFIED" | "UNVERIFIED" | "CONFLICTING";

export type VariableOrigin = "USER_PROVIDED" | "DERIVED" | "LOOKUP";

export type VariableRelevance = "CORE" | "CONDITIONAL" | "OPTIONAL" | "NOT_NEEDED";

export type DecisionRunStatus =
  | "PENDING"
  | "RUNNING"
  | "COMPLETED"
  | "PARTIAL"
  | "FAILED";

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
  code?: string;
  key?: string;
  variable_key: string;
  label: string;
  data_type: string;
  why_it_matters: string;
  unit: string | null;
  relevance?: VariableRelevance;
  options: SmartQuestionChoice[];
  current_value?: string | number | boolean | string[] | null;
  candidate_rules_count?: number;
  rule_dependency_count?: number;
}

export interface SmartQuestionsResponse {
  business_id: string;
  total_questions: number;
  unanswered_count: number;
  questions: SmartQuestion[];
}

export interface SmartQuestionAnswerPayload {
  answers: Record<string, string | number | boolean | string[]>;
}

export interface ProductsActivitiesPayload {
  product_description: string;
  import_export_intent: "NONE" | "IMPORT_ONLY" | "EXPORT_ONLY" | "IMPORT_AND_EXPORT" | "PLANNED";
}

export interface ProductsActivitiesResponse {
  business_id: string;
  version: number;
  product_description: string;
  import_export_intent: string;
  detected_activities: string[];
}

export interface OnboardingStatus {
  business_id: string;
  current_step: number;
  profile_completed: boolean;
  products_completed: boolean;
  questions_answered: number;
  total_questions: number;
  analysis_ready: boolean;
  decision_run_id: string | null;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Dashboard Types (apps/dashboard/services.py)
// ---------------------------------------------------------------------------

export interface ComplianceReadiness {
  score: number;
  status: "HIGH" | "MEDIUM" | "LOW";
  total_evaluated: number;
  applicable_count: number;
  compliant_count: number;
  action_required_count: number;
}

export interface PriorityAction {
  id: string;
  title: string;
  requirement_name: string;
  category: string;
  authority: string;
  urgency: "HIGH" | "MEDIUM" | "LOW";
  action_summary: string;
}

export interface StatutoryDeadline {
  id: string;
  requirement_name: string;
  due_date: string;
  penalty_risk: string;
  authority: string;
  status: "UPCOMING" | "OVERDUE" | "COMPLETED";
}

export interface CategoryBreakdown {
  category: string;
  count: number;
  status_breakdown: Record<string, number>;
}

export interface JurisdictionBreakdown {
  jurisdiction: string;
  count: number;
}

export interface RecentUpdate {
  id: string;
  title: string;
  effective_date: string;
  authority: string;
  summary: string;
  impact_level: "HIGH" | "MEDIUM" | "LOW";
}

export interface DashboardSummary {
  business_id: string;
  business_name: string;
  readiness: ComplianceReadiness;
  status_counts: Record<ApplicabilityStatus, number>;
  priority_actions: PriorityAction[];
  upcoming_deadlines: StatutoryDeadline[];
  category_breakdown: CategoryBreakdown[];
  jurisdiction_breakdown: JurisdictionBreakdown[];
  recent_updates: RecentUpdate[];
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

export interface RequirementDetail {
  requirement_id: string;
  name: string;
  authority: string;
  category: string;
  jurisdiction: string;
  status: ApplicabilityStatus;
  why_it_applies: {
    summary: string;
    matched_rule_id?: string | null;
    matched_rule_type?: string | null;
    evaluation_notes?: string | null;
  };
  what_you_need: {
    documents: string[];
    statutory_fee_estimate: string;
    validity_period: string;
  };
  what_to_do_next: {
    step_1: string;
    step_2: string;
    step_3: string;
  };
  statutory_evidence: StatutoryEvidenceItem[];
}

// ---------------------------------------------------------------------------
// Documents (apps/documents)
// ---------------------------------------------------------------------------

export interface DocumentItem {
  id: string;
  name: string;
  category: string;
  status: DocumentStatus;
  requirement_id: string;
  prevalidation_status: PrevalidationOutcome;
  expiry_date: string | null;
  notes: string;
}

// ---------------------------------------------------------------------------
// Workflows (apps/workflows)
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

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  type: string;
  authority: string;
  penalty_risk: string;
  status: string;
}

// ---------------------------------------------------------------------------
// Schemes & Subsidies (apps/schemes)
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

export interface StandardItem {
  standard_code: string;
  title: string;
  authority: string;
  scheme: string;
  category: "MANDATORY" | "RECOMMENDED" | "VOLUNTARY";
  applicable_products: string[];
  testing_parameters: string[];
}

// ---------------------------------------------------------------------------
// Regulatory Updates (apps/regulatory_updates)
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
  authority: string;
  source_title: string;
  locator: string;
  excerpt: string;
  verification_status: VerificationStatus;
  canonical_url: string;
}

export interface AssistantChatResponse {
  prompt: string;
  answer: string;
  citations: AssistantCitation[];
  grounding_level: string;
}

