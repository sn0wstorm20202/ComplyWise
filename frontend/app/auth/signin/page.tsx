"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { LanguageSelector } from "@/components/LanguageSelector";
import ErrorState from "@/components/ErrorState";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { businessesApi } from "@/lib/api/businesses";
import {
  User,
  UserPlus,
  Shield,
  Lock,
  Mail,
  Phone,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

export type AuthMode = "signin" | "register" | "officer";

export function SignInContent() {
  const { t } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams.get("redirect") || "/dashboard";

  const { login, register, adminLogin, fastDemoLogin } = useAuth();

  const queryMode = searchParams.get("mode");
  const initialMode: AuthMode =
    queryMode === "register"
      ? "register"
      : queryMode === "officer" || queryMode === "admin"
      ? "officer"
      : "signin";

  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [fullName, setFullName] = useState<string>("");
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  async function resolveWorkspaceAndRedirect(fallbackUrl: string) {
    const target =
      fallbackUrl === "/auth/signin" || fallbackUrl === "/auth/sign-in"
        ? "/dashboard"
        : fallbackUrl;
    try {
      const ws = await Promise.race([
        businessesApi.getWorkspace(),
        new Promise<null>((resolve) => setTimeout(() => resolve(null), 3000)),
      ]);
      if (ws?.active_business_id) {
        localStorage.setItem("complywise_active_business_id", ws.active_business_id);
      }
      if (ws?.active_assessment_id) {
        localStorage.setItem("complywise_active_assessment_id", ws.active_assessment_id);
      }
      if (ws?.redirect_url && (target === "/dashboard" || target === "/")) {
        router.push(ws.redirect_url);
        return;
      }
    } catch {
      // Non-blocking workspace restoration fallback
    }
    router.push(target);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (mode === "signin") {
        await login(email, password);
        await resolveWorkspaceAndRedirect(redirectTarget);
      } else if (mode === "register") {
        await register(email, password, fullName, phoneNumber);
        await resolveWorkspaceAndRedirect("/onboarding");
      } else if (mode === "officer") {
        await adminLogin(email, password);
        router.push("/admin");
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

  function handleAutofillOfficer() {
    setEmail("admin@complywise.in");
    setPassword("Admin@1234");
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col">
      {/* Clean Minimal Top Bar: No bulky headers, only Brand + Choose Language */}
      <header className="w-full border-b border-[#E2E8F0] bg-white/95 backdrop-blur-md px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0F172A] text-white font-bold text-sm shadow-xs group-hover:bg-slate-800 transition-colors">
            CW
          </div>
          <div className="flex flex-col">
            <span className="text-base font-bold tracking-tight text-[#0F172A] leading-tight">
              ComplyWise
            </span>
            <span className="text-[10px] text-[#64748B] font-medium hidden sm:inline">
              Industrial Compliance Intelligence
            </span>
          </div>
        </Link>

        {/* Right side: Choose Language Only */}
        <div className="flex items-center gap-2.5">
          <span className="text-xs font-semibold text-[#64748B] hidden sm:inline">
            Choose Language:
          </span>
          <LanguageSelector compact={false} />
        </div>
      </header>

      {/* Main Authentication Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-lg bg-white rounded-3xl border border-[#E2E8F0] p-6 sm:p-8 shadow-xs space-y-6">
          {/* Card Header */}
          <div className="text-center space-y-1.5">
            <div
              className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl font-bold text-xl shadow-xs mx-auto ${
                mode === "officer"
                  ? "bg-purple-600 text-white"
                  : "bg-[#0F172A] text-white"
              }`}
            >
              {mode === "officer" ? <Shield className="w-6 h-6" /> : "CW"}
            </div>
            <h1 className="text-2xl font-sans font-bold tracking-tight text-[#0F172A]">
              {mode === "signin"
                ? "Sign in as Normal User"
                : mode === "register"
                ? "Register as Normal User"
                : "Sign in as Compliance Officer"}
            </h1>
            <p className="text-xs text-[#64748B]">
              {mode === "signin"
                ? "Enter your registered credentials to access your business compliance dashboard."
                : mode === "register"
                ? "Create an account to start tracking statutory requirements for your enterprise."
                : "Dedicated portal for platform scrutiny, case reviews, and regulatory clearance."}
            </p>
          </div>

          {/* 3-Option Mode Switcher */}
          <div className="grid grid-cols-3 rounded-2xl bg-[#F1F5F9] p-1.5 border border-[#E2E8F0] gap-1">
            <button
              type="button"
              onClick={() => {
                setMode("signin");
                setError(null);
              }}
              className={`rounded-xl py-2 px-1 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                mode === "signin"
                  ? "bg-white text-[#0F172A] shadow-xs font-bold ring-1 ring-black/5"
                  : "text-[#64748B] hover:text-[#0F172A] font-medium"
              }`}
            >
              <User className="w-4 h-4" />
              <span className="text-[11px] leading-tight">1. Sign In (User)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setMode("register");
                setError(null);
              }}
              className={`rounded-xl py-2 px-1 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                mode === "register"
                  ? "bg-white text-[#0F172A] shadow-xs font-bold ring-1 ring-black/5"
                  : "text-[#64748B] hover:text-[#0F172A] font-medium"
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span className="text-[11px] leading-tight">2. Register (User)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setMode("officer");
                setError(null);
              }}
              className={`rounded-xl py-2 px-1 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                mode === "officer"
                  ? "bg-purple-600 text-white shadow-xs font-bold"
                  : "text-purple-700 hover:text-purple-900 font-medium"
              }`}
            >
              <Shield className={`w-4 h-4 ${mode === "officer" ? "text-white" : "text-purple-600"}`} />
              <span className="text-[11px] leading-tight">3. Officer Login</span>
            </button>
          </div>

          {mode === "officer" && (
            <div className="p-3 rounded-xl border border-purple-200 bg-purple-50 text-purple-900 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-purple-600 shrink-0" />
                <span className="font-semibold text-[11px]">
                  Restricted: Compliance Officers &amp; Staff Only
                </span>
              </div>
              <button
                type="button"
                onClick={handleAutofillOfficer}
                className="text-[11px] font-bold text-purple-700 hover:text-purple-900 underline cursor-pointer"
              >
                Autofill Demo Staff
              </button>
            </div>
          )}

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
                  <label className="block text-xs font-semibold text-[#475569] mb-1.5">
                    {t("auth.fullNameLabel") || "Full Name"}
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Ramesh Chandra"
                      className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] pl-9.5 pr-3.5 py-2.5 text-sm text-[#0F172A] placeholder-[#94A3B8] focus:border-[#0F172A] focus:outline-none focus:ring-1 focus:ring-[#0F172A] transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#475569] mb-1.5">
                    {t("auth.phoneNumberLabel") || "Phone Number (Optional)"}
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] pl-9.5 pr-3.5 py-2.5 text-sm text-[#0F172A] placeholder-[#94A3B8] focus:border-[#0F172A] focus:outline-none focus:ring-1 focus:ring-[#0F172A] transition-colors"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-semibold text-[#475569] mb-1.5">
                {mode === "officer" ? "Staff Email Address" : t("auth.emailLabel") || "Email Address"}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={mode === "officer" ? "admin@complywise.in" : "name@enterprise.in"}
                  className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] pl-9.5 pr-3.5 py-2.5 text-sm text-[#0F172A] placeholder-[#94A3B8] focus:border-[#0F172A] focus:outline-none focus:ring-1 focus:ring-[#0F172A] transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#475569] mb-1.5">
                {t("auth.passwordLabel") || "Password"}
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] pl-9.5 pr-10 py-2.5 text-sm text-[#0F172A] placeholder-[#94A3B8] focus:border-[#0F172A] focus:outline-none focus:ring-1 focus:ring-[#0F172A] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#0F172A] cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {mode === "signin" && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setEmail("abc@gmail.com");
                    setPassword("Password123!");
                  }}
                  className="text-xs font-semibold text-amber-700 hover:text-amber-900 underline cursor-pointer"
                >
                  Autofill demo user credentials
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full rounded-xl px-4 py-3 text-xs font-bold text-white transition-all shadow-xs cursor-pointer flex items-center justify-center gap-2 ${
                mode === "officer"
                  ? "bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
                  : "bg-[#0F172A] hover:bg-slate-800 disabled:opacity-50"
              }`}
            >
              <span>
                {loading
                  ? "Processing..."
                  : mode === "signin"
                  ? "Sign In as Normal User"
                  : mode === "register"
                  ? "Create Account & Start Onboarding"
                  : "Sign In to Admin Control Room"}
              </span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Quick Demo Access Options */}
          {mode === "signin" && (
            <div className="pt-4 border-t border-[#E2E8F0] space-y-2">
              <div className="text-[10px] uppercase tracking-wider text-center text-[#94A3B8] font-bold">
                EVALUATION &amp; HACKATHON JURY ACCESS
              </div>
              <button
                type="button"
                onClick={handleDemoLogin}
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-4 py-2.5 text-xs font-bold text-amber-900 hover:bg-amber-100/80 disabled:opacity-50 transition-colors cursor-pointer shadow-2xs"
              >
                Fast Demo Login (Lead Compliance Officer)
              </button>
            </div>
          )}
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
