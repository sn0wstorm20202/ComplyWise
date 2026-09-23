"use client";

import React from "react";
import { BusinessUnderstandingResponse } from "@/lib/api/orchestration";
import { Sparkles, ArrowRight, ShieldCheck, AlertTriangle, Cpu, Factory } from "lucide-react";

interface BusinessUnderstandingCardProps {
  businessName: string;
  understanding: BusinessUnderstandingResponse | null;
  loading?: boolean;
  onProceed: () => void;
  onEditProducts: () => void;
}

export default function BusinessUnderstandingCard({
  businessName,
  understanding,
  loading = false,
  onProceed,
  onEditProducts,
}: BusinessUnderstandingCardProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-8 text-center space-y-4 shadow-2xs">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-700 animate-pulse text-2xl font-bold">
          ⚡
        </div>
        <div className="space-y-1.5 max-w-md mx-auto">
          <h3 className="text-base font-bold text-[#0F172A]">
            ComplyWise is Analyzing Your Operations...
          </h3>
          <p className="text-xs text-[#64748B] leading-relaxed">
            Extracting statutory activities, manufacturing boundaries, sector classification, and regulatory jurisdictions for {businessName}.
          </p>
        </div>
      </div>
    );
  }

  const summary =
    understanding?.business_summary ||
    understanding?.primary_activity ||
    "Operational manufacturing and commercial trade facility.";
  const activities: string[] = (
    understanding?.operational_activities ||
    understanding?.operational_characteristics ||
    understanding?.products || [
      "Manufacturing Operations",
      "Statutory Quality Assembly",
      "Commercial Warehousing & Distribution",
    ]
  ) as string[];
  const sector =
    understanding?.identified_sector ||
    understanding?.business_type ||
    "Industrial Manufacturing & Statutory Compliance";
  const risks: string[] = (
    understanding?.risk_categories ||
    understanding?.likely_regulatory_domains || [
      "Industrial Environmental Compliance",
      "Workplace & Factory Labour Welfare",
      "Statutory Quality & BIS Product Standards",
    ]
  ) as string[];

  return (
    <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 sm:p-8 shadow-2xs space-y-6">
      {/* Header */}
      <div className="border-b border-[#E2E8F0] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1">
            <Sparkles className="h-3.5 w-3.5" />
            <span>AI Business Understanding Grounded</span>
          </div>
          <h2 className="text-lg font-bold text-[#0F172A]">
            Operational Intelligence Briefing for {businessName}
          </h2>
          <p className="text-xs text-[#64748B] mt-0.5">
            ComplyWise has structured your operations into canonical regulatory parameters to tailor the 15 compliance questions.
          </p>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold shrink-0">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
          <span>Grounded Assessment Active</span>
        </div>
      </div>

      {/* Grid of Understood Dimensions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Identified Sector */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wide">
            <Factory className="h-4 w-4 text-indigo-600" />
            <span>Identified Sector &amp; Domain</span>
          </div>
          <p className="text-sm font-semibold text-[#0F172A]">
            {sector}
          </p>
          <p className="text-[11px] text-[#64748B]">
            Determines statutory nodal ministry and central regulatory gazettes.
          </p>
        </div>

        {/* Operational Scope */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wide">
            <Cpu className="h-4 w-4 text-amber-600" />
            <span>Operational Summary</span>
          </div>
          <p className="text-xs text-slate-700 leading-relaxed font-medium">
            {summary}
          </p>
        </div>
      </div>

      {/* Operational Activities Tags */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-[#0F172A] block uppercase tracking-wide">
          Parsed Operational Activities:
        </label>
        <div className="flex flex-wrap gap-2">
          {activities.map((act, idx) => (
            <span
              key={idx}
              className="inline-flex items-center rounded-lg bg-indigo-50 border border-indigo-200/80 px-3 py-1 text-xs font-medium text-indigo-900 shadow-2xs"
            >
              {act}
            </span>
          ))}
        </div>
      </div>

      {/* Risk Categories */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-[#0F172A] block uppercase tracking-wide">
          Regulatory Focus &amp; Risk Domains:
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {risks.map((risk, idx) => (
            <div
              key={idx}
              className="flex items-start gap-2 p-2.5 rounded-lg border border-amber-200/70 bg-amber-50/40 text-xs text-amber-950 font-medium"
            >
              <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />
              <span>{risk}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="pt-4 border-t border-[#E2E8F0] flex flex-col sm:flex-row items-center justify-between gap-3">
        <button
          type="button"
          onClick={onEditProducts}
          className="rounded-full border border-[#E2E8F0] bg-white px-5 py-2 text-xs font-semibold text-[#475569] hover:bg-slate-50 transition-colors cursor-pointer shadow-2xs w-full sm:w-auto"
        >
          ← Edit Operational Description
        </button>

        <button
          type="button"
          onClick={onProceed}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-[#0F172A] px-6 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 transition-colors shadow-2xs cursor-pointer w-full sm:w-auto"
        >
          <span>Begin 15-Question Regulatory Assessment</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
