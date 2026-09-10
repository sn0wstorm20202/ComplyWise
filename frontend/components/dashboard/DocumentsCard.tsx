"use client";

import React from "react";
import { FileText, ArrowUpRight } from "lucide-react";

interface DocumentsCardProps {
  onOpen?: () => void;
}

export function DocumentsCard({ onOpen }: DocumentsCardProps) {
  return (
    <div className="bg-white rounded-[28px] p-6 border border-slate-200/60 shadow-xs flex flex-col justify-between h-[280px]">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900">Documents</h3>
          <button
            type="button"
            onClick={onOpen}
            aria-label="View documents"
            className="h-8 w-8 rounded-full bg-slate-100 hover:bg-slate-200/70 flex items-center justify-center text-slate-600 transition-colors"
          >
            <FileText className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Metric Summary */}
        <div className="mt-2.5">
          <div className="text-xs font-medium text-slate-400">Total Documents</div>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="text-3xl font-bold text-slate-900 tracking-tight leading-none">
              11
            </span>
            <span className="text-xs font-medium text-slate-500">on track</span>
          </div>
          <div className="flex items-center gap-1 mt-1 text-xs font-medium text-emerald-600">
            <ArrowUpRight className="h-3.5 w-3.5" />
            <span>3 this week</span>
          </div>
        </div>
      </div>

      {/* Progress Bars Section */}
      <div className="space-y-3.5 pt-2">
        {/* Verified Row */}
        <div className="flex items-center justify-between gap-3 text-xs font-medium">
          <span className="text-slate-600 text-[11px] w-20 shrink-0">Verified</span>
          <div className="flex-1 h-4 rounded-full bg-[#edf0f4] p-0.5 overflow-hidden">
            <div
              className="h-full rounded-full bg-[#cce3d8] transition-all duration-500"
              style={{ width: "72%" }}
            />
          </div>
          <span className="text-slate-900 font-bold text-[11px] w-7 text-right">
            72%
          </span>
        </div>

        {/* Under Review Row */}
        <div className="flex items-center justify-between gap-3 text-xs font-medium">
          <span className="text-slate-600 text-[11px] w-20 shrink-0">Under Review</span>
          <div className="flex-1 h-4 rounded-full bg-[#edf0f4] p-0.5 overflow-hidden">
            <div
              className="h-full rounded-full bg-[#e2e8f0] transition-all duration-500"
              style={{ width: "28%" }}
            />
          </div>
          <span className="text-slate-900 font-bold text-[11px] w-7 text-right">
            28%
          </span>
        </div>
      </div>
    </div>
  );
}

export default DocumentsCard;
