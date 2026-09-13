/**
 * ComplyWise Mobile - Authentication Provider & State Machine
 *
 * Authority: TRD_v2.0 §31
 *
 * Explicit State Machine:
 * INITIALIZING -> UNAUTHENTICATED <-> AUTHENTICATING -> AUTHENTICATED -> LOGGING_OUT
 *
 * Guarantees:
 * 1. Hardware-backed token reading on app launch
 * 2. Silent session verification against GET /api/v1/auth/me
 * 3. Stale/invalid token eviction without UI flicker
 * 4. Centralized token persistence and wipe
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { storage } from '../../storage';
import { ApiError } from '../../api';
import { authApi } from './api';
import { AuthContext } from './AuthContext';
import {
  AuthStatus,
  LoginCredentials,
  RegisterCredentials,
  User,
  AuthContextValue,
} from './types';

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [status, setStatus] = useState<AuthStatus>('INITIALIZING');
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);

  /**
   * Session Hydration on Application Startup
   */
  const hydrateSession = useCallback(async () => {
    setStatus('INITIALIZING');
    setError(null);

    try {
      const storedToken = await storage.getAuthToken();

      if (!storedToken) {
        setUser(null);
        setStatus('UNAUTHENTICATED');
        return;
      }

      // Verify stored token against current user profile
      const verifiedUser = await authApi.getMe(storedToken);
      setUser(verifiedUser);
      setStatus('AUTHENTICATED');
    } catch {
      // Token is stale, revoked, or invalid -> clear local store
      await storage.clearAuthToken();
      setUser(null);
      setStatus('UNAUTHENTICATED');
    }
  }, []);

  useEffect(() => {
    hydrateSession();
  }, [hydrateSession]);

  /**
   * Login with email & password
   */
  const login = useCallback(async (credentials: LoginCredentials) => {
    setStatus('AUTHENTICATING');
    setError(null);

    try {
      const res = await authApi.login(credentials);
      await storage.saveAuthToken(res.token);
      setUser(res.user);
      setStatus('AUTHENTICATED');
    } catch (err: unknown) {
      const errorMessage =
        err instanceof ApiError ? err.message : 'Login failed. Please check your credentials.';
      setError(errorMessage);
      setStatus('ERROR');
      throw err;
    }
  }, []);

  /**
   * Register a new user account
   */
  const register = useCallback(async (credentials: RegisterCredentials) => {
    setStatus('AUTHENTICATING');
    setError(null);

    try {
      const res = await authApi.register(credentials);
      // Backend directly returns { user, token } on registration
      await storage.saveAuthToken(res.token);
      setUser(res.user);
      setStatus('AUTHENTICATED');
    } catch (err: unknown) {
      const errorMessage =
        err instanceof ApiError ? err.message : 'Registration failed. Please check your details.';
      setError(errorMessage);
      setStatus('ERROR');
      throw err;
    }
  }, []);

  /**
   * Logout current session
   */
  const logout = useCallback(async () => {
    setStatus('LOGGING_OUT');
    setError(null);

    try {
      await authApi.logout();
    } finally {
      await storage.clearAuthToken();
      setUser(null);
      setStatus('UNAUTHENTICATED');
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
    if (status === 'ERROR') {
      setStatus(user ? 'AUTHENTICATED' : 'UNAUTHENTICATED');
    }
  }, [status, user]);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      isLoading: status === 'INITIALIZING' || status === 'AUTHENTICATING' || status === 'LOGGING_OUT',
      isAuthenticated: status === 'AUTHENTICATED' && user !== null,
      user,
      error,
      login,
      register,
      logout,
      clearError,
      refreshSession: hydrateSession,
    }),
    [status, user, error, login, register, logout, clearError, hydrateSession]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthProvider;
