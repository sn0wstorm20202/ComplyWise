"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { User, AuthSession } from "@/types";
import { authApi } from "@/lib/api/auth";
import { getAuthToken, setAuthToken } from "@/lib/api/client";

interface AuthContextValue {
  user: User | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<AuthSession>;
  adminLogin: (email: string, password: string) => Promise<AuthSession>;
  register: (
    email: string,
    password: string,
    fullName: string,
    phoneNumber?: string
  ) => Promise<AuthSession>;
  completeGoogleSignIn: (ticket: string, verifier: string) => Promise<AuthSession & {is_new_user: boolean}>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function clearTenantLocalStorage() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("complywise_active_business_id");
    localStorage.removeItem("complywise_active_business_name");
    localStorage.removeItem("complywise_active_assessment_id");
    localStorage.removeItem("complywise_cached_businesses");
    localStorage.removeItem("complywise_cached_assessments");
    localStorage.removeItem("complywise_business_profile_v2");
    localStorage.removeItem("complywise_admin_token");
    localStorage.removeItem("complywise_compliance_cache");
    localStorage.removeItem("complywise_documents_cache");
    window.dispatchEvent(new CustomEvent("complywise_auth_logged_out"));
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const checkAuth = useCallback(async (): Promise<boolean> => {
    const existingToken = getAuthToken();
    if (!existingToken) {
      setUser(null);
      setTokenState(null);
      setLoading(false);
      return false;
    }

    try {
      const currentUser = await authApi.me();
      if (currentUser && currentUser.email) {
        setUser(currentUser);
        setTokenState(existingToken);
        setLoading(false);
        return true;
      }
      throw new Error("Invalid user payload");
    } catch (err: unknown) {
      // Only clear credentials if the server explicitly rejected the token (401 Unauthorized / 403 Forbidden)
      const isUnauthorized =
        (err && typeof err === "object" && "status" in err && (err as { status: number }).status === 401) ||
        (err instanceof Error && (err.message.includes("401") || err.message.includes("credentials were not provided")));
      if (isUnauthorized) {
        setAuthToken(null);
        setUser(null);
        setTokenState(null);
        clearTenantLocalStorage();
      }
      setLoading(false);
      return false;
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (email: string, password: string): Promise<AuthSession> => {
    setLoading(true);
    try {
      const session = await authApi.login(email, password);
      setUser(session.user);
      setTokenState(session.token);
      setAuthToken(session.token);
      return session;
    } finally {
      setLoading(false);
    }
  };

  const adminLogin = async (
    email: string,
    password: string
  ): Promise<AuthSession> => {
    setLoading(true);
    try {
      const session = await authApi.adminLogin(email, password);
      setUser(session.user);
      setTokenState(session.token);
      setAuthToken(session.token);
      if (typeof window !== "undefined") {
        localStorage.setItem("complywise_admin_token", session.token);
      }
      return session;
    } finally {
      setLoading(false);
    }
  };

  const register = async (
    email: string,
    password: string,
    fullName: string,
    phoneNumber?: string
  ): Promise<AuthSession> => {
    setLoading(true);
    try {
      const session = await authApi.register(email, password, fullName, phoneNumber);
      setUser(session.user);
      setTokenState(session.token);
      setAuthToken(session.token);
      return session;
    } finally {
      setLoading(false);
    }
  };

  const completeGoogleSignIn = useCallback(async (ticket: string, verifier: string) => {
    const session = await authApi.googleExchange(ticket, verifier);
    setAuthToken(session.token);
    setUser(session.user);
    setTokenState(session.token);
    setLoading(false);
    return session;
  }, []);

  const logout = async (): Promise<void> => {
    setLoading(true);
    try {
      await authApi.logout();
    } catch {
      // Ignore network errors on logout
    } finally {
      setAuthToken(null);
      localStorage.removeItem("complywise_admin_token");
      for (const key of ["complywise_active_business_id", "complywise_active_assessment_id", "complywise_cached_businesses", "complywise_cached_assessments", "complywise_business_profile_v2"]) localStorage.removeItem(key);
      setUser(null);
      setTokenState(null);
      clearTenantLocalStorage();
      setLoading(false);
    }
  };

  const value: AuthContextValue = {
    user,
    token,
    loading,
    isAuthenticated: Boolean(user && token),
    login,
    adminLogin,
    register,
    completeGoogleSignIn,
    logout,
    checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
