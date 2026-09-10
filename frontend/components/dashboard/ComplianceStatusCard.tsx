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
    <div className="bg-white rounded-[28px] p-6 border border-slate-200/60 shadow-xs flex flex-col justify-between h-[280px] relative">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900">
            Compliance Status
          </h3>
          <button
            type="button"
            onClick={onExpand}
            aria-label="Expand compliance status"
            className="h-8 w-8 rounded-full bg-slate-100 hover:bg-slate-200/70 flex items-center justify-center text-slate-600 transition-colors"
          >
            <ArrowUpRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Dropdown Pill Button */}
        <div className="mt-2 relative">
          <button
            type="button"
            onClick={() => setIsDropdownOpen((prev) => !prev)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#f1f5f9] hover:bg-slate-200/80 text-slate-700 text-xs font-semibold transition-colors"
          >
            <span>{selectedCategory}</span>
            <ChevronDown className="h-3 w-3 text-slate-400" />
          </button>

          {/* Interactive Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute left-0 top-8 z-30 w-52 bg-white rounded-2xl shadow-xl border border-slate-200 p-1.5 space-y-0.5 animate-in fade-in duration-100">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    setSelectedCategory(cat);
                    setIsDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 rounded-xl text-xs font-medium flex items-center justify-between transition-colors ${
                    selectedCategory === cat
                      ? "bg-indigo-50 text-indigo-700 font-bold"
                      : "hover:bg-slate-50 text-slate-700"
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
      <div className="relative h-28 flex items-center justify-center my-auto">
        <div className="relative w-52 h-28 flex items-center justify-center">
          {/* Main Central Mint Bubble */}
          <div className="relative z-10 h-[100px] w-[100px] rounded-full bg-[#82ded8] flex flex-col items-center justify-center shadow-xs transition-all duration-500">
            <div className="flex items-baseline">
              <span className="text-3xl font-bold text-slate-950 tracking-tight">
                {stats.healthPercentage}
              </span>
              <span className="text-sm font-bold text-slate-950 ml-0.5">%</span>
            </div>
          </div>

          {/* Top-Right Overlapping Bubble */}
          <div className="absolute top-0 right-7 z-20 h-14 w-14 rounded-full bg-[#f2fbf9]/90 border border-white/80 flex items-center justify-center shadow-2xs transition-all duration-500">
            <span className="text-xs font-semibold text-slate-600">
              {stats.inProgressPercentage}%
            </span>
          </div>

          {/* Bottom-Left Overlapping Bubble */}
          <div className="absolute bottom-0 left-7 z-20 h-11 w-11 rounded-full bg-[#f0f8f6]/90 border border-white/80 flex items-center justify-center shadow-2xs transition-all duration-500">
            <span className="text-[11px] font-semibold text-slate-500">
              {stats.overduePercentage}%
            </span>
          </div>
        </div>
      </div>

      {/* Bottom 3-Column Metrics (Clean whitespace separation, no vertical borders) */}
      <div className="grid grid-cols-3 gap-3 pt-3 text-left">
        <div>
          <div className="text-2xl font-bold text-slate-950 tracking-tight">
            {stats.compliantCount}
          </div>
          <div className="text-[11px] font-medium text-slate-400 mt-0.5">
            Compliant
          </div>
        </div>

        <div>
          <div className="text-2xl font-bold text-slate-950 tracking-tight">
            {stats.inProgressCount}
          </div>
          <div className="text-[11px] font-medium text-slate-400 mt-0.5">
            In Progress
          </div>
        </div>

        <div>
          <div className="text-2xl font-bold text-slate-950 tracking-tight">
            {stats.overdueCount}
          </div>
          <div className="text-[11px] font-medium text-slate-400 mt-0.5">
            Overdue
          </div>
        </div>
      </div>
    </div>
  );
}

export default ComplianceStatusCard;
