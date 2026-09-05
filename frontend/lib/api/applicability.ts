/**
 * Applicability Evaluation & Decision Runs API module
 *
 * Authority: TRD_v2.0 §14, §17, §30, §31; PRD_v2.0 §P3, §P5; Task 2 C18
 */

import { request } from "./client";
import { DecisionRun } from "@/types";

export interface EvaluateRequestPayload {
  profile_version_id?: string;
  evaluation_date?: string;
}

export interface ListDecisionsParams {
  page?: number;
  page_size?: number;
  [key: string]: string | number | boolean | undefined;
}

export const applicabilityApi = {
  /**
   * Trigger deterministic compliance evaluation for a business profile version.
   */
  evaluate: (businessId: string, payload?: EvaluateRequestPayload) =>
    request<DecisionRun>(`/businesses/${businessId}/evaluate`, {
      method: "POST",
      body: payload ? JSON.stringify(payload) : undefined,
    }),

  /**
   * List paginated historical decision runs for a business.
   */
  listDecisions: (businessId: string, params?: ListDecisionsParams) =>
    request<DecisionRun[]>(`/businesses/${businessId}/decisions`, {
      params,
    }),

  /**
   * Retrieve full details and itemized results of a specific decision run.
   */
  getDecision: (businessId: string, runId: string) =>
    request<DecisionRun>(`/businesses/${businessId}/decisions/${runId}`),
};
