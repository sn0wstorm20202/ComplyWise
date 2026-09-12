/**
 * ComplyWise Base API Client
 *
 * Authority: TRD_v2.0 §30, FRONTEND_INSTRUCTIONS.md §4
 *
 * Ensures all API calls:
 * 1. Target the versioned API base URL (defaults to http://127.0.0.1:8000/api/v1)
 * 2. Unpack the canonical {"data": ..., "meta": ...} response envelope
 * 3. Handle errors uniformly with ApiError exception
 * 4. Pass token credentials where stored
 */

import { ApiEnvelope, ApiErrorEnvelope, ApiErrorDetail } from "@/types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") ||
  (typeof window !== "undefined" && window.location.hostname.includes("vercel.app")
    ? "https://backend-delta-inky-91.vercel.app/api/v1"
    : "http://127.0.0.1:8000/api/v1");

export class ApiError extends Error {
  readonly code: string;
  readonly details: ApiErrorDetail[];
  readonly status: number;

  constructor(code: string, message: string, status: number, details: ApiErrorDetail[] = []) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("complywise_token");
}

export function setAuthToken(token: string | null): void {
  if (typeof window === "undefined") return;
  if (token) {
    localStorage.setItem("complywise_token", token);
  } else {
    localStorage.removeItem("complywise_token");
  }
}

export interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
  timeoutMs?: number;
}

export async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { params, headers: customHeaders, timeoutMs = 25000, ...init } = options;

  let url = endpoint.startsWith("http")
    ? endpoint
    : `${API_BASE_URL}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;

  if (params) {
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) {
        searchParams.append(key, String(value));
      }
    }
    const queryString = searchParams.toString();
    if (queryString) {
      url += (url.includes("?") ? "&" : "?") + queryString;
    }
  }

  const headers: Record<string, string> = {
    "Accept": "application/json",
    ...(init.body ? { "Content-Type": "application/json" } : {}),
    ...(customHeaders as Record<string, string>),
  };

  const token = getAuthToken();
  if (token && !headers["Authorization"]) {
    headers["Authorization"] = `Token ${token}`;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let res: Response;
  try {
    res = await fetch(url, {
      ...init,
      headers,
      signal: init.signal || controller.signal,
    });
  } catch (err: unknown) {
    clearTimeout(timer);
    if (err instanceof Error && (err.name === "AbortError" || err.message?.includes("aborted"))) {
      throw new ApiError("TIMEOUT", `Request to ${endpoint} timed out after ${timeoutMs}ms`, 408);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }

  if (res.status === 204) {
    return {} as T;
  }

  let body: unknown;
  try {
    body = await res.json();
  } catch {
    if (!res.ok) {
      throw new ApiError(
        "SERVER_ERROR",
        `Server returned ${res.status}: ${res.statusText}`,
        res.status
      );
    }
    return {} as T;
  }

  if (!res.ok) {
    const errorEnv = body as ApiErrorEnvelope;
    const errorBody = errorEnv?.error;
    throw new ApiError(
      errorBody?.code || "REQUEST_FAILED",
      errorBody?.message || "An unexpected error occurred.",
      res.status,
      errorBody?.details || []
    );
  }

  // If payload is wrapped in the standard envelope {"data": ...}, unwrap it.
  const env = body as ApiEnvelope<T>;
  if (env && typeof env === "object" && "data" in env) {
    return env.data;
  }

  return body as T;
}
