/**
 * Documents API client
 *
 * Authority: TRD_v2.0 §30, PRD_v2.0 §18
 *
 * Supports:
 * 1. Statutory document registry listing.
 * 2. Document upload with automated software verification layer.
 * 3. Standalone software verification pre-check.
 * 4. Official portal upload status tracking.
 */

import { request } from "./client";
import { DocumentItem } from "@/types";
import type { DocumentVerificationResult } from "@/lib/verification/documentVerifier";

export interface DocumentsListResponse {
  business_id: string;
  /** False when no decision run exists yet, so no checklist can be derived. */
  evaluated: boolean;
  documents: DocumentItem[];
  total_count: number;
  disclaimer: string;
  checklist_source: string;
  requirements_without_checklist: string[];
  upload_available: boolean;
  prevalidation_available: boolean;
  unavailable_reason: string;
}

export interface DocumentUploadPayload {
  name: string;
  document_type?: string;
  category?: string;
  file_name: string;
  file_size_bytes?: number;
  authority?: string;
  requirement_id?: string;
  reference_number?: string;
  valid_until?: string;
  portal_uploaded?: boolean;
}

export interface DocumentUploadResponse {
  document: DocumentItem;
  verification: DocumentVerificationResult;
  message: string;
}

export const documentsApi = {
  list: (businessId: string, assessmentId?: string): Promise<DocumentsListResponse> =>
    request<DocumentsListResponse>(
      assessmentId
        ? `/businesses/${businessId}/documents?assessment_id=${assessmentId}`
        : `/businesses/${businessId}/documents`
    ),

  upload: (
    businessId: string,
    payload: DocumentUploadPayload,
    file?: File | null
  ): Promise<DocumentUploadResponse> => {
    if (file) {
      const formData = new FormData();
      formData.append("file", file);
      Object.entries(payload).forEach(([k, v]) => {
        if (v !== undefined && v !== null) {
          formData.append(k, String(v));
        }
      });
      return request<DocumentUploadResponse>(`/businesses/${businessId}/documents/upload`, {
        method: "POST",
        body: formData,
      });
    }
    return request<DocumentUploadResponse>(`/businesses/${businessId}/documents/upload`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  verify: (
    businessId: string,
    payload: Partial<DocumentUploadPayload>,
    file?: File | null
  ): Promise<DocumentVerificationResult> => {
    if (file) {
      const formData = new FormData();
      formData.append("file", file);
      Object.entries(payload).forEach(([k, v]) => {
        if (v !== undefined && v !== null) {
          formData.append(k, String(v));
        }
      });
      return request<DocumentVerificationResult>(`/businesses/${businessId}/documents/verify`, {
        method: "POST",
        body: formData,
      });
    }
    return request<DocumentVerificationResult>(`/businesses/${businessId}/documents/verify`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  updatePortalStatus: (
    businessId: string,
    documentId: string,
    portalUploaded: boolean
  ): Promise<{ document_id: string; portal_uploaded: boolean; status: string }> =>
    request<{ document_id: string; portal_uploaded: boolean; status: string }>(
      `/businesses/${businessId}/documents/portal-status`,
      {
        method: "POST",
        body: JSON.stringify({ document_id: documentId, portal_uploaded: portalUploaded }),
      }
    ),

  getLLMConfig: (): Promise<{
    provider: string;
    model: string;
    is_configured: boolean;
    key_preview: string | null;
  }> => request("/documents/config-llm"),

  saveLLMConfig: (
    apiKey: string,
    model: string = "gpt-4o-mini"
  ): Promise<{
    success: boolean;
    provider: string;
    model: string;
    key_preview: string;
  }> =>
    request("/documents/config-llm", {
      method: "POST",
      body: JSON.stringify({ openai_api_key: apiKey, model }),
    }),
};
