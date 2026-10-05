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
    (r) => r.status === "APPLICABLE" || r.status === "NEEDS_INFORMATION" || r.status === "SUGGESTED"
  );

  return (
    <div className="bg-white rounded-2xl border border-[var(--ui-border)] p-6 sm:p-8 shadow-2xs space-y-6">
      {/* Header */}
      <div className="border-b border-[var(--ui-border)] pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase bg-[var(--ui-sage-soft)] text-[var(--ui-sage)]">
              Assessment Completed
            </span>
            <span className="text-xs text-[var(--ui-secondary)]">
              Your saved business assessment
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-[var(--ui-text)] tracking-tight">
            Compliance Profile for {businessName}
          </h2>
          <p className="text-xs text-[var(--ui-secondary)] mt-0.5">
            Reviewed rule decisions and contextual planning for your business. Open each item to see its basis.
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenDashboard}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--ui-text)] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[var(--ui-text)] transition-colors shadow-2xs cursor-pointer self-start sm:self-auto shrink-0"
        >
          <span>Open Full Dashboard</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      {/* 4 Metric Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-[var(--ui-sage-soft)] bg-[var(--ui-sage-faint)]/50 space-y-1">
          <div className="flex items-center justify-between text-[var(--ui-sage)] text-xs font-bold uppercase tracking-wide">
            <span>Applicable</span>
            <CheckCircle2 className="h-4 w-4 text-[var(--ui-sage)]" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-[var(--ui-sage)]">
            {summary.total_applicable}
          </p>
          <p className="text-[11px] text-[var(--ui-sage)]/80">
            Matched by reviewed rules
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
            A decision needs more detail
          </p>
        </div>

        <div className="p-4 rounded-xl border border-[var(--ui-border)] bg-[var(--ui-bg)] space-y-1">
          <div className="flex items-center justify-between text-[var(--ui-secondary)] text-xs font-bold uppercase tracking-wide">
            <span>Not Applicable</span>
            <span className="text-xs">✕</span>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-[var(--ui-text)]">
            {summary.total_not_applicable}
          </p>
          <p className="text-[11px] text-[var(--ui-secondary)]">
            Outside the reviewed rule conditions
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
            Recorded priority
          </p>
        </div>
      </div>

      {/* Auxiliary Badges: Schemes & Standards */}
      {requirements.some(r => r.status === "UNVERIFIED") && <p className="text-xs text-[var(--ui-secondary)]">
        {requirements.filter(r => r.status === "UNVERIFIED").length} items await review. They are not confirmed obligations.
      </p>}
      <div className="flex flex-wrap items-center gap-3 p-3.5 rounded-xl border border-[var(--ui-sage-soft)] bg-[var(--ui-sage-faint)]/40 text-xs font-semibold text-[var(--ui-sage)]">
        <span className="text-[var(--ui-sage)] font-bold uppercase tracking-wider text-[10px]">
          Intelligence Summary:
        </span>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-[var(--ui-sage-soft)] text-[var(--ui-sage)] shadow-2xs">
          <Sparkles className="h-3.5 w-3.5 text-[var(--ui-sage)]" />
          <span>{schemesCount} Relevant scheme / support areas</span>
        </div>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-[var(--ui-sage-soft)] text-[var(--ui-sage)] shadow-2xs">
          <Award className="h-3.5 w-3.5 text-[var(--ui-sage)]" />
          <span>{standardsCount} Standard / quality review areas</span>
        </div>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-[var(--ui-sage-soft)] text-[var(--ui-sage)] shadow-2xs">
          <ShieldCheck className="h-3.5 w-3.5 text-[var(--ui-sage)]" />
          <span>Review the basis of each result</span>
        </div>
      </div>

      {/* Top Synthesized Requirements */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-[var(--ui-text)] uppercase tracking-wide">
            Requirements &amp; suggested next steps ({applicableReqs.length})
          </h3>
          <button
            type="button"
            onClick={onOpenCompliance}
            className="text-xs font-semibold text-[var(--ui-sage)] hover:text-[var(--ui-sage)] hover:underline cursor-pointer"
          >
            View All in Requirements Table ↗
          </button>
        </div>

        <div className="space-y-3">
          {applicableReqs.slice(0, 5).map((req) => (
            <div
              key={req.requirement_id}
              className="p-4 rounded-xl border border-[var(--ui-border)] bg-white hover:border-[var(--ui-border-strong)] transition-all space-y-2 shadow-2xs"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-sm text-[var(--ui-text)]">
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
                          : "bg-[var(--ui-inset)] text-[var(--ui-secondary)]"
                      }`}
                    >
                      {req.priority} PRIORITY
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => onOpenWhyModal(req)}
                  className="inline-flex items-center gap-1 text-xs font-bold text-[var(--ui-sage)] hover:text-[var(--ui-sage)] hover:underline cursor-pointer self-start sm:self-auto shrink-0"
                >
                  <span>Why does this apply?</span>
                  <ExternalLink className="h-3 w-3" />
                </button>
              </div>

              <p className="text-xs text-[var(--ui-secondary)] leading-relaxed">
                {req.description}
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-[var(--ui-secondary)]">
                <span>Authority: <strong className="text-[var(--ui-secondary)]">{req.authority}</strong></span>
                <span>•</span>
                <span>Domain: <strong className="text-[var(--ui-secondary)]">{req.domain}</strong></span>
                {req.portal_name && (
                  <>
                    <span>•</span>
                    <span>Portal: <strong className="text-[var(--ui-secondary)]">{req.portal_name}</strong></span>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action Footer */}
      <div className="pt-4 border-t border-[var(--ui-border)] flex flex-col sm:flex-row items-center justify-between gap-3">
        <button
          type="button"
          onClick={onOpenSchemes}
          className="rounded-full border border-[var(--ui-border-strong)] bg-white px-5 py-2 text-xs font-semibold text-[var(--ui-secondary)] hover:bg-[var(--ui-bg)] transition-colors cursor-pointer shadow-2xs w-full sm:w-auto"
        >
          Explore relevant support areas ({schemesCount}) →
        </button>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            type="button"
            onClick={onOpenCompliance}
            className="rounded-full border border-[var(--ui-text)] bg-white px-5 py-2 text-xs font-semibold text-[var(--ui-text)] hover:bg-[var(--ui-bg)] transition-colors cursor-pointer shadow-2xs w-full sm:w-auto"
          >
            Review Requirements Table
          </button>
          <button
            type="button"
            onClick={onOpenDashboard}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--ui-text)] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[var(--ui-text)] transition-colors shadow-2xs cursor-pointer w-full sm:w-auto"
          >
            <span>Proceed to Dashboard</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
