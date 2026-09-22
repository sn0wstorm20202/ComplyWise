"use client";

import React from "react";
import { FileText, ArrowUpRight } from "lucide-react";

interface DocumentsCardProps {
  documentsData?: {
    totalCount: number;
    onTrackCount: number;
    changeThisWeek: string;
    verifiedPercentage: number;
    underReviewPercentage: number;
  };
  onOpen?: () => void;
}

export function DocumentsCard({
  documentsData = {
    totalCount: 11,
    onTrackCount: 11,
    changeThisWeek: "3 this week",
    verifiedPercentage: 72,
    underReviewPercentage: 28,
  },
  onOpen,
}: DocumentsCardProps) {
  return (
    <div
      onClick={onOpen}
      className="bg-white dark:bg-[#0E1318] rounded-[20px] p-5 sm:p-6 border border-[#E2E8F0] dark:border-white/12 shadow-sm flex flex-col justify-between h-full min-h-[270px] cursor-pointer group hover:border-slate-300 dark:hover:border-white/25 transition-all select-none w-full"
    >
      {/* Header */}
      <div>
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-[#0B1220] dark:text-[#F7F9FC] group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            Documents
          </h3>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (onOpen) onOpen();
            }}
            aria-label="View documents"
            className="h-7 w-7 rounded-lg bg-[#F8FAFD] dark:bg-[#141A21] hover:bg-[#F1F5F9] dark:hover:bg-white/10 border border-[#E2E8F0] dark:border-white/15 flex items-center justify-center text-[#475569] dark:text-[#D4DBE4] hover:text-[#0B1220] dark:hover:text-white transition-colors"
          >
            <FileText className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Metric Summary */}
        <div className="mt-3">
          <div className="text-xs font-semibold text-[#475569] dark:text-[#A8B2BE]">Total Documents</div>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="text-3xl sm:text-4xl font-extrabold text-[#0B1220] dark:text-[#F7F9FC] tracking-tight leading-none">
              {documentsData.totalCount}
            </span>
            <span className="text-xs font-medium text-[#475569] dark:text-[#A8B2BE]">on track</span>
          </div>
          <div className="flex items-center gap-1 mt-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
            <ArrowUpRight className="h-3.5 w-3.5" />
            <span>{documentsData.changeThisWeek}</span>
          </div>
        </div>
      </div>

      {/* Progress Bars Section */}
      <div className="space-y-3 pt-3">
        {/* Verified Row */}
        <div className="flex items-center justify-between gap-2.5 text-xs">
          <span className="text-[#334155] dark:text-[#D4DBE4] font-semibold text-xs w-24 shrink-0">Verified</span>
          <div className="flex-1 h-3 rounded-full bg-[#F1F5F9] dark:bg-white/10 p-0.5 overflow-hidden">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${documentsData.verifiedPercentage}%` }}
            />
          </div>
          <span className="text-[#0B1220] dark:text-[#F7F9FC] font-bold text-xs w-8 text-right font-mono">
            {documentsData.verifiedPercentage}%
          </span>
        </div>

        {/* Under Review Row */}
        <div className="flex items-center justify-between gap-2.5 text-xs">
          <span className="text-[#334155] dark:text-[#D4DBE4] font-semibold text-xs w-24 shrink-0">Under Review</span>
          <div className="flex-1 h-3 rounded-full bg-[#F1F5F9] dark:bg-white/10 p-0.5 overflow-hidden">
            <div
              className="h-full rounded-full bg-amber-400 dark:bg-amber-500 transition-all duration-500"
              style={{ width: `${documentsData.underReviewPercentage}%` }}
            />
          </div>
          <span className="text-[#0B1220] dark:text-[#F7F9FC] font-bold text-xs w-8 text-right font-mono">
            {documentsData.underReviewPercentage}%
          </span>
        </div>
      </div>
    </div>
  );
}

export default DocumentsCard;
