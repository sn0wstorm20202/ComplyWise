"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getAuthToken, setAuthToken } from "@/lib/api/client";
import { useLanguage } from "@/context/LanguageContext";
import LanguageSelector from "@/components/LanguageSelector";
import ThemeToggle from "@/components/ThemeToggle";
import ComplyWiseLogo from "@/components/icons/ComplyWiseLogo";

export function Navbar() {
  const { t } = useLanguage();
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  useEffect(() => {
    setIsAuthenticated(!!getAuthToken());
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
    <header className="sticky top-0 z-40 w-full border-b border-[#E2E8F0] dark:border-white/12 bg-white/95 dark:bg-[#070A0D]/95 backdrop-blur-md transition-colors duration-200">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand & Problem Statement Badge */}
        <div className="flex items-center gap-3 sm:gap-4">
          <Link href="/" className="flex items-center gap-3 group">
            <ComplyWiseLogo className="h-7 w-7" showSubtitle={true} />
            <span className="hidden sm:inline-flex items-center rounded-full bg-[#F1F5F9] dark:bg-[#141A21] px-2.5 py-0.5 text-xs font-semibold text-[#0B1220] dark:text-[#D4DBE4] border border-[#E2E8F0] dark:border-white/12 group-hover:border-[#CBD5E1] transition-colors">
              PS 26130
            </span>
          </Link>
        </div>

        {/* Navigation items */}
        <nav className="hidden lg:flex items-center gap-1.5">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full px-3 py-1.5 text-sm font-medium text-[#334155] dark:text-[#D4DBE4] hover:bg-[#F1F5F9] dark:hover:bg-white/10 hover:text-[#0B1220] dark:hover:text-[#F7F9FC] transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Right side: Theme Toggle, Language Selector & Auth */}
        <div className="flex items-center gap-3 sm:gap-4">
          <ThemeToggle />
          <LanguageSelector />
          {isAuthenticated ? (
            <div className="flex items-center gap-2.5">
              <Link
                href="/profile"
                className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-[#0B1220] dark:text-[#F7F9FC] hover:bg-[#F1F5F9] dark:hover:bg-white/10 bg-[#F8FAFD] dark:bg-[#141A21] border border-[#CBD5E1] dark:border-white/15 px-3.5 py-1.5 rounded-full transition-colors"
              >
                <span>👤</span>
                <span>My Profile</span>
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="text-xs font-semibold text-rose-700 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-500/15 border border-rose-200 dark:border-rose-500/30 px-3.5 py-1.5 rounded-full transition-colors cursor-pointer"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <Link
              href="/auth/signin"
              className="text-xs font-semibold text-[#0B1220] dark:text-[#F7F9FC] hover:bg-[#F1F5F9] dark:hover:bg-white/10 bg-[#F8FAFD] dark:bg-[#141A21] border border-[#CBD5E1] dark:border-white/15 px-3.5 py-1.5 rounded-full transition-colors"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

export default Navbar;
