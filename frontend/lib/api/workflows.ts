/**
 * Workflows API client
 *
 * Authority: TRD_v2.0 §30, PRD_v2.0 §19
 *
 * No workflow definitions are ingested, so this endpoint always returns
 * `available: false` with a reason. Typed as a union so `workflows` cannot be read
 * without checking `available` first.
 */

import { request } from "./client";
import { CapabilityUnavailable, WorkflowItem } from "@/types";

export interface WorkflowsAvailable {
  business_id: string;
  available: true;
  workflows: WorkflowItem[];
  count: number;
}

export type WorkflowsListResponse =
  | WorkflowsAvailable
  | (CapabilityUnavailable & { business_id: string; workflows: never[] });

export const workflowsApi = {
  list: (businessId: string, assessmentId?: string): Promise<WorkflowsListResponse> =>
    request<WorkflowsListResponse>(
      assessmentId
        ? `/businesses/${businessId}/workflows?assessment_id=${assessmentId}`
        : `/businesses/${businessId}/workflows`
    ),
};
