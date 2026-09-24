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

  // Dynamically calculate coordinates for spline curve
  const xCoords = [15, 60, 110, 160, 205, 250, 290];
  const maxCount = Math.max(
    5,
    ...(actionsData.timeline?.map((item) => item.count) || [5])
  );
  const points = (actionsData.timeline || []).map((item, idx) => {
    const x = xCoords[idx] !== undefined ? xCoords[idx] : (idx / Math.max(1, actionsData.timeline.length - 1)) * 270 + 15;
    const y = Math.round(90 - (item.count / maxCount) * 70);
    return { ...item, x, y };
  });

  const pathD = points.reduce((acc, curr, idx, arr) => {
    if (idx === 0) return `M ${curr.x} ${curr.y}`;
    const prev = arr[idx - 1];
    const cp1x = prev.x + (curr.x - prev.x) / 2;
    const cp1y = prev.y;
    const cp2x = prev.x + (curr.x - prev.x) / 2;
    const cp2y = curr.y;
    return `${acc} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${curr.x} ${curr.y}`;
  }, "");
  const lastPoint = points.length > 0 ? points[points.length - 1] : { x: 290, y: 50 };
  const firstPoint = points.length > 0 ? points[0] : { x: 15, y: 50 };
  const areaD = `${pathD} L ${lastPoint.x} 100 L ${firstPoint.x} 100 Z`;

  const peakPoint =
    points.find((p) => p.isPeak) ||
    [...points].sort((a, b) => b.count - a.count)[0] ||
    points[0] || { x: 150, y: 30, day: "Fri", count: 4 };

  return (
    <div className="bg-white dark:bg-[#0E1318] rounded-[20px] p-5 sm:p-6 border border-[#E2E8F0] dark:border-white/12 shadow-sm flex flex-col justify-between h-full min-h-[270px] relative select-none w-full transition-colors">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between gap-1">
          <h3 className="text-base font-bold text-[#0B1220] dark:text-[#F7F9FC] whitespace-nowrap">
            Compliance Actions
          </h3>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleSortClick}
              aria-label="Sort actions"
              title={`Filter: currently ${activeFilter === "all" ? "All Actions" : "High Priority Only"}`}
              className={`h-7 w-7 rounded-lg flex items-center justify-center transition-colors cursor-pointer border ${
                activeFilter === "high"
                  ? "bg-[#0B1220] dark:bg-blue-600 border-[#0B1220] dark:border-blue-600 text-white"
                  : "bg-[#F8FAFD] dark:bg-[#141A21] hover:bg-[#F1F5F9] dark:hover:bg-white/10 border-[#E2E8F0] dark:border-white/15 text-[#475569] dark:text-[#D4DBE4] hover:text-[#0B1220] dark:hover:text-white"
              }`}
            >
              <ArrowUpDown className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={onExpand}
              aria-label="Expand actions details"
              className="h-7 w-7 rounded-lg bg-[#F8FAFD] dark:bg-[#141A21] hover:bg-[#F1F5F9] dark:hover:bg-white/10 border border-[#E2E8F0] dark:border-white/15 flex items-center justify-center text-[#475569] dark:text-[#D4DBE4] hover:text-[#0B1220] dark:hover:text-white transition-colors cursor-pointer"
            >
              <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Metric Summary */}
        <div className="mt-3 flex items-baseline justify-between">
          <div>
            <div className="text-xs font-semibold text-[#475569] dark:text-[#A8B2BE]">Open Actions</div>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-3xl sm:text-4xl font-extrabold text-[#0B1220] dark:text-[#F7F9FC] tracking-tight leading-none">
                {activeFilter === "high" ? actionsData.highPriorityCount : actionsData.openCount}
              </span>
              <span className="text-xs font-semibold text-rose-600 dark:text-rose-400">
                {actionsData.changeFromLastWeek}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Body: Left Stat Pills + Right Spline Curve Chart */}
      <div className="grid grid-cols-12 gap-3 items-end mt-2">
        {/* Left Pills Column */}
        <div className="col-span-3 flex flex-col gap-1.5 pb-4">
          <button
            type="button"
            onClick={() => setActiveFilter("high")}
            className={`px-3 py-1.5 rounded-xl border flex items-center justify-between text-xs transition-all cursor-pointer ${
              activeFilter === "high"
                ? "bg-[#0B1220] dark:bg-blue-600 border-[#0B1220] dark:border-blue-600 text-white font-semibold shadow-xs"
                : "bg-white dark:bg-[#141A21] border-[#E2E8F0] dark:border-white/15 hover:bg-[#F8FAFD] dark:hover:bg-white/10 text-[#334155] dark:text-[#D4DBE4]"
            }`}
          >
            <span className="font-bold">{actionsData.highPriorityCount}</span>
            <span className={`text-xs ml-1 font-semibold ${activeFilter === "high" ? "text-gray-200" : "text-[#475569] dark:text-[#A8B2BE]"}`}>High</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter("all")}
            className={`px-3 py-1.5 rounded-xl border flex items-center justify-between text-xs transition-all cursor-pointer ${
              activeFilter === "all"
                ? "bg-[#0B1220] dark:bg-blue-600 border-[#0B1220] dark:border-blue-600 text-white font-semibold shadow-xs"
                : "bg-white dark:bg-[#141A21] border-[#E2E8F0] dark:border-white/15 hover:bg-[#F8FAFD] dark:hover:bg-white/10 text-[#334155] dark:text-[#D4DBE4]"
            }`}
          >
            <span className="font-bold">{actionsData.totalCount}</span>
            <span className={`text-xs ml-1 font-semibold ${activeFilter === "all" ? "text-gray-200" : "text-[#475569] dark:text-[#A8B2BE]"}`}>Total</span>
          </button>
        </div>

        {/* Right Spline Chart Area */}
        <div className="col-span-9 relative h-32 flex flex-col justify-end">
          {/* Hover Tooltip */}
          {hoveredPoint && (
            <div className="absolute top-0 right-2 z-20 bg-[#0B1220] dark:bg-[#141A21] text-white text-xs font-semibold px-2.5 py-1 rounded-full shadow-md border border-white/10">
              {hoveredPoint.day}: {hoveredPoint.count} open actions
            </div>
          )}

          {/* Chart SVG */}
          <div className="relative h-20 w-full">
            <svg
              className="w-full h-full overflow-visible"
              viewBox="0 0 300 100"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="actionGradientLight" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2563EB" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#2563EB" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Area under curve */}
              <path
                d={areaD}
                fill="url(#actionGradientLight)"
              />

              {/* Spline curve stroke */}
              <path
                d={pathD}
                fill="none"
                className="stroke-[#2563EB] dark:stroke-[#60A5FA]"
                strokeWidth="2.4"
                strokeLinecap="round"
              />

              {/* Dots on each day point */}
              {points.map((p, idx) => (
                <g
                  key={idx}
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredPoint(actionsData.timeline[idx] || null)}
                  onMouseLeave={() => setHoveredPoint(null)}
                >
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={p.isPeak ? "4.5" : "3"}
                    className="fill-[#2563EB] dark:fill-[#60A5FA]"
                  />
                  {p.isPeak && (
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r="8"
                      fill="none"
                      className="stroke-[#2563EB] dark:stroke-[#60A5FA]"
                      strokeWidth="1.2"
                      opacity="0.4"
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
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-500/25 border border-blue-200 dark:border-blue-500/40 text-blue-900 dark:text-blue-200 font-bold text-xs shadow-2xs whitespace-nowrap">
                {actionsData.openCount} actions
              </span>
            </div>
          </div>

          {/* Weekday Labels matching X positions */}
          <div className="flex items-center justify-between px-1 pt-1.5 text-xs text-[#475569] dark:text-[#A8B2BE] font-medium">
            {actionsData.timeline.map((d) => (
              <span key={d.day} className={d.isPeak ? "text-[#0B1220] dark:text-[#F7F9FC] font-bold" : ""}>
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
