"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Menu, X, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
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
    <motion.header 
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="sticky top-0 z-40 w-full border-b border-cw-parchment bg-cw-cream/95 backdrop-blur-md shadow-[0_4px_20px_-10px_rgba(29,33,29,0.05)]"
    >
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cw-forest text-cw-cream font-serif font-bold text-xs shadow-sm transition-transform group-hover:scale-105 border border-cw-sage-deep/30">
              CW
            </div>
            <div className="flex items-center gap-2">
              <span className="font-serif text-base font-bold tracking-tight text-cw-charcoal">
                {t("common.appName")}
              </span>
              <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-mono font-medium bg-cw-parchment/50 text-cw-forest border border-cw-sage/30">
                BIS
              </span>
            </div>
          </Link>

          {/* Subtle Development Status Signal */}
          <div className="hidden xl:inline-flex items-center gap-2 rounded-full bg-cw-parchment/30 border border-cw-parchment px-3 py-0.5 text-[11px] font-medium text-cw-forest">
            <span className="h-1.5 w-1.5 rounded-full bg-cw-terracotta animate-pulse" />
            <span>{t("header.problemStatement")}</span>
          </div>
        </div>

        {/* Center Nav Links (Desktop) */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-cw-forest/80">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="hover:text-cw-charcoal transition-colors relative after:absolute after:-bottom-1 after:left-0 after:h-[1px] after:w-0 after:bg-cw-terracotta after:transition-all hover:after:w-full"
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
            className="text-xs font-medium text-cw-forest hover:text-cw-charcoal px-2.5 py-1.5 transition-colors"
          >
            {t("navigation.signIn")}
          </Link>

          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 rounded-full bg-cw-terracotta hover:bg-cw-clay text-white px-4 py-1.5 text-xs font-medium shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
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
            className="p-1.5 text-cw-forest hover:text-cw-charcoal rounded-md cursor-pointer"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown */}
      {mobileMenuOpen && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="md:hidden border-b border-cw-parchment bg-cw-cream px-4 py-3 space-y-2 text-xs"
        >
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-cw-forest font-medium hover:text-cw-charcoal"
            >
              {link.label}
            </a>
          ))}
          <div className="pt-2 border-t border-cw-parchment flex items-center justify-between">
            <Link
              href="/auth/signin"
              className="font-medium text-cw-forest hover:text-cw-charcoal"
            >
              {t("navigation.signIn")}
            </Link>
            <Link
              href="/dashboard"
              className="rounded-full bg-cw-terracotta text-white px-4 py-1.5 font-medium text-xs shadow-sm"
            >
              {t("header.exploreWorkspace")}
            </Link>
          </div>
        </motion.div>
      )}
    </motion.header>
  );
}

export default LandingNavbar;
