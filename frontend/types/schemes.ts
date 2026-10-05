// ---------------------------------------------------------------------------
// Schemes & Incentives Pipeline (apps/schemes) — Central & Maharashtra Pipeline
// ---------------------------------------------------------------------------

import type { EvidenceSourceRecord, GroundedEvidenceItem } from "./requirements";

export interface SchemeItem {
  source?: EvidenceSourceRecord | null;
  evidence?: GroundedEvidenceItem[];
  matched_facts?: string[];
  id: string;
  result_origin?: "DETERMINISTIC_KB_RESULT" | "LLM_FALLBACK_RESULT" | "HUMAN_REVIEW_RESULT";
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
  source_url?: string | null;
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

