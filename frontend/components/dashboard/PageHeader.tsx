"use client";

import React from "react";
import { Folder, ChevronRight, ArrowUpDown, Calendar, ChevronDown, Plus } from "lucide-react";
import SearchControl from "./SearchControl";

export interface PageHeaderProps {
  title?: string;
  breadcrumb?: { label: string; href?: string }[];
  selectedDateRange?: string;
  onOpenSearch?: () => void;
  onToggleSort?: () => void;
  onOpenDateRange?: () => void;
  onAddWidget?: () => void;
  onCreateReport?: () => void;
}

export function PageHeader({
  title = "Compliance Dashboard",
  breadcrumb = [
    { label: "Home Page", href: "/" },
    { label: "Dashboard", href: "/dashboard" },
  ],
  selectedDateRange = "20-27 Jan 2025",
  onOpenSearch,
  onToggleSort,
  onOpenDateRange,
  onAddWidget,
  onCreateReport,
}: PageHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pt-1 select-none">
      {/* Left: Breadcrumb + Page Title */}
      <div className="space-y-1">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-xs text-[#475569] dark:text-[#A8B2BE] font-medium">
          <Folder className="h-3.5 w-3.5 text-[#475569] dark:text-[#A8B2BE]" />
          <span>{breadcrumb[0]?.label || "Home Page"}</span>
          <ChevronRight className="h-3 w-3 text-[#CBD5E1] dark:text-white/20" />
          <Folder className="h-3.5 w-3.5 text-[#475569] dark:text-[#A8B2BE]" />
          <span className="text-[#0B1220] dark:text-[#F7F9FC] font-semibold">{breadcrumb[1]?.label || "Dashboard"}</span>
        </div>

        {/* Title */}
        <h1 className="text-2xl sm:text-[28px] font-bold tracking-tight text-[#0B1220] dark:text-[#F7F9FC]">
          {title}
        </h1>
      </div>

      {/* Right: Action Controls */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Search button */}
        {onOpenSearch && <SearchControl onOpenSearch={onOpenSearch} />}

        {/* Sort / Filter button */}
        {onToggleSort && (
          <button
            type="button"
            aria-label="Sort and Filter"
            onClick={onToggleSort}
            title="Sort and filter active compliance items"
            className="h-9 w-9 rounded-xl bg-white dark:bg-[#141A21] hover:bg-[#F8FAFD] dark:hover:bg-white/10 border border-[#E2E8F0] dark:border-white/15 flex items-center justify-center text-[#334155] dark:text-[#D4DBE4] hover:text-[#0B1220] dark:hover:text-white transition-colors cursor-pointer shadow-2xs"
          >
            <ArrowUpDown className="h-3.5 w-3.5" />
          </button>
        )}

        {/* Date Selector Pill */}
        {onOpenDateRange && (
          <button
            type="button"
            onClick={onOpenDateRange}
            title="Select compliance audit period"
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white dark:bg-[#141A21] hover:bg-[#F8FAFD] dark:hover:bg-white/10 border border-[#E2E8F0] dark:border-white/15 text-xs font-semibold text-[#0B1220] dark:text-[#F7F9FC] transition-colors cursor-pointer shadow-2xs"
          >
            <Calendar className="h-3.5 w-3.5 text-[#475569] dark:text-[#A8B2BE]" />
            <span>{selectedDateRange}</span>
            <ChevronDown className="h-3 w-3 text-[#475569] dark:text-[#A8B2BE]" />
          </button>
        )}

        {/* Add Widget Button */}
        {onAddWidget && (
          <button
            type="button"
            onClick={onAddWidget}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white dark:bg-[#141A21] hover:bg-[#F8FAFD] dark:hover:bg-white/10 border border-[#E2E8F0] dark:border-white/15 text-xs font-semibold text-[#334155] dark:text-[#D4DBE4] hover:text-[#0B1220] dark:hover:text-white transition-colors cursor-pointer shadow-2xs"
          >
            <Plus className="h-3.5 w-3.5 text-[#475569] dark:text-[#A8B2BE]" />
            <span>Add Widget</span>
          </button>
        )}

        {/* Create a Report Pill Button */}
        {onCreateReport && (
          <button
            type="button"
            onClick={onCreateReport}
            className="inline-flex items-center px-4 py-1.5 rounded-full bg-[#0B1220] dark:bg-white text-white dark:text-[#070A0D] border border-transparent hover:bg-slate-800 dark:hover:bg-slate-100 text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
          >
            <span>Create a Report</span>
          </button>
        )}
      </div>
    </div>
  );
}

export default PageHeader;
