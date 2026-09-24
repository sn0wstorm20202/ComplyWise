"use client";

import React, { useState } from "react";
import { ArrowUpRight, ChevronDown, Check } from "lucide-react";
import { ComplianceCategoryStats } from "@/data/demo";

interface ComplianceStatusCardProps {
  categoryBreakdown?: Record<string, ComplianceCategoryStats>;
  onExpand?: () => void;
}

export function ComplianceStatusCard({
  categoryBreakdown = {
    Overall: {
      category: "Overall",
      healthPercentage: 82,
      compliantCount: 140,
      inProgressCount: 48,
      overdueCount: 16,
      inProgressPercentage: 10,
      overduePercentage: 8,
    },
    "Electrical / Machinery": {
      category: "Electrical / Machinery",
      healthPercentage: 79,
      compliantCount: 78,
      inProgressCount: 24,
      overdueCount: 9,
      inProgressPercentage: 12,
      overduePercentage: 9,
    },
    "Food Safety & FSSAI": {
      category: "Food Safety & FSSAI",
      healthPercentage: 91,
      compliantCount: 48,
      inProgressCount: 12,
      overdueCount: 3,
      inProgressPercentage: 6,
      overduePercentage: 3,
    },
    "Environment & Pollution": {
      category: "Environment & Pollution",
      healthPercentage: 94,
      compliantCount: 36,
      inProgressCount: 8,
      overdueCount: 2,
      inProgressPercentage: 4,
      overduePercentage: 2,
    },
  },
  onExpand,
}: ComplianceStatusCardProps) {
  const categories = Object.keys(categoryBreakdown);
  const [selectedCategory, setSelectedCategory] = useState<string>("Overall");
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);

  React.useEffect(() => {
    if (!categoryBreakdown[selectedCategory]) {
      setSelectedCategory("Overall");
    }
  }, [categoryBreakdown, selectedCategory]);

  const stats = categoryBreakdown[selectedCategory] || categoryBreakdown["Overall"] || Object.values(categoryBreakdown)[0];

  return (
    <div className="bg-white dark:bg-[#0E1318] rounded-[20px] p-5 sm:p-6 border border-[#E2E8F0] dark:border-white/12 shadow-sm flex flex-col justify-between h-full min-h-[270px] relative select-none w-full transition-colors">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between gap-1">
          <h3 className="text-base font-bold text-[#0B1220] dark:text-[#F7F9FC] whitespace-nowrap">
            Compliance Status
          </h3>
          <button
            type="button"
            onClick={onExpand}
            aria-label="Expand compliance status"
            className="h-7 w-7 rounded-lg bg-[#F8FAFD] dark:bg-[#141A21] hover:bg-[#F1F5F9] dark:hover:bg-white/10 border border-[#E2E8F0] dark:border-white/15 flex items-center justify-center text-[#475569] dark:text-[#D4DBE4] hover:text-[#0B1220] dark:hover:text-white transition-colors cursor-pointer"
          >
            <ArrowUpRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Dropdown Pill Button */}
        <div className="mt-2.5 relative">
          <button
            type="button"
            onClick={() => setIsDropdownOpen((prev) => !prev)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white dark:bg-[#141A21] hover:bg-[#F8FAFD] dark:hover:bg-white/10 border border-[#E2E8F0] dark:border-white/15 text-[#0B1220] dark:text-[#F7F9FC] text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
          >
            <span>{selectedCategory}</span>
            <ChevronDown className="h-3.5 w-3.5 text-[#475569] dark:text-[#A8B2BE]" />
          </button>

          {/* Interactive Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute left-0 top-9 z-30 w-56 bg-white dark:bg-[#141A21] rounded-2xl shadow-2xl border border-[#E2E8F0] dark:border-white/15 p-1.5 space-y-0.5 animate-in fade-in duration-100 text-xs">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    setSelectedCategory(cat);
                    setIsDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium flex items-center justify-between transition-colors ${
                    selectedCategory === cat
                      ? "bg-[#F1F5F9] dark:bg-white/10 text-[#0B1220] dark:text-[#F7F9FC] font-semibold"
                      : "hover:bg-[#F8FAFD] dark:hover:bg-white/5 text-[#334155] dark:text-[#D4DBE4] hover:text-[#0B1220] dark:hover:text-white"
                  }`}
                >
                  <span>{cat}</span>
                  {selectedCategory === cat && <Check className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bubble Cluster Graphic */}
      <div className="relative h-24 flex items-center justify-center my-auto">
        <div className="relative w-48 h-24 flex items-center justify-center">
          {/* Main Central Turquoise/Mint Bubble */}
          <div className="relative z-10 h-[88px] w-[88px] rounded-full bg-[#5EEAD4] dark:bg-[#0D9488] flex flex-col items-center justify-center shadow-[0_4px_20px_rgba(94,234,212,0.35)] dark:shadow-[0_4px_20px_rgba(13,148,136,0.4)] transition-all duration-500">
            <div className="flex items-baseline">
              <span className="text-2xl font-bold text-[#0B1220] dark:text-white tracking-tight">
                {stats.healthPercentage}
              </span>
              <span className="text-xs font-bold text-[#0B1220] dark:text-white ml-0.5">%</span>
            </div>
          </div>

          {/* Top-Right Overlapping Bubble */}
          <div className="absolute top-0 right-6 z-20 h-12 w-12 rounded-full bg-[#E0F2FE] dark:bg-blue-500/25 border border-[#BAE6FD] dark:border-blue-500/35 flex items-center justify-center shadow-xs transition-all duration-500">
            <span className="text-xs font-bold text-[#0369A1] dark:text-blue-200">
              {stats.inProgressPercentage}%
            </span>
          </div>

          {/* Bottom-Left Overlapping Bubble */}
          <div className="absolute bottom-0 left-6 z-20 h-10 w-10 rounded-full bg-[#F1F5F9] dark:bg-white/15 border border-[#E2E8F0] dark:border-white/20 flex items-center justify-center shadow-xs transition-all duration-500">
            <span className="text-xs font-bold text-[#334155] dark:text-slate-100">
              {stats.overduePercentage}%
            </span>
          </div>
        </div>
      </div>

      {/* Bottom 3-Column Metrics */}
      <div className="grid grid-cols-3 gap-2 pt-3 text-left border-t border-[#E2E8F0] dark:border-white/10">
        <div>
          <div className="text-xl sm:text-2xl font-extrabold text-[#0B1220] dark:text-[#F7F9FC] tracking-tight">
            {stats.compliantCount}
          </div>
          <div className="text-xs font-semibold text-[#475569] dark:text-[#A8B2BE] mt-0.5">
            Compliant
          </div>
        </div>

        <div>
          <div className="text-xl sm:text-2xl font-extrabold text-[#0B1220] dark:text-[#F7F9FC] tracking-tight">
            {stats.inProgressCount}
          </div>
          <div className="text-xs font-semibold text-[#475569] dark:text-[#A8B2BE] mt-0.5">
            In Progress
          </div>
        </div>

        <div>
          <div className="text-xl sm:text-2xl font-extrabold text-rose-600 dark:text-rose-400 tracking-tight">
            {stats.overdueCount}
          </div>
          <div className="text-xs font-semibold text-[#475569] dark:text-[#A8B2BE] mt-0.5">
            Overdue
          </div>
        </div>
      </div>
    </div>
  );
}

export default ComplianceStatusCard;
