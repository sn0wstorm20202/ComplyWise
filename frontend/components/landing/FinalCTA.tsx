"use client";

import React from "react";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";

interface FinalCTAProps {
  onRequestDemo: () => void;
}

export function FinalCTA({ onRequestDemo }: FinalCTAProps) {
  return (
    <section className="py-20 md:py-28 bg-cw-cream text-cw-charcoal relative border-t border-cw-parchment overflow-hidden">
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6"
      >
        <div className="inline-flex items-center gap-2 rounded-full bg-cw-parchment/60 border border-cw-sage/30 px-4 py-1.5 text-xs text-cw-forest">
          <span className="h-1.5 w-1.5 rounded-full bg-cw-terracotta animate-pulse" />
          <span>BIS Compliance Intelligence Platform</span>
        </div>

        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-medium tracking-tight text-cw-charcoal max-w-2xl mx-auto leading-tight font-serif">
          Compliance is easier when the right information is connected.
        </h2>

        <p className="text-sm sm:text-base text-cw-forest/80 max-w-xl mx-auto leading-relaxed font-sans">
          ComplyWise brings standards, requirements, documents and regulatory intelligence into one calm, operational workspace.
        </p>

        <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={onRequestDemo}
            type="button"
            className="inline-flex items-center gap-2 rounded-xl bg-cw-terracotta hover:bg-cw-clay text-white px-7 py-3.5 text-xs sm:text-sm font-semibold shadow-[0_4px_14px_0_rgba(216,121,76,0.39)] hover:shadow-[0_6px_20px_rgba(216,121,76,0.23)] hover:-translate-y-0.5 transition-all cursor-pointer"
          >
            <span>Request a Demo</span>
            <ArrowRight className="h-4 w-4 text-white" />
          </button>

          <a
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-xl border border-cw-sage-deep/30 bg-cw-cream hover:bg-cw-parchment/40 text-cw-forest px-7 py-3.5 text-xs sm:text-sm font-medium transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5"
          >
            <span>Launch Live Dashboard</span>
          </a>
        </div>

        <p className="text-[11px] text-cw-sage-deep pt-4 font-mono">
          Welcoming select industrial manufacturing and conformity testing teams for early evaluation.
        </p>
      </motion.div>
    </section>
  );
}

export default FinalCTA;
