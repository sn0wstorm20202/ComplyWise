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
    <div className="relative mx-auto max-w-5xl rounded-2xl border border-slate-200/90 bg-white shadow-xl overflow-hidden transition-all group">
      {/* Browser Window Chrome */}
      <div className="flex items-center justify-between border-b border-slate-200/80 bg-slate-50/90 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full bg-slate-300" />
          <div className="h-2.5 w-2.5 rounded-full bg-slate-300" />
          <div className="h-2.5 w-2.5 rounded-full bg-slate-300" />
        </div>

        {/* Browser URL Bar */}
        <div className="flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1 text-[11px] font-mono text-slate-500 max-w-md w-full mx-4 shadow-2xs">
          <Lock className="h-3 w-3 text-slate-400 shrink-0" />
          <span className="text-slate-400">https://</span>
          <span className="text-slate-900 font-medium">app.complywise.in</span>
          <span className="text-slate-400">/dashboard</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden sm:inline-flex items-center gap-1 rounded bg-stone-100 px-2 py-0.5 text-[10px] font-medium text-stone-600 border border-stone-200">
            Platform Artifact · Active Build
          </span>
          <Link
            href="/dashboard"
            className="text-[11px] font-semibold text-blue-900 hover:text-blue-950 inline-flex items-center gap-1"
          >
            <span>Open Workspace</span>
            <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
      </div>

      {/* Simulated Application Surface */}
      <div className="p-4 sm:p-6 bg-slate-50/50 space-y-4 text-xs select-none">
        {/* Workspace Mini-Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-slate-900 text-white font-bold text-xs flex items-center justify-center">
              CW
            </div>
            <div>
              <div className="font-bold text-slate-950 text-xs flex items-center gap-1.5">
                <span>Apex Industrial Electro-Mechanicals Ltd.</span>
                <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-1 rounded">
                  CM/L-8492019
                </span>
              </div>
              <p className="text-[10px] text-slate-500">
                Deterministic Regulatory Matrix · 18 Applicable Standards Evaluated
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-2 py-1 rounded border border-slate-200">
              Surveillance: 14 Jun 2026 (96d)
            </span>
          </div>
        </div>

        {/* Primary Health Module Simulation */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* Health Index Card */}
          <div className="md:col-span-7 bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 text-xs">Compliance Health Index</span>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                82% Good Standing
              </span>
            </div>

            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full border-4 border-blue-900 border-t-blue-200 flex items-center justify-center font-bold text-slate-950 text-base">
                82%
              </div>
              <div className="space-y-1 text-[11px] text-slate-600">
                <div>
                  <span className="font-bold text-slate-900">15 of 18 Mandates</span> in full conformance.
                </div>
                <div className="text-[10px] text-slate-500">
                  3 obligations require documentation renewal before surveillance audit.
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-100 text-[10px]">
              <div className="p-1.5 rounded bg-slate-50 border border-slate-200 text-center">
                <span className="text-slate-400 block font-semibold">APPLICABLE</span>
                <span className="font-bold text-slate-900 text-xs">18</span>
              </div>
              <div className="p-1.5 rounded bg-amber-50 border border-amber-200 text-center text-amber-900">
                <span className="text-amber-600 block font-semibold">ACTION REQ.</span>
                <span className="font-bold text-xs">3</span>
              </div>
              <div className="p-1.5 rounded bg-slate-50 border border-slate-200 text-center">
                <span className="text-slate-400 block font-semibold">DOCUMENTS</span>
                <span className="font-bold text-slate-900 text-xs">11</span>
              </div>
            </div>
          </div>

          {/* Upcoming Deadlines Mini Preview */}
          <div className="md:col-span-5 bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 text-xs">Upcoming Deadlines</span>
              <span className="text-[10px] text-slate-400 font-mono">4 Total</span>
            </div>

            <div className="space-y-1.5">
              <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-[11px]">
                <div className="min-w-0">
                  <div className="font-bold text-slate-900 truncate">IS 1293 Type-Test Renewal</div>
                  <div className="text-[10px] text-slate-500 font-mono">BIS Scheme I</div>
                </div>
                <span className="font-bold text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded text-[10px]">
                  14d left
                </span>
              </div>

              <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-[11px]">
                <div className="min-w-0">
                  <div className="font-bold text-slate-900 truncate">QCO S.O. 1421(E) Dossier</div>
                  <div className="text-[10px] text-slate-500 font-mono">DPIIT Mandate</div>
                </div>
                <span className="font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded text-[10px]">
                  28d left
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* BIS Agent Bar Preview */}
        <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-slate-400 text-xs flex-1">
            <Search className="h-3.5 w-3.5 text-slate-400" />
            <span className="text-slate-500 italic">
              Ask BIS Agent: &quot;Which clause covers calibration accuracy under IS 3055:2024?&quot;
            </span>
          </div>
          <span className="text-[10px] font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
            Source-Grounded Retrieval
          </span>
        </div>
      </div>

      {/* Floating Hover CTA Badge */}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-white via-white/80 to-transparent py-4 text-center pointer-events-none">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 rounded-full bg-slate-950 text-white px-4 py-1.5 text-xs font-semibold shadow-md pointer-events-auto hover:bg-blue-900 transition-colors"
        >
          <span>Launch Interactive Platform Demo</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}

export default HeroProductPreview;
