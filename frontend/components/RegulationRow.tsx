"use client";

import React, { useState } from "react";
import { ExternalLink, ChevronDown, ChevronUp, ShieldCheck } from "lucide-react";
import { RegulatoryChange } from "@/lib/mockData";

interface RegulationRowProps {
  change: RegulatoryChange;
}

export function RegulationRow({ change }: RegulationRowProps) {
  const [expanded, setExpanded] = useState(false);

  const impactStyles = ({
    HIGH: "bg-rose-50 dark:bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/30",
    MEDIUM: "bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/30",
    INFO: "bg-blue-50 dark:bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/30",
  } as Record<string, string>)[change.impact_level || "INFO"] || "bg-blue-50 dark:bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/30";

  return (
    <div className="rounded-2xl border border-[#E2E8F0] dark:border-white/10 bg-white dark:bg-[#0D1117] hover:border-[#CBD5E1] dark:hover:border-white/20 hover:shadow-sm dark:hover:shadow-none transition-all p-5 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs font-bold text-[#0F172A] dark:text-[#F8FAFC] bg-[#F1F5F9] dark:bg-white/10 px-2.5 py-0.5 rounded-full border border-[#E2E8F0] dark:border-white/10">
              {change.gazette_no}
            </span>
            <span className="text-xs text-[#64748B] dark:text-[#94A3B8] font-medium">
              {change.authority}
            </span>
            <span className="text-[#CBD5E1] dark:text-white/20">·</span>
            <span className="text-[11px] text-[#64748B] dark:text-[#94A3B8] font-mono">
              Notified: {change.date}
            </span>
          </div>

          <div className="text-sm font-bold text-[#0F172A] dark:text-[#F8FAFC] leading-snug mt-1">
            {change.title}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold border ${impactStyles}`}
          >
            {change.impact}
          </span>
          <button
            onClick={() => setExpanded(!expanded)}
            type="button"
            className="p-1 text-[#94A3B8] dark:text-[#64748B] hover:text-[#475569] dark:hover:text-[#94A3B8] rounded-full hover:bg-[#F8FAFC] dark:hover:bg-white/5 transition-colors"
          >
            {expanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* Summary preview */}
      <p className="text-xs text-[#64748B] dark:text-[#94A3B8] leading-relaxed">
        {change.summary}
      </p>

      {/* Expanded Details */}
      {expanded && (
        <div className="pt-3 border-t border-[#F1F5F9] dark:border-white/5 space-y-2 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-[#64748B] dark:text-[#94A3B8]">Affected Standards:</span>
              <div className="flex flex-wrap gap-1.5">
                {(change.affected_standards || []).map((std, i) => (
                  <span
                    key={i}
                    className="font-mono text-[11px] bg-[#F1F5F9] dark:bg-white/5 text-[#334155] dark:text-[#CBD5E1] px-2 py-0.5 rounded-full border border-[#E2E8F0] dark:border-white/10 font-medium"
                  >
                    {std}
                  </span>
                ))}
              </div>
            </div>

            <div className="text-[11px] font-semibold text-[#475569] dark:text-[#CBD5E1]">
              Effective Date: <span className="font-mono text-[#0F172A] dark:text-[#F8FAFC] font-bold">{change.effective_date}</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-[#F8FAFC] dark:border-white/5">
            <span className="inline-flex items-center gap-1.5 text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              Verified Official Gazette Notification
            </span>
            <a
              href={change.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 dark:text-blue-400 hover:underline"
            >
              <span>View Gazette PDF</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

export default RegulationRow;
