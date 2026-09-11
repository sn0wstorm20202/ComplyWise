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
    <div className="bg-[#101114] rounded-[14px] p-5 sm:p-6 border border-white/[0.08] shadow-lg flex flex-col justify-between h-full min-h-[270px] relative select-none">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between gap-1">
          <h3 className="text-sm font-semibold text-[#F2F2F0] whitespace-nowrap">
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
                  ? "bg-white/[0.12] border-white/[0.16] text-[#F2F2F0]"
                  : "bg-[#141519] hover:bg-white/[0.08] border-white/[0.08] text-[#A4A5AA] hover:text-[#F2F2F0]"
              }`}
            >
              <ArrowUpDown className="h-3 w-3" />
            </button>
            <button
              type="button"
              onClick={onExpand}
              aria-label="Expand actions details"
              className="h-6 w-6 rounded-[6px] bg-[#141519] hover:bg-white/[0.08] border border-white/[0.08] flex items-center justify-center text-[#A4A5AA] hover:text-[#F2F2F0] transition-colors cursor-pointer"
            >
              <ArrowUpRight className="h-3 w-3" />
            </button>
          </div>
        </div>

        {/* Metric Summary */}
        <div className="mt-2.5 flex items-baseline justify-between">
          <div>
            <div className="text-xs font-normal text-[#71717A]">Open Actions</div>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-3xl font-bold text-[#F5F5F3] tracking-tight leading-none">
                {activeFilter === "high" ? actionsData.highPriorityCount : actionsData.openCount}
              </span>
              <span className="text-xs text-[#ED7C7C]">
                {actionsData.changeFromLastWeek}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Body: Left Stat Pills + Right Spline Curve Chart */}
      <div className="grid grid-cols-12 gap-3 items-end mt-1">
        {/* Left Pills Column */}
        <div className="col-span-3 flex flex-col gap-1.5 pb-4">
          <button
            type="button"
            onClick={() => setActiveFilter("high")}
            className={`px-2.5 py-1.5 rounded-[8px] border flex items-center justify-between text-xs transition-all cursor-pointer ${
              activeFilter === "high"
                ? "bg-[#ED7C7C]/15 border-[#ED7C7C]/40 text-[#ED7C7C] font-semibold"
                : "bg-[#141519] border-white/[0.08] hover:bg-white/[0.04] text-[#A4A5AA]"
            }`}
          >
            <span className="font-semibold">{actionsData.highPriorityCount}</span>
            <span className="text-[10px] text-[#71717A] ml-1">High</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter("all")}
            className={`px-2.5 py-1.5 rounded-[8px] border flex items-center justify-between text-xs transition-all cursor-pointer ${
              activeFilter === "all"
                ? "bg-white/[0.12] border-white/[0.16] text-[#F5F5F3] font-semibold"
                : "bg-[#141519] border-white/[0.08] hover:bg-white/[0.04] text-[#A4A5AA]"
            }`}
          >
            <span className="font-semibold">{actionsData.totalCount}</span>
            <span className="text-[10px] text-[#71717A] ml-1">Total</span>
          </button>
        </div>

        {/* Right Spline Chart Area */}
        <div className="col-span-9 relative h-32 flex flex-col justify-end">
          {/* Hover Tooltip */}
          {hoveredPoint && (
            <div className="absolute top-0 right-2 z-20 bg-[#17191C] border border-white/[0.12] text-[#F5F5F3] text-[10px] font-medium px-2 py-0.5 rounded-full shadow-md">
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
                <linearGradient id="actionGradientDark" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6D8CFF" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#6D8CFF" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Area Fill */}
              <path d={areaD} fill="url(#actionGradientDark)" />

              {/* Vertical Dashed Line at Peak */}
              <line
                x1={peakPoint.x}
                y1={peakPoint.y}
                x2={peakPoint.x}
                y2="98"
                stroke="#6D8CFF"
                strokeWidth="1.2"
                strokeDasharray="3 3"
                opacity="0.6"
              />

              {/* Spline Line */}
              <path
                d={pathD}
                fill="none"
                stroke="#F5F5F3"
                strokeWidth="2.2"
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
                    r={p.isPeak ? "4" : "3"}
                    fill={p.isPeak ? "#6D8CFF" : "#F5F5F3"}
                  />
                  {p.isPeak && (
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r="7.5"
                      fill="none"
                      stroke="#6D8CFF"
                      strokeWidth="1"
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
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-accent text-[#09090B] font-semibold text-[10px] shadow-sm whitespace-nowrap">
                {actionsData.openCount} actions
              </span>
            </div>
          </div>

          {/* Weekday Labels matching X positions */}
          <div className="flex items-center justify-between px-1 pt-1.5 text-[10px] text-[#71717A]">
            {actionsData.timeline.map((d) => (
              <span key={d.day} className={d.isPeak ? "text-[#F5F5F3] font-medium" : ""}>
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
