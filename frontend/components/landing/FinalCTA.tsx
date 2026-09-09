"use client";

import React from "react";
import { ArrowRight, ShieldCheck } from "lucide-react";

interface FinalCTAProps {
  onRequestDemo: () => void;
}

export function FinalCTA({ onRequestDemo }: FinalCTAProps) {
  return (
    <section className="py-20 md:py-24 bg-[#18181b] text-white relative border-t border-stone-800">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
        <div className="inline-flex items-center gap-2 rounded-full bg-stone-900 border border-stone-800 px-3 py-1 text-xs text-stone-300">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
          <span>BIS Compliance Intelligence Platform</span>
        </div>

        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white max-w-2xl mx-auto leading-snug">
          Compliance is easier when the right information is connected.
        </h2>

        <p className="text-xs sm:text-sm text-stone-400 max-w-xl mx-auto leading-relaxed">
          ComplyWise brings standards, requirements, documents and regulatory intelligence into one place.
        </p>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={onRequestDemo}
            type="button"
            className="inline-flex items-center gap-2 rounded-lg bg-white hover:bg-stone-100 text-stone-950 px-6 py-3 text-xs sm:text-sm font-semibold shadow-xs transition-colors"
          >
            <span>Request a Demo</span>
            <ArrowRight className="h-4 w-4 text-stone-950" />
          </button>
        </div>

        <p className="text-[11px] text-stone-500 pt-2 font-mono">
          Welcoming select industrial manufacturing and conformity testing teams for early evaluation.
        </p>
      </div>
    </section>
  );
}

export default FinalCTA;
