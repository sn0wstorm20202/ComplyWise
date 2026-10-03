"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { LanguageSelector } from "../LanguageSelector";

interface LandingNavbarProps {
  onRequestDemo: () => void;
}

export function LandingNavbar({ onRequestDemo }: LandingNavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      {/* Floating Glass Pill — detached from top */}
      <header
        className={`fixed top-5 left-1/2 -translate-x-1/2 z-50 transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] ${
          scrolled
            ? "w-[88%] max-w-xl shadow-[0_8px_32px_rgba(15,23,42,0.08)]"
            : "w-[92%] max-w-md shadow-[0_4px_20px_rgba(15,23,42,0.04)]"
        }`}
      >
        <div
          className={`rounded-full backdrop-blur-2xl border transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] px-3 sm:px-5 py-2 flex items-center justify-between ${
            scrolled
              ? "bg-white/90 border-slate-200/80"
              : "bg-white/80 border-slate-200/50"
          }`}
        >
          {/* Brand */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#0F172A] text-white font-mono font-semibold text-[10px] tracking-wider transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-110">
              CW
            </div>
            <span className="font-sans text-[13px] font-semibold tracking-tight text-[#0F172A] hidden sm:inline">
              {t("common.appName")}
            </span>
          </Link>

          {/* Right: Sign In + CTA */}
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            <LanguageSelector compact={true} />

            <Link
              href="/auth/signin"
              className="text-[11px] sm:text-xs font-medium text-slate-500 hover:text-[#0F172A] px-2 py-1 transition-colors duration-300"
            >
              {t("navigation.signIn")}
            </Link>

            {/* Island Button-in-Button CTA */}
            <Link
              href="/dashboard"
              className="group inline-flex items-center gap-1.5 rounded-full bg-[#0F172A] hover:bg-slate-800 text-white pl-3.5 pr-1.5 py-1.5 text-[11px] sm:text-xs font-medium shadow-sm transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.97]"
            >
              <span>{t("header.exploreWorkspace")}</span>
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/15 text-white transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5 group-hover:-translate-y-[1px] group-hover:scale-105">
                <ArrowUpRight className="h-3 w-3" strokeWidth={1.5} />
              </span>
            </Link>
          </div>
        </div>
      </header>

      {/* Mobile menu is unnecessary with this minimal nav */}
    </>
  );
}

export default LandingNavbar;
