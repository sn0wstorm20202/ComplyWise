"use client";

import React, { useState } from "react";
import { Scale, ExternalLink, ChevronDown, ChevronUp, ShieldCheck } from "lucide-react";
import { RegulatoryChange } from "@/lib/mockData";

interface RegulationRowProps {
  change: RegulatoryChange;
}

export function RegulationRow({ change }: RegulationRowProps) {
  const [expanded, setExpanded] = useState(false);

  const impactStyles = {
    HIGH: "bg-rose-50 text-rose-700 border-rose-200",
    MEDIUM: "bg-amber-50 text-amber-700 border-amber-200",
    INFO: "bg-blue-50 text-blue-700 border-blue-200",
  }[change.impact_level];

  return (
    <div className="rounded-lg border border-slate-200/80 bg-slate-50/40 hover:bg-white hover:border-slate-300 transition-all p-3.5 space-y-2">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
              {change.gazette_no}
            </span>
            <span className="text-xs text-slate-500 font-medium">
              {change.authority}
            </span>
            <span className="text-slate-300">·</span>
            <span className="text-[11px] text-slate-500 font-mono">
              Notified: {change.date}
            </span>
          </div>

          <div className="text-xs font-semibold text-slate-950 leading-snug">
            {change.title}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span
            className={`inline-flex items-center rounded px-2 py-0.5 text-[10px] font-semibold border ${impactStyles}`}
          >
            {change.impact}
          </span>
          <button
            onClick={() => setExpanded(!expanded)}
            type="button"
            className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors"
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
      <p className="text-xs text-slate-600 leading-relaxed">
        {change.summary}
      </p>

      {/* Expanded Details */}
      {expanded && (
        <div className="pt-2 border-t border-slate-100 space-y-2 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-semibold text-slate-500">Affected Standards:</span>
              <div className="flex flex-wrap gap-1">
                {change.affected_standards.map((std, i) => (
                  <span
                    key={i}
                    className="font-mono text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200"
                  >
                    {std}
                  </span>
                ))}
              </div>
            </div>

            <div className="text-[11px] font-semibold text-slate-700">
              Effective Date: <span className="font-mono text-slate-900">{change.effective_date}</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700">
              <ShieldCheck className="h-3 w-3 text-emerald-600" />
              Verified Official Gazette Notification
            </span>
            <a
              href={change.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-900 hover:underline"
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
