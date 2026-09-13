/**
 * Work API Service (Documents, Workflows, Calendar)
 * Authority: PRD_v2.0 §18, §19, §20
 */

import { client } from '../../api/client';
import {
  CalendarResponse,
  DocumentsResponse,
  WorkflowsResponse,
  DocumentItem,
  DocumentVerificationResult,
  NotificationsResponse,
  NotificationsSummaryResponse,
} from '../../types/work';

export interface DocumentUploadParams {
  name: string;
  category?: string;
  document_type?: string;
  authority?: string;
  requirement_id?: string;
  reference_number?: string;
  file_name?: string;
  file_size_bytes?: number;
  file?: {
    uri: string;
    name: string;
    type: string;
  };
}

export const workApi = {
  getDocuments: async (
    businessId: string,
    assessmentId?: string
  ): Promise<DocumentsResponse> => {
    return client.get<DocumentsResponse>(`businesses/${businessId}/documents`, {
      params: assessmentId ? { assessment_id: assessmentId } : undefined,
    });
  },

  uploadDocument: async (
    businessId: string,
    payload: DocumentUploadParams
  ): Promise<{ document: DocumentItem; verification: DocumentVerificationResult; message: string }> => {
    if (payload.file) {
      const formData = new FormData();
      formData.append('name', payload.name);
      if (payload.category) formData.append('category', payload.category);
      if (payload.document_type) formData.append('document_type', payload.document_type);
      if (payload.authority) formData.append('authority', payload.authority);
      if (payload.requirement_id) formData.append('requirement_id', payload.requirement_id);
      if (payload.reference_number) formData.append('reference_number', payload.reference_number);
      formData.append('file', {
        uri: payload.file.uri,
        name: payload.file.name,
        type: payload.file.type,
      } as unknown as Blob);
      return client.post(`businesses/${businessId}/documents/upload`, formData);
    }
    return client.post(`businesses/${businessId}/documents/upload`, payload);
  },

  verifyDocument: async (
    businessId: string,
    payload: DocumentUploadParams
  ): Promise<DocumentVerificationResult> => {
    if (payload.file) {
      const formData = new FormData();
      formData.append('name', payload.name);
      if (payload.category) formData.append('category', payload.category);
      if (payload.authority) formData.append('authority', payload.authority);
      if (payload.requirement_id) formData.append('requirement_id', payload.requirement_id);
      formData.append('file', {
        uri: payload.file.uri,
        name: payload.file.name,
        type: payload.file.type,
      } as unknown as Blob);
      return client.post(`businesses/${businessId}/documents/verify`, formData);
    }
    return client.post(`businesses/${businessId}/documents/verify`, payload);
  },

  updatePortalStatus: async (
    businessId: string,
    documentId: string,
    portalUploaded: boolean
  ): Promise<{ document_id: string; portal_uploaded: boolean; status: string }> => {
    return client.post(`businesses/${businessId}/documents/portal-status`, {
      document_id: documentId,
      portal_uploaded: portalUploaded,
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

  getNotifications: async (
    businessId: string,
    lang?: string
  ): Promise<NotificationsResponse> => {
    return client.get<NotificationsResponse>(`businesses/${businessId}/calendar/notifications`, {
      params: lang ? { lang } : undefined,
    });
  },

  getNotificationsSummary: async (
    businessId: string
  ): Promise<NotificationsSummaryResponse> => {
    return client.get<NotificationsSummaryResponse>(
      `businesses/${businessId}/calendar/notifications/summary`
    );
  },

  markNotificationRead: async (
    businessId: string,
    notificationId: string
  ): Promise<unknown> => {
    return client.post(`businesses/${businessId}/calendar/notifications/${notificationId}/read`);
  },

  markAllNotificationsRead: async (
    businessId: string
  ): Promise<unknown> => {
    return client.post(`businesses/${businessId}/calendar/notifications/read-all`);
  },
};
