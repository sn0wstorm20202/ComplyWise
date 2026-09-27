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
  fastDemoLogin: () => Promise<AuthSession>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

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

  const fastDemoLogin = async (): Promise<AuthSession> => {
    setLoading(true);
    const demoEmail = "compliance.officer@example.com";
    const demoPassword = "CompliancePass123!";
    const fallbackEmail = "demo@complywise.test";
    const fallbackPassword = "DemoPassword123!";
    const demoName = "Lead Compliance Officer";

    try {
      try {
        const session = await authApi.login(demoEmail, demoPassword);
        setUser(session.user);
        setTokenState(session.token);
        setAuthToken(session.token);
        return session;
      } catch {
        try {
          const session = await authApi.login(fallbackEmail, fallbackPassword);
          setUser(session.user);
          setTokenState(session.token);
          setAuthToken(session.token);
          return session;
        } catch {
          // If not registered yet, register demo account
          const session = await authApi.register(
            demoEmail,
            demoPassword,
            demoName
          );
          setUser(session.user);
          setTokenState(session.token);
          setAuthToken(session.token);
          return session;
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    setLoading(true);
    try {
      await authApi.logout();
    } catch {
      // Ignore network errors on logout
    } finally {
      setAuthToken(null);
      setUser(null);
      setTokenState(null);
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
    fastDemoLogin,
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
