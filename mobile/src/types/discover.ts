/**
 * Discover boundary types (Standards, Schemes, Updates)
 * Authority: PRD_v2.0 §21, §22, §23
 */

export interface StandardItem {
  requirement_id: string;
  standard_code?: string;
  title: string;
  authority: string;
  jurisdiction: string;
  domain: string;
  description: string;
  category: string;
  citations: Array<{
    evidence_id: string;
    source_title: string;
    authority: string;
    locator: string;
    excerpt: string;
    verification_status: string;
    canonical_url?: string;
  }>;
  citation_count: number;
  is_mandatory?: boolean;
  next_step?: string;
}

export interface StandardsSearchResponse {
  query?: string;
  business_id?: string;
  count: number;
  standards: StandardItem[];
  catalogue_available: boolean;
  catalogue_note: string;
}

export interface SchemeItem {
  scheme_id: string;
  title: string;
  ministry_or_department: string;
  benefit_type: string;
  quantum_or_subsidy: string;
  eligibility_summary: string;
  official_portal?: string;
  status?: string;
}

export interface SchemesResponse {
  business_id: string;
  schemes: SchemeItem[];
  catalogue_available: boolean;
  catalogue_note: string;
}

export interface RegulatoryUpdateItem {
  id: string;
  title: string;
  authority: string;
  date: string;
  summary: string;
  source_url?: string;
}

export interface RegulatoryUpdatesResponse {
  available: boolean;
  reason: string;
  updates: RegulatoryUpdateItem[];
}
