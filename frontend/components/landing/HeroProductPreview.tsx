"use client";

import React from "react";
import Link from "next/link";
import {
  Shield,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  Search,
  ExternalLink,
  Layers,
  ChevronRight,
  Lock,
} from "lucide-react";

export function HeroProductPreview() {
  return (
    <div className="relative mx-auto max-w-5xl rounded-2xl border border-cw-parchment bg-cw-cream shadow-[0_20px_40px_-15px_rgba(29,33,29,0.15)] overflow-hidden transition-all group">
      {/* Browser Window Chrome */}
      <div className="flex items-center justify-between border-b border-cw-parchment bg-cw-parchment/40 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full bg-cw-sage-deep/50" />
          <div className="h-2.5 w-2.5 rounded-full bg-cw-sage-deep/50" />
          <div className="h-2.5 w-2.5 rounded-full bg-cw-sage-deep/50" />
        </div>

        {/* Browser URL Bar */}
        <div className="flex items-center gap-1.5 rounded-md border border-cw-parchment bg-cw-cream px-3 py-1 text-[11px] font-mono text-cw-forest/70 max-w-md w-full mx-4 shadow-sm">
          <Lock className="h-3 w-3 text-cw-sage-deep shrink-0" />
          <span className="text-cw-sage-deep">https://</span>
          <span className="text-cw-forest font-medium">app.complywise.in</span>
          <span className="text-cw-sage-deep">/dashboard</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden sm:inline-flex items-center gap-1 rounded bg-cw-parchment/60 px-2 py-0.5 text-[10px] font-medium text-cw-forest/80 border border-cw-sage/30">
            Platform Artifact · Active Build
          </span>
          <Link
            href="/dashboard"
            className="text-[11px] font-semibold text-cw-forest hover:text-cw-terracotta transition-colors inline-flex items-center gap-1"
          >
            <span>Open Workspace</span>
            <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
      </div>

      {/* Simulated Application Surface */}
      <div className="p-4 sm:p-6 bg-cw-cream/30 space-y-4 text-xs select-none">
        {/* Workspace Mini-Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-cw-cream p-3.5 rounded-xl border border-cw-parchment shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-cw-forest text-cw-cream font-serif font-bold text-xs flex items-center justify-center border border-cw-sage-deep/30">
              CW
            </div>
            <div>
              <div className="font-bold text-cw-charcoal text-xs flex items-center gap-1.5 font-serif">
                <span>Apex Industrial Electro-Mechanicals Ltd.</span>
                <span className="font-mono text-[10px] text-cw-forest/70 bg-cw-parchment/60 px-1.5 rounded border border-cw-sage/30">
                  CM/L-8492019
                </span>
              </div>
              <p className="text-[10px] text-cw-forest/80">
                Deterministic Regulatory Matrix · 18 Applicable Standards Evaluated
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] text-cw-forest/70 bg-cw-parchment/60 px-2 py-1 rounded border border-cw-sage/30">
              Surveillance: 14 Jun 2026 (96d)
            </span>
          </div>
        </div>

        {/* Primary Health Module Simulation */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* Health Index Card */}
          <div className="md:col-span-7 bg-cw-cream p-4 rounded-xl border border-cw-parchment shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-cw-charcoal text-xs font-serif">Compliance Health Index</span>
              <span className="text-[10px] font-bold text-cw-forest bg-cw-sage/20 px-2 py-0.5 rounded border border-cw-sage">
                82% Good Standing
              </span>
            </div>

            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full border-4 border-cw-forest border-t-cw-sage-deep flex items-center justify-center font-bold text-cw-charcoal text-base font-serif">
                82%
              </div>
              <div className="space-y-1 text-[11px] text-cw-forest/90">
                <div>
                  <span className="font-bold text-cw-charcoal">15 of 18 Mandates</span> in full conformance.
                </div>
                <div className="text-[10px] text-cw-forest/70">
                  3 obligations require documentation renewal before surveillance audit.
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-1 border-t border-cw-parchment text-[10px]">
              <div className="p-1.5 rounded bg-cw-parchment/40 border border-cw-sage/30 text-center">
                <span className="text-cw-sage-deep block font-semibold">APPLICABLE</span>
                <span className="font-bold text-cw-charcoal text-xs">18</span>
              </div>
              <div className="p-1.5 rounded bg-cw-clay/10 border border-cw-clay/30 text-center text-cw-terracotta">
                <span className="text-cw-clay block font-semibold">ACTION REQ.</span>
                <span className="font-bold text-xs">3</span>
              </div>
              <div className="p-1.5 rounded bg-cw-parchment/40 border border-cw-sage/30 text-center">
                <span className="text-cw-sage-deep block font-semibold">DOCUMENTS</span>
                <span className="font-bold text-cw-charcoal text-xs">11</span>
              </div>
            </div>
          </div>

          {/* Upcoming Deadlines Mini Preview */}
          <div className="md:col-span-5 bg-cw-cream p-4 rounded-xl border border-cw-parchment shadow-sm space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-cw-charcoal text-xs font-serif">Upcoming Deadlines</span>
              <span className="text-[10px] text-cw-sage-deep font-mono">4 Total</span>
            </div>

            <div className="space-y-1.5">
              <div className="p-2 rounded-lg bg-cw-parchment/40 border border-cw-sage/30 flex items-center justify-between text-[11px]">
                <div className="min-w-0">
                  <div className="font-bold text-cw-charcoal truncate font-serif">IS 1293 Type-Test Renewal</div>
                  <div className="text-[10px] text-cw-forest/70 font-mono">BIS Scheme I</div>
                </div>
                <span className="font-bold text-cw-terracotta bg-cw-terracotta/10 border border-cw-terracotta/30 px-1.5 py-0.5 rounded text-[10px]">
                  14d left
                </span>
              </div>

              <div className="p-2 rounded-lg bg-cw-parchment/40 border border-cw-sage/30 flex items-center justify-between text-[11px]">
                <div className="min-w-0">
                  <div className="font-bold text-cw-charcoal truncate font-serif">QCO S.O. 1421(E) Dossier</div>
                  <div className="text-[10px] text-cw-forest/70 font-mono">DPIIT Mandate</div>
                </div>
                <span className="font-bold text-cw-clay bg-cw-clay/10 border border-cw-clay/30 px-1.5 py-0.5 rounded text-[10px]">
                  28d left
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* BIS Agent Bar Preview */}
        <div className="bg-cw-cream p-3 rounded-xl border border-cw-parchment shadow-sm flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-cw-sage-deep text-xs flex-1">
            <Search className="h-3.5 w-3.5 text-cw-sage-deep" />
            <span className="text-cw-forest/80 italic font-serif">
              Ask BIS Agent: &quot;Which clause covers calibration accuracy under IS 3055:2024?&quot;
            </span>
          </div>
          <span className="text-[10px] font-bold text-cw-forest bg-cw-sage/20 px-2 py-0.5 rounded border border-cw-sage">
            Source-Grounded Retrieval
          </span>
        </div>
      </div>

      {/* Floating Hover CTA Badge */}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-cw-cream via-cw-cream/80 to-transparent py-4 text-center pointer-events-none">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 rounded-full bg-cw-terracotta text-white px-4 py-1.5 text-xs font-semibold shadow-md pointer-events-auto hover:bg-cw-clay transition-all hover:-translate-y-0.5"
        >
          <span>Launch Interactive Platform Demo</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}

export default HeroProductPreview;
