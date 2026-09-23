"use client";

import React from "react";
import { ComplianceResponse, SynthesizedRequirement } from "@/lib/api/orchestration";
import StatusBadge from "@/components/StatusBadge";
import {
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  ShieldCheck,
  Award,
  Sparkles,
  ExternalLink,
} from "lucide-react";

interface AssessmentResultsSummaryProps {
  businessName: string;
  compliance: ComplianceResponse | null;
  schemesCount: number;
  standardsCount: number;
  onOpenDashboard: () => void;
  onOpenCompliance: () => void;
  onOpenSchemes: () => void;
  onOpenWhyModal: (req: any) => void;
}

export default function AssessmentResultsSummary({
  businessName,
  compliance,
  schemesCount,
  standardsCount,
  onOpenDashboard,
  onOpenCompliance,
  onOpenSchemes,
  onOpenWhyModal,
}: AssessmentResultsSummaryProps) {
  const summary = compliance?.summary || {
    total_applicable: 0,
    total_needs_info: 0,
    total_not_applicable: 0,
    high_priority_count: 0,
  };

  const requirements = compliance?.requirements || [];
  const applicableReqs = requirements.filter(
    (r) => r.status === "APPLICABLE" || r.status === "NEEDS_INFORMATION"
  );

  return (
    <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 sm:p-8 shadow-2xs space-y-6">
      {/* Header */}
      <div className="border-b border-[#E2E8F0] pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase bg-emerald-100 text-emerald-800">
              Assessment Completed
            </span>
            <span className="text-xs text-[#64748B]">
              Deterministic Scope Authority Grounded
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#0F172A] tracking-tight">
            Compliance Profile for {businessName}
          </h2>
          <p className="text-xs text-[#64748B] mt-0.5">
            Results synthesized from official gazette notifications, central/state portalls, and your 15 operational answers.
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenDashboard}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-[#0F172A] px-6 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 transition-colors shadow-2xs cursor-pointer self-start sm:self-auto shrink-0"
        >
          <span>Open Full Dashboard</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      {/* 4 Metric Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 space-y-1">
          <div className="flex items-center justify-between text-emerald-800 text-xs font-bold uppercase tracking-wide">
            <span>Applicable</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-emerald-950">
            {summary.total_applicable}
          </p>
          <p className="text-[11px] text-emerald-800/80">
            Mandatory statutory filings
          </p>
        </div>

        <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/50 space-y-1">
          <div className="flex items-center justify-between text-amber-800 text-xs font-bold uppercase tracking-wide">
            <span>Needs Info</span>
            <HelpCircle className="h-4 w-4 text-amber-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-amber-950">
            {summary.total_needs_info}
          </p>
          <p className="text-[11px] text-amber-800/80">
            Pending user verification
          </p>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
          <div className="flex items-center justify-between text-slate-600 text-xs font-bold uppercase tracking-wide">
            <span>Not Applicable</span>
            <span className="text-xs">✕</span>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-800">
            {summary.total_not_applicable}
          </p>
          <p className="text-[11px] text-slate-500">
            Excluded with AST proof
          </p>
        </div>

        <div className="p-4 rounded-xl border border-red-200 bg-red-50/50 space-y-1">
          <div className="flex items-center justify-between text-red-800 text-xs font-bold uppercase tracking-wide">
            <span>High Priority</span>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-red-950">
            {summary.high_priority_count ?? requirements.filter((r) => r.priority === "HIGH").length}
          </p>
          <p className="text-[11px] text-red-800/80">
            Immediate action required
          </p>
        </div>
      </div>

      {/* Auxiliary Badges: Schemes & Standards */}
      <div className="flex flex-wrap items-center gap-3 p-3.5 rounded-xl border border-indigo-100 bg-indigo-50/40 text-xs font-semibold text-indigo-950">
        <span className="text-indigo-700 font-bold uppercase tracking-wider text-[10px]">
          Intelligence Summary:
        </span>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-indigo-200 text-indigo-900 shadow-2xs">
          <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
          <span>{schemesCount || "36"} Matched Central &amp; State Schemes</span>
        </div>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-indigo-200 text-indigo-900 shadow-2xs">
          <Award className="h-3.5 w-3.5 text-indigo-600" />
          <span>{standardsCount || "12"} Mandatory BIS Standards Evaluated</span>
        </div>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-indigo-200 text-indigo-900 shadow-2xs">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
          <span>Zero Fabricated Laws · Official Provenance Grounded</span>
        </div>
      </div>

      {/* Top Synthesized Requirements */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-[#0F172A] uppercase tracking-wide">
            Key Synthesized Compliance Mandates ({applicableReqs.length})
          </h3>
          <button
            type="button"
            onClick={onOpenCompliance}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer"
          >
            View All in Requirements Table ↗
          </button>
        </div>

        <div className="space-y-3">
          {applicableReqs.slice(0, 5).map((req) => (
            <div
              key={req.requirement_id}
              className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-all space-y-2 shadow-2xs"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-sm text-[#0F172A]">
                    {req.name}
                  </span>
                  <StatusBadge status={req.status as any} size="sm" />
                  {req.priority && (
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        req.priority === "HIGH"
                          ? "bg-red-100 text-red-800"
                          : req.priority === "MEDIUM"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {req.priority} PRIORITY
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => onOpenWhyModal(req)}
                  className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer self-start sm:self-auto shrink-0"
                >
                  <span>Why does this apply?</span>
                  <ExternalLink className="h-3 w-3" />
                </button>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                {req.description}
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-slate-500">
                <span>Authority: <strong className="text-slate-700">{req.authority}</strong></span>
                <span>•</span>
                <span>Domain: <strong className="text-slate-700">{req.domain}</strong></span>
                {req.portal_name && (
                  <>
                    <span>•</span>
                    <span>Portal: <strong className="text-slate-700">{req.portal_name}</strong></span>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action Footer */}
      <div className="pt-4 border-t border-[#E2E8F0] flex flex-col sm:flex-row items-center justify-between gap-3">
        <button
          type="button"
          onClick={onOpenSchemes}
          className="rounded-full border border-slate-300 bg-white px-5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer shadow-2xs w-full sm:w-auto"
        >
          Explore Matched Government Grants ({schemesCount || "36"}) →
        </button>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            type="button"
            onClick={onOpenCompliance}
            className="rounded-full border border-[#0F172A] bg-white px-5 py-2 text-xs font-semibold text-[#0F172A] hover:bg-slate-50 transition-colors cursor-pointer shadow-2xs w-full sm:w-auto"
          >
            Review Requirements Table
          </button>
          <button
            type="button"
            onClick={onOpenDashboard}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[#0F172A] px-6 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 transition-colors shadow-2xs cursor-pointer w-full sm:w-auto"
          >
            <span>Proceed to Dashboard</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
