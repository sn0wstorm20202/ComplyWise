/**
 * Compliance Requirements & Detail types
 * Authority: PRD_v2.0 §15, §16, TRD_v2.0 §30, §31
 */

export interface RequirementItem {
  requirement_id: string;
  name: string;
  authority: string;
  category: string;
  jurisdiction: string;
  status: 'APPLICABLE' | 'NOT_APPLICABLE' | 'NEEDS_INFORMATION' | 'CONFLICT_REVIEW' | 'UNVERIFIED';
  matched_rule_id?: string | null;
  matched_rule_type?: string | null;
  evidence_count: number;
  explanation_reason?: string | null;
  notes?: string;
}

export interface ComplianceListResponse {
  business_id: string;
  latest_run_id: string | null;
  count: number;
  requirements: RequirementItem[];
}

export interface StatutoryEvidenceItem {
  evidence_id: string;
  source_title: string;
  authority: string;
  locator: string;
  excerpt: string;
  verification_status: string;
  canonical_url?: string;
}

export interface WhyItApplies {
  summary: string;
  matched_rule_id?: string | null;
  matched_rule_type?: string | null;
  matched_rule_version?: number | null;
  reason_code?: string | null;
  evaluation_notes?: string | null;
  rule_evaluations?: unknown[];
  conflicts?: unknown[];
}

export interface WhatYouNeed {
  documents: string[];
  documents_available: boolean;
  statutory_fee_estimate: string;
  validity_period: string;
  renewal_period_years?: number | null;
  not_recorded_note?: string | null;
}

export interface WhatToDoNext {
  steps: string[];
  steps_available: boolean;
  official_portal: string;
  not_recorded_note?: string | null;
}

export interface RequirementDetail {
  requirement_id: string;
  name: string;
  authority: string;
  category: string;
  jurisdiction: string;
  domain: string;
  description: string;
  status: 'APPLICABLE' | 'NOT_APPLICABLE' | 'NEEDS_INFORMATION' | 'CONFLICT_REVIEW' | 'UNVERIFIED';
  evaluated: boolean;
  evaluation_date?: string | null;
  why_it_applies: WhyItApplies;
  what_you_need: WhatYouNeed;
  what_to_do_next: WhatToDoNext;
  statutory_evidence: StatutoryEvidenceItem[];
  evidence_count: number;
}
