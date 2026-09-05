"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import ErrorState from "@/components/ErrorState";
import { authApi } from "@/lib/api/auth";
import { setAuthToken } from "@/lib/api/client";

export default function SignInPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "register">("signin");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [fullName, setFullName] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (mode === "signin") {
        const session = await authApi.login(email, password);
        setAuthToken(session.token);
        // Check if there is an active business or redirect to onboarding
        router.push("/onboarding");
      } else {
        const session = await authApi.register(email, password, fullName);
        setAuthToken(session.token);
        router.push("/onboarding");
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Authentication failed. Please verify credentials.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDemoLogin() {
    setLoading(true);
    setError(null);
    const demoEmail = "compliance.officer@example.com";
    const demoPassword = "CompliancePass123!";
    const demoName = "Lead Compliance Officer";

    try {
      // Try login first
      try {
        const session = await authApi.login(demoEmail, demoPassword);
        setAuthToken(session.token);
        router.push("/onboarding");
        return;
      } catch {
        // If login failed, register demo account
        const session = await authApi.register(
          demoEmail,
          demoPassword,
          demoName
        );
        setAuthToken(session.token);
        router.push("/onboarding");
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to authenticate demo user.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <Navbar />

      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200/80 p-8 shadow-xs space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-white font-bold text-xl shadow-xs">
              CW
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-950">
              {mode === "signin" ? "Sign In to ComplyWise" : "Create ComplyWise Account"}
            </h1>
            <p className="text-xs text-slate-500">
              {mode === "signin"
                ? "Enter your credentials to access industrial compliance intelligence."
                : "Register to manage multi-jurisdiction statutory requirements."}
            </p>
          </div>

          {/* Tab selector */}
          <div className="flex rounded-lg bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => {
                setMode("signin");
                setError(null);
              }}
              className={`flex-1 rounded-md py-1.5 text-xs font-semibold transition-all ${
                mode === "signin"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("register");
                setError(null);
              }}
              className={`flex-1 rounded-md py-1.5 text-xs font-semibold transition-all ${
                mode === "register"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Create Account
            </button>
          </div>

          {error && (
            <ErrorState
              title="Authentication Notice"
              message={error}
              onRetry={() => setError(null)}
            />
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Ramesh Chandra"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Work Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@enterprise.in"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {loading
                ? "Authenticating..."
                : mode === "signin"
                ? "Sign In →"
                : "Create Account →"}
            </button>
          </form>

          {/* Fast Demo Access Button */}
          <div className="pt-4 border-t border-slate-100 space-y-2">
            <div className="text-[11px] text-center text-slate-400 font-medium">
              EVALUATION & HACKATHON JURY ACCESS
            </div>
            <button
              type="button"
              onClick={handleDemoLogin}
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50/70 px-4 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-100/70 disabled:opacity-50 transition-colors"
            >
              ⚡ Fast Demo Login (Lead Compliance Officer)
            </button>
            <div className="text-[11px] text-center text-slate-400">
              Pre-seeded test account with ready industrial parameters
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
