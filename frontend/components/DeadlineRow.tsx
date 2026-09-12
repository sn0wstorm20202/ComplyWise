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
    : "bg-slate-50 text-slate-700 border-slate-200";

  return (
    <div
      onClick={() => onSelect && onSelect(deadline)}
      className="p-5 rounded-2xl border border-slate-200/70 bg-white hover:border-slate-300 hover:shadow-xs transition-all cursor-pointer group"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-blue-900 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
              {deadline.authority}
            </span>
            {deadline.standard_code && (
              <>
                <span className="text-slate-300">·</span>
                <span className="text-[11px] font-mono text-slate-600">
                  {deadline.standard_code}
                </span>
              </>
            )}
          </div>
          <div className="text-sm font-bold text-slate-950 group-hover:text-blue-950 transition-colors truncate mt-1">
            {deadline.title}
          </div>
          <p className="text-xs text-slate-500 line-clamp-1">
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
              <Clock className="h-3.5 w-3.5 text-slate-500" />
            )}
            <span>{deadline.days_remaining}d remaining</span>
          </span>
          <span className="text-[11px] font-mono text-slate-400 mt-0.5">
            Due {deadline.due_date}
          </span>
        </div>
      </div>
    </div>
  );
}

export default DeadlineRow;
