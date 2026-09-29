/**
 * Businesses & Profiles API module
 *
 * Authority: TRD_v2.0 §31, FRONTEND_INSTRUCTIONS.md §4
 */

import { request } from "./client";
import {
  AdminScrutinyData,
  Assessment,
  AssessmentSummary,
  Business,
  BusinessProfileData,
  BusinessProfileVersion,
  ProfileVariableDefinition,
  ProfileVariableValue,
  UserProfileHome,
} from "@/types";

export const businessesApi = {
  /** Get current user's profile home (businesses & recent assessments) */
  getProfileHome: () => request<UserProfileHome>("/user/profile"),

  /** List businesses accessible to current user */
  list: () => request<Business[]>("/businesses"),

  /** List all businesses across all accounts for Admin Control Room */
  getAdminBusinesses: (search?: string) =>
    request<{ total_count: number; businesses: Business[] }>(
      search ? `/admin/businesses?search=${encodeURIComponent(search)}` : "/admin/businesses"
    ),

  /** Get complete 360-degree scrutiny overview of a business (Engine 2 truth, CIR, profile, schemes, standards, docs) */
  getAdminBusinessOverview: (businessId: string, assessmentId?: string) =>
    request<AdminScrutinyData>(
      assessmentId
        ? `/admin/businesses/${businessId}?assessment_id=${encodeURIComponent(assessmentId)}`
        : `/admin/businesses/${businessId}`
    ),

  /** Record human requirement review disposition directly from the Scrutiny Control Room */
  recordRequirementDisposition: (
    businessId: string,
    requirementCode: string,
    action: "CONFIRM" | "NOT_REQUIRED",
    reason?: string
  ) =>
    request<{ message: string; disposition: any }>(
      `/admin/businesses/${businessId}/requirements/${encodeURIComponent(requirementCode)}/disposition`,
      {
        method: "POST",
        body: JSON.stringify({ action, reason }),
      }
    ),

  /** Create a new business owned by current user */
  create: (data: { name: string }) =>
    request<Business>("/businesses", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  /** Update business details (e.g. name) */
  update: (businessId: string, data: { name?: string }) =>
    request<Business>(`/businesses/${businessId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  /** Get specific business details */
  get: (businessId: string) => request<Business>(`/businesses/${businessId}`),

  /** Archive or delete a business profile */
  delete: (businessId: string, permanent?: boolean) =>
    request<void>(`/businesses/${businessId}${permanent ? "?permanent=true" : ""}`, {
      method: "DELETE",
    }),

  /** Get current business profile and schema */
  getProfile: (businessId: string) =>
    request<BusinessProfileData>(`/businesses/${businessId}/profile`),

  /** Create a new immutable profile version */
  createProfileVersion: (
    businessId: string,
    variables: Record<string, Partial<ProfileVariableValue>>,
    changeNote: string = "",
    carryForward: boolean = true
  ) =>
    request<BusinessProfileVersion>(`/businesses/${businessId}/profile`, {
      method: "POST",
      body: JSON.stringify({
        variables,
        change_note: changeNote,
        carry_forward: carryForward,
      }),
    }),

  /** Get profile version history for business */
  getProfileHistory: (businessId: string) =>
    request<BusinessProfileVersion[]>(`/businesses/${businessId}/profile/history`),

  /** Get the canonical variable definitions registry */
  getVariableDefinitions: () =>
    request<ProfileVariableDefinition[]>("/profile/variables"),

  /** List all assessments for a business */
  getAssessments: (businessId: string) =>
    request<AssessmentSummary[]>(`/businesses/${businessId}/assessments`),

  /** Create a new assessment for a business */
  createAssessment: (businessId: string, data?: { title?: string; duplicate_from_latest?: boolean }) =>
    request<Assessment>(`/businesses/${businessId}/assessments`, {
      method: "POST",
      body: JSON.stringify(data || {}),
    }),

  /** Get specific assessment by business ID and assessment ID */
  getAssessment: (businessId: string, assessmentId: string) =>
    request<Assessment>(`/businesses/${businessId}/assessments/${assessmentId}`),

  /** Update an ongoing assessment */
  updateAssessment: (businessId: string, assessmentId: string, data: Partial<Assessment>) =>
    request<Assessment>(`/businesses/${businessId}/assessments/${assessmentId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  /** Complete an assessment */
  completeAssessment: (businessId: string, assessmentId: string, summary?: any) =>
    request<Assessment>(`/businesses/${businessId}/assessments/${assessmentId}/complete`, {
      method: "POST",
      body: JSON.stringify({ summary }),
    }),

  /** Get an assessment directly by its ID */
  getAssessmentDirect: (assessmentId: string) =>
    request<Assessment>(`/assessments/${assessmentId}`),

  /** Get authoritative server-side user workspace state */
  getWorkspace: () =>
    request<{
      user_id: string;
      email: string;
      has_workspace: boolean;
      active_business_id: string | null;
      active_business_name: string | null;
      active_assessment_id: string | null;
      active_assessment_number: number | null;
      active_assessment_title: string | null;
      active_assessment_status: string | null;
      current_step: number;
      redirect_target: "DASHBOARD" | "ONBOARDING";
      redirect_url: string;
      updated_at: string | null;
    }>("/user/workspace"),

  /** Update authoritative active workspace selection */
  setWorkspace: (data: { business_id?: string | null; assessment_id?: string | null }) =>
    request<{
      user_id: string;
      email: string;
      has_workspace: boolean;
      active_business_id: string | null;
      active_business_name: string | null;
      active_assessment_id: string | null;
      active_assessment_number: number | null;
      active_assessment_title: string | null;
      active_assessment_status: string | null;
      current_step: number;
      redirect_target: "DASHBOARD" | "ONBOARDING";
      redirect_url: string;
      updated_at: string | null;
    }>("/user/workspace", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

