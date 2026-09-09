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
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-xs">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white font-bold text-sm shadow-xs transition-transform group-hover:scale-102">
              CW
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold tracking-tight text-slate-950">
                ComplyWise
              </span>
              <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                BIS
              </span>
            </div>
          </Link>

          {/* Subtle Development Status Signal */}
          <div className="hidden xl:inline-flex items-center gap-1.5 rounded-full bg-stone-50 border border-stone-200 px-2.5 py-0.5 text-[11px] font-medium text-stone-600">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
            <span>Platform in active development</span>
          </div>
        </div>

        {/* Center Nav Links (Desktop) */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-slate-600">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="hover:text-slate-950 transition-colors"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Right CTA Actions */}
        <div className="hidden sm:flex items-center gap-3">
          <Link
            href="/auth/signin"
            className="text-xs font-semibold text-slate-600 hover:text-slate-950 px-2.5 py-1.5 transition-colors"
          >
            Sign In
          </Link>

          <button
            onClick={onRequestDemo}
            type="button"
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-900 hover:bg-blue-950 text-white px-3.5 py-1.5 text-xs font-semibold shadow-xs transition-colors"
          >
            <span>Request Demo</span>
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>

        {/* Mobile Hamburger Toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          type="button"
          aria-label="Toggle navigation menu"
          className="md:hidden p-1.5 text-slate-600 hover:text-slate-900 rounded-md"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 bg-white px-4 py-3 space-y-2 text-xs">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-slate-700 font-medium hover:text-blue-900"
            >
              {link.label}
            </a>
          ))}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <Link
              href="/auth/signin"
              className="font-semibold text-slate-700"
            >
              Sign In
            </Link>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onRequestDemo();
              }}
              className="rounded-lg bg-blue-900 text-white px-3.5 py-1.5 font-semibold"
            >
              Request Demo
            </button>
          </div>
        </div>
      )}
    </header>
  );
}

export default LandingNavbar;
