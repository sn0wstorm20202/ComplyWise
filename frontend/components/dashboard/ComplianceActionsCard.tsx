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
  // ViewBox: 0 0 300 100.
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

  // Construct dynamic smooth cubic bezier spline through all data points
  const pathD = points.reduce((acc, curr, i, arr) => {
    if (i === 0) return `M ${curr.x} ${curr.y}`;
    const prev = arr[i - 1];
    const cp1x = Math.round(prev.x + (curr.x - prev.x) / 2);
    const cp1y = prev.y;
    const cp2x = Math.round(prev.x + (curr.x - prev.x) / 2);
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
    <div className="bg-white rounded-[20px] p-5 sm:p-6 border border-[#E5E7EB] shadow-sm flex flex-col justify-between h-full min-h-[270px] relative select-none w-full">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between gap-1">
          <h3 className="text-sm font-semibold text-[#111827] whitespace-nowrap">
            Compliance Actions
          </h3>
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={handleSortClick}
              aria-label="Sort actions"
              title={`Filter: currently ${activeFilter === "all" ? "All Actions" : "High Priority Only"}`}
              className={`h-6 w-6 rounded-[6px] flex items-center justify-center transition-colors cursor-pointer border ${
                activeFilter === "high"
                  ? "bg-[#18181B] border-[#18181B] text-white"
                  : "bg-[#F8FAFC] hover:bg-[#F1F5F9] border-[#E2E8F0] text-[#64748B] hover:text-[#111827]"
              }`}
            >
              <ArrowUpDown className="h-3 w-3" />
            </button>
            <button
              type="button"
              onClick={onExpand}
              aria-label="Expand actions details"
              className="h-6 w-6 rounded-[6px] bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-[#E2E8F0] flex items-center justify-center text-[#64748B] hover:text-[#111827] transition-colors cursor-pointer"
            >
              <ArrowUpRight className="h-3 w-3" />
            </button>
          </div>
        </div>

        {/* Metric Summary */}
        <div className="mt-2.5 flex items-baseline justify-between">
          <div>
            <div className="text-xs font-normal text-[#9CA3AF]">Open Actions</div>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-3xl sm:text-4xl font-bold text-[#111827] tracking-tight leading-none">
                {activeFilter === "high" ? actionsData.highPriorityCount : actionsData.openCount}
              </span>
              <span className="text-xs font-semibold text-[#EF4444]">
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
            className={`px-3 py-1.5 rounded-[10px] border flex items-center justify-between text-xs transition-all cursor-pointer ${
              activeFilter === "high"
                ? "bg-[#18181B] border-[#18181B] text-white font-semibold shadow-xs"
                : "bg-white border-[#E2E8F0] hover:bg-[#F8FAFC] text-[#334155]"
            }`}
          >
            <span className="font-semibold">{actionsData.highPriorityCount}</span>
            <span className={`text-[10px] ml-1 ${activeFilter === "high" ? "text-gray-300" : "text-[#9CA3AF]"}`}>High</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter("all")}
            className={`px-3 py-1.5 rounded-[10px] border flex items-center justify-between text-xs transition-all cursor-pointer ${
              activeFilter === "all"
                ? "bg-[#18181B] border-[#18181B] text-white font-semibold shadow-xs"
                : "bg-white border-[#E2E8F0] hover:bg-[#F8FAFC] text-[#334155]"
            }`}
          >
            <span className="font-semibold">{actionsData.totalCount}</span>
            <span className={`text-[10px] ml-1 ${activeFilter === "all" ? "text-gray-300" : "text-[#9CA3AF]"}`}>Total</span>
          </button>
        </div>

        {/* Right Spline Chart Area */}
        <div className="col-span-9 relative h-32 flex flex-col justify-end">
          {/* Hover Tooltip */}
          {hoveredPoint && (
            <div className="absolute top-0 right-2 z-20 bg-[#18181B] text-white text-[10px] font-medium px-2 py-0.5 rounded-full shadow-md">
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
                  <stop offset="0%" stopColor="#0F172A" stopOpacity="0.08" />
                  <stop offset="100%" stopColor="#0F172A" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Area Fill */}
              <path d={areaD} fill="url(#actionGradientLight)" />

              {/* Vertical Dashed Line at Peak */}
              <line
                x1={peakPoint.x}
                y1={peakPoint.y}
                x2={peakPoint.x}
                y2="98"
                stroke="#D4F66C"
                strokeWidth="1.5"
                strokeDasharray="3 3"
              />

              {/* Spline Line */}
              <path
                d={pathD}
                fill="none"
                stroke="#0F172A"
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
                    fill="#0F172A"
                  />
                  {p.isPeak && (
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r="8"
                      fill="none"
                      stroke="#0F172A"
                      strokeWidth="1.2"
                      opacity="0.3"
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
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-[#E5F77D] text-[#111827] font-semibold text-[10px] shadow-2xs whitespace-nowrap">
                {actionsData.openCount} actions
              </span>
            </div>
          </div>

          {/* Weekday Labels matching X positions */}
          <div className="flex items-center justify-between px-1 pt-1.5 text-[10px] text-[#9CA3AF]">
            {actionsData.timeline.map((d) => (
              <span key={d.day} className={d.isPeak ? "text-[#0F172A] font-bold" : ""}>
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
