import type { ApplicabilityStatus, VerificationStatus, WorkspaceRequirementStatus } from "./status";

// ---------------------------------------------------------------------------
// Compliance Requirements (apps/requirements)
// ---------------------------------------------------------------------------

export interface ComplianceRequirementItem {
  user_action_required?: boolean;
  admin_disposition?: string;
  review_reason?: string;
  result_origin?: "DETERMINISTIC_KB_RESULT" | "LLM_FALLBACK_RESULT" | "HUMAN_REVIEW_RESULT";
  source_reference?: string;
  requirement_id: string;
  name: string;
  authority: string;
  category: string;
  jurisdiction: string;
  status: WorkspaceRequirementStatus;
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
  source_id?: string;
  source?: EvidenceSourceRecord | null;
}

/** Metadata of the stored source used by a result; never reconstructed from its authority. */
export interface EvidenceSourceRecord {
  id?: string | null;
  title?: string | null;
  url?: string | null;
  canonical_url?: string | null;
  resolved_url?: string | null;
  authority?: string | null;
  source_type?: string | null;
  source_domain?: string | null;
  retrieved_at?: string | null;
  publication_date?: string | null;
  effective_date?: string | null;
  version?: string | number | null;
  hash?: string | null;
  acquisition_method?: string | null;
  evidence_status?: string | null;
  reviewed?: boolean;
  source_status?: string | null;
}

export interface GroundedEvidenceItem {
  evidence_id?: string;
  source_id?: string;
  excerpt?: string | null;
  location?: string | null;
  locator?: string | null;
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
  user_action_required?: boolean;
  admin_disposition?: string;
  review_reason?: string;
  requirement_id: string;
  name: string;
  authority: string;
  category: string;
  jurisdiction: string;
  domain: string;
  description: string;
  status: WorkspaceRequirementStatus;
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

