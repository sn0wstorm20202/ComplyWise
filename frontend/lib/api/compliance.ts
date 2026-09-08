/**
 * Compliance Requirements API client
 *
 * Authority: TRD_v2.0 §30, PRD_v2.0 §15, §16
 */

import { request } from "./client";
import { ComplianceRequirementItem, RequirementDetail } from "@/types";

export interface ComplianceListResponse {
  business_id: string;
  latest_run_id: string | null;
  count: number;
  requirements: ComplianceRequirementItem[];
}

export interface ComplianceFilterParams {
  status?: string;
  authority?: string;
  category?: string;
  assessment_id?: string;
}

export const complianceApi = {
  list: (
    businessId: string,
    filters?: ComplianceFilterParams
  ): Promise<ComplianceListResponse> =>
    request<ComplianceListResponse>(`/businesses/${businessId}/compliance`, {
      params: filters as Record<string, string | undefined>,
    }),

  getDetail: (
    businessId: string,
    requirementId: string,
    assessmentId?: string
  ): Promise<RequirementDetail> =>
    request<RequirementDetail>(
      assessmentId
        ? `/businesses/${businessId}/compliance/${requirementId}?assessment_id=${assessmentId}`
        : `/businesses/${businessId}/compliance/${requirementId}`
    ),
};
