import type { ActorType, CaseStatus, DocumentReviewStatus, DocumentStatus, ExternalApplicationStatusEnum, ReviewType, StepStatus, WorkflowStatus, WorkflowStepType } from "./status";

// ---------------------------------------------------------------------------
// Workflows (apps/workflows): recorded procedures and persisted execution
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
  result_origin?: "DETERMINISTIC_KB_RESULT" | "LLM_FALLBACK_RESULT" | "HUMAN_REVIEW_RESULT";
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
  in_human_review: number;
  queries_awaiting?: number;
  queries_raised: number;
  forms_ready?: number;
  external_processing?: number;
  in_government_scrutiny: number;
  completed_cases: number;
  rejected_cases?: number;
  overdue_cases?: number;
}

