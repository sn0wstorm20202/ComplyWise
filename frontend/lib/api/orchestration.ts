/**
 * Assessment Orchestration API Client
 *
 * Authority: Milestone Step 01-04 Specifications; TRD_v2.0 §30, §31; PRD_v2.0 §10, §14.
 *
 * Provides typed methods for the unified 15-question and regulatory intelligence
 * assessment lifecycle:
 * - Create assessment run
 * - Check progress / safe status
 * - AI business understanding
 * - 15-question generation & answering
 * - Canonical context retrieval
 * - Live regulatory discovery
 * - Compliance synthesis
 * - Compliance requirements & evidence
 * - Matched schemes & standards
 */

import { request } from "./client";

export type AssessmentStage =
  | "INITIALIZED"
  | "BUSINESS_UNDERSTANDING"
  | "QUESTION_GENERATION"
  | "ANSWER_INTERPRETATION"
  | "CONTEXT_SYNTHESIS"
  | "REGULATORY_DISCOVERY"
  | "COMPLIANCE_SYNTHESIS"
  | "SCHEMES"
  | "STANDARDS"
  | "COMPLETED"
  | "FAILED";

export type QuestionAnswerType =
  | "BOOLEAN"
  | "NUMBER"
  | "SINGLE_SELECT"
  | "MULTI_SELECT"
  | "TEXT"
  | "DATE"
  | "CURRENCY"
  | "PERCENTAGE";

export interface QuestionOption {
  value: string;
  label: string;
}

export interface OrchestrationQuestion {
  question_id: string;
  question: string;
  category: string;
  answer_type: QuestionAnswerType;
  required: boolean;
  options: QuestionOption[];
  unit?: string | null;
  help_text?: string | null;
  reason?: string | null;
  order?: number;
  is_answered?: boolean;
  current_value?: any;
}

export interface QuestionsListResponse {
  questions: OrchestrationQuestion[];
  total_questions: number;
  answered_count: number;
  is_complete: boolean;
  next_question: OrchestrationQuestion | null;
}

export interface AssessmentRunSafe {
  run_id: string;
  business_id: string;
  status: string;
  current_stage: AssessmentStage;
  correlation_id: string;
  progress_percent: number;
  stages_completed: string[];
  created_at: string;
  updated_at: string;
  error_message?: string | null;
}

export interface CreateRunResponse {
  run_id: string;
  assessment_id: string;
  business_id: string;
  status: string;
  stage: string;
  created_at: string;
}

export interface BusinessUnderstandingResponse {
  business_summary: string;
  operational_activities: string[];
  risk_categories: string[];
  identified_sector: string;
  [key: string]: any;
}

export interface AnswerSubmitResponse {
  question_id?: string;
  saved: boolean;
  total_answered?: number;
  progress_percent?: number;
  is_complete?: boolean;
  [key: string]: any;
}

export interface ComplianceEvidenceItem {
  evidence_id: string;
  canonical_url: string;
  source_title: string;
  excerpt: string;
  authority: string;
  tier: "PRIMARY_OFFICIAL" | "SECONDARY" | "UNVERIFIED";
  verification_status: "VERIFIED" | "UNVERIFIED" | "CONFLICTING";
  sha256?: string;
}

export interface SynthesizedRequirement {
  id?: string;
  requirement_id: string;
  name: string;
  status: "APPLICABLE" | "NEEDS_INFORMATION" | "NOT_APPLICABLE";
  priority: "HIGH" | "MEDIUM" | "LOW";
  authority: string;
  domain: string;
  jurisdiction: string;
  statutory_act?: string;
  description: string;
  action_summary?: string;
  applicable_facts?: string[];
  missing_facts?: string[];
  evidence_ids?: string[];
  evidence_excerpts?: string[];
  citations?: Array<{
    evidence_id: string;
    source_title: string;
    canonical_url?: string;
    locator?: string;
    excerpt?: string;
    authority?: string;
    verification_status?: string;
  }>;
  portal_url?: string;
  portal_name?: string;
}

export interface ComplianceResponse {
  requirements: SynthesizedRequirement[];
  summary: {
    total_applicable: number;
    total_needs_info: number;
    total_not_applicable: number;
    high_priority_count?: number;
    total?: number;
  };
  executive_summary?: string;
  business_name?: string;
  jurisdiction?: string;
}

export interface EvidenceResponse {
  evidence: ComplianceEvidenceItem[];
  total_evidence: number;
  sources: Array<{
    url: string;
    title: string;
    tier: string;
    authority?: string;
  }>;
  total_sources: number;
}

export interface MatchedScheme {
  id?: string;
  scheme_id: string;
  name: string;
  nodal_ministry?: string;
  authority?: string;
  benefit_type?: string;
  quantum_of_assistance?: string;
  eligibility_status?: string;
  application_url?: string;
  matched_reasons?: string[];
  state?: string;
}

export interface SchemesResponse {
  schemes: MatchedScheme[];
  total_schemes?: number;
  count?: number;
}

export interface MatchedStandard {
  id?: string;
  standard_code: string;
  standard_title: string;
  issuing_body: string;
  is_mandatory: boolean;
  qco_order_number?: string;
  qco_date?: string;
  applicability_reason?: string;
  matched_products?: string[];
}

export interface StandardsResponse {
  standards: MatchedStandard[];
  total_standards?: number;
  count?: number;
}

export const orchestrationApi = {
  /**
   * Create or resume an assessment orchestration run.
   */
  createRun: (payload: {
    business_id: string;
    correlation_id?: string;
    idempotency_key?: string;
    strategy?: string;
  }): Promise<CreateRunResponse> =>
    request<CreateRunResponse>("assessments/", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  /**
   * Retrieve safe progress and status for an assessment run.
   */
  getStatus: (runId: string, businessId?: string): Promise<AssessmentRunSafe> =>
    request<AssessmentRunSafe>(`assessments/${runId}/`, {
      method: "GET",
      params: businessId ? { business_id: businessId } : undefined,
    }),

  /**
   * Execute AI business understanding.
   */
  understand: (runId: string): Promise<BusinessUnderstandingResponse> =>
    request<BusinessUnderstandingResponse>(`assessments/${runId}/understand/`, {
      method: "POST",
    }),

  /**
   * Generate the 15 intelligent compliance questions in a single LLM call.
   */
  generateQuestions: (runId: string): Promise<{ questions: OrchestrationQuestion[]; count: number }> =>
    request<{ questions: OrchestrationQuestion[]; count: number }>(`assessments/${runId}/questions/generate/`, {
      method: "POST",
    }),

  /**
   * List the 15 questions and user completion status for an assessment.
   */
  listQuestions: (runId: string): Promise<QuestionsListResponse> =>
    request<QuestionsListResponse>(`assessments/${runId}/questions/`, {
      method: "GET",
    }),

  /**
   * Submit an answer to a single question or a dictionary of answers.
   */
  submitAnswer: (
    runId: string,
    payload: { question_id: string; value: any } | { answers: Record<string, any> } | { answers: Array<{ question_id: string; value: any }> }
  ): Promise<AnswerSubmitResponse> =>
    request<AnswerSubmitResponse>(`assessments/${runId}/answers/`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  /**
   * Retrieve canonical enriched BusinessContext combining profile, understanding, and answers.
   */
  getContext: (runId: string): Promise<any> =>
    request<any>(`assessments/${runId}/context/`, {
      method: "GET",
    }),

  /**
   * Execute live regulatory discovery across official portals.
   */
  runDiscovery: (runId: string, options?: { force_refresh?: boolean }): Promise<any> =>
    request<any>(`assessments/${runId}/regulatory-discovery/`, {
      method: "POST",
      body: JSON.stringify(options || {}),
    }),

  /**
   * Execute structured compliance synthesis grounded in official evidence.
   */
  runSynthesis: (runId: string, options?: { force_refresh?: boolean }): Promise<ComplianceResponse> =>
    request<ComplianceResponse>(`assessments/${runId}/compliance-synthesis/`, {
      method: "POST",
      body: JSON.stringify(options || {}),
    }),

  /**
   * Retrieve structured compliance requirements and executive summary.
   */
  getCompliance: (runId: string): Promise<ComplianceResponse> =>
    request<ComplianceResponse>(`assessments/${runId}/compliance/`, {
      method: "GET",
    }),

  /**
   * Retrieve discovered official evidence records with provenance metadata.
   */
  getEvidence: (runId: string): Promise<EvidenceResponse> =>
    request<EvidenceResponse>(`assessments/${runId}/evidence/`, {
      method: "GET",
    }),

  /**
   * Retrieve matched government schemes and incentives.
   */
  getSchemes: (runId: string): Promise<SchemesResponse> =>
    request<SchemesResponse>(`assessments/${runId}/schemes/`, {
      method: "GET",
    }),

  /**
   * Retrieve matched statutory and voluntary industrial standards.
   */
  getStandards: (runId: string): Promise<StandardsResponse> =>
    request<StandardsResponse>(`assessments/${runId}/standards/`, {
      method: "GET",
    }),
};
