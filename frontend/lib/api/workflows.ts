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

export interface WorkflowsSummary {
  total_workflows: number;
  compliance_count: number;
  standards_count: number;
  schemes_count: number;
  completed_count: number;
  in_progress_count: number;
  not_started_count: number;
  overall_progress: number;
}

export interface WorkflowsAvailable {
  business_id: string;
  business_name?: string;
  available: true;
  workflows: WorkflowItem[];
  count: number;
  total_workflows?: number;
  summary?: WorkflowsSummary;
}

export interface UpdateWorkflowStepPayload {
  assessment_id?: string;
  workflow_id: string;
  step_number: number;
  status: "COMPLETED" | "IN_PROGRESS" | "NOT_STARTED" | string;
  user_reference?: string;
  notes?: string;
  total_steps?: number;
  title?: string;
  authority?: string;
  category?: string;
}

export interface UpdateWorkflowStepResponse {
  message: string;
  workflow_id: string;
  step_number: number;
  status: string;
  progress_percent: number;
  current_step: number;
  case_number?: string;
  workflow_state?: any;
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

  updateStep: (
    businessId: string,
    payload: UpdateWorkflowStepPayload
  ): Promise<UpdateWorkflowStepResponse> =>
    request<UpdateWorkflowStepResponse>(`/businesses/${businessId}/workflows/step`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};
