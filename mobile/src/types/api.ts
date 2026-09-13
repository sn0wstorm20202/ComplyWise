/**
 * ComplyWise Mobile - Core API Response & Envelope Types
 *
 * Authority: TRD_v2.0 §30, §31
 *
 * All ComplyWise API responses adhere to the standard envelope pattern.
 * The mobile client unwraps `data` while preserving metadata where needed.
 */

export interface ApiEnvelope<T> {
  data: T;
  meta: Record<string, unknown>;
}

export interface ApiErrorDetail {
  field?: string;
  messages?: string[];
}

export interface ApiErrorPayload {
  error: {
    code: string;
    message: string;
    details?: ApiErrorDetail[];
  };
}

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface RequestOptions {
  headers?: Record<string, string>;
  params?: Record<string, string | number | boolean | undefined>;
  timeoutMs?: number;
  skipAuth?: boolean;
}

export interface AuthSession {
  user: {
    id: string;
    email: string;
    full_name: string;
    date_joined: string;
  };
  token: string;
}

export interface HealthCheckResponse {
  status: string;
  timestamp?: string;
  service?: string;
  version?: string;
  api_version?: string;
  services?: Record<string, string>;
}
