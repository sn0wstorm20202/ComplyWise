/**
 * Businesses & Profiles API module
 *
 * Authority: TRD_v2.0 §31, FRONTEND_INSTRUCTIONS.md §4
 */

import { request } from "./client";
import {
  Business,
  BusinessProfileData,
  BusinessProfileVersion,
  ProfileVariableDefinition,
  ProfileVariableValue,
} from "@/types";

export const businessesApi = {
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
};
