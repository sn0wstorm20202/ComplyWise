/**
 * Work API Service (Documents, Workflows, Calendar)
 * Authority: PRD_v2.0 §18, §19, §20
 */

import { client } from '../../api/client';
import {
  CalendarResponse,
  DocumentsResponse,
  WorkflowsResponse,
} from '../../types/work';

export const workApi = {
  getDocuments: async (
    businessId: string,
    assessmentId?: string
  ): Promise<DocumentsResponse> => {
    return client.get<DocumentsResponse>(`businesses/${businessId}/documents`, {
      params: assessmentId ? { assessment_id: assessmentId } : undefined,
    });
  },

  getWorkflows: async (
    businessId: string,
    assessmentId?: string
  ): Promise<WorkflowsResponse> => {
    return client.get<WorkflowsResponse>(`businesses/${businessId}/workflows`, {
      params: assessmentId ? { assessment_id: assessmentId } : undefined,
    });
  },

  getCalendar: async (
    businessId: string,
    assessmentId?: string
  ): Promise<CalendarResponse> => {
    return client.get<CalendarResponse>(`businesses/${businessId}/calendar`, {
      params: assessmentId ? { assessment_id: assessmentId } : undefined,
    });
  },
};
