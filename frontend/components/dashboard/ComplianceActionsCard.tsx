"use client";

import React from "react";
import { ArrowUpDown, ArrowUpRight } from "lucide-react";

interface ComplianceActionsCardProps {
  onSort?: () => void;
  onExpand?: () => void;
}

export function ComplianceActionsCard({
  onSort,
  onExpand,
}: ComplianceActionsCardProps) {
  return (
    <div className="bg-white rounded-[28px] p-6 border border-slate-200/60 shadow-xs flex flex-col justify-between h-[280px]">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900">
            Compliance Actions
          </h3>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onSort}
              aria-label="Sort actions"
              className="h-8 w-8 rounded-full bg-slate-100 hover:bg-slate-200/70 flex items-center justify-center text-slate-600 transition-colors"
            >
              <ArrowUpDown className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={onExpand}
              aria-label="Expand actions details"
              className="h-8 w-8 rounded-full bg-slate-100 hover:bg-slate-200/70 flex items-center justify-center text-slate-600 transition-colors"
            >
              <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Metric Summary */}
        <div className="mt-2 flex items-baseline gap-3">
          <div className="text-xs font-medium text-slate-400">Open Actions</div>
        </div>
        <div className="flex items-baseline gap-2.5">
          <span className="text-3xl font-bold text-slate-900 tracking-tight leading-none">
            3
          </span>
          <span className="text-xs font-medium text-rose-500">
            ↑ 2 from last week
          </span>
        </div>
      </div>

      {/* Main Body: Left Stat Pills + Right Spline Curve Chart */}
      <div className="grid grid-cols-12 gap-3 items-end mt-1">
        {/* Left Pills Column */}
        <div className="col-span-3 flex flex-col gap-2 pb-5">
          <div className="px-3 py-1.5 rounded-full bg-[#f8fafc] border border-slate-200/60 flex items-center justify-between text-xs shadow-2xs">
            <span className="font-bold text-slate-900">10</span>
            <span className="text-[11px] text-slate-400 font-medium">High</span>
          </div>
          <div className="px-3 py-1.5 rounded-full bg-[#f8fafc] border border-slate-200/60 flex items-center justify-between text-xs shadow-2xs">
            <span className="font-bold text-slate-900">26</span>
            <span className="text-[11px] text-slate-400 font-medium">Total</span>
          </div>
        </div>

        {/* Right Spline Chart Area */}
        <div className="col-span-9 relative h-32 flex flex-col justify-end">
          {/* Chart SVG */}
          <div className="relative h-24 w-full">
            <svg
              className="w-full h-full overflow-visible"
              viewBox="0 0 300 100"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="actionAreaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f1f5f9" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#ffffff" stopOpacity="0.1" />
                </linearGradient>
              </defs>

              {/* Area Fill */}
              <path
                d="M 15 75 
                   C 35 60, 55 45, 75 48 
                   C 95 52, 115 65, 135 40 
                   C 155 42, 175 60, 195 55 
                   C 215 50, 235 38, 255 35 
                   C 275 32, 285 20, 290 15 
                   L 290 100 L 15 100 Z"
                fill="url(#actionAreaGradient)"
              />

              {/* Spline Line */}
              <path
                d="M 15 75 
                   C 35 60, 55 45, 75 48 
                   C 95 52, 115 65, 135 40 
                   C 155 42, 175 60, 195 55 
                   C 215 50, 235 38, 255 35 
                   C 275 32, 285 20, 290 15"
                fill="none"
                stroke="#cbd5e1"
                strokeWidth="1.75"
              />

              {/* Wednesday Vertical Dashed Guideline */}
              <line
                x1="135"
                y1="40"
                x2="135"
                y2="100"
                stroke="#ecfa98"
                strokeWidth="1.5"
                strokeDasharray="3 3"
              />

              {/* Data Points (Black Circles) */}
              <circle cx="15" cy="75" r="3.5" fill="#0f172a" />
              <circle cx="75" cy="48" r="3.5" fill="#0f172a" />
              <circle cx="135" cy="40" r="3.5" fill="#0f172a" />
              <circle cx="195" cy="55" r="3.5" fill="#0f172a" />
              <circle cx="255" cy="35" r="3.5" fill="#0f172a" />
              <circle cx="290" cy="15" r="3.5" fill="#0f172a" />
            </svg>

            {/* Pinned "3 actions" Lime Pill attached above Wednesday point */}
            <div
              className="absolute left-[45%] -top-4 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-[#ecfa98] text-[#1c2e0b] font-bold text-[10px] shadow-xs z-10 pointer-events-none whitespace-nowrap"
            >
              3 actions
            </div>
          </div>

          {/* X-axis Day Labels */}
          <div className="flex justify-between px-2 pt-2 text-[11px] font-medium text-slate-400">
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
            <span>Sun</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ComplianceActionsCard;
