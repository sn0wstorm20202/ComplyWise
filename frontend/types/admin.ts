import type { Business } from "./businesses";
import type { ApplicabilityStatus, AssessmentStatus } from "./status";

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
  business: Business & {
    owner_id?: string;
    owner_email?: string;
    owner_name?: string;
    incorporation_type?: string;
    primary_state?: string;
  };
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

