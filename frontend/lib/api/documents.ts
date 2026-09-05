/**
 * Documents API client
 *
 * Authority: TRD_v2.0 §30, PRD_v2.0 §18
 */

import { request } from "./client";
import { DocumentItem } from "@/types";

export interface DocumentsListResponse {
  business_id: string;
  count: number;
  documents: DocumentItem[];
}

export interface DocumentUploadPayload {
  name: string;
  document_type: string;
  file_name: string;
}

export const documentsApi = {
  list: (businessId: string): Promise<DocumentsListResponse> =>
    request<DocumentsListResponse>(`/businesses/${businessId}/documents`),

  upload: (
    businessId: string,
    payload: DocumentUploadPayload
  ): Promise<DocumentItem> =>
    request<DocumentItem>(`/businesses/${businessId}/documents/upload`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};
