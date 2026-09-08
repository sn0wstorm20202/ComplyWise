/**
 * Standards API client
 *
 * Authority: TRD_v2.0 §30, PRD_v2.0 §22
 *
 * Searches published STANDARD-category requirements, not a BIS catalogue.
 * `catalogue_available` is always false: product scopes and testing parameters are
 * not ingested, so this must not be presented as a complete standards lookup.
 */

import { request } from "./client";
import { StandardItem } from "@/types";

export interface StandardsSearchResponse {
  query: string;
  count: number;
  standards: StandardItem[];
  catalogue_available: boolean;
  catalogue_note: string;
}

export const standardsApi = {
  search: (query?: string, businessId?: string): Promise<StandardsSearchResponse> =>
    request<StandardsSearchResponse>("/standards/search", {
      params: { ...(query ? { query } : {}), ...(businessId ? { business_id: businessId } : {}) },
    }),
};
