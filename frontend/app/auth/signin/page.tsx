"use client";

import React, { useState, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import ErrorState from "@/components/ErrorState";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { businessesApi } from "@/lib/api/businesses";
import { ComplyWiseLogoMark } from "@/components/icons/ComplyWiseLogo";
import { ShieldCheck, Sparkles, CheckCircle2, ArrowRight } from "lucide-react";

function SignInContent() {
  const { t } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams?.get("redirect") || "/dashboard";

  const { login, register, fastDemoLogin } = useAuth();
  const initialMode = searchParams?.get("mode") === "register" ? "register" : "signin";

  const [mode, setMode] = useState<"signin" | "register">(initialMode);
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [fullName, setFullName] = useState<string>("");
  const [phoneNumber, setPhoneNumber] = useState<string>("");
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
        await register(email, password, fullName, phoneNumber);
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
    <div className="min-h-screen bg-[#F4F7FB] dark:bg-[#070A0D] text-[#0F172A] dark:text-[#F7F9FC] flex flex-col transition-colors duration-200">
      <Navbar />

      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-5xl bg-white dark:bg-[#0E1318] rounded-3xl border border-[#E2E8F0] dark:border-white/12 shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 transition-all">
          {/* Left Form Column */}
          <div className="lg:col-span-7 p-6 sm:p-10 lg:p-12 flex flex-col justify-center space-y-6">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 dark:bg-blue-500 text-white font-bold text-lg shadow-md shrink-0">
                  CW
                </div>
                <div className="flex flex-col leading-tight">
                  <span className="text-lg font-bold text-[#0B1220] dark:text-[#F7F9FC] tracking-tight">
                    ComplyWise
                  </span>
                  <span className="text-xs font-semibold text-[#475569] dark:text-[#A8B2BE]">
                    Statutory Compliance Intelligence
                  </span>
                </div>
              </div>

              <h1 className="text-2xl sm:text-3xl font-sans font-bold tracking-tight text-[#0B1220] dark:text-[#F7F9FC]">
                {mode === "signin" ? t("auth.signInTitle") : t("auth.signUpTitle")}
              </h1>
              <p className="text-sm font-normal text-[#334155] dark:text-[#D4DBE4] leading-relaxed">
                {mode === "signin"
                  ? "Access your enterprise statutory compliance dashboard and standards monitoring."
                  : "Establish your corporate compliance profile, QCO mappings, and plant dossiers."}
              </p>
            </div>

            {/* Mode Selector Tabs */}
            <div className="flex rounded-xl bg-[#F1F5F9] dark:bg-[#141A21] p-1 border border-[#E2E8F0] dark:border-white/10">
              <button
                type="button"
                onClick={() => {
                  setMode("signin");
                  setError(null);
                }}
                className={`flex-1 rounded-lg py-2.5 text-xs sm:text-sm font-semibold transition-all cursor-pointer ${mode === "signin"
                    ? "bg-white dark:bg-[#0E1318] text-[#0B1220] dark:text-[#F7F9FC] shadow-xs border border-black/5 dark:border-white/15"
                    : "text-[#475569] dark:text-[#A8B2BE] hover:text-[#0B1220] dark:hover:text-[#F7F9FC]"
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
                className={`flex-1 rounded-lg py-2.5 text-xs sm:text-sm font-semibold transition-all cursor-pointer ${mode === "register"
                    ? "bg-white dark:bg-[#0E1318] text-[#0B1220] dark:text-[#F7F9FC] shadow-xs border border-black/5 dark:border-white/15"
                    : "text-[#475569] dark:text-[#A8B2BE] hover:text-[#0B1220] dark:hover:text-[#F7F9FC]"
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
                <>
                  <div>
                    <label className="block text-sm font-semibold text-[#0B1220] dark:text-[#F7F9FC] mb-1.5">
                      {t("auth.fullNameLabel")}
                    </label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Ramesh Chandra"
                      className="w-full rounded-xl border border-[#CBD5E1] dark:border-white/20 bg-white dark:bg-[#141A21] px-4 py-2.5 text-base text-[#0F172A] dark:text-[#F7F9FC] placeholder-[#64748B] dark:placeholder-[#A8B2BE] focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors shadow-2xs"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-[#0B1220] dark:text-[#F7F9FC] mb-1.5">
                      {t("auth.phoneNumberLabel") || "Phone Number / Mobile (for alerts)"}
                    </label>
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full rounded-xl border border-[#CBD5E1] dark:border-white/20 bg-white dark:bg-[#141A21] px-4 py-2.5 text-base text-[#0F172A] dark:text-[#F7F9FC] placeholder-[#64748B] dark:placeholder-[#A8B2BE] focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors shadow-2xs"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-semibold text-[#0B1220] dark:text-[#F7F9FC] mb-1.5">
                  {t("auth.emailLabel")}
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@enterprise.in"
                  className="w-full rounded-xl border border-[#CBD5E1] dark:border-white/20 bg-white dark:bg-[#141A21] px-4 py-2.5 text-base text-[#0F172A] dark:text-[#F7F9FC] placeholder-[#64748B] dark:placeholder-[#A8B2BE] focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#0B1220] dark:text-[#F7F9FC] mb-1.5">
                  {t("auth.passwordLabel")}
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full rounded-xl border border-[#CBD5E1] dark:border-white/20 bg-white dark:bg-[#141A21] px-4 py-2.5 text-base text-[#0F172A] dark:text-[#F7F9FC] placeholder-[#64748B] dark:placeholder-[#A8B2BE] focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors shadow-2xs"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 text-base font-semibold shadow-md disabled:opacity-50 transition-all cursor-pointer"
              >
                <span>
                  {loading
                    ? t("common.submitting")
                    : mode === "signin"
                      ? t("auth.signInBtn")
                      : t("auth.registerBtn")}
                </span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>

            {/* Fast Demo Access Button */}
            <div className="pt-4 border-t border-[#E2E8F0] dark:border-white/10 space-y-2.5">
              <div className="text-xs uppercase tracking-wider text-center text-[#334155] dark:text-[#D4DBE4] font-bold">
                EVALUATION &amp; HACKATHON JURY ACCESS
              </div>
              <button
                type="button"
                onClick={handleDemoLogin}
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-amber-400 dark:border-amber-500/40 bg-amber-50 dark:bg-amber-500/15 px-4 py-3 text-sm font-bold text-amber-950 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-500/25 disabled:opacity-50 transition-colors cursor-pointer shadow-2xs"
              >
                <Sparkles className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>Fast Demo Login (Lead Compliance Officer)</span>
              </button>
              <div className="text-xs text-center text-[#475569] dark:text-[#D4DBE4]">
                Pre-seeded test account with ready industrial parameters
              </div>
            </div>
          </div>

          {/* Right Atmospheric Visual Column (Using Provided Image) */}
          <div className="hidden lg:relative lg:col-span-5 bg-[#070A0D] overflow-hidden lg:flex flex-col justify-between p-8 text-white border-l border-[#E2E8F0] dark:border-white/12">
            {/* The User-Provided Photograph */}
            <Image
              src="/assets/auth/signup.jpg"
              alt="Compliance Documentation and Verification Workspace"
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 40vw"
              className="object-cover object-center opacity-60"
            />

            {/* Gradient Overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#070A0D] via-[#070A0D]/40 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#070A0D]/70 via-transparent to-transparent" />

            {/* Top Pill */}
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-xs font-mono text-white">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>STATUTORY COMPLIANCE INTELLIGENCE</span>
              </div>
            </div>

            {/* Bottom Minimal Ambient Text */}
            <div className="relative z-10">
              <p className="text-sm font-medium text-white/90 leading-relaxed max-w-xs">
                Bureau of Indian Standards · Quality Control Orders · Regulatory Intelligence
              </p>
              <p className="mt-1.5 text-xs text-white/70 font-mono">
                Deterministic · Source-Grounded · Audit-Ready
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F4F7FB] dark:bg-[#070A0D]" />}>
      <SignInContent />
    </Suspense>
  );
}
