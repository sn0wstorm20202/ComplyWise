import type { StatutoryEvidenceItem, EvidenceSourceRecord, GroundedEvidenceItem } from "./requirements";
import type { VerificationStatus } from "./status";

// ---------------------------------------------------------------------------
// Standards & BIS (apps/standards)
// ---------------------------------------------------------------------------

/**
 * A published STANDARD-category requirement. Not a BIS catalogue entry: product
 * scopes and testing parameters are not ingested, so they are not fields here.
 */
export interface StandardItem {
  status?: string;
  source?: EvidenceSourceRecord | null;
  evidence?: GroundedEvidenceItem[];
  matched_facts?: string[];
  source_reference?: string;
  source_url?: string | null;
  why_it_matters?: string;
  is_mandatory?: boolean | null;
  rule_version_id?: string | null;
  result_origin?: "DETERMINISTIC_KB_RESULT" | "LLM_FALLBACK_RESULT" | "HUMAN_REVIEW_RESULT";
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
// Regulatory Updates (apps/regulatory_updates): recorded change summaries
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
