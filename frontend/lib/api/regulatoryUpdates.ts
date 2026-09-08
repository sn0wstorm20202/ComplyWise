/**
 * Regulatory Updates API client
 *
 * Authority: TRD_v2.0 §30, PRD_v2.0 §23
 *
 * No regulatory-change monitoring exists, so this endpoint always returns
 * `available: false` with a reason. Typed as a union so `updates` cannot be read
 * without checking `available` first — an empty list rendered on a screen titled
 * "Regulatory Updates" reads as "nothing has changed", which is a different claim.
 */

import { request } from "./client";
import { CapabilityUnavailable, RegulatoryUpdateItem } from "@/types";

export interface RegulatoryUpdatesAvailable {
  available: true;
  updates: RegulatoryUpdateItem[];
  count: number;
}

export type RegulatoryUpdatesResponse =
  | RegulatoryUpdatesAvailable
  | (CapabilityUnavailable & { updates: never[] });

export const regulatoryUpdatesApi = {
  list: (): Promise<RegulatoryUpdatesResponse> =>
    request<RegulatoryUpdatesResponse>("/regulatory-updates"),
};
