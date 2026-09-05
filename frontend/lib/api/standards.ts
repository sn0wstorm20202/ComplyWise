/**
 * Standards API client
 *
 * Authority: TRD_v2.0 §30, PRD_v2.0 §22
 */

import { request } from "./client";
import { StandardItem } from "@/types";

export interface StandardsSearchResponse {
  count: number;
  standards: StandardItem[];
}

export const standardsApi = {
  search: (query?: string): Promise<StandardsSearchResponse> =>
    request<StandardsSearchResponse>("/standards/search", {
      params: { query },
    }),
};
