/**
 * Dashboard API client
 *
 * Authority: TRD_v2.0 §30, PRD_v2.0 §15
 */

import { request } from "./client";
import { DashboardSummary } from "@/types";

export const dashboardApi = {
  get: (businessId: string): Promise<DashboardSummary> =>
    request<DashboardSummary>(`/businesses/${businessId}/dashboard`),
};
