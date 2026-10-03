"use client";

import React from "react";
import Link from "next/link";
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  Lock,
} from "lucide-react";

export function HeroProductPreview() {
  return (
    <div className="relative mx-auto w-full bg-white select-none">
      {/* Hardware Chrome Topbar */}
      <div className="flex items-center justify-between border-b border-slate-200/70 bg-slate-50/80 px-4 sm:px-6 py-3">
        <div className="flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full bg-slate-300" />
          <div className="h-2.5 w-2.5 rounded-full bg-slate-300" />
          <div className="h-2.5 w-2.5 rounded-full bg-slate-300" />
        </div>

        {/* Browser URL Bar */}
        <div className="flex items-center justify-center gap-2 rounded-full border border-slate-200/80 bg-white px-4 py-1 text-[11px] font-mono text-slate-500 max-w-sm w-full mx-2 shadow-2xs">
          <Lock className="h-3 w-3 text-slate-400 shrink-0" strokeWidth={1.5} />
          <span className="text-slate-400">https://</span>
          <span className="text-slate-900 font-medium">app.complywise.in</span>
          <span className="text-slate-400">/workspace</span>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/dashboard"
            className="text-[11px] font-medium text-slate-700 hover:text-slate-950 inline-flex items-center gap-1 transition-colors"
          >
            <span>Live System</span>
            <ArrowUpRight className="h-3.5 w-3.5 text-slate-400" strokeWidth={1.5} />
          </Link>
        </div>
      </div>

      {/* Simulated Application Workspace */}
      <div className="p-5 sm:p-8 bg-slate-50/50 space-y-5 text-xs">
        {/* Workspace Mini-Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-[#0F172A] text-white font-mono font-bold text-xs flex items-center justify-center shadow-xs">
              CW
            </div>
            <div>
              <div className="font-semibold text-slate-950 text-xs sm:text-sm flex items-center gap-2">
                <span>Apex Industrial Electro-Mechanicals Ltd.</span>
                <span className="font-mono text-[10px] text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded-md border border-slate-200/60">
                  CM/L-8492019
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Deterministic Regulatory Matrix · 18 Applicable Standards Evaluated
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200/70">
              Surveillance: 14 Jun 2026 (96d)
            </span>
          </div>
        </div>

        {/* Primary Health Module Simulation */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
          {/* Health Index Card */}
          <div className="md:col-span-7 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-900 text-xs">Compliance Health Index</span>
              <span className="text-[10px] font-mono font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/80">
                82% Good Standing
              </span>
            </div>

            <div className="flex items-center gap-5">
              <div className="h-16 w-16 rounded-full border-[3px] border-[#0F172A] border-t-emerald-500 flex items-center justify-center font-bold text-slate-950 text-base font-mono shrink-0">
                82%
              </div>
              <div className="space-y-1 text-xs text-slate-600">
                <div>
                  <span className="font-semibold text-slate-900">15 of 18 Mandates</span> in full statutory conformance.
                </div>
                <div className="text-[11px] text-slate-500">
                  3 obligations require documentation renewal before scheduled surveillance audit.
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono text-slate-500">
              <span>Next BIS Audit Window: Q3 2026</span>
              <span className="text-emerald-700 font-medium">Deterministic Rule Run: Complete</span>
            </div>
          </div>

          {/* Urgent Actions Card */}
          <div className="md:col-span-5 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-900 text-xs">Priority Actions</span>
              <span className="text-[10px] font-mono text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                3 Pending
              </span>
            </div>

            <div className="space-y-2">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/60 flex items-start gap-2.5">
                <Clock className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" strokeWidth={1.5} />
                <div className="text-[11px]">
                  <div className="font-medium text-slate-900">High-Voltage Calibration Rig</div>
                  <div className="text-slate-500 text-[10px]">Renewal certificate due in 14 days</div>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/60 flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" strokeWidth={1.5} />
                <div className="text-[11px]">
                  <div className="font-medium text-slate-900">IS 1293:2019 Clause 18 Dossier</div>
                  <div className="text-slate-500 text-[10px]">NABL laboratory report verified</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HeroProductPreview;
