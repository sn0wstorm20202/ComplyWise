/**
 * Schemes API client
 *
 * Authority: TRD_v2.0 §30, PRD_v2.0 §21; Central & Maharashtra Schemes Pipeline.
 *
 * Provides real-time access to the immutable, crawled, and verified government schemes
 * database, business eligibility matching, pipeline status, and version provenance.
 */

import { request } from "./client";
import { CapabilityUnavailable, SchemeItem, SchemePipelineStatus, SchemeVersionRecord } from "@/types";

export interface SchemesAvailable {
  business_id: string;
  business_name?: string;
  available: true;
  state?: string;
  state_name?: string;
  msme_scale?: string;
  schemes: SchemeItem[];
  count: number;
  total_schemes_found?: number;
  maharashtra_schemes_count?: number;
  central_schemes_count?: number;
  discovery_mode?: string;
  data_freshness?: string;
  disclaimer?: string;
}

export type SchemesListResponse =
  | SchemesAvailable
  | (CapabilityUnavailable & { business_id: string; schemes: never[] });

export interface SchemeCatalogResponse {
  count: number;
  schemes: SchemeItem[];
}

export interface SchemeVersionHistoryResponse {
  scheme_code: string;
  current_version_number: number;
  authority: string;
  jurisdiction: string;
  versions_count: number;
  versions: SchemeVersionRecord[];
}

export const schemesApi = {
  list: (businessId: string, assessmentId?: string): Promise<SchemesListResponse> =>
    request<SchemesListResponse>(
      assessmentId
        ? `/businesses/${businessId}/schemes?assessment_id=${assessmentId}`
        : `/businesses/${businessId}/schemes`
    ),

  evaluateContext: (context: {
    state: string;
    product_description: string;
    msme_scale: string;
    is_manufacturing?: boolean;
    is_cross_border?: boolean;
  }): Promise<SchemesAvailable> =>
    request<SchemesAvailable>("/schemes/evaluate", {
      method: "POST",
      body: JSON.stringify(context),
    }),

  catalog: (filters?: { jurisdiction?: string; sector?: string; q?: string }): Promise<SchemeCatalogResponse> => {
    const params = new URLSearchParams();
    if (filters?.jurisdiction) params.set("jurisdiction", filters.jurisdiction);
    if (filters?.sector) params.set("sector", filters.sector);
    if (filters?.q) params.set("q", filters.q);
    const qs = params.toString();
    return request<SchemeCatalogResponse>(qs ? `/schemes/catalog?${qs}` : `/schemes/catalog`);
  },

  pipelineStatus: (): Promise<SchemePipelineStatus> =>
    request<SchemePipelineStatus>("/schemes/pipeline/status"),

  runPipeline: (payload?: { source_keys?: string[]; force?: boolean }): Promise<any> =>
    request<any>("/schemes/pipeline/run", {
      method: "POST",
      body: JSON.stringify(payload || {}),
    }),

  versions: (schemeCode: string): Promise<SchemeVersionHistoryResponse> =>
    request<SchemeVersionHistoryResponse>(`/schemes/${encodeURIComponent(schemeCode)}/versions`),

  rollback: (schemeCode: string, targetVersion: number, reason?: string): Promise<any> =>
    request<any>(`/schemes/${encodeURIComponent(schemeCode)}/rollback`, {
      method: "POST",
      body: JSON.stringify({ target_version: targetVersion, reason: reason || "User triggered rollback" }),
    }),

  updateScheme: (
    schemeCode: string,
    payload: {
      title?: string;
      benefit_summary?: string;
      eligibility_statement?: string;
      benefit_type?: string;
      rate_percent?: number;
      change_reason?: string;
    }
  ): Promise<any> =>
    request<any>(`/schemes/${encodeURIComponent(schemeCode)}/update`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};
