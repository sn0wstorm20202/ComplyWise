import type { DocumentStatus, PrevalidationOutcome } from "./status";

// ---------------------------------------------------------------------------
// Documents (apps/documents)
// ---------------------------------------------------------------------------

/**
 * A checklist row derived from an applicable requirement's metadata.
 *
 * Checklist rows can be joined to persisted submissions and pre-validation
 * outcomes. Upload availability is reported by DocumentsListResponse.
 */
export interface DocumentItem {
  id: string;
  name: string;
  requirement_id: string;
  requirement_name: string;
  authority: string;
  category: string;
  status: DocumentStatus;
  prevalidation_status: PrevalidationOutcome;
  expiry_date: string | null;
  notes: string;
  portal_uploaded?: boolean;
  code?: string;
  valid_until?: string;
  file_format?: string;
  file_size_bytes?: number;
  verification?: any;
}

