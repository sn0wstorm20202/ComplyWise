/**
 * Schemes API client
 *
 * Authority: TRD_v2.0 §30, PRD_v2.0 §21
 */

import { request } from "./client";
import { SchemeItem } from "@/types";

export interface SchemesListResponse {
  business_id: string;
  schemes: SchemeItem[];
}

export const schemesApi = {
  list: (businessId: string): Promise<SchemesListResponse> =>
    request<SchemesListResponse>(`/businesses/${businessId}/schemes`),
};
