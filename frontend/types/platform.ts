// ---------------------------------------------------------------------------
// API Envelope & Error Types (TRD_v2.0 §30, common/envelope.py)
// ---------------------------------------------------------------------------

export interface ApiEnvelope<T> {
  data: T;
  meta?: Record<string, unknown>;
}

export interface ApiErrorDetail {
  field?: string;
  messages: string[];
}

export interface ApiErrorBody {
  code: string;
  message: string;
  details?: ApiErrorDetail[];
}

export interface ApiErrorEnvelope {
  error: ApiErrorBody;
}

export type ApiResponse<T> = ApiEnvelope<T>;

// ---------------------------------------------------------------------------
// Health & System Types (common/health.py)
// ---------------------------------------------------------------------------

export interface HealthData {
  status: string;
  service: string;
  version: string;
  api_version: string;
}

export interface DependencyCheck {
  status: "ok" | "degraded" | "unavailable" | "not_configured";
  engine?: string;
  is_target_engine?: boolean;
  installed?: boolean;
  note?: string;
  error?: string;
  [key: string]: unknown;
}

export interface KnowledgePacksCheck {
  status: "ok" | "degraded" | "not_configured";
  pack_count: number;
  file_count: number;
  packs?: string[];
  malformed_count?: number;
  note?: string;
}

export interface IntegrationsCheck {
  openai_api_key: boolean;
  openai_model: boolean;
  openai_embedding_model: boolean;
  azure_storage: boolean;
  firecrawl_api_key: boolean;
}

export interface ReadinessData {
  status: "ok" | "degraded" | "unavailable";
  service: string;
  version: string;
  checks: {
    database: DependencyCheck;
    pgvector: DependencyCheck;
    knowledge_packs: KnowledgePacksCheck;
    integrations: IntegrationsCheck;
  };
}

// ---------------------------------------------------------------------------
// Accounts & Identity (apps/accounts/serializers.py)
// ---------------------------------------------------------------------------

export interface User {
  is_compliance_officer?: boolean;
  role?: string;
  id: string;
  email: string;
  full_name: string;
  phone_number?: string;
  is_staff?: boolean;
  is_superuser?: boolean;
  date_joined: string;
}

export interface AuthSession {
  user: User;
  token: string;
}

// ---------------------------------------------------------------------------
// Unavailable capabilities (backend common/capability.py)
// ---------------------------------------------------------------------------

/**
 * Returned by boundaries that are routed and typed but have no knowledge source.
 *
 * `available: false` is not an error — it is the honest state of a screen whose
 * data has not been ingested. Render `reason` rather than an empty table, and
 * never substitute sample rows: a user cannot tell fabricated regulatory content
 * from verified content once it is on screen.
 */
export interface CapabilityUnavailable {
  capability: string;
  available: false;
  reason: string;
  requires: string;
  count: 0;
}

