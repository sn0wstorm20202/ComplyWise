/**
 * Compliance Requirements API Service
 * Authority: PRD_v2.0 §15, §16, TRD_v2.0 §30, §31
 */

import { client } from '../../api/client';
import {
  ComplianceListResponse,
  RequirementDetail,
} from '../../types/compliance';

export interface ComplianceFilters {
  status?: string;
  category?: string;
  authority?: string;
  assessment_id?: string;
}

export const complianceApi = {
  listRequirements: async (
    businessId: string,
    filters?: ComplianceFilters
  ): Promise<ComplianceListResponse> => {
    return client.get<ComplianceListResponse>(
      `businesses/${businessId}/compliance`,
      {
        params: filters as Record<string, string | number | boolean | undefined>,
      }
    );
  },

  getRequirementDetail: async (
    businessId: string,
    requirementId: string,
    assessmentId?: string
  ): Promise<RequirementDetail> => {
    return client.get<RequirementDetail>(
      `businesses/${businessId}/compliance/${requirementId}`,
      {
        params: assessmentId ? { assessment_id: assessmentId } : undefined,
      }
    );
  },
};
