/**
 * ComplyWise Consolidated Typed API Client
 *
 * Authority: FRONTEND_INSTRUCTIONS.md §4
 *
 * Exports a single, typed `api` object providing access to all backend boundaries.
 * No raw `fetch()` calls should be scattered across components.
 */

import { healthApi } from "./health";
import { authApi } from "./auth";
import { businessesApi } from "./businesses";
import { applicabilityApi } from "./applicability";
import { onboardingApi } from "./onboarding";
import { dashboardApi } from "./dashboard";
import { complianceApi } from "./compliance";
import { documentsApi } from "./documents";
import { workflowsApi } from "./workflows";
import { calendarApi } from "./calendar";
import { schemesApi } from "./schemes";
import { standardsApi } from "./standards";
import { regulatoryUpdatesApi } from "./regulatoryUpdates";
import { assistantApi } from "./assistant";
import { discoveryApi } from "./discovery";

export const api = {
  health: healthApi,
  auth: authApi,
  businesses: businessesApi,
  applicability: applicabilityApi,
  onboarding: onboardingApi,
  dashboard: dashboardApi,
  compliance: complianceApi,
  documents: documentsApi,
  workflows: workflowsApi,
  calendar: calendarApi,
  schemes: schemesApi,
  standards: standardsApi,
  regulatoryUpdates: regulatoryUpdatesApi,
  assistant: assistantApi,
  discovery: discoveryApi,
};

export default api;
export * from "./client";
export * from "./health";
export * from "./auth";
export * from "./businesses";
export * from "./applicability";
export * from "./onboarding";
export * from "./dashboard";
export * from "./compliance";
export * from "./documents";
export * from "./workflows";
export * from "./calendar";
export * from "./schemes";
export * from "./standards";
export * from "./regulatoryUpdates";
export * from "./assistant";
export * from "./discovery";
