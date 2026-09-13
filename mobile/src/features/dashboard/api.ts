/**
 * Dashboard API Service
 * Authority: PRD_v2.0 §14, TRD_v2.0 §30
 */

import { client } from '../../api/client';
import { DashboardSummary } from '../../types/dashboard';

export const dashboardApi = {
  getSummary: async (
    businessId: string,
    assessmentId?: string
  ): Promise<DashboardSummary> => {
    return client.get<DashboardSummary>(`businesses/${businessId}/dashboard`, {
      params: assessmentId ? { assessment_id: assessmentId } : undefined,
    });
  },
};
