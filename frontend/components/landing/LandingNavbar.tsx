"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Shield, Menu, X, ArrowRight } from "lucide-react";

interface LandingNavbarProps {
  onRequestDemo: () => void;
}

export function LandingNavbar({ onRequestDemo }: LandingNavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: "Product", href: "#product" },
    { label: "How It Works", href: "#how-it-works" },
    { label: "Standards", href: "#standards" },
    { label: "Intelligence", href: "#intelligence" },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#1c1d22] bg-[#08080a]/95 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#cc9166] text-black font-bold text-xs shadow-md transition-transform group-hover:scale-105">
              CW
            </div>
            <div className="flex items-center gap-2">
              <span className="font-serif text-sm font-semibold tracking-wide text-[#ffffff]">
                ComplyWise
              </span>
              <span className="inline-flex items-center rounded-full px-2 py-0.2 text-[10px] font-mono font-medium bg-[#121317] text-[#cc9166] border border-[#cc9166]/30">
                BIS
              </span>
            </div>
          </Link>

          {/* Subtle Development Status Signal */}
          <div className="hidden xl:inline-flex items-center gap-2 rounded-full bg-[#121317] border border-[#1c1d22] px-3 py-0.5 text-[11px] font-medium text-[#9194a1]">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Problem Statement 26130 · Active Build</span>
          </div>
        </div>

        {/* Center Nav Links (Desktop) */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-[#9194a1]">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="hover:text-[#ffffff] transition-colors"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Right CTA Actions */}
        <div className="hidden sm:flex items-center gap-3">
          <Link
            href="/auth/signin"
            className="text-xs font-medium text-[#9194a1] hover:text-[#ffffff] px-3 py-1.5 transition-colors"
          >
            Sign In
          </Link>

          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 rounded-full bg-[#ffffff] hover:bg-[#e2e3e9] text-[#08080a] px-4 py-1.5 text-xs font-semibold shadow-md transition-all"
          >
            <span>Live Dashboard</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {/* Mobile Hamburger Toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          type="button"
          aria-label="Toggle navigation menu"
          className="md:hidden p-1.5 text-[#9194a1] hover:text-[#ffffff] rounded-md"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-[#1c1d22] bg-[#040406] px-4 py-3 space-y-2 text-xs">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-[#9194a1] font-medium hover:text-[#ffffff]"
            >
              {link.label}
            </a>
          ))}
          <div className="pt-2 border-t border-[#1c1d22] flex items-center justify-between">
            <Link
              href="/auth/signin"
              className="font-semibold text-[#9194a1]"
            >
              Sign In
            </Link>
            <Link
              href="/dashboard"
              className="rounded-full bg-[#ffffff] text-[#08080a] px-4 py-1.5 font-semibold text-xs"
            >
              Live Dashboard
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

export default LandingNavbar;
