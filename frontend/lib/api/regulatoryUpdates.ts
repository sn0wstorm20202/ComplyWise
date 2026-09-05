/**
 * Regulatory Updates API client
 *
 * Authority: TRD_v2.0 §30, PRD_v2.0 §23
 */

import { request } from "./client";
import { RegulatoryUpdateItem } from "@/types";

export interface RegulatoryUpdatesResponse {
  count: number;
  updates: RegulatoryUpdateItem[];
}

export const regulatoryUpdatesApi = {
  list: (): Promise<RegulatoryUpdatesResponse> =>
    request<RegulatoryUpdatesResponse>("/regulatory-updates"),
};
