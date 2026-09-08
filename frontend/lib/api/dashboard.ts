/**
 * Dashboard API client
 *
 * Authority: TRD_v2.0 §30, PRD_v2.0 §15
 */

import { request } from "./client";
import { DashboardSummary } from "@/types";

export const dashboardApi = {
  get: (businessId: string, assessmentId?: string | null): Promise<DashboardSummary> =>
    request<DashboardSummary>(
      assessmentId
        ? `/businesses/${businessId}/dashboard?assessment_id=${assessmentId}`
        : `/businesses/${businessId}/dashboard`
    ),
};
