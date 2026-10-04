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
    HIGH: "bg-rose-50 text-rose-700 border-rose-200",
    MEDIUM: "bg-amber-50 text-amber-700 border-amber-200",
    INFO: "bg-[var(--ui-info-soft)] text-[var(--ui-info)] border-[var(--ui-sage-soft)]",
  } as Record<string, string>)[change.impact_level || "INFO"] || "bg-[var(--ui-info-soft)] text-[var(--ui-info)] border-[var(--ui-sage-soft)]";

  return (
    <div className="rounded-2xl border border-[var(--ui-border)]/70 bg-white hover:border-[var(--ui-border-strong)] hover:shadow-xs transition-all p-5 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs font-bold text-[var(--ui-text)] bg-[var(--ui-inset)] px-2.5 py-0.5 rounded-full border border-[var(--ui-border)]">
              {change.gazette_no}
            </span>
            <span className="text-xs text-[var(--ui-secondary)] font-medium">
              {change.authority}
            </span>
            <span className="text-[var(--ui-muted)]">·</span>
            <span className="text-[11px] text-[var(--ui-secondary)] font-mono">
              Notified: {change.date}
            </span>
          </div>

          <div className="text-sm font-bold text-[var(--ui-text)] leading-snug mt-1">
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
            className="p-1 text-[var(--ui-muted)] hover:text-[var(--ui-secondary)] rounded-full hover:bg-[var(--ui-inset)] transition-colors"
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
      <p className="text-xs text-[var(--ui-secondary)] leading-relaxed">
        {change.summary}
      </p>

      {/* Expanded Details */}
      {expanded && (
        <div className="pt-3 border-t border-[var(--ui-border)] space-y-2 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-[var(--ui-secondary)]">Affected Standards:</span>
              <div className="flex flex-wrap gap-1.5">
                {(change.affected_standards || []).map((std, i) => (
                  <span
                    key={i}
                    className="font-mono text-[11px] bg-[var(--ui-inset)] text-[var(--ui-text)] px-2 py-0.5 rounded-full border border-[var(--ui-border)]/80 font-medium"
                  >
                    {std}
                  </span>
                ))}
              </div>
            </div>

            <div className="text-[11px] font-semibold text-[var(--ui-secondary)]">
              Effective Date: <span className="font-mono text-[var(--ui-text)] font-bold">{change.effective_date}</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-[var(--ui-border)]">
            <span className="inline-flex items-center gap-1.5 text-[11px] text-[var(--ui-sage)] font-medium">
              <ShieldCheck className="h-3.5 w-3.5 text-[var(--ui-sage)]" />
              Verified Official Gazette Notification
            </span>
            <a
              href={change.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--ui-info)] hover:underline"
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
