"use client";

import React from "react";
import { Calendar, AlertCircle, Clock, ChevronRight } from "lucide-react";
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
      className="p-3.5 rounded-lg border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:border-slate-300 hover:shadow-xs transition-all cursor-pointer group"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-blue-900">
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
          <div className="text-xs font-semibold text-slate-950 group-hover:text-blue-950 transition-colors truncate">
            {deadline.title}
          </div>
          <p className="text-[11px] text-slate-500 line-clamp-1">
            {deadline.basis}
          </p>
        </div>

        <div className="flex flex-col items-end gap-1 shrink-0">
          <span
            className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-semibold border ${badgeStyles}`}
          >
            {isUrgent ? (
              <AlertCircle className="h-3 w-3 text-rose-600" />
            ) : (
              <Clock className="h-3 w-3 text-slate-500" />
            )}
            <span>{deadline.days_remaining}d remaining</span>
          </span>
          <span className="text-[10px] font-mono text-slate-400">
            Due {deadline.due_date}
          </span>
        </div>
      </div>
    </div>
  );
}

export default DeadlineRow;
