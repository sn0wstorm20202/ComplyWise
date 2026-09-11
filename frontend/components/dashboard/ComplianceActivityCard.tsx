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
    <div className="bg-[#101114] rounded-[14px] p-5 sm:p-6 border border-white/[0.08] shadow-lg flex flex-col justify-between h-full min-h-[270px] relative select-none">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between gap-1">
          <h3 className="text-sm font-semibold text-[#F2F2F0] whitespace-nowrap">
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
                  ? "bg-white/[0.12] border-white/[0.16] text-[#F2F2F0]"
                  : "bg-[#141519] hover:bg-white/[0.08] border-white/[0.08] text-[#A4A5AA] hover:text-[#F2F2F0]"
              }`}
            >
              <ArrowUpDown className="h-3 w-3" />
            </button>
            <button
              type="button"
              onClick={onExpand}
              aria-label="Expand activity details"
              className="h-6 w-6 rounded-[6px] bg-[#141519] hover:bg-white/[0.08] border border-white/[0.08] flex items-center justify-center text-[#A4A5AA] hover:text-[#F2F2F0] transition-colors cursor-pointer"
            >
              <ArrowUpRight className="h-3 w-3" />
            </button>
          </div>
        </div>

        {/* Metric Summary */}
        <div className="mt-2.5 flex items-baseline justify-between">
          <div>
            <div className="text-xs font-normal text-[#71717A]">This week</div>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-3xl font-bold text-[#F5F5F3] tracking-tight leading-none">
                {activityData.weeklyTasks}
              </span>
              <span className="text-xs text-[#71717A]">tasks</span>
            </div>
          </div>

          {/* Growth Highlight Pill */}
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-[#75D69C]/15 border border-[#75D69C]/30 text-[#75D69C] font-medium text-xs">
            {activityData.growthPercentage}
          </span>
        </div>
      </div>

      {/* Interactive 7-Day Bar Chart */}
      <div className="mt-2 relative">
        {/* Floating Tooltip */}
        {hoveredDay && (
          <div className="absolute -top-7 left-1/2 -translate-x-1/2 z-20 bg-[#17191C] border border-white/[0.12] text-[#F5F5F3] text-[10px] font-medium px-2.5 py-1 rounded-full shadow-lg pointer-events-none whitespace-nowrap">
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
                  className={`w-full max-w-[24px] rounded-full transition-all duration-300 group-hover:scale-y-105 origin-bottom ${
                    d.isHighlight
                      ? "bg-[#75D69C] group-hover:bg-[#8ce6b0] shadow-sm"
                      : "bg-white/[0.08] group-hover:bg-white/[0.15]"
                  }`}
                  style={{ height: `${heightPercent}%` }}
                />
                <span
                  className={`text-[11px] transition-colors ${
                    d.isHighlight ? "text-[#F5F5F3] font-semibold" : "text-[#71717A] group-hover:text-[#A1A1AA]"
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
