"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, ChevronRight, CheckCircle2, Shield, Layers } from "lucide-react";
import HeroProductPreview from "./HeroProductPreview";

export function PlatformOverviewSection() {
  return (
    <section className="py-20 md:py-28 bg-[#fcfcfb] border-b border-stone-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Header Copy */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="text-[11px] font-bold text-stone-500 uppercase tracking-widest">
            Operational Workspace
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-stone-950">
            One place for your compliance picture.
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
            Requirements, deadlines, documents, standards, and regulatory updates unified into a single operational interface.
          </p>

          <div className="pt-2">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-lg bg-stone-900 hover:bg-stone-800 text-white px-5 py-2.5 text-xs sm:text-sm font-semibold shadow-xs transition-colors"
            >
              <span>Explore Workspace</span>
              <ChevronRight className="h-4 w-4 text-stone-300" />
            </Link>
          </div>
        </div>

        {/* Browser Frame Preview */}
        <div className="pt-4">
          <HeroProductPreview />
        </div>
      </div>
    </section>
  );
}

export default PlatformOverviewSection;
