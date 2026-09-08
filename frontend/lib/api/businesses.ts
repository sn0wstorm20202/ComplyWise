/**
 * Businesses & Profiles API module
 *
 * Authority: TRD_v2.0 §31, FRONTEND_INSTRUCTIONS.md §4
 */

import { request } from "./client";
import {
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
};
