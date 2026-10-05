"use client";

import React from "react";
import { FileText, ArrowUpRight } from "lucide-react";

interface DocumentsCardProps {
  documentsData: {
    totalCount: number;
    onTrackCount: number;
    changeThisWeek: string;
    verifiedPercentage: number;
    underReviewPercentage: number;
  };
  onOpen?: () => void;
}

export function DocumentsCard({
  documentsData,
  onOpen,
}: DocumentsCardProps) {
  return (
    <div
      onClick={onOpen}
      role="button" tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOpen?.(); } }}
      className="bg-white rounded-[20px] p-5 sm:p-6 border border-[var(--ui-border)] shadow-sm flex flex-col justify-between h-full min-h-[270px] cursor-pointer group hover:border-[var(--ui-border-strong)] transition-all select-none w-full"
    >
      {/* Header */}
      <div>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[var(--ui-text)] group-hover:text-[var(--ui-sage)] transition-colors">
            Documents
          </h3>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (onOpen) onOpen();
            }}
            aria-label="View documents"
            className="h-6 w-6 rounded-[6px] bg-[var(--ui-bg)] hover:bg-[var(--ui-inset)] border border-[var(--ui-border)] flex items-center justify-center text-[var(--ui-secondary)] hover:text-[var(--ui-text)] transition-colors"
          >
            <FileText className="h-3 w-3" />
          </button>
        </div>

        {/* Metric Summary */}
        <div className="mt-2.5">
          <div className="text-xs font-normal text-[var(--ui-muted)]">Uploaded documents</div>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="text-3xl sm:text-4xl font-bold text-[var(--ui-text)] tracking-tight leading-none">
              {documentsData.totalCount}
            </span>
            <span className="text-xs text-[var(--ui-muted)]">uploaded</span>
          </div>
          <div className="flex items-center gap-1 mt-1 text-xs font-semibold text-[var(--ui-sage)]">
            <ArrowUpRight className="h-3.5 w-3.5" />
            <span>{documentsData.changeThisWeek}</span>
          </div>
        </div>
      </div>

      {/* Progress Bars Section */}
      <div className="space-y-3 pt-2">
        {/* Verified Row */}
        <div className="flex items-center justify-between gap-2.5 text-xs">
          <span className="text-[var(--ui-secondary)] text-[11px] w-20 shrink-0">Approved</span>
          <div className="flex-1 h-3 rounded-full bg-[var(--ui-inset)] p-0.5 overflow-hidden">
            <div
              className="h-full rounded-full bg-[#A7F3D0] transition-all duration-500"
              style={{ width: `${documentsData.verifiedPercentage}%` }}
            />
          </div>
          <span className="text-[var(--ui-text)] font-semibold text-[11px] w-7 text-right">
            {documentsData.verifiedPercentage}%
          </span>
        </div>

        {/* Awaiting review Row */}
        <div className="flex items-center justify-between gap-2.5 text-xs">
          <span className="text-[var(--ui-secondary)] text-[11px] w-20 shrink-0">Awaiting review</span>
          <div className="flex-1 h-3 rounded-full bg-[var(--ui-inset)] p-0.5 overflow-hidden">
            <div
              className="h-full rounded-full bg-[var(--ui-border)] transition-all duration-500"
              style={{ width: `${documentsData.underReviewPercentage}%` }}
            />
          </div>
          <span className="text-[var(--ui-text)] font-semibold text-[11px] w-7 text-right">
            {documentsData.underReviewPercentage}%
          </span>
        </div>
      </div>
    </div>
  );
}

export default DocumentsCard;
