/**
 * Business & Profile API service
 * Authority: TRD_v2.0 §31, §32
 */

import { client } from '../../api/client';
import {
  Business,
  BusinessProfileData,
  BusinessSummary,
  VariableDefinition,
} from '../../types/business';

export interface UserHomeResponse {
  user: {
    id: string;
    email: string;
    full_name?: string;
  };
  businesses: BusinessSummary[];
  recent_assessments: unknown[];
  total_businesses: number;
  total_assessments: number;
}

export interface UserWorkspaceResponse {
  user_id: string;
  email: string;
  has_workspace: boolean;
  active_business_id?: string | null;
  active_business_name?: string | null;
  active_assessment_id?: string | null;
  active_assessment_number?: number | null;
  active_assessment_title?: string | null;
  active_assessment_status?: string | null;
  current_step?: number;
  redirect_target?: 'DASHBOARD' | 'ONBOARDING';
  redirect_url?: string;
  updated_at?: string;
}

export const businessApi = {
  getWorkspace: async (): Promise<UserWorkspaceResponse> => {
    try {
      return await client.get<UserWorkspaceResponse>('user/workspace');
    } catch {
      return await client.get<UserWorkspaceResponse>('users/workspace');
    }
  },

  updateWorkspace: async (
    businessId?: string,
    assessmentId?: string
  ): Promise<UserWorkspaceResponse> => {
    return client.post<UserWorkspaceResponse>('user/workspace', {
      ...(businessId ? { business_id: businessId } : {}),
      ...(assessmentId ? { assessment_id: assessmentId } : {}),
    });
  },

  getUserHome: async (): Promise<UserHomeResponse> => {
    try {
      return await client.get<UserHomeResponse>('user/profile');
    } catch {
      return await client.get<UserHomeResponse>('user/home');
    }
  },

  listBusinesses: async (): Promise<Business[]> => {
    return client.get<Business[]>('businesses');
  },

  getBusiness: async (businessId: string): Promise<Business> => {
    return client.get<Business>(`businesses/${businessId}`);
  },

  createBusiness: async (name: string): Promise<Business> => {
    return client.post<Business>('businesses', { name });
  },

  getBusinessProfile: async (businessId: string): Promise<BusinessProfileData> => {
    return client.get<BusinessProfileData>(`businesses/${businessId}/profile`);
  },

  getVariableDefinitions: async (): Promise<VariableDefinition[]> => {
    return client.get<VariableDefinition[]>('profile/variables');
  },

  saveBusinessProfile: async (
    businessId: string,
    variables: Record<string, { value: unknown; origin?: string }>,
    changeNote?: string,
    carryForward: boolean = false
  ): Promise<unknown> => {
    return client.post(`businesses/${businessId}/profile`, {
      variables,
      change_note: changeNote || 'Updated via mobile app',
      carry_forward: carryForward,
    });
  },
};
