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

  const stats = categoryBreakdown[selectedCategory] || categoryBreakdown["Overall"];

  return (
    <div className="bg-[#111214] rounded-[14px] p-5 sm:p-6 border border-white/[0.08] shadow-sm flex flex-col justify-between h-[280px] relative select-none">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between">
          <h3 className="text-[15px] font-semibold text-[#F5F5F3]">
            Compliance Status
          </h3>
          <button
            type="button"
            onClick={onExpand}
            aria-label="Expand compliance status"
            className="h-7 w-7 rounded-[8px] bg-[#17191C] hover:bg-white/[0.06] border border-white/[0.08] flex items-center justify-center text-[#A1A1AA] hover:text-[#F5F5F3] transition-colors cursor-pointer"
          >
            <ArrowUpRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Dropdown Pill Button */}
        <div className="mt-2 relative">
          <button
            type="button"
            onClick={() => setIsDropdownOpen((prev) => !prev)}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#17191C] hover:bg-white/[0.06] border border-white/[0.08] text-[#F5F5F3] text-xs font-medium transition-colors cursor-pointer"
          >
            <span>{selectedCategory}</span>
            <ChevronDown className="h-3 w-3 text-[#71717A]" />
          </button>

          {/* Interactive Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute left-0 top-8 z-30 w-52 bg-[#17191C] rounded-[10px] shadow-2xl border border-white/[0.12] p-1.5 space-y-0.5 animate-in fade-in duration-100">
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
                      ? "bg-white/[0.10] text-[#F5F5F3]"
                      : "hover:bg-white/[0.04] text-[#A1A1AA] hover:text-[#F5F5F3]"
                  }`}
                >
                  <span>{cat}</span>
                  {selectedCategory === cat && <Check className="h-3.5 w-3.5 text-accent" />}
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
          <div className="relative z-10 h-[88px] w-[88px] rounded-full bg-[#75D69C] flex flex-col items-center justify-center shadow-[0_0_24px_rgba(117,214,156,0.2)] transition-all duration-500">
            <div className="flex items-baseline">
              <span className="text-2xl font-bold text-[#09090B] tracking-tight">
                {stats.healthPercentage}
              </span>
              <span className="text-xs font-bold text-[#09090B] ml-0.5">%</span>
            </div>
          </div>

          {/* Top-Right Overlapping Bubble */}
          <div className="absolute top-0 right-6 z-20 h-12 w-12 rounded-full bg-[#17191C] border border-white/[0.14] flex items-center justify-center shadow-md transition-all duration-500">
            <span className="text-[11px] font-medium text-[#A1A1AA]">
              {stats.inProgressPercentage}%
            </span>
          </div>

          {/* Bottom-Left Overlapping Bubble */}
          <div className="absolute bottom-0 left-6 z-20 h-10 w-10 rounded-full bg-[#17191C] border border-white/[0.14] flex items-center justify-center shadow-md transition-all duration-500">
            <span className="text-[10px] font-medium text-[#71717A]">
              {stats.overduePercentage}%
            </span>
          </div>
        </div>
      </div>

      {/* Bottom 3-Column Metrics */}
      <div className="grid grid-cols-3 gap-2 pt-2 text-left border-t border-white/[0.06]">
        <div>
          <div className="text-xl sm:text-2xl font-bold text-[#F5F5F3] tracking-tight">
            {stats.compliantCount}
          </div>
          <div className="text-[11px] text-[#71717A] mt-0.5">
            Compliant
          </div>
        </div>

        <div>
          <div className="text-xl sm:text-2xl font-bold text-[#F5F5F3] tracking-tight">
            {stats.inProgressCount}
          </div>
          <div className="text-[11px] text-[#71717A] mt-0.5">
            In Progress
          </div>
        </div>

        <div>
          <div className="text-xl sm:text-2xl font-bold text-[#ED7C7C] tracking-tight">
            {stats.overdueCount}
          </div>
          <div className="text-[11px] text-[#71717A] mt-0.5">
            Overdue
          </div>
        </div>
      </div>
    </div>
  );
}

export default ComplianceStatusCard;
