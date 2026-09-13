/**
 * Discover API Service (Standards, Schemes, Regulatory Updates)
 * Authority: PRD_v2.0 §21, §22, §23
 */

import { client } from '../../api/client';
import {
  RegulatoryUpdatesResponse,
  SchemesResponse,
  StandardsSearchResponse,
} from '../../types/discover';

export const discoverApi = {
  searchStandards: async (
    query?: string,
    businessId?: string,
    assessmentId?: string
  ): Promise<StandardsSearchResponse> => {
    return client.get<StandardsSearchResponse>('standards/search', {
      params: {
        ...(query ? { query } : {}),
        ...(businessId ? { business_id: businessId } : {}),
        ...(assessmentId ? { assessment_id: assessmentId } : {}),
      },
    });
  },

  getSchemes: async (
    businessId: string,
    assessmentId?: string
  ): Promise<SchemesResponse> => {
    return client.get<SchemesResponse>(`businesses/${businessId}/schemes`, {
      params: assessmentId ? { assessment_id: assessmentId } : undefined,
    });
  },

  getRegulatoryUpdates: async (): Promise<RegulatoryUpdatesResponse> => {
    return client.get<RegulatoryUpdatesResponse>('regulatory-updates');
  },
};
