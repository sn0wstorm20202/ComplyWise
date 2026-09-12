"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, ChevronRight, ShieldCheck } from "lucide-react";
import HeroProductPreview from "./HeroProductPreview";

interface HeroSectionProps {
  onRequestDemo: () => void;
}

export function HeroSection({ onRequestDemo }: HeroSectionProps) {
  return (
    <section className="relative pt-12 pb-16 md:pt-20 md:pb-24 overflow-hidden bg-gradient-to-b from-white via-[#F8FAFC] to-[#F8FAFC]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Editorial Hero Content */}
        <div className="text-center max-w-3xl mx-auto space-y-6">
          {/* Subtle announcement / Evolution signal */}
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#E2E8F0] bg-white px-4 py-1 text-xs text-[#64748B] shadow-2xs transition-all hover:bg-slate-50">
              <span className="font-semibold text-[#0F172A] flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                ComplyWise Platform
              </span>
              <span className="text-[#CBD5E1]">·</span>
              <span className="text-[#64748B] hidden sm:inline">
                Deterministic compliance intelligence and connected workflows for Indian manufacturing.
              </span>
              <span className="text-[#64748B] sm:hidden">
                Active build
              </span>
            </div>
          </div>

          {/* Eyebrow */}
          <div className="text-[11px] font-bold tracking-widest text-[#64748B] uppercase font-mono">
            BIS COMPLIANCE INTELLIGENCE
          </div>

          {/* Main Headline & Secondary Line */}
          <div className="space-y-3">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#0F172A] leading-[1.1] font-sans">
              Stay ahead of compliance.
            </h1>
            <p className="text-xl sm:text-3xl lg:text-4xl font-semibold text-[#475569] tracking-tight font-sans">
              Understand what applies. Act with confidence.
            </p>
          </div>

          {/* Supporting Paragraph */}
          <p className="text-sm sm:text-base text-[#64748B] leading-relaxed max-w-2xl mx-auto font-normal font-sans">
            ComplyWise unifies BIS standards, statutory requirements, laboratory dossiers, and regulatory gazettes into one calm, connected operational workspace.
          </p>

          {/* Actions */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
            <a
              href="#how-it-works"
              className="inline-flex items-center gap-2 rounded-xl bg-[#0F172A] hover:bg-slate-800 text-white px-6 py-3 text-xs sm:text-sm font-semibold shadow-xs transition-colors"
            >
              <span>Explore Architecture</span>
              <ArrowRight className="h-4 w-4" />
            </a>

            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-xl border border-[#E2E8F0] bg-white hover:bg-slate-50 text-[#0F172A] px-6 py-3 text-xs sm:text-sm font-semibold transition-colors shadow-2xs"
            >
              <span>Launch Live Dashboard</span>
              <ChevronRight className="h-4 w-4 text-[#64748B]" />
            </Link>
          </div>
        </div>

        {/* Hero Product Preview */}
        <div id="product" className="mt-14 sm:mt-20">
          <HeroProductPreview />
        </div>
      </div>
    </section>
  );
}

export default HeroSection;
