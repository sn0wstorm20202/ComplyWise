"use client";

import React from "react";
import { ArrowUpDown, ArrowUpRight } from "lucide-react";

interface ComplianceActivityCardProps {
  onSort?: () => void;
  onExpand?: () => void;
}

export function ComplianceActivityCard({
  onSort,
  onExpand,
}: ComplianceActivityCardProps) {
  const days = [
    { label: "Mon", height: 26, isHighlight: false },
    { label: "Tue", height: 42, isHighlight: false },
    { label: "Wed", height: 36, isHighlight: false },
    { label: "Thu", height: 60, isHighlight: false },
    { label: "Fri", height: 88, isHighlight: true },
    { label: "Sat", height: 48, isHighlight: false },
    { label: "Sun", height: 54, isHighlight: false },
  ];

  return (
    <div className="bg-white rounded-[28px] p-6 border border-slate-200/60 shadow-xs flex flex-col justify-between h-[280px]">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900">
            Compliance Activity
          </h3>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onSort}
              aria-label="Sort activity"
              className="h-8 w-8 rounded-full bg-slate-100 hover:bg-slate-200/70 flex items-center justify-center text-slate-600 transition-colors"
            >
              <ArrowUpDown className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={onExpand}
              aria-label="Expand activity details"
              className="h-8 w-8 rounded-full bg-slate-100 hover:bg-slate-200/70 flex items-center justify-center text-slate-600 transition-colors"
            >
              <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Metric Summary */}
        <div className="mt-2.5 flex items-baseline justify-between">
          <div>
            <div className="text-xs font-medium text-slate-400">This week</div>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-3xl font-bold text-slate-900 tracking-tight leading-none">
                186
              </span>
              <span className="text-xs font-medium text-slate-500">tasks</span>
            </div>
          </div>

          {/* Growth Highlight Pill */}
          <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#ecfa98] text-[#1c2e0b] font-bold text-xs shadow-2xs">
            +32%
          </span>
        </div>
      </div>

      {/* 7-Day Bar Chart */}
      <div className="mt-3">
        <div className="h-28 flex items-end justify-between gap-2 px-1">
          {days.map((d) => (
            <div
              key={d.label}
              className="flex-1 flex flex-col items-center gap-2 h-full justify-end group"
            >
              <div
                className={`w-full max-w-[36px] rounded-xl transition-all duration-300 ${
                  d.isHighlight
                    ? "bg-[#ecfa98] shadow-xs group-hover:brightness-95"
                    : "bg-[#edf0f4] group-hover:bg-slate-200"
                }`}
                style={{ height: `${d.height}%` }}
              />
              <span className="text-[11px] font-medium text-slate-400 group-hover:text-slate-600 transition-colors">
                {d.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ComplianceActivityCard;
