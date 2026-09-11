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
        <div className="flex items-center gap-1.5 text-xs text-[#71717A] font-normal">
          <Folder className="h-3.5 w-3.5 text-[#71717A]" />
          <span>{breadcrumb[0]?.label || "Home Page"}</span>
          <ChevronRight className="h-3 w-3 text-[#71717A]/60" />
          <Folder className="h-3.5 w-3.5 text-[#71717A]" />
          <span className="text-[#A1A1AA] font-medium">{breadcrumb[1]?.label || "Dashboard"}</span>
        </div>

        {/* Title */}
        <h1 className="text-2xl sm:text-[26px] font-semibold tracking-tight text-[#F5F5F3]">
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
            className="h-9 w-9 rounded-[8px] bg-[#17191C] hover:bg-white/[0.06] border border-white/[0.08] flex items-center justify-center text-[#A1A1AA] hover:text-[#F5F5F3] transition-colors cursor-pointer"
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
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#17191C] hover:bg-white/[0.06] border border-white/[0.08] text-xs font-medium text-[#F5F5F3] transition-colors cursor-pointer"
          >
            <Calendar className="h-3.5 w-3.5 text-[#71717A]" />
            <span>{selectedDateRange}</span>
            <ChevronDown className="h-3 w-3 text-[#71717A]" />
          </button>
        )}

        {/* Add Widget Ghost Button */}
        {onAddWidget && (
          <button
            type="button"
            onClick={onAddWidget}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-white/[0.10] hover:bg-white/[0.04] text-xs font-medium text-[#A1A1AA] hover:text-[#F5F5F3] transition-colors cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Widget</span>
          </button>
        )}

        {/* Create a Report Pill Button */}
        {onCreateReport && (
          <button
            type="button"
            onClick={onCreateReport}
            className="inline-flex items-center px-4 py-1.5 rounded-full bg-white/[0.08] hover:bg-white/[0.12] text-xs font-medium text-[#F5F5F3] transition-colors cursor-pointer border border-white/[0.10]"
          >
            <span>Create a Report</span>
          </button>
        )}
      </div>
    </div>
  );
}

export default PageHeader;
