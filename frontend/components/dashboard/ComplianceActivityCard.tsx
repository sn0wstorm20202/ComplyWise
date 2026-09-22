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
    <div className="bg-white dark:bg-[#0E1318] rounded-[20px] p-5 sm:p-6 border border-[#E2E8F0] dark:border-white/12 shadow-sm flex flex-col justify-between h-full min-h-[270px] relative select-none w-full transition-colors">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between gap-1">
          <h3 className="text-base font-bold text-[#0B1220] dark:text-[#F7F9FC] whitespace-nowrap">
            Compliance Activity
          </h3>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleSortClick}
              title={`Sort: currently ${sortOrder === "standard" ? "Chronological" : "By Volume"}`}
              aria-label="Sort activity"
              className={`h-7 w-7 rounded-lg flex items-center justify-center transition-colors cursor-pointer border ${
                sortOrder === "volume"
                  ? "bg-[#0B1220] dark:bg-blue-600 border-[#0B1220] dark:border-blue-600 text-white"
                  : "bg-[#F8FAFD] dark:bg-[#141A21] hover:bg-[#F1F5F9] dark:hover:bg-white/10 border-[#E2E8F0] dark:border-white/15 text-[#475569] dark:text-[#D4DBE4] hover:text-[#0B1220] dark:hover:text-white"
              }`}
            >
              <ArrowUpDown className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={onExpand}
              aria-label="Expand activity details"
              className="h-7 w-7 rounded-lg bg-[#F8FAFD] dark:bg-[#141A21] hover:bg-[#F1F5F9] dark:hover:bg-white/10 border border-[#E2E8F0] dark:border-white/15 flex items-center justify-center text-[#475569] dark:text-[#D4DBE4] hover:text-[#0B1220] dark:hover:text-white transition-colors cursor-pointer"
            >
              <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Metric Summary */}
        <div className="mt-3 flex items-baseline justify-between">
          <div>
            <div className="text-xs font-semibold text-[#475569] dark:text-[#A8B2BE]">This week</div>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-3xl sm:text-4xl font-extrabold text-[#0B1220] dark:text-[#F7F9FC] tracking-tight leading-none">
                {activityData.weeklyTasks}
              </span>
              <span className="text-xs font-medium text-[#475569] dark:text-[#A8B2BE]">tasks</span>
            </div>
          </div>

          {/* Growth Highlight Pill */}
          <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-500/20 border border-emerald-200 dark:border-emerald-500/35 text-emerald-900 dark:text-emerald-300 font-bold text-xs shadow-2xs">
            {activityData.growthPercentage}
          </span>
        </div>
      </div>

      {/* Interactive 7-Day Bar Chart */}
      <div className="mt-2 relative">
        {/* Floating Tooltip */}
        {hoveredDay && (
          <div className="absolute -top-7 left-1/2 -translate-x-1/2 z-20 bg-[#0B1220] dark:bg-[#141A21] text-white text-xs font-semibold px-2.5 py-1 rounded-full shadow-lg pointer-events-none whitespace-nowrap border border-white/10">
            {hoveredDay.day} ({hoveredDay.dateStr}): {hoveredDay.tasks} tasks verified
          </div>
        )}

        <div className="h-28 flex items-end justify-between gap-2 px-1">
          {displayedDays.map((d) => {
            const maxDayTask = Math.max(...displayedDays.map((item) => item.tasks), 1);
            const effectiveMax = Math.max(activityData.maxTasks || 100, maxDayTask);
            const heightPercent = Math.min(100, Math.max(14, Math.round((d.tasks / effectiveMax) * 100)));
            const isHighlighted = d.isHighlight || d.tasks === maxDayTask;
            return (
              <div
                key={d.day}
                onMouseEnter={() => setHoveredDay(d)}
                onMouseLeave={() => setHoveredDay(null)}
                className="flex-1 flex flex-col items-center gap-2 h-full justify-end group cursor-pointer"
              >
                <div
                  className={`w-full max-w-[24px] rounded-full transition-all duration-300 group-hover:scale-y-105 origin-bottom ${
                    isHighlighted
                      ? "bg-blue-600 dark:bg-blue-500 shadow-2xs"
                      : "bg-[#EEF2F6] dark:bg-white/10 group-hover:bg-[#E2E8F0] dark:group-hover:bg-white/20"
                  }`}
                  style={{ height: `${heightPercent}%` }}
                />
                <span
                  className={`text-xs font-semibold transition-colors ${
                    isHighlighted ? "text-[#0B1220] dark:text-[#F7F9FC] font-bold" : "text-[#475569] dark:text-[#A8B2BE] group-hover:text-[#0B1220] dark:group-hover:text-white"
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
