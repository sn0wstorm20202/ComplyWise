"use client";

import React from "react";
import { AlertCircle, Clock } from "lucide-react";
import { UpcomingDeadline } from "@/lib/mockData";

interface DeadlineRowProps {
  deadline: UpcomingDeadline;
  onSelect?: (deadline: UpcomingDeadline) => void;
}

export function DeadlineRow({ deadline, onSelect }: DeadlineRowProps) {
  const isUrgent = deadline.days_remaining <= 15;
  const isUpcoming = deadline.days_remaining > 15 && deadline.days_remaining <= 30;

  const badgeStyles = isUrgent
    ? "bg-rose-50 text-rose-700 border-rose-200"
    : isUpcoming
    ? "bg-amber-50 text-amber-700 border-amber-200"
    : "bg-[var(--ui-bg)] text-[var(--ui-secondary)] border-[var(--ui-border)]";

  return (
    <div
      onClick={() => onSelect && onSelect(deadline)}
      className="p-5 rounded-2xl border border-[var(--ui-border)]/70 bg-white hover:border-[var(--ui-border-strong)] hover:shadow-xs transition-all cursor-pointer group"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-[var(--ui-info)] bg-[var(--ui-info-soft)] px-2.5 py-0.5 rounded-full border border-[var(--ui-sage-soft)]">
              {deadline.authority}
            </span>
            {deadline.standard_code && (
              <>
                <span className="text-[var(--ui-muted)]">·</span>
                <span className="text-[11px] font-mono text-[var(--ui-secondary)]">
                  {deadline.standard_code}
                </span>
              </>
            )}
          </div>
          <div className="text-sm font-bold text-[var(--ui-text)] group-hover:text-[var(--ui-info)] transition-colors truncate mt-1">
            {deadline.title}
          </div>
          <p className="text-xs text-[var(--ui-secondary)] line-clamp-1">
            {deadline.basis}
          </p>
        </div>

        <div className="flex flex-col items-end gap-1 shrink-0">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold border ${badgeStyles}`}
          >
            {isUrgent ? (
              <AlertCircle className="h-3.5 w-3.5 text-rose-600" />
            ) : (
              <Clock className="h-3.5 w-3.5 text-[var(--ui-secondary)]" />
            )}
            <span>{deadline.days_remaining}d remaining</span>
          </span>
          <span className="text-[11px] font-mono text-[var(--ui-muted)] mt-0.5">
            Due {deadline.due_date}
          </span>
        </div>
      </div>
    </div>
  );
}

export default DeadlineRow;
