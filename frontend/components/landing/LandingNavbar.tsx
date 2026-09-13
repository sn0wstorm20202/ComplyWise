"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Menu, X, ArrowRight } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { LanguageSelector } from "../LanguageSelector";

interface LandingNavbarProps {
  onRequestDemo: () => void;
}

export function LandingNavbar({ onRequestDemo }: LandingNavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { t } = useLanguage();

  const navLinks = [
    { label: "Product", href: "#product" },
    { label: "How It Works", href: "#how-it-works" },
    { label: "Standards", href: "#standards" },
    { label: "Intelligence", href: "#intelligence" },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#E2E8F0] bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0F172A] text-white font-bold text-xs shadow-xs transition-transform group-hover:scale-105">
              CW
            </div>
            <div className="flex items-center gap-2">
              <span className="font-sans text-sm font-bold tracking-tight text-[#0F172A]">
                {t("common.appName")}
              </span>
              <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-mono font-medium bg-amber-50 text-amber-800 border border-amber-200">
                BIS
              </span>
            </div>
          </Link>

          {/* Subtle Development Status Signal */}
          <div className="hidden xl:inline-flex items-center gap-2 rounded-full bg-slate-50 border border-slate-200 px-3 py-0.5 text-[11px] font-medium text-slate-600">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>{t("header.problemStatement")}</span>
          </div>
        </div>

        {/* Center Nav Links (Desktop) */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-slate-600">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="hover:text-[#0F172A] transition-colors"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Right CTA Actions */}
        <div className="hidden sm:flex items-center gap-2.5">
          <LanguageSelector compact={true} />

          <Link
            href="/auth/signin"
            className="text-xs font-medium text-slate-600 hover:text-[#0F172A] px-2.5 py-1.5 transition-colors"
          >
            {t("navigation.signIn")}
          </Link>

          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 rounded-full bg-[#0F172A] hover:bg-slate-800 text-white px-3.5 py-1.5 text-xs font-semibold shadow-xs transition-all"
          >
            <span>{t("header.exploreWorkspace")}</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {/* Mobile Hamburger Toggle */}
        <div className="md:hidden flex items-center gap-2">
          <LanguageSelector compact={true} />
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            type="button"
            aria-label="Toggle navigation menu"
            className="p-1.5 text-slate-600 hover:text-[#0F172A] rounded-md cursor-pointer"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-[#E2E8F0] bg-white px-4 py-3 space-y-2 text-xs">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-slate-600 font-medium hover:text-[#0F172A]"
            >
              {link.label}
            </a>
          ))}
          <div className="pt-2 border-t border-[#E2E8F0] flex items-center justify-between">
            <Link
              href="/auth/signin"
              className="font-semibold text-slate-600 hover:text-[#0F172A]"
            >
              {t("navigation.signIn")}
            </Link>
            <Link
              href="/dashboard"
              className="rounded-full bg-[#0F172A] text-white px-4 py-1.5 font-semibold text-xs"
            >
              {t("header.exploreWorkspace")}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

export default LandingNavbar;
