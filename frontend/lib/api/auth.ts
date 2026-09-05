/**
 * Accounts / Auth API module
 *
 * Authority: TRD_v2.0 §30, FRONTEND_INSTRUCTIONS.md §4
 */

import { request, setAuthToken } from "./client";
import { AuthSession, User } from "@/types";

export const authApi = {
  /** Get current authenticated user profile */
  me: () => request<User>("/auth/me"),

  /** Login with email and password, store token */
  login: async (email: string, password: string): Promise<AuthSession> => {
    const session = await request<AuthSession>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    if (session?.token) {
      setAuthToken(session.token);
    }
    return session;
  },

  /** Register new user account */
  register: async (
    email: string,
    password: string,
    fullName: string
  ): Promise<AuthSession> => {
    const session = await request<AuthSession>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password, full_name: fullName }),
    });
    if (session?.token) {
      setAuthToken(session.token);
    }
    return session;
  },

  /** Invalidate current token and clear local session */
  logout: async (): Promise<void> => {
    try {
      await request<void>("/auth/logout", { method: "POST" });
    } finally {
      setAuthToken(null);
    }
  },
};
