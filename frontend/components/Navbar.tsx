"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { healthApi } from "@/lib/api/health";
import { getAuthToken, setAuthToken } from "@/lib/api/client";
import { HealthData } from "@/types";
import { useLanguage } from "@/context/LanguageContext";
import LanguageSelector from "@/components/LanguageSelector";

interface NavbarProps {
  variant?: "default" | "onboarding";
}

export function Navbar({ variant = "default" }: NavbarProps = {}) {
  const { t } = useLanguage();
  const router = useRouter();
  const [health, setHealth] = useState<HealthData | null>(null);
  const [checking, setChecking] = useState<boolean>(true);
  const [isOnline, setIsOnline] = useState<boolean | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    setIsAuthenticated(!!getAuthToken());

    async function checkHealth() {
      try {
        const data = await healthApi.get();
        if (isMounted) {
          setHealth(data);
          setIsOnline(data?.status === "ok");
        }
      } catch {
        if (isMounted) {
          setIsOnline(false);
        }
      } finally {
        if (isMounted) {
          setChecking(false);
        }
      }
    }

    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  function handleLogout() {
    setAuthToken(null);
    localStorage.removeItem("complywise_active_business_id");
    localStorage.removeItem("complywise_active_assessment_id");
    setIsAuthenticated(false);
    if (typeof window !== "undefined") {
      window.location.href = "/auth/signin";
    } else {
      router.push("/auth/signin");
    }
  }

  const navItems = [
    { label: t("navigation.dashboard"), href: "/dashboard" },
    { label: t("navigation.onboarding"), href: "/onboarding" },
    { label: t("navigation.compliance"), href: "/compliance" },
    { label: t("navigation.documents"), href: "/documents" },
    { label: t("navigation.workflows"), href: "/workflows" },
    { label: t("navigation.calendar"), href: "/calendar" },
    { label: t("navigation.standards"), href: "/standards" },
    { label: t("navigation.schemes"), href: "/schemes" },
    { label: t("navigation.assistant"), href: "/assistant" },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#E2E8F0] bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand & Problem Statement Badge */}
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#18181B] text-white font-bold text-base shadow-xs">
              CW
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold tracking-tight text-[#0F172A]">
                  {t("common.appName")}
                </span>
                {variant !== "onboarding" && (
                  <span className="hidden sm:inline-flex items-center rounded-full bg-[#F1F5F9] px-2.5 py-0.5 text-[11px] font-semibold text-[#0F172A] border border-[#E2E8F0]">
                    PS 26130
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[#64748B] hidden md:block">
                {variant === "onboarding" ? "Business Onboarding & Compliance Intake" : t("common.brandSubtitle")}
              </p>
            </div>
          </Link>
        </div>

        {/* Navigation items - Hidden on onboarding flow */}
        {variant !== "onboarding" && (
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-full px-3 py-1.5 text-xs font-medium text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0F172A] transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        )}

        {/* Right side: Language Selector, Auth / User Action & Backend Connectivity Status */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center">
            <LanguageSelector />
          </div>
          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              {variant !== "onboarding" && (
                <Link
                  href="/admin"
                  className="hidden md:inline-flex items-center gap-1.5 text-xs font-semibold text-purple-700 hover:text-purple-800 bg-purple-50 hover:bg-purple-100 border border-purple-200 px-3 py-1 rounded-full transition-colors"
                  title="Compliance Officer Control Room"
                >
                  <span>🛡️</span>
                  <span>Admin Portal</span>
                </Link>
              )}
              <Link
                href="/profile"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0F172A] hover:bg-[#F1F5F9] bg-[#F8FAFC] border border-[#E2E8F0] px-3 py-1 rounded-full transition-colors"
              >
                <span>👤</span>
                <span>My Profile</span>
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-200 px-3 py-1 rounded-full transition-colors cursor-pointer"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              {variant !== "onboarding" && (
                <Link
                  href="/admin/login"
                  className="hidden md:inline-flex items-center gap-1.5 text-xs font-semibold text-purple-700 hover:text-purple-800 bg-purple-50 hover:bg-purple-100 border border-purple-200 px-3 py-1 rounded-full transition-colors"
                  title="Compliance Officer Login"
                >
                  <span>🛡️</span>
                  <span>Admin Portal</span>
                </Link>
              )}
              <Link
                href="/auth/signin"
                className="text-xs font-semibold text-[#0F172A] hover:bg-[#F1F5F9] bg-[#F8FAFC] border border-[#E2E8F0] px-3.5 py-1 rounded-full transition-colors"
              >
                Sign In
              </Link>
            </div>
          )}
          {variant !== "onboarding" && (
            <div className="hidden sm:flex items-center gap-2 rounded-full border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-1">
              <span
                className={`h-2 w-2 rounded-full ${
                  checking
                    ? "bg-amber-400 animate-pulse"
                    : isOnline
                    ? "bg-emerald-500"
                    : "bg-rose-500"
                }`}
              />
              <span className="text-xs font-medium text-[#0F172A]">
                {checking
                  ? t("common.loading")
                  : isOnline
                  ? `API Online ${health?.api_version ? `(${health.api_version})` : ""}`
                  : "API Offline"}
              </span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Navbar;
