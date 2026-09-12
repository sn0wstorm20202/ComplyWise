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
    <div className="bg-white rounded-[20px] p-5 sm:p-6 border border-[#E5E7EB] shadow-sm flex flex-col justify-between h-full min-h-[270px] relative select-none w-full">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between gap-1">
          <h3 className="text-sm font-semibold text-[#111827] whitespace-nowrap">
            Compliance Activity
          </h3>
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={handleSortClick}
              title={`Sort: currently ${sortOrder === "standard" ? "Chronological" : "By Volume"}`}
              aria-label="Sort activity"
              className={`h-6 w-6 rounded-[6px] flex items-center justify-center transition-colors cursor-pointer border ${
                sortOrder === "volume"
                  ? "bg-[#18181B] border-[#18181B] text-white"
                  : "bg-[#F8FAFC] hover:bg-[#F1F5F9] border-[#E2E8F0] text-[#64748B] hover:text-[#111827]"
              }`}
            >
              <ArrowUpDown className="h-3 w-3" />
            </button>
            <button
              type="button"
              onClick={onExpand}
              aria-label="Expand activity details"
              className="h-6 w-6 rounded-[6px] bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-[#E2E8F0] flex items-center justify-center text-[#64748B] hover:text-[#111827] transition-colors cursor-pointer"
            >
              <ArrowUpRight className="h-3 w-3" />
            </button>
          </div>
        </div>

        {/* Metric Summary */}
        <div className="mt-2.5 flex items-baseline justify-between">
          <div>
            <div className="text-xs font-normal text-[#9CA3AF]">This week</div>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-3xl sm:text-4xl font-bold text-[#111827] tracking-tight leading-none">
                {activityData.weeklyTasks}
              </span>
              <span className="text-xs text-[#9CA3AF]">tasks</span>
            </div>
          </div>

          {/* Growth Highlight Pill */}
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-[#E5F77D] text-[#3F6212] font-semibold text-xs shadow-2xs">
            {activityData.growthPercentage}
          </span>
        </div>
      </div>

      {/* Interactive 7-Day Bar Chart */}
      <div className="mt-2 relative">
        {/* Floating Tooltip */}
        {hoveredDay && (
          <div className="absolute -top-7 left-1/2 -translate-x-1/2 z-20 bg-[#18181B] text-white text-[10px] font-medium px-2.5 py-1 rounded-full shadow-lg pointer-events-none whitespace-nowrap">
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
                      ? "bg-[#D4F66C] group-hover:bg-[#C9EE5B] shadow-2xs"
                      : "bg-[#EEF2F6] group-hover:bg-[#E2E8F0]"
                  }`}
                  style={{ height: `${heightPercent}%` }}
                />
                <span
                  className={`text-[11px] transition-colors ${
                    isHighlighted ? "text-[#111827] font-bold" : "text-[#9CA3AF] group-hover:text-[#4B5563]"
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
