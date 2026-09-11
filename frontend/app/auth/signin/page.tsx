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
    <div className="min-h-screen bg-[#08080a] text-[#e2e3e9] flex flex-col">
      <Navbar />

      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-md bg-[#040406] rounded-2xl border border-[#1c1d22] p-8 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[#cc9166] text-[#08080a] font-bold text-xl shadow-xs">
              CW
            </div>
            <h1 className="text-2xl font-serif tracking-tight text-[#ffffff]">
              {mode === "signin" ? "Sign In to ComplyWise" : "Create ComplyWise Account"}
            </h1>
            <p className="text-xs text-[#777a88]">
              {mode === "signin"
                ? "Enter your credentials to access industrial compliance intelligence."
                : "Register to manage multi-jurisdiction statutory requirements."}
            </p>
          </div>

          {/* Tab selector */}
          <div className="flex rounded-full bg-[#121317] p-1 border border-[#1c1d22]">
            <button
              type="button"
              onClick={() => {
                setMode("signin");
                setError(null);
              }}
              className={`flex-1 rounded-full py-1.5 text-xs font-semibold transition-all ${
                mode === "signin"
                  ? "bg-[#ffffff] text-[#08080a] shadow-xs"
                  : "text-[#777a88] hover:text-[#ffffff]"
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
              className={`flex-1 rounded-full py-1.5 text-xs font-semibold transition-all ${
                mode === "register"
                  ? "bg-[#ffffff] text-[#08080a] shadow-xs"
                  : "text-[#777a88] hover:text-[#ffffff]"
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
                <label className="block text-xs font-medium text-[#9194a1] mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Ramesh Chandra"
                  className="w-full rounded-lg border border-[#1c1d22] bg-[#121317] px-3.5 py-2.5 text-sm text-[#ffffff] placeholder-[#5e616e] focus:border-[#cc9166] focus:outline-none focus:ring-1 focus:ring-[#cc9166] transition-colors"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-[#9194a1] mb-1.5">
                Work Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@enterprise.in"
                className="w-full rounded-lg border border-[#1c1d22] bg-[#121317] px-3.5 py-2.5 text-sm text-[#ffffff] placeholder-[#5e616e] focus:border-[#cc9166] focus:outline-none focus:ring-1 focus:ring-[#cc9166] transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#9194a1] mb-1.5">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full rounded-lg border border-[#1c1d22] bg-[#121317] px-3.5 py-2.5 text-sm text-[#ffffff] placeholder-[#5e616e] focus:border-[#cc9166] focus:outline-none focus:ring-1 focus:ring-[#cc9166] transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-[#ffffff] px-4 py-2.5 text-sm font-semibold text-[#08080a] hover:bg-[#e2e3e9] disabled:opacity-50 transition-colors shadow-sm cursor-pointer"
            >
              {loading
                ? "Authenticating..."
                : mode === "signin"
                ? "Sign In →"
                : "Create Account →"}
            </button>
          </form>

          {/* Fast Demo Access Button */}
          <div className="pt-4 border-t border-[#1c1d22] space-y-2">
            <div className="text-[10px] uppercase tracking-wider text-center text-[#5e616e] font-semibold">
              EVALUATION &amp; HACKATHON JURY ACCESS
            </div>
            <button
              type="button"
              onClick={handleDemoLogin}
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 rounded-full border border-[#2e3038] bg-[#121317] px-4 py-2.5 text-xs font-semibold text-[#cc9166] hover:bg-[#1a1c22] hover:border-[#cc9166]/60 disabled:opacity-50 transition-colors cursor-pointer"
            >
              ⚡ Fast Demo Login (Lead Compliance Officer)
            </button>
            <div className="text-[11px] text-center text-[#777a88]">
              Pre-seeded test account with ready industrial parameters
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
