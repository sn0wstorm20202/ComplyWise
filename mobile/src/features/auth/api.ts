/**
 * ComplyWise Mobile - Authentication API Service
 *
 * Authority: TRD_v2.0 §31
 *
 * Communicates with the Django accounts endpoints:
 * - POST /api/v1/auth/login
 * - POST /api/v1/auth/register
 * - GET  /api/v1/auth/me
 * - POST /api/v1/auth/logout
 *
 * Unwraps data from the canonical envelope and maps responses to typed models.
 */

import { client } from '../../api';
import {
  AuthResponse,
  LoginCredentials,
  RegisterCredentials,
  User,
} from '../../types';

export const authApi = {
  /**
   * Authenticate user with email & password.
   * Uses skipAuth: true so any existing stale token does not interfere.
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const payload = {
      email: credentials.email.trim().toLowerCase(),
      password: credentials.password,
    };
    return client.post<AuthResponse>('auth/login', payload, { skipAuth: true });
  },

  /**
   * Register a new user account.
   * Upon success, the backend directly returns { user, token }.
   */
  async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    const payload = {
      email: credentials.email.trim().toLowerCase(),
      password: credentials.password,
      full_name: credentials.full_name?.trim() || '',
    };
    return client.post<AuthResponse>('auth/register', payload, { skipAuth: true });
  },

  /**
   * Retrieve the authenticated user profile to verify an active session.
   * Injects the provided token or uses the stored token.
   */
  async getMe(token?: string): Promise<User> {
    const options = token
      ? { headers: { Authorization: `Token ${token}` } }
      : undefined;
    return client.get<User>('auth/me', options);
  },

  /**
   * Invalidate the current session token on the backend.
   */
  async logout(): Promise<void> {
    try {
      await client.post<void>('auth/logout');
    } catch {
      // Server logout is best-effort; local session cleanup always proceeds.
    }
  },
};

export default authApi;
