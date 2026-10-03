"use client";

import React from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { useFadeUp, useStaggerFadeUp } from "./motion/useScrollAnimations";

export function PlatformOverviewSection() {
  const headerRef = useFadeUp({ duration: 0.9 });
  const statsRef = useStaggerFadeUp({ stagger: 0.1, duration: 0.7 });

  return (
    <section className="py-28 md:py-40 bg-[#FAFAFA] border-b border-slate-200/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center space-y-7">
          <div ref={headerRef}>
            <div className="inline-flex items-center gap-2 rounded-full px-3.5 py-1 text-[10px] font-mono uppercase tracking-[0.2em] font-medium bg-slate-900/[0.04] border border-slate-900/[0.06] text-slate-600 mb-5">
              Operational Workspace
            </div>

            <h2 className="text-[clamp(1.8rem,4vw,3.5rem)] font-extrabold tracking-[-0.02em] text-[#0F172A] leading-[1.1] font-sans mb-4">
              One connected workspace for your compliance picture.
            </h2>

            <p className="text-sm sm:text-base text-slate-500 leading-relaxed font-sans max-w-2xl mx-auto mb-6">
              Requirements, deadlines, documents, standards, and regulatory updates unified into a single operational interface.
            </p>

            <Link
              href="/dashboard"
              className="group inline-flex items-center gap-3 rounded-full bg-[#0F172A] hover:bg-slate-800 text-white pl-7 pr-2.5 py-3 text-sm font-medium shadow-lg shadow-slate-900/10 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.97]"
            >
              <span>Launch Workspace</span>
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-white transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-1 group-hover:-translate-y-[1px] group-hover:scale-105">
                <ArrowUpRight className="h-4 w-4" strokeWidth={1.5} />
              </span>
            </Link>
          </div>

          {/* Stats Grid */}
          <div ref={statsRef} className="pt-10 grid grid-cols-2 sm:grid-cols-4 gap-5 max-w-3xl mx-auto">
            {[
              { value: "26", label: "Curated Rules" },
              { value: "8", label: "Knowledge Packs" },
              { value: "24", label: "Verified Sources" },
              { value: "5", label: "Golden Fixtures" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="group p-5 rounded-2xl bg-white border border-slate-200/60 shadow-2xs hover:shadow-md hover:border-slate-300/70 transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] text-center"
              >
                <div className="text-3xl font-bold text-slate-900 font-mono tracking-tight">
                  {stat.value}
                </div>
                <div className="text-[11px] text-slate-500 mt-1 font-sans">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default PlatformOverviewSection;
