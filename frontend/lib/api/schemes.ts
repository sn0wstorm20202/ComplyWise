/**
 * Schemes API client
 *
 * Authority: TRD_v2.0 §30, PRD_v2.0 §21
 *
 * The backend has no scheme catalogue, so this endpoint always returns
 * `available: false` with a reason. The response is typed as a union so a caller
 * cannot read `schemes` without first checking `available`.
 */

import { request } from "./client";
import { CapabilityUnavailable, SchemeItem } from "@/types";

export interface SchemesAvailable {
  business_id: string;
  available: true;
  schemes: SchemeItem[];
  count: number;
}

export type SchemesListResponse =
  | SchemesAvailable
  | (CapabilityUnavailable & { business_id: string; schemes: never[] });

export const schemesApi = {
  list: (businessId: string, assessmentId?: string): Promise<SchemesListResponse> =>
    request<SchemesListResponse>(
      assessmentId
        ? `/businesses/${businessId}/schemes?assessment_id=${assessmentId}`
        : `/businesses/${businessId}/schemes`
    ),
};
