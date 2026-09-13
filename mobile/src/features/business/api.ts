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

export const businessApi = {
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
