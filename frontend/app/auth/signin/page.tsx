"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import ErrorState from "@/components/ErrorState";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { businessesApi } from "@/lib/api/businesses";

function SignInContent() {
  const { t } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams.get("redirect") || "/dashboard";

  const { login, register, fastDemoLogin } = useAuth();
  const initialMode = searchParams.get("mode") === "register" ? "register" : "signin";

  const [mode, setMode] = useState<"signin" | "register">(initialMode);
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [fullName, setFullName] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  async function resolveWorkspaceAndRedirect(fallbackUrl: string) {
    try {
      const ws = await businessesApi.getWorkspace();
      if (ws?.active_business_id) {
        localStorage.setItem("complywise_active_business_id", ws.active_business_id);
      }
      if (ws?.active_assessment_id) {
        localStorage.setItem("complywise_active_assessment_id", ws.active_assessment_id);
      }
      if (ws?.redirect_url && fallbackUrl === "/dashboard") {
        router.push(ws.redirect_url);
        return;
      }
    } catch {
      // Non-blocking workspace restoration fallback
    }
    router.push(fallbackUrl);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (mode === "signin") {
        await login(email, password);
        await resolveWorkspaceAndRedirect(redirectTarget);
      } else {
        await register(email, password, fullName);
        await resolveWorkspaceAndRedirect("/onboarding");
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Authentication failed. Please verify credentials.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDemoLogin() {
    setLoading(true);
    setError(null);
    try {
      await fastDemoLogin();
      await resolveWorkspaceAndRedirect(redirectTarget);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to authenticate demo user.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col">
      <Navbar />

      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-md bg-white rounded-2xl border border-[#E2E8F0] p-8 shadow-xs space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[#0F172A] text-white font-bold text-xl shadow-2xs">
              CW
            </div>
            <h1 className="text-2xl font-sans font-bold tracking-tight text-[#0F172A]">
              {mode === "signin" ? t("auth.signInTitle") : t("auth.signUpTitle")}
            </h1>
            <p className="text-xs text-[#64748B]">
              {mode === "signin"
                ? t("auth.signInSubtitle")
                : t("auth.signUpSubtitle")}
            </p>
          </div>

          {/* Tab selector */}
          <div className="flex rounded-full bg-[#F1F5F9] p-1 border border-[#E2E8F0]">
            <button
              type="button"
              onClick={() => {
                setMode("signin");
                setError(null);
              }}
              className={`flex-1 rounded-full py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                mode === "signin"
                  ? "bg-white text-[#0F172A] shadow-xs"
                  : "text-[#64748B] hover:text-[#0F172A]"
              }`}
            >
              {t("navigation.signIn")}
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("register");
                setError(null);
              }}
              className={`flex-1 rounded-full py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                mode === "register"
                  ? "bg-white text-[#0F172A] shadow-xs"
                  : "text-[#64748B] hover:text-[#0F172A]"
              }`}
            >
              {t("auth.createAccount")}
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
                <label className="block text-xs font-semibold text-[#475569] mb-1.5">
                  {t("auth.fullNameLabel")}
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Ramesh Chandra"
                  className="w-full rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-3.5 py-2.5 text-sm text-[#0F172A] placeholder-[#94A3B8] focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-colors"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-[#475569] mb-1.5">
                {t("auth.emailLabel")}
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@enterprise.in"
                className="w-full rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-3.5 py-2.5 text-sm text-[#0F172A] placeholder-[#94A3B8] focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#475569] mb-1.5">
                {t("auth.passwordLabel")}
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-3.5 py-2.5 text-sm text-[#0F172A] placeholder-[#94A3B8] focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-[#0F172A] px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50 transition-colors shadow-2xs cursor-pointer"
            >
              {loading
                ? t("common.submitting")
                : mode === "signin"
                ? t("auth.signInBtn")
                : t("auth.registerBtn")}
            </button>
          </form>

          {/* Fast Demo Access Button */}
          <div className="pt-4 border-t border-[#E2E8F0] space-y-2">
            <div className="text-[10px] uppercase tracking-wider text-center text-[#94A3B8] font-bold">
              EVALUATION &amp; HACKATHON JURY ACCESS
            </div>
            <button
              type="button"
              onClick={handleDemoLogin}
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 rounded-full border border-amber-300 bg-amber-50 px-4 py-2.5 text-xs font-bold text-amber-900 hover:bg-amber-100/80 disabled:opacity-50 transition-colors cursor-pointer shadow-2xs"
            >
              Fast Demo Login (Lead Compliance Officer)
            </button>
            <div className="text-[11px] text-center text-[#64748B]">
              Pre-seeded test account with ready industrial parameters
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F8FAFC]" />}>
      <SignInContent />
    </Suspense>
  );
}
