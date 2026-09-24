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
    ? "bg-rose-50 dark:bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/30"
    : isUpcoming
    ? "bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/30"
    : "bg-[#F8FAFC] dark:bg-white/5 text-[#475569] dark:text-[#94A3B8] border-[#E2E8F0] dark:border-white/10";

  return (
    <div
      onClick={() => onSelect && onSelect(deadline)}
      className="p-5 rounded-2xl border border-[#E2E8F0] dark:border-white/10 bg-white dark:bg-[#0D1117] hover:border-[#CBD5E1] dark:hover:border-white/20 hover:shadow-sm dark:hover:shadow-none transition-all cursor-pointer group"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/15 px-2.5 py-0.5 rounded-full border border-blue-200 dark:border-blue-500/30">
              {deadline.authority}
            </span>
            {deadline.standard_code && (
              <>
                <span className="text-[#CBD5E1] dark:text-white/20">·</span>
                <span className="text-[11px] font-mono text-[#64748B] dark:text-[#94A3B8]">
                  {deadline.standard_code}
                </span>
              </>
            )}
          </div>
          <div className="text-sm font-bold text-[#0F172A] dark:text-[#F8FAFC] group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors truncate mt-1">
            {deadline.title}
          </div>
          <p className="text-xs text-[#64748B] dark:text-[#94A3B8] line-clamp-1">
            {deadline.basis}
          </p>
        </div>

        <div className="flex flex-col items-end gap-1 shrink-0">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold border ${badgeStyles}`}
          >
            {isUrgent ? (
              <AlertCircle className="h-3.5 w-3.5" />
            ) : (
              <Clock className="h-3.5 w-3.5" />
            )}
            <span>{deadline.days_remaining}d remaining</span>
          </span>
          <span className="text-[11px] font-mono text-[#94A3B8] dark:text-[#64748B] mt-0.5">
            Due {deadline.due_date}
          </span>
        </div>
      </div>
    </div>
  );
}

export default DeadlineRow;
