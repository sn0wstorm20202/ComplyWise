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
      <div className="space-y-1.5">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
          <Folder className="h-3.5 w-3.5 text-slate-400" />
          <span>{breadcrumb[0]?.label || "Home Page"}</span>
          <ChevronRight className="h-3 w-3 text-slate-300" />
          <Folder className="h-3.5 w-3.5 text-slate-400" />
          <span className="text-slate-600 font-semibold">{breadcrumb[1]?.label || "Dashboard"}</span>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold tracking-tight text-slate-950 font-sans">
          {title}
        </h1>
      </div>

      {/* Right: Action Controls */}
      <div className="flex flex-wrap items-center gap-2.5">
        {/* Search circle button */}
        {onOpenSearch && <SearchControl onOpenSearch={onOpenSearch} />}

        {/* Sort / Filter circle button */}
        {onToggleSort && (
          <button
            type="button"
            aria-label="Sort and Filter"
            onClick={onToggleSort}
            title="Sort and filter active compliance items"
            className="h-10 w-10 rounded-full bg-white hover:bg-slate-50 border border-slate-200/80 hover:border-slate-300 flex items-center justify-center text-slate-600 hover:text-slate-900 transition-colors shadow-2xs cursor-pointer"
          >
            <ArrowUpDown className="h-4 w-4" />
          </button>
        )}

        {/* Date Selector Pill */}
        {onOpenDateRange && (
          <button
            type="button"
            onClick={onOpenDateRange}
            title="Select compliance audit period"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white hover:bg-slate-50 border border-slate-200/80 hover:border-slate-300 text-xs font-semibold text-slate-800 transition-colors shadow-2xs cursor-pointer"
          >
            <Calendar className="h-3.5 w-3.5 text-slate-500" />
            <span>{selectedDateRange}</span>
            <ChevronDown className="h-3 w-3 text-slate-400" />
          </button>
        )}

        {/* Add Widget Ghost Button */}
        {onAddWidget && (
          <button
            type="button"
            onClick={onAddWidget}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-slate-300/80 hover:bg-white text-xs font-semibold text-slate-700 hover:text-slate-900 transition-colors cursor-pointer"
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
            className="inline-flex items-center px-4 py-2 rounded-full bg-[#f1f5f9] hover:bg-slate-200/80 text-xs font-semibold text-slate-900 transition-colors shadow-2xs cursor-pointer border border-transparent hover:border-slate-300/40"
          >
            <span>Create a Report</span>
          </button>
        )}
      </div>
    </div>
  );
}

export default PageHeader;
