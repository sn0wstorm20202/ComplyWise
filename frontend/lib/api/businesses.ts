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

  /** List all businesses across all accounts for Admin Control Room */
  getAdminBusinesses: (search?: string) =>
    request<{ total_count: number; businesses: Business[] }>(
      search ? `/admin/businesses?search=${encodeURIComponent(search)}` : "/admin/businesses"
    ),

  /** Get complete 360-degree overview of a business (profile, compliances, all uploaded documents) */
  getAdminBusinessOverview: (businessId: string) =>
    request<{
      business: Business & { owner_id?: string; owner_email?: string; owner_name?: string };
      profile: {
        version_number: number;
        change_note: string;
        created_at: string | null;
        answered_variables: Array<{
          key: string;
          label: string;
          value: any;
          origin: string;
          unit?: string | null;
          recorded_at?: string | null;
        }>;
      };
      profile_history: Array<{
        id: string;
        version: number;
        change_note: string;
        variables_count: number;
        created_at: string | null;
      }>;
      compliance_cases: Array<{
        id: string;
        case_number: string;
        requirement_id_code: string;
        requirement_name: string;
        authority: string;
        status_code: string;
        priority: string;
        is_mandated: boolean;
        mandate_basis: string;
        current_step_name: string;
        current_step_code: string;
        documents_required_count: number;
        documents_uploaded_count: number;
        documents_approved_count: number;
        assigned_reviewer_name?: string | null;
        assigned_reviewer_email?: string | null;
        opened_at?: string | null;
        updated_at?: string | null;
      }>;
      uploaded_documents: Array<{
        id: string;
        document_requirement_id: string;
        requirement_name: string;
        document_type_code: string;
        case_id: string;
        case_number: string;
        version_number: number;
        file_name: string;
        file_size_bytes: number;
        mime_type: string;
        checksum: string;
        status_code: string;
        uploaded_at?: string | null;
        uploaded_by_email?: string | null;
        latest_review?: {
          review_type: string;
          status: string;
          reviewer_comments?: string;
          findings?: any[];
          reviewed_at?: string | null;
        } | null;
      }>;
      summary: {
        total_compliances: number;
        mandated_compliances: number;
        pending_reviews: number;
        action_required: number;
        completed: number;
        total_uploaded_documents: number;
      };
    }>(`/admin/businesses/${businessId}`),

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

