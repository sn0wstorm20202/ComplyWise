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
    <div className="bg-white rounded-[20px] p-5 sm:p-6 border border-[#E5E7EB] shadow-sm flex flex-col justify-between h-full min-h-[270px] relative select-none w-full">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between gap-1">
          <h3 className="text-sm font-semibold text-[#111827] whitespace-nowrap">
            Compliance Status
          </h3>
          <button
            type="button"
            onClick={onExpand}
            aria-label="Expand compliance status"
            className="h-6 w-6 rounded-[6px] bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-[#E2E8F0] flex items-center justify-center text-[#64748B] hover:text-[#111827] transition-colors cursor-pointer"
          >
            <ArrowUpRight className="h-3 w-3" />
          </button>
        </div>

        {/* Dropdown Pill Button */}
        <div className="mt-2 relative">
          <button
            type="button"
            onClick={() => setIsDropdownOpen((prev) => !prev)}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white hover:bg-[#F8FAFC] border border-[#E2E8F0] text-[#111827] text-xs font-medium transition-colors cursor-pointer shadow-2xs"
          >
            <span>{selectedCategory}</span>
            <ChevronDown className="h-3 w-3 text-[#64748B]" />
          </button>

          {/* Interactive Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute left-0 top-8 z-30 w-52 bg-white rounded-[12px] shadow-2xl border border-[#E2E8F0] p-1.5 space-y-0.5 animate-in fade-in duration-100">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    setSelectedCategory(cat);
                    setIsDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 rounded-[8px] text-xs font-medium flex items-center justify-between transition-colors ${
                    selectedCategory === cat
                      ? "bg-[#F1F5F9] text-[#111827] font-semibold"
                      : "hover:bg-[#F8FAFC] text-[#64748B] hover:text-[#111827]"
                  }`}
                >
                  <span>{cat}</span>
                  {selectedCategory === cat && <Check className="h-3.5 w-3.5 text-indigo-600" />}
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
          <div className="relative z-10 h-[88px] w-[88px] rounded-full bg-[#5EEAD4] flex flex-col items-center justify-center shadow-[0_4px_20px_rgba(94,234,212,0.35)] transition-all duration-500">
            <div className="flex items-baseline">
              <span className="text-2xl font-bold text-[#0F172A] tracking-tight">
                {stats.healthPercentage}
              </span>
              <span className="text-xs font-bold text-[#0F172A] ml-0.5">%</span>
            </div>
          </div>

          {/* Top-Right Overlapping Bubble */}
          <div className="absolute top-0 right-6 z-20 h-12 w-12 rounded-full bg-[#E0F2FE] border border-[#BAE6FD] flex items-center justify-center shadow-xs transition-all duration-500">
            <span className="text-[11px] font-bold text-[#0369A1]">
              {stats.inProgressPercentage}%
            </span>
          </div>

          {/* Bottom-Left Overlapping Bubble */}
          <div className="absolute bottom-0 left-6 z-20 h-10 w-10 rounded-full bg-[#F1F5F9] border border-[#E2E8F0] flex items-center justify-center shadow-xs transition-all duration-500">
            <span className="text-[10px] font-bold text-[#475569]">
              {stats.overduePercentage}%
            </span>
          </div>
        </div>
      </div>

      {/* Bottom 3-Column Metrics */}
      <div className="grid grid-cols-3 gap-2 pt-2 text-left border-t border-[#F0F2F5]">
        <div>
          <div className="text-xl sm:text-2xl font-bold text-[#111827] tracking-tight">
            {stats.compliantCount}
          </div>
          <div className="text-[11px] text-[#6B7280] mt-0.5">
            Compliant
          </div>
        </div>

        <div>
          <div className="text-xl sm:text-2xl font-bold text-[#111827] tracking-tight">
            {stats.inProgressCount}
          </div>
          <div className="text-[11px] text-[#6B7280] mt-0.5">
            In Progress
          </div>
        </div>

        <div>
          <div className="text-xl sm:text-2xl font-bold text-[#EF4444] tracking-tight">
            {stats.overdueCount}
          </div>
          <div className="text-[11px] text-[#6B7280] mt-0.5">
            Overdue
          </div>
        </div>
      </div>
    </div>
  );
}

export default ComplianceStatusCard;
