"use client";

import React, { useState } from "react";
import { ArrowUpDown, ArrowUpRight } from "lucide-react";
import { ActionTimelinePoint } from "@/data/demo";

interface ComplianceActionsCardProps {
  actionsData?: {
    openCount: number;
    changeFromLastWeek: string;
    highPriorityCount: number;
    totalCount: number;
    timeline: ActionTimelinePoint[];
  };
  onSort?: () => void;
  onExpand?: () => void;
}

export function ComplianceActionsCard({
  actionsData = {
    openCount: 3,
    changeFromLastWeek: "↑ 2 from last week",
    highPriorityCount: 10,
    totalCount: 26,
    timeline: [
      { day: "Mon", count: 2 },
      { day: "Tue", count: 1 },
      { day: "Wed", count: 3, isPeak: true },
      { day: "Thu", count: 2 },
      { day: "Fri", count: 4 },
      { day: "Sat", count: 3 },
      { day: "Sun", count: 3 },
    ],
  },
  onSort,
  onExpand,
}: ComplianceActionsCardProps) {
  const [activeFilter, setActiveFilter] = useState<"all" | "high">("all");
  const [hoveredPoint, setHoveredPoint] = useState<ActionTimelinePoint | null>(null);

  function handleSortClick() {
    if (onSort) {
      onSort();
    } else {
      setActiveFilter((prev) => (prev === "all" ? "high" : "all"));
    }
  }

  // Calculate coordinates for spline curve
  // ViewBox: 0 0 300 100.
  // We have 7 points along X: 15, 60, 110, 160, 205, 250, 290.
  // Y maps count 0..5 -> 90..15.
  const xCoords = [15, 60, 110, 160, 205, 250, 290];
  const maxCount = 5;
  const points = actionsData.timeline.map((item, idx) => {
    const x = xCoords[idx] || (idx / (actionsData.timeline.length - 1)) * 280 + 10;
    const y = 90 - (item.count / maxCount) * 70;
    return { ...item, x, y };
  });

  // Construct SVG Path
  const pathD = `M ${points[0].x} ${points[0].y} C ${points[1].x} ${points[1].y}, ${points[2].x} 18, ${points[2].x} 22 C 145 28, 175 62, ${points[4].x} ${points[4].y} C 230 45, 260 52, ${points[6].x} ${points[6].y}`;
  const areaD = `${pathD} L ${points[6].x} 100 L ${points[0].x} 100 Z`;

  const peakPoint = points.find((p) => p.isPeak) || points[2];

  return (
    <div className="bg-white rounded-[28px] p-6 border border-slate-200/60 shadow-xs flex flex-col justify-between h-[280px] relative">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900">
            Compliance Actions
          </h3>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleSortClick}
              aria-label="Sort actions"
              title={`Filter: currently ${activeFilter === "all" ? "All Actions" : "High Priority Only"}`}
              className={`h-8 w-8 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                activeFilter === "high"
                  ? "bg-slate-900 text-white"
                  : "bg-[#f1f5f9] hover:bg-slate-200/80 text-slate-600"
              }`}
            >
              <ArrowUpDown className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={onExpand}
              aria-label="Expand actions details"
              className="h-8 w-8 rounded-full bg-[#f1f5f9] hover:bg-slate-200/80 flex items-center justify-center text-slate-600 transition-colors cursor-pointer"
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
            {activeFilter === "high" ? actionsData.highPriorityCount : actionsData.openCount}
          </span>
          <span className="text-xs font-medium text-rose-500">
            {actionsData.changeFromLastWeek}
          </span>
        </div>
      </div>

      {/* Main Body: Left Stat Pills + Right Spline Curve Chart */}
      <div className="grid grid-cols-12 gap-3 items-end mt-1">
        {/* Left Pills Column */}
        <div className="col-span-3 flex flex-col gap-2 pb-5">
          <button
            type="button"
            onClick={() => setActiveFilter("high")}
            className={`px-3 py-1.5 rounded-full border flex items-center justify-between text-xs shadow-2xs transition-all cursor-pointer ${
              activeFilter === "high"
                ? "bg-rose-50 border-rose-300 ring-2 ring-rose-200 text-rose-900 font-bold"
                : "bg-white border-slate-200/80 hover:bg-slate-50 text-slate-900"
            }`}
          >
            <span className="font-bold">{actionsData.highPriorityCount}</span>
            <span className="text-[11px] text-slate-400 font-medium ml-1">High</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter("all")}
            className={`px-3 py-1.5 rounded-full border flex items-center justify-between text-xs shadow-2xs transition-all cursor-pointer ${
              activeFilter === "all"
                ? "bg-slate-900 border-slate-900 text-white font-bold"
                : "bg-white border-slate-200/80 hover:bg-slate-50 text-slate-900"
            }`}
          >
            <span className="font-bold">{actionsData.totalCount}</span>
            <span className={`text-[11px] font-medium ml-1 ${activeFilter === "all" ? "text-slate-300" : "text-slate-400"}`}>
              Total
            </span>
          </button>
        </div>

        {/* Right Spline Chart Area */}
        <div className="col-span-9 relative h-32 flex flex-col justify-end">
          {/* Hover Tooltip */}
          {hoveredPoint && (
            <div className="absolute top-0 right-4 z-20 bg-slate-900 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full shadow-md">
              {hoveredPoint.day}: {hoveredPoint.count} open actions
            </div>
          )}

          {/* Chart SVG */}
          <div className="relative h-22 w-full">
            <svg
              className="w-full h-full overflow-visible"
              viewBox="0 0 300 100"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="actionGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f1f5f9" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#ffffff" stopOpacity="0.05" />
                </linearGradient>
              </defs>

              {/* Area Fill */}
              <path d={areaD} fill="url(#actionGradient)" />

              {/* Vertical Dashed Line at Peak */}
              <line
                x1={peakPoint.x}
                y1={peakPoint.y}
                x2={peakPoint.x}
                y2="98"
                stroke="#ecfa98"
                strokeWidth="1.5"
                strokeDasharray="3 3"
              />

              {/* Spline Line */}
              <path
                d={pathD}
                fill="none"
                stroke="#0f172a"
                strokeWidth="2.5"
                strokeLinecap="round"
              />

              {/* Dots on each day point */}
              {points.map((p, idx) => (
                <g key={idx}>
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={p.isPeak ? "4" : "3"}
                    fill="#0f172a"
                  />
                  {p.isPeak && (
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r="7"
                      fill="none"
                      stroke="#0f172a"
                      strokeWidth="1"
                      opacity="0.25"
                    />
                  )}
                </g>
              ))}
            </svg>

            {/* Floating Action Pill Badge pinned directly above peak dot */}
            <div
              className="absolute z-10 -translate-x-1/2 -translate-y-full"
              style={{
                left: `${(peakPoint.x / 300) * 100}%`,
                top: `${(peakPoint.y / 100) * 100 - 6}%`,
              }}
            >
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-[#ecfa98] text-[#1c2e0b] font-bold text-[11px] shadow-2xs whitespace-nowrap">
                {actionsData.openCount} actions
              </span>
            </div>
          </div>

          {/* Weekday Labels matching X positions */}
          <div className="flex items-center justify-between px-1 pt-1 text-[10px] font-semibold text-slate-400">
            {actionsData.timeline.map((d) => (
              <span key={d.day} className={d.isPeak ? "text-slate-900 font-bold" : ""}>
                {d.day}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ComplianceActionsCard;
