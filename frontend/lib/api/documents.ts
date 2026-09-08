/**
 * Documents API client
 *
 * Authority: TRD_v2.0 §30, PRD_v2.0 §18
 *
 * The checklist is real where knowledge records it — document names come from the
 * metadata of requirements the engine found APPLICABLE. Storage is not: there is no
 * document model and no blob backend, so `upload_available` is false and `upload()`
 * returns 501. Gate the upload control on that flag rather than letting a user
 * submit a statutory document that is silently discarded.
 */

import { request } from "./client";
import { DocumentItem } from "@/types";

export interface DocumentsListResponse {
  business_id: string;
  /** False when no decision run exists yet, so no checklist can be derived. */
  evaluated: boolean;
  documents: DocumentItem[];
  total_count: number;
  disclaimer: string;
  checklist_source: string;
  /**
   * Applicable requirements with no document list in published knowledge. A gap in
   * knowledge, not a statement that no documents are needed.
   */
  requirements_without_checklist: string[];
  upload_available: boolean;
  prevalidation_available: boolean;
  unavailable_reason: string;
}

export interface DocumentUploadPayload {
  name: string;
  document_type: string;
  file_name: string;
}

export const documentsApi = {
  list: (businessId: string, assessmentId?: string): Promise<DocumentsListResponse> =>
    request<DocumentsListResponse>(
      assessmentId
        ? `/businesses/${businessId}/documents?assessment_id=${assessmentId}`
        : `/businesses/${businessId}/documents`
    ),

  /**
   * Always rejects with `NOT_CONFIGURED` (HTTP 501) until document storage is
   * wired. Kept in the client so the failure is typed and handled, not so it can
   * be called optimistically.
   */
  upload: (
    businessId: string,
    payload: DocumentUploadPayload
  ): Promise<never> =>
    request<never>(`/businesses/${businessId}/documents/upload`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};
