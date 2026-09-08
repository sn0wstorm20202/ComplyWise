/**
 * Discovery API client — TRD_v2.0 §11A, §30.
 *
 * Provides status and triggering for external regulatory discovery.
 */

import { request } from "./client";
import { CandidateRequirement, DiscoveryRun, DiscoveryRunResult, DiscoveryStatusData } from "@/types";

export const discoveryApi = {
  getStatus(businessId: string, assessmentId?: string): Promise<DiscoveryStatusData> {
    const url = assessmentId
      ? `/businesses/${businessId}/discovery/status?assessment_id=${assessmentId}`
      : `/businesses/${businessId}/discovery/status`;
    return request<DiscoveryStatusData>(url);
  },

  run(businessId: string, forceRefresh: boolean = false): Promise<DiscoveryRunResult> {
    return request<DiscoveryRunResult>(`/businesses/${businessId}/discovery/run`, {
      method: "POST",
      body: JSON.stringify({ force_refresh: forceRefresh }),
    });
  },

  getRuns(businessId: string): Promise<DiscoveryRun[]> {
    return request<DiscoveryRun[]>(`/businesses/${businessId}/discovery/runs`);
  },

  getRun(businessId: string, runId: string): Promise<DiscoveryRun> {
    return request<DiscoveryRun>(`/businesses/${businessId}/discovery/runs/${runId}`);
  },

  getCandidates(businessId: string, runId?: string): Promise<CandidateRequirement[]> {
    const url = runId
      ? `/businesses/${businessId}/discovery/runs/${runId}/candidates`
      : `/businesses/${businessId}/discovery/candidates`;
    return request<CandidateRequirement[]>(url);
  },

  orchestrate(businessId: string, assessmentId?: string, forceLiveDiscovery: boolean = true): Promise<any> {
    return request<any>(`/businesses/${businessId}/analysis/orchestrate`, {
      method: "POST",
      body: JSON.stringify({
        assessment_id: assessmentId,
        force_live_discovery: forceLiveDiscovery,
      }),
    });
  },

  getAnalysisStatus(businessId: string, assessmentId?: string): Promise<any> {
    const url = assessmentId
      ? `/businesses/${businessId}/analysis/status?assessment_id=${assessmentId}`
      : `/businesses/${businessId}/analysis/status`;
    return request<any>(url);
  },
};
