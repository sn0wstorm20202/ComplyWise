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
      className="bg-[#101114] rounded-[14px] p-5 sm:p-6 border border-white/[0.08] shadow-lg flex flex-col justify-between h-full min-h-[270px] cursor-pointer group hover:border-white/[0.14] transition-all select-none"
    >
      {/* Header */}
      <div>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[#F2F2F0] group-hover:text-[#6E82FF] transition-colors">
            Documents
          </h3>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (onOpen) onOpen();
            }}
            aria-label="View documents"
            className="h-6 w-6 rounded-[6px] bg-[#141519] hover:bg-white/[0.08] border border-white/[0.08] flex items-center justify-center text-[#A4A5AA] hover:text-[#F2F2F0] transition-colors"
          >
            <FileText className="h-3 w-3" />
          </button>
        </div>

        {/* Metric Summary */}
        <div className="mt-2.5">
          <div className="text-xs font-normal text-[#71717A]">Total Documents</div>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="text-3xl font-bold text-[#F5F5F3] tracking-tight leading-none">
              {documentsData.totalCount}
            </span>
            <span className="text-xs text-[#71717A]">on track</span>
          </div>
          <div className="flex items-center gap-1 mt-1 text-xs font-medium text-[#75D69C]">
            <ArrowUpRight className="h-3.5 w-3.5" />
            <span>{documentsData.changeThisWeek}</span>
          </div>
        </div>
      </div>

      {/* Progress Bars Section */}
      <div className="space-y-3 pt-2">
        {/* Verified Row */}
        <div className="flex items-center justify-between gap-2.5 text-xs">
          <span className="text-[#A1A1AA] text-[11px] w-20 shrink-0">Verified</span>
          <div className="flex-1 h-3 rounded-full bg-white/[0.06] p-0.5 overflow-hidden">
            <div
              className="h-full rounded-full bg-[#75D69C] transition-all duration-500"
              style={{ width: `${documentsData.verifiedPercentage}%` }}
            />
          </div>
          <span className="text-[#F5F5F3] font-medium text-[11px] w-7 text-right">
            {documentsData.verifiedPercentage}%
          </span>
        </div>

        {/* Under Review Row */}
        <div className="flex items-center justify-between gap-2.5 text-xs">
          <span className="text-[#A1A1AA] text-[11px] w-20 shrink-0">Under Review</span>
          <div className="flex-1 h-3 rounded-full bg-white/[0.06] p-0.5 overflow-hidden">
            <div
              className="h-full rounded-full bg-white/[0.22] transition-all duration-500"
              style={{ width: `${documentsData.underReviewPercentage}%` }}
            />
          </div>
          <span className="text-[#F5F5F3] font-medium text-[11px] w-7 text-right">
            {documentsData.underReviewPercentage}%
          </span>
        </div>
      </div>
    </div>
  );
}

export default DocumentsCard;
