/**
 * Workflows API client
 *
 * Authority: TRD_v2.0 §30, PRD_v2.0 §19
 */

import { request } from "./client";
import { WorkflowItem } from "@/types";

export interface WorkflowsListResponse {
  business_id: string;
  workflows: WorkflowItem[];
}

export const workflowsApi = {
  list: (businessId: string): Promise<WorkflowsListResponse> =>
    request<WorkflowsListResponse>(`/businesses/${businessId}/workflows`),
};
