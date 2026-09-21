"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X, ArrowRight } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { LanguageSelector } from "../LanguageSelector";

interface LandingNavbarProps {
  onRequestDemo: () => void;
}

export function LandingNavbar({ onRequestDemo }: LandingNavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [entered, setEntered] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    const t = setTimeout(() => setEntered(true), 150);
    return () => clearTimeout(t);
  }, []);

  const navLinks = [
    { label: "Product", href: "#product" },
    { label: "How It Works", href: "#how-it-works" },
    { label: "Standards", href: "#standards" },
    { label: "Intelligence", href: "#intelligence" },
  ];

  return (
    <header
      className="sticky top-0 z-50 w-full border-b border-white/[0.08] bg-[#06080A]/85 backdrop-blur-xl transition-all duration-300"
      style={{
        opacity: entered ? 1 : 0,
        transform: entered ? "translateY(0)" : "translateY(-10px)",
        transition: "opacity 0.6s 0.15s ease, transform 0.6s 0.15s cubic-bezier(0.16,1,0.3,1)",
      }}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-b from-[#151A1F] to-[#0A0D10] border border-white/15 text-white font-bold text-xs shadow-lg transition-all duration-200 group-hover:scale-105 group-hover:border-blue-500/40 group-hover:shadow-[0_0_12px_rgba(59,130,246,0.2)]">
              <span className="font-mono tracking-tight text-slate-100">CW</span>
              <span className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
            </div>

            <div className="flex items-center gap-2">
              <span className="font-sans text-sm font-semibold tracking-tight text-white/95 group-hover:text-white transition-colors duration-200">
                {t("common.appName")}
              </span>
              <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-mono font-medium bg-white/[0.06] text-amber-300/90 border border-amber-400/20">
                BIS
              </span>
            </div>
          </Link>

          {/* Development Status Pill */}
          <div className="hidden xl:inline-flex items-center gap-2 rounded-full bg-white/[0.04] border border-white/[0.08] px-3 py-1 text-[11px] font-medium text-slate-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.7)] animate-pulse" />
            <span>{t("header.problemStatement")}</span>
          </div>
        </div>

        {/* Center Nav Links (Desktop) */}
        <nav className="hidden md:flex items-center gap-8 text-xs font-medium text-slate-300">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="relative py-1 text-slate-300/85 hover:text-white transition-colors duration-200 after:absolute after:bottom-0 after:left-0 after:h-px after:w-0 after:bg-blue-400/70 after:transition-all after:duration-200 hover:after:w-full"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Right CTA Actions */}
        <div className="hidden sm:flex items-center gap-3">
          <LanguageSelector compact={true} dark={true} />

          <Link
            href="/auth/signin"
            className="text-xs font-medium text-slate-300/90 hover:text-white px-3 py-1.5 rounded-lg hover:bg-white/[0.05] transition-all duration-200 hover:scale-[1.01]"
          >
            {t("navigation.signIn")}
          </Link>

          <Link
            href="/dashboard"
            className="btn-shimmer relative inline-flex items-center gap-1.5 rounded-full bg-white hover:bg-slate-100 text-[#06080A] px-4 py-1.5 text-xs font-semibold shadow-[0_2px_12px_rgba(255,255,255,0.15)] transition-all duration-200 hover:scale-[1.03] hover:-translate-y-px active:scale-[0.98]"
          >
            <span>{t("header.exploreWorkspace")}</span>
            <ArrowRight className="h-3.5 w-3.5 text-[#06080A]" />
          </Link>
        </div>

        {/* Mobile Hamburger Toggle */}
        <div className="md:hidden flex items-center gap-2">
          <LanguageSelector compact={true} dark={true} />
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            type="button"
            aria-label="Toggle navigation menu"
            className="p-1.5 text-slate-300 hover:text-white rounded-lg border border-white/10 bg-white/[0.05] cursor-pointer transition-colors duration-150"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-white/[0.08] bg-[#0A0D10]/95 backdrop-blur-2xl px-5 py-4 space-y-3 text-xs animate-reveal-up">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-slate-300 font-medium hover:text-white border-b border-white/[0.04] transition-colors duration-150"
            >
              {link.label}
            </a>
          ))}
          <div className="pt-3 flex items-center justify-between gap-3">
            <Link
              href="/auth/signin"
              className="font-medium text-slate-300 hover:text-white py-1.5 px-3 rounded-md hover:bg-white/[0.05] transition-colors"
            >
              {t("navigation.signIn")}
            </Link>
            <Link
              href="/dashboard"
              className="rounded-full bg-white text-[#06080A] px-4 py-2 font-semibold text-xs inline-flex items-center gap-1.5 shadow-md"
            >
              <span>{t("header.exploreWorkspace")}</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

export default LandingNavbar;
