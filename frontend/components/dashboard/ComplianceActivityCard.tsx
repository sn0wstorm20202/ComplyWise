"use client";

import React, { useState } from "react";
import { ArrowUpDown, ArrowUpRight } from "lucide-react";
import { ActivityDay } from "@/data/demo";

interface ComplianceActivityCardProps {
  activityData: {
    weeklyTasks: number;
    growthPercentage: string;
    maxTasks: number;
    daily: ActivityDay[];
  };
  onSort?: () => void;
  onExpand?: () => void;
}

export function ComplianceActivityCard({
  activityData,
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
    <div className="bg-white rounded-[20px] p-5 sm:p-6 border border-[var(--ui-border)] shadow-sm flex flex-col justify-between h-full min-h-[270px] relative select-none w-full">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between gap-1">
          <h3 className="text-sm font-semibold text-[var(--ui-text)] whitespace-nowrap">
            Workspace activity
          </h3>
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={handleSortClick}
              title={`Sort: currently ${sortOrder === "standard" ? "Chronological" : "By Volume"}`}
              aria-label="Sort activity"
              className={`h-6 w-6 rounded-[6px] flex items-center justify-center transition-colors cursor-pointer border ${
                sortOrder === "volume"
                  ? "bg-[var(--ui-text)] border-[var(--ui-text)] text-white"
                  : "bg-[var(--ui-bg)] hover:bg-[var(--ui-inset)] border-[var(--ui-border)] text-[var(--ui-secondary)] hover:text-[var(--ui-text)]"
              }`}
            >
              <ArrowUpDown className="h-3 w-3" />
            </button>
            <button
              type="button"
              onClick={onExpand}
              aria-label="Expand activity details"
              className="h-6 w-6 rounded-[6px] bg-[var(--ui-bg)] hover:bg-[var(--ui-inset)] border border-[var(--ui-border)] flex items-center justify-center text-[var(--ui-secondary)] hover:text-[var(--ui-text)] transition-colors cursor-pointer"
            >
              <ArrowUpRight className="h-3 w-3" />
            </button>
          </div>
        </div>

        {/* Metric Summary */}
        <div className="mt-2.5 flex items-baseline justify-between">
          <div>
            <div className="text-xs font-normal text-[var(--ui-muted)]">Last seven days</div>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-3xl sm:text-4xl font-bold text-[var(--ui-text)] tracking-tight leading-none">
                {activityData.weeklyTasks}
              </span>
              <span className="text-xs text-[var(--ui-muted)]">events</span>
            </div>
          </div>

          {/* Growth Highlight Pill */}
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-[var(--ui-sage-soft)] text-[var(--ui-sage)] font-semibold text-xs shadow-2xs">
            {activityData.growthPercentage}
          </span>
        </div>
      </div>

      {/* Interactive 7-Day Bar Chart */}
      <div className="mt-2 relative">
        {/* Floating Tooltip */}
        {hoveredDay && (
          <div className="absolute -top-7 left-1/2 -translate-x-1/2 z-20 bg-[var(--ui-text)] text-white text-[10px] font-medium px-2.5 py-1 rounded-full shadow-lg pointer-events-none whitespace-nowrap">
            {hoveredDay.day} ({hoveredDay.dateStr}): {hoveredDay.tasks} recorded events
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
                      : "bg-[#EEF2F6] group-hover:bg-[var(--ui-border)]"
                  }`}
                  style={{ height: `${heightPercent}%` }}
                />
                <span
                  className={`text-[11px] transition-colors ${
                    isHighlighted ? "text-[var(--ui-text)] font-bold" : "text-[var(--ui-muted)] group-hover:text-[#4B5563]"
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
