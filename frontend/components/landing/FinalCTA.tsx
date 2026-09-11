"use client";

import React from "react";
import { ArrowRight, ShieldCheck } from "lucide-react";

interface FinalCTAProps {
  onRequestDemo: () => void;
}

export function FinalCTA({ onRequestDemo }: FinalCTAProps) {
  return (
    <section className="py-20 md:py-28 bg-white text-[#0F172A] relative border-t border-[#E2E8F0]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
        <div className="inline-flex items-center gap-2 rounded-full bg-[#F8FAFC] border border-[#E2E8F0] px-4 py-1 text-xs text-[#64748B]">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          <span>BIS Compliance Intelligence Platform</span>
        </div>

        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#0F172A] max-w-2xl mx-auto leading-tight font-sans">
          Compliance is easier when the right information is connected.
        </h2>

        <p className="text-sm sm:text-base text-[#64748B] max-w-xl mx-auto leading-relaxed font-sans">
          ComplyWise brings standards, requirements, documents and regulatory intelligence into one calm, operational workspace.
        </p>

        <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={onRequestDemo}
            type="button"
            className="inline-flex items-center gap-2 rounded-xl bg-[#0F172A] hover:bg-slate-800 text-white px-7 py-3 text-xs sm:text-sm font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <span>Request a Demo</span>
            <ArrowRight className="h-4 w-4 text-white" />
          </button>

          <a
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-xl border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] text-[#0F172A] px-7 py-3 text-xs sm:text-sm font-semibold transition-colors shadow-2xs"
          >
            <span>Launch Live Dashboard</span>
          </a>
        </div>

        <p className="text-[11px] text-[#94A3B8] pt-2 font-mono">
          Welcoming select industrial manufacturing and conformity testing teams for early evaluation.
        </p>
      </div>
    </section>
  );
}

export default FinalCTA;
