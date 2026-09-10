"use client";

import React, { useState } from "react";
import { ArrowUpDown, ArrowUpRight } from "lucide-react";
import { ActivityDay } from "@/data/demo";

interface ComplianceActivityCardProps {
  activityData?: {
    weeklyTasks: number;
    growthPercentage: string;
    maxTasks: number;
    daily: ActivityDay[];
  };
  onSort?: () => void;
  onExpand?: () => void;
}

export function ComplianceActivityCard({
  activityData = {
    weeklyTasks: 186,
    growthPercentage: "+32%",
    maxTasks: 100,
    daily: [
      { day: "Mon", tasks: 26, isHighlight: false, dateStr: "20 Jan" },
      { day: "Tue", tasks: 42, isHighlight: false, dateStr: "21 Jan" },
      { day: "Wed", tasks: 36, isHighlight: false, dateStr: "22 Jan" },
      { day: "Thu", tasks: 60, isHighlight: false, dateStr: "23 Jan" },
      { day: "Fri", tasks: 88, isHighlight: true, dateStr: "24 Jan" },
      { day: "Sat", tasks: 48, isHighlight: false, dateStr: "25 Jan" },
      { day: "Sun", tasks: 54, isHighlight: false, dateStr: "26 Jan" },
    ],
  },
  onSort,
  onExpand,
}: ComplianceActivityCardProps) {
  const [sortOrder, setSortOrder] = useState<"standard" | "volume">("standard");
  const [hoveredDay, setHoveredDay] = useState<ActivityDay | null>(null);

  const displayedDays = [...activityData.daily].sort((a, b) => {
    if (sortOrder === "volume") {
      return b.tasks - a.tasks;
    }
    return 0; // standard chronological
  });

  function handleSortClick() {
    if (onSort) {
      onSort();
    } else {
      setSortOrder((prev) => (prev === "standard" ? "volume" : "standard"));
    }
  }

  return (
    <div className="bg-white rounded-[28px] p-6 border border-slate-200/60 shadow-xs flex flex-col justify-between h-[280px] relative">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900">
            Compliance Activity
          </h3>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleSortClick}
              title={`Sort: currently ${sortOrder === "standard" ? "Chronological" : "By Volume"}`}
              aria-label="Sort activity"
              className={`h-8 w-8 rounded-full flex items-center justify-center transition-colors ${
                sortOrder === "volume"
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 hover:bg-slate-200/70 text-slate-600"
              }`}
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
                {activityData.weeklyTasks}
              </span>
              <span className="text-xs font-medium text-slate-500">tasks</span>
            </div>
          </div>

          {/* Growth Highlight Pill */}
          <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#ecfa98] text-[#1c2e0b] font-bold text-xs shadow-2xs">
            {activityData.growthPercentage}
          </span>
        </div>
      </div>

      {/* Interactive 7-Day Bar Chart */}
      <div className="mt-3 relative">
        {/* Floating Tooltip */}
        {hoveredDay && (
          <div className="absolute -top-7 left-1/2 -translate-x-1/2 z-20 bg-slate-900 text-white text-[10px] font-semibold px-2.5 py-1 rounded-full shadow-lg pointer-events-none whitespace-nowrap">
            {hoveredDay.day} ({hoveredDay.dateStr}): {hoveredDay.tasks} tasks verified
          </div>
        )}

        <div className="h-28 flex items-end justify-between gap-2 px-1">
          {displayedDays.map((d) => {
            const heightPercent = Math.round((d.tasks / activityData.maxTasks) * 100);
            return (
              <div
                key={d.day}
                onMouseEnter={() => setHoveredDay(d)}
                onMouseLeave={() => setHoveredDay(null)}
                className="flex-1 flex flex-col items-center gap-2 h-full justify-end group cursor-pointer"
              >
                <div
                  className={`w-full max-w-[26px] rounded-t-lg transition-all duration-300 group-hover:scale-y-105 origin-bottom ${
                    d.isHighlight
                      ? "bg-[#ecfa98] group-hover:bg-[#e4f67c] shadow-xs"
                      : "bg-[#f1f5f9] group-hover:bg-slate-300/80"
                  }`}
                  style={{ height: `${heightPercent}%` }}
                />
                <span
                  className={`text-[11px] font-semibold transition-colors ${
                    d.isHighlight ? "text-slate-900 font-bold" : "text-slate-400 group-hover:text-slate-700"
                  }`}
                >
                  {d.day}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default ComplianceActivityCard;
