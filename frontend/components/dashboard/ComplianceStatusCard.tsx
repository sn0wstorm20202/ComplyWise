"use client";

import React, { useState } from "react";
import { ArrowUpRight, ChevronDown } from "lucide-react";

interface ComplianceStatusCardProps {
  onExpand?: () => void;
}

export function ComplianceStatusCard({ onExpand }: ComplianceStatusCardProps) {
  const [filter, setFilter] = useState("Overall");

  return (
    <div className="bg-white rounded-[28px] p-6 border border-slate-200/60 shadow-xs flex flex-col justify-between h-[280px]">
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
        <div className="mt-2">
          <button
            type="button"
            className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#f1f5f9] hover:bg-slate-200/80 text-slate-700 text-xs font-semibold transition-colors"
          >
            <span>{filter}</span>
            <ChevronDown className="h-3 w-3 text-slate-400" />
          </button>
        </div>
      </div>

      {/* Bubble Cluster Graphic */}
      <div className="relative h-28 flex items-center justify-center my-auto">
        <div className="relative w-52 h-28 flex items-center justify-center">
          {/* Main Central Mint Bubble (82%) */}
          <div className="relative z-10 h-[100px] w-[100px] rounded-full bg-[#82ded8] flex flex-col items-center justify-center shadow-xs">
            <div className="flex items-baseline">
              <span className="text-3xl font-bold text-slate-950 tracking-tight">
                82
              </span>
              <span className="text-sm font-bold text-slate-950 ml-0.5">%</span>
            </div>
          </div>

          {/* Top-Right Overlapping Bubble (10%) */}
          <div className="absolute top-0 right-7 z-20 h-14 w-14 rounded-full bg-[#f2fbf9]/90 border border-white/80 flex items-center justify-center shadow-2xs">
            <span className="text-xs font-semibold text-slate-600">10%</span>
          </div>

          {/* Bottom-Left Overlapping Bubble (8%) */}
          <div className="absolute bottom-0 left-7 z-20 h-11 w-11 rounded-full bg-[#f0f8f6]/90 border border-white/80 flex items-center justify-center shadow-2xs">
            <span className="text-[11px] font-semibold text-slate-500">8%</span>
          </div>
        </div>
      </div>

      {/* Bottom 3-Column Metrics (Clean whitespace separation, no vertical borders) */}
      <div className="grid grid-cols-3 gap-3 pt-3 text-left">
        <div>
          <div className="text-2xl font-bold text-slate-950 tracking-tight">140</div>
          <div className="text-[11px] font-medium text-slate-400 mt-0.5">
            Compliant
          </div>
        </div>

        <div>
          <div className="text-2xl font-bold text-slate-950 tracking-tight">48</div>
          <div className="text-[11px] font-medium text-slate-400 mt-0.5">
            In Progress
          </div>
        </div>

        <div>
          <div className="text-2xl font-bold text-slate-950 tracking-tight">16</div>
          <div className="text-[11px] font-medium text-slate-400 mt-0.5">
            Overdue
          </div>
        </div>
      </div>
    </div>
  );
}

export default ComplianceStatusCard;
