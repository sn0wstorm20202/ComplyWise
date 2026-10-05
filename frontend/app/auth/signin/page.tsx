"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { LanguageSelector } from "@/components/LanguageSelector";
import ComplyWiseLogo, { ComplyWiseLogoMark } from "@/components/icons/ComplyWiseLogo";
import ErrorState from "@/components/ErrorState";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { startGoogleSignIn } from "@/lib/googleAuth";
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
  const requestedRedirect = searchParams.get("redirect");
  const redirectTarget = requestedRedirect?.startsWith("/") && !requestedRedirect.startsWith("//") ? requestedRedirect : "/dashboard";

  const { login, register, adminLogin } = useAuth();

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

  async function resolveWorkspaceAndRedirect(fallbackUrl: string, isRegistration: boolean = false) {
    if (isRegistration) {
      router.push("/onboarding");
      return;
    }

    const target =
      fallbackUrl === "/auth/signin" || fallbackUrl === "/auth/sign-in"
        ? "/dashboard"
        : fallbackUrl;

    try {
      const ws = await Promise.race([
        businessesApi.getWorkspace(),
        new Promise<null>((resolve) => setTimeout(() => resolve(null), 1500)),
      ]);
      if (ws?.active_business_id) {
        localStorage.setItem("complywise_active_business_id", ws.active_business_id);
      }
      if (ws?.active_assessment_id) {
        localStorage.setItem("complywise_active_assessment_id", ws.active_assessment_id);
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
        await resolveWorkspaceAndRedirect(redirectTarget, false);
      } else if (mode === "register") {
        await register(email, password, fullName, phoneNumber);
        await resolveWorkspaceAndRedirect("/onboarding", true);
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

  return (
    <div className="ui-auth min-h-screen text-[var(--ui-text)] flex flex-col">
      {/* Clean Minimal Top Bar: No bulky headers, only Brand + Choose Language */}
      <header className="ui-topbar">
        <Link href="/" aria-label="ComplyWise home">
          <ComplyWiseLogo showSubtitle={false} />
        </Link>

        {/* Right side: Choose Language Only */}
        <div className="flex items-center gap-2.5">
          <LanguageSelector compact />
        </div>
      </header>

      {/* Main Authentication Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-lg bg-white rounded-3xl border border-[var(--ui-border)] p-6 sm:p-8 shadow-xs space-y-6">
          {/* Card Header */}
          <div className="text-center space-y-1.5">
            <div
              className="inline-flex h-12 w-12 items-center justify-center mx-auto text-[var(--ui-sage)]"
            >
              {mode === "officer" ? <Shield className="w-6 h-6" /> : <ComplyWiseLogoMark className="h-10 w-10" />}
            </div>
            <h1 className="text-2xl font-sans font-bold tracking-tight text-[var(--ui-text)]">
              {mode === "signin"
                ? "Welcome back."
                : mode === "register"
                ? "Your workspace starts here."
                : "Compliance review sign-in"}
            </h1>
            <p className="text-xs text-[var(--ui-secondary)]">
              {mode === "signin"
                ? "Sign in to understand what applies and keep your next steps together."
                : mode === "register"
                ? "Create an account to build your business compliance workspace."
                : "Review business cases, inspect evidence and record decisions."}
            </p>
          </div>

          {/* 3-Option Mode Switcher */}
          <div className="grid grid-cols-3 rounded-2xl bg-[var(--ui-inset)] p-1.5 border border-[var(--ui-border)] gap-1">
            <button
              type="button"
              onClick={() => {
                setMode("signin");
                setError(null);
              }}
              className={`rounded-xl py-2 px-1 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                mode === "signin"
                  ? "bg-white text-[var(--ui-text)] shadow-xs font-bold ring-1 ring-black/5"
                  : "text-[var(--ui-secondary)] hover:text-[var(--ui-text)] font-medium"
              }`}
            >
              <User className="w-4 h-4" />
              <span className="text-[11px] leading-tight">Sign in</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setMode("register");
                setError(null);
              }}
              className={`rounded-xl py-2 px-1 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                mode === "register"
                  ? "bg-white text-[var(--ui-text)] shadow-xs font-bold ring-1 ring-black/5"
                  : "text-[var(--ui-secondary)] hover:text-[var(--ui-text)] font-medium"
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span className="text-[11px] leading-tight">Create account</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setMode("officer");
                setError(null);
              }}
              className={`rounded-xl py-2 px-1 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                mode === "officer"
                  ? "bg-[var(--ui-sage)] text-white shadow-xs font-bold"
                  : "text-[var(--ui-sage)] hover:text-[var(--ui-sage)] font-medium"
              }`}
            >
              <Shield className={`w-4 h-4 ${mode === "officer" ? "text-white" : "text-[var(--ui-sage)]"}`} />
              <span className="text-[11px] leading-tight">Reviewer</span>
            </button>
          </div>

          {mode === "officer" && (
            <div className="p-3 rounded-xl border border-[var(--ui-sage-soft)] bg-[var(--ui-sage-faint)] text-[var(--ui-sage)] text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[var(--ui-sage)] shrink-0" />
                <span className="font-semibold text-[11px]">
                  Restricted: Compliance Officers &amp; Staff Only
                </span>
              </div>

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
                  <label className="block text-xs font-semibold text-[var(--ui-secondary)] mb-1.5">
                    {t("auth.fullNameLabel") || "Full Name"}
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ui-muted)]" />
                    <input
                      type="text"
                      aria-label="Full name"
                      autoComplete="name"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Ramesh Chandra"
                      className="w-full rounded-xl border border-[var(--ui-border)] bg-[var(--ui-bg)] pl-9.5 pr-3.5 py-2.5 text-sm text-[var(--ui-text)] placeholder-[var(--ui-muted)] focus:border-[var(--ui-text)] focus:outline-none focus:ring-1 focus:ring-[var(--ui-text)] transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--ui-secondary)] mb-1.5">
                    {t("auth.phoneNumberLabel") || "Phone Number (Optional)"}
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ui-muted)]" />
                    <input
                      type="tel"
                      aria-label="Phone number"
                      autoComplete="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full rounded-xl border border-[var(--ui-border)] bg-[var(--ui-bg)] pl-9.5 pr-3.5 py-2.5 text-sm text-[var(--ui-text)] placeholder-[var(--ui-muted)] focus:border-[var(--ui-text)] focus:outline-none focus:ring-1 focus:ring-[var(--ui-text)] transition-colors"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-semibold text-[var(--ui-secondary)] mb-1.5">
                {mode === "officer" ? "Staff Email Address" : t("auth.emailLabel") || "Email Address"}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ui-muted)]" />
                <input
                  type="email"
                  aria-label="Email address"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={mode === "officer" ? "admin@complywise.in" : "name@enterprise.in"}
                  className="w-full rounded-xl border border-[var(--ui-border)] bg-[var(--ui-bg)] pl-9.5 pr-3.5 py-2.5 text-sm text-[var(--ui-text)] placeholder-[var(--ui-muted)] focus:border-[var(--ui-text)] focus:outline-none focus:ring-1 focus:ring-[var(--ui-text)] transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--ui-secondary)] mb-1.5">
                {t("auth.passwordLabel") || "Password"}
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ui-muted)]" />
                <input
                  type={showPassword ? "text" : "password"}
                  aria-label="Password"
                  autoComplete={mode === "register" ? "new-password" : "current-password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full rounded-xl border border-[var(--ui-border)] bg-[var(--ui-bg)] pl-9.5 pr-10 py-2.5 text-sm text-[var(--ui-text)] placeholder-[var(--ui-muted)] focus:border-[var(--ui-text)] focus:outline-none focus:ring-1 focus:ring-[var(--ui-text)] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-10 w-10 flex items-center justify-center text-[var(--ui-muted)] hover:text-[var(--ui-text)] cursor-pointer"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {mode === "signin" && (
              <div className="flex justify-end">

              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full rounded-xl px-4 py-3 text-xs font-bold text-white transition-all shadow-xs cursor-pointer flex items-center justify-center gap-2 ${
                mode === "officer"
                  ? "bg-[var(--ui-sage)] hover:bg-[var(--ui-sage)] disabled:opacity-50"
                  : "bg-[var(--ui-text)] hover:bg-[var(--ui-text)] disabled:opacity-50"
              }`}
            >
              <span>
                {loading
                  ? "Processing..."
                  : mode === "signin"
                ? "Sign in"
                  : mode === "register"
                  ? "Create Account & Start Onboarding"
                  : "Sign in to review workspace"}
              </span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          {mode !== "officer" && <button type="button" className="ui-button w-full justify-center" disabled={loading}
            onClick={() => { setLoading(true); setError(null); startGoogleSignIn().catch(() => { setError("We couldn't start Google sign-in. Please try again."); setLoading(false); }); }}>Continue with Google</button>}

        </div>
      </main>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--ui-bg)]" />}>
      <SignInContent />
    </Suspense>
  );
}
