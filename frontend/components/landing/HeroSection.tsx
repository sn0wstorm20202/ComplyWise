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
    <section className="relative pt-10 pb-16 md:pt-16 md:pb-24 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Editorial Hero Content */}
        <div className="text-center max-w-3xl mx-auto space-y-6">
          {/* Subtle announcement / Evolution signal */}
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-stone-50/80 px-3.5 py-1 text-xs text-stone-700 shadow-2xs transition-all hover:bg-stone-100/80">
              <span className="font-semibold text-stone-950 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-700" />
                ComplyWise is evolving
              </span>
              <span className="text-stone-300">·</span>
              <span className="text-stone-600 hidden sm:inline">
                More compliance intelligence, workflows and connected capabilities are being added as we build the platform.
              </span>
              <span className="text-stone-600 sm:hidden">
                Active development
              </span>
            </div>
          </div>

          {/* Eyebrow */}
          <div className="text-[11px] font-bold tracking-widest text-stone-500 uppercase">
            BIS COMPLIANCE INTELLIGENCE
          </div>

          {/* Main Headline & Secondary Line */}
          <div className="space-y-2">
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-stone-950 leading-[1.1]">
              Stay ahead of compliance.
            </h1>
            <p className="text-xl sm:text-3xl lg:text-4xl font-semibold text-stone-600 tracking-tight">
              Understand what applies. Act with confidence.
            </p>
          </div>

          {/* Supporting Paragraph */}
          <p className="text-sm sm:text-base text-stone-600 leading-relaxed max-w-2xl mx-auto font-normal">
            ComplyWise brings BIS standards, requirements, documents and regulatory intelligence into one connected workspace.
          </p>

          {/* Actions */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <a
              href="#how-it-works"
              className="inline-flex items-center gap-2 rounded-lg bg-stone-900 hover:bg-stone-800 text-white px-5 py-2.5 text-xs sm:text-sm font-semibold shadow-xs transition-colors"
            >
              <span>Explore ComplyWise</span>
              <ArrowRight className="h-4 w-4" />
            </a>

            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-lg border border-stone-300 bg-white hover:bg-stone-50 text-stone-800 px-5 py-2.5 text-xs sm:text-sm font-semibold transition-colors shadow-2xs"
            >
              <span>View Platform</span>
              <ChevronRight className="h-4 w-4 text-stone-400" />
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
