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
      className="bg-white rounded-[20px] p-5 sm:p-6 border border-[#E5E7EB] shadow-sm flex flex-col justify-between h-full min-h-[270px] cursor-pointer group hover:border-[#CBD5E1] transition-all select-none w-full"
    >
      {/* Header */}
      <div>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[#111827] group-hover:text-indigo-600 transition-colors">
            Documents
          </h3>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (onOpen) onOpen();
            }}
            aria-label="View documents"
            className="h-6 w-6 rounded-[6px] bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-[#E2E8F0] flex items-center justify-center text-[#64748B] hover:text-[#111827] transition-colors"
          >
            <FileText className="h-3 w-3" />
          </button>
        </div>

        {/* Metric Summary */}
        <div className="mt-2.5">
          <div className="text-xs font-normal text-[#9CA3AF]">Total Documents</div>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="text-3xl sm:text-4xl font-bold text-[#111827] tracking-tight leading-none">
              {documentsData.totalCount}
            </span>
            <span className="text-xs text-[#9CA3AF]">on track</span>
          </div>
          <div className="flex items-center gap-1 mt-1 text-xs font-semibold text-[#059669]">
            <ArrowUpRight className="h-3.5 w-3.5" />
            <span>{documentsData.changeThisWeek}</span>
          </div>
        </div>
      </div>

      {/* Progress Bars Section */}
      <div className="space-y-3 pt-2">
        {/* Verified Row */}
        <div className="flex items-center justify-between gap-2.5 text-xs">
          <span className="text-[#6B7280] text-[11px] w-20 shrink-0">Verified</span>
          <div className="flex-1 h-3 rounded-full bg-[#F1F5F9] p-0.5 overflow-hidden">
            <div
              className="h-full rounded-full bg-[#A7F3D0] transition-all duration-500"
              style={{ width: `${documentsData.verifiedPercentage}%` }}
            />
          </div>
          <span className="text-[#111827] font-semibold text-[11px] w-7 text-right">
            {documentsData.verifiedPercentage}%
          </span>
        </div>

        {/* Under Review Row */}
        <div className="flex items-center justify-between gap-2.5 text-xs">
          <span className="text-[#6B7280] text-[11px] w-20 shrink-0">Under Review</span>
          <div className="flex-1 h-3 rounded-full bg-[#F1F5F9] p-0.5 overflow-hidden">
            <div
              className="h-full rounded-full bg-[#E2E8F0] transition-all duration-500"
              style={{ width: `${documentsData.underReviewPercentage}%` }}
            />
          </div>
          <span className="text-[#111827] font-semibold text-[11px] w-7 text-right">
            {documentsData.underReviewPercentage}%
          </span>
        </div>
      </div>
    </div>
  );
}

export default DocumentsCard;
