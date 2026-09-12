"use client";

import React from "react";
import { ShieldCheck, AlertCircle, CheckCircle2, Clock, ArrowUpRight, Award } from "lucide-react";

interface ComplianceHealthProps {
  score?: number; // default 82
  actionRequiredCount?: number; // 3
  applicableCount?: number; // 18
  conformingCount?: number; // 15
  auditReadiness?: number; // 88
  surveillanceAuditDate?: string; // 14 Jun 2026
  surveillanceDaysLeft?: number; // 96
  onViewActions?: () => void;
}

export function ComplianceHealth({
  score = 82,
  actionRequiredCount = 3,
  applicableCount = 18,
  conformingCount = 15,
  auditReadiness = 88,
  surveillanceAuditDate = "14 Jun 2026",
  surveillanceDaysLeft = 96,
  onViewActions,
}: ComplianceHealthProps) {
  // Radial progress circumference calculation: r=42, 2*pi*r = 263.89
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 p-6 shadow-xs relative overflow-hidden">
      {/* Top Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Regulatory Posture
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-200">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Good Standing
            </span>
          </div>
          <h2 className="text-lg font-bold text-slate-950 mt-0.5">
            Compliance Health Index
          </h2>
          <p className="text-xs text-slate-500">
            Deterministic evaluation against 18 statutory standards and mandatory Quality Control Orders.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onViewActions && (
            <button
              onClick={onViewActions}
              type="button"
              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-900 hover:text-blue-950 bg-blue-50/70 hover:bg-blue-100/70 border border-blue-200/60 rounded-lg px-3 py-1.5 transition-colors"
            >
              <span>Resolve Pending ({actionRequiredCount})</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Metric Presentation */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-5 items-center">
        {/* Left: Prominent Radial Gauge */}
        <div className="md:col-span-5 lg:col-span-4 flex items-center gap-5">
          <div className="relative h-28 w-28 shrink-0 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              {/* Background Track */}
              <circle
                cx="50"
                cy="50"
                r={radius}
                className="text-slate-100 stroke-current"
                strokeWidth="8"
                fill="transparent"
              />
              {/* Progress Indicator */}
              <circle
                cx="50"
                cy="50"
                r={radius}
                className="text-blue-900 stroke-current transition-all duration-1000 ease-out"
                strokeWidth="8"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className="text-3xl font-bold tracking-tight text-slate-950">
                {score}%
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Score
              </span>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="text-xs font-semibold text-slate-900">
              15 of 18 In Conformance
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              3 obligations require documentation renewal or test certification to reach 100% audit readiness.
            </p>
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-600 pt-0.5">
              <ShieldCheck className="h-3.5 w-3.5 text-blue-700" />
              <span>Full Statutory Provenance Backed</span>
            </div>
          </div>
        </div>

        {/* Right: Detailed Breakdown & Readiness Indicators */}
        <div className="md:col-span-7 lg:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Tile 1: Conforming Standards */}
          <div className="p-3.5 rounded-lg border border-slate-200/80 bg-slate-50/60">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider">
                Conforming
              </span>
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900">
              {conformingCount}
              <span className="text-xs font-normal text-slate-400 ml-1">/ {applicableCount}</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Verified active test reports & licenses
            </div>
          </div>

          {/* Tile 2: Action Required */}
          <div className="p-3.5 rounded-lg border border-amber-200/80 bg-amber-50/40">
            <div className="flex items-center justify-between text-amber-800 mb-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider">
                Action Required
              </span>
              <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
            </div>
            <div className="text-2xl font-bold text-amber-950">
              {actionRequiredCount}
              <span className="text-xs font-normal text-amber-700 ml-1">Mandates</span>
            </div>
            <div className="text-[11px] text-amber-800/80 mt-0.5">
              1 Type-Test, 1 QAP, 1 Form VI filing
            </div>
          </div>

          {/* Tile 3: Surveillance Audit Readiness */}
          <div className="p-3.5 rounded-lg border border-slate-200/80 bg-slate-50/60">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider">
                Next Audit
              </span>
              <Clock className="h-3.5 w-3.5 text-blue-700" />
            </div>
            <div className="text-2xl font-bold text-slate-900">
              {surveillanceDaysLeft}
              <span className="text-xs font-normal text-slate-400 ml-1">days left</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Scheduled on {surveillanceAuditDate}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ComplianceHealth;
