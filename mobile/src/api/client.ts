/**
 * ComplyWise Mobile - Centralized HTTP API Client Foundation
 *
 * Authority: TRD_v2.0 §30, FRONTEND_INSTRUCTIONS.md §4
 *
 * Layered Architecture:
 * Screen -> Feature Hook -> API Service -> Central HTTP Client -> Django REST API
 *
 * Guarantees:
 * 1. Targets versioned API base URL from central configuration
 * 2. Unpacks the canonical {"data": ..., "meta": ...} response envelope
 * 3. Automatic hardware-backed SecureStore token injection (Authorization: Token <key>)
 * 4. Request timeout handling via AbortController
 * 5. Consistent, typed ApiError handling
 */

import { config } from '../config';
import { storage } from '../storage';
import {
  ApiEnvelope,
  ApiErrorDetail,
  ApiErrorPayload,
  HttpMethod,
  RequestOptions,
} from '../types';

export class ApiError extends Error {
  readonly code: string;
  readonly status: number;
  readonly details: ApiErrorDetail[];

  constructor(code: string, message: string, status: number, details: ApiErrorDetail[] = []) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

async function request<T>(
  endpoint: string,
  method: HttpMethod,
  body?: unknown,
  options: RequestOptions = {}
): Promise<T> {
  const {
    headers: customHeaders = {},
    params,
    timeoutMs = config.apiTimeoutMs,
    skipAuth = false,
  } = options;

  let url = endpoint.startsWith('http')
    ? endpoint
    : `${config.apiBaseUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  if (params) {
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    }
    const queryString = searchParams.toString();
    if (queryString) {
      url += (url.includes('?') ? '&' : '?') + queryString;
    }
  }

  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;

  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(body !== undefined && !isFormData ? { 'Content-Type': 'application/json' } : {}),
    ...customHeaders,
  };

  if (!skipAuth && !headers['Authorization']) {
    const token = await storage.getAuthToken();
    if (token) {
      headers['Authorization'] = `Token ${token}`;
    }
  }

  const payloadBody = isFormData ? (body as FormData) : (body !== undefined ? JSON.stringify(body) : undefined);

  async function executeFetch(attempt = 1): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      return await fetch(url, {
        method,
        headers,
        body: payloadBody,
        signal: controller.signal,
      });
    } catch (err: unknown) {
      clearTimeout(timer);
      const isAbort = err instanceof Error && (err.name === 'AbortError' || err.message?.includes('aborted'));
      if (attempt < 2 && method === 'GET' && isAbort) {
        return executeFetch(attempt + 1);
      }
      if (isAbort) {
        throw new ApiError(
          'TIMEOUT',
          `Network request to ${endpoint} timed out after ${timeoutMs}ms. Verify backend reachability.`,
          408
        );
      }
      throw new ApiError(
        'NETWORK_ERROR',
        err instanceof Error ? err.message : 'Unable to connect to the ComplyWise backend.',
        0
      );
    } finally {
      clearTimeout(timer);
    }
  }

  const response = await executeFetch();

  if (response.status === 204) {
    return {} as T;
  }

  let responseBody: unknown;
  try {
    responseBody = await response.json();
  } catch {
    if (!response.ok) {
      throw new ApiError(
        'SERVER_ERROR',
        `Server returned ${response.status}: ${response.statusText}`,
        response.status
      );
    }
    return {} as T;
  }

  if (!response.ok) {
    const errorPayload = responseBody as ApiErrorPayload;
    const errorData = errorPayload?.error;
    throw new ApiError(
      errorData?.code || 'REQUEST_FAILED',
      errorData?.message || 'An unexpected error occurred.',
      response.status,
      errorData?.details || []
    );
  }

  // Unwrap the canonical {"data": ..., "meta": ...} envelope if present
  const envelope = responseBody as ApiEnvelope<T>;
  if (envelope && typeof envelope === 'object' && 'data' in envelope) {
    return envelope.data;
  }

  return responseBody as T;
}

export const client = {
  get: <T>(endpoint: string, options?: RequestOptions): Promise<T> =>
    request<T>(endpoint, 'GET', undefined, options),

  post: <T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> =>
    request<T>(endpoint, 'POST', body, options),

  put: <T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> =>
    request<T>(endpoint, 'PUT', body, options),

  patch: <T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> =>
    request<T>(endpoint, 'PATCH', body, options),

  delete: <T>(endpoint: string, options?: RequestOptions): Promise<T> =>
    request<T>(endpoint, 'DELETE', undefined, options),
};

export default client;
