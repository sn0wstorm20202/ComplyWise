"use client";

import React from "react";
import {
  Folder,
  ChevronRight,
  Search,
  ArrowUpDown,
  Calendar,
  ChevronDown,
  Plus,
} from "lucide-react";
import TallFeatureCard from "./dashboard/TallFeatureCard";
import ComplianceActivityCard from "./dashboard/ComplianceActivityCard";
import ComplianceActionsCard from "./dashboard/ComplianceActionsCard";
import DocumentsCard from "./dashboard/DocumentsCard";
import ApplicableRequirementsCard from "./dashboard/ApplicableRequirementsCard";
import ComplianceStatusCard from "./dashboard/ComplianceStatusCard";
import { NavView } from "./Sidebar";

interface DashboardViewProps {
  onNavigateToView: (view: NavView) => void;
  onOpenNewQuery?: () => void;
}

export function DashboardView({
  onNavigateToView,
  onOpenNewQuery,
}: DashboardViewProps) {
  return (
    <div className="space-y-6 pb-6 select-none">
      {/* Page Header Area */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pt-1">
        {/* Left: Breadcrumb + Page Title */}
        <div className="space-y-1.5">
          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
            <Folder className="h-3.5 w-3.5 text-slate-400" />
            <span>Home Page</span>
            <ChevronRight className="h-3 w-3 text-slate-300" />
            <Folder className="h-3.5 w-3.5 text-slate-400" />
            <span className="text-slate-600 font-semibold">Dashboard</span>
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold tracking-tight text-slate-950 font-sans">
            Compliance Dashboard
          </h1>
        </div>

        {/* Right Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search circle button */}
          <button
            type="button"
            aria-label="Search"
            onClick={onOpenNewQuery}
            className="h-10 w-10 rounded-full bg-white hover:bg-slate-50 border border-slate-200/80 flex items-center justify-center text-slate-600 transition-colors shadow-2xs"
          >
            <Search className="h-4 w-4" />
          </button>

          {/* Sort / Filter circle button */}
          <button
            type="button"
            aria-label="Filter"
            className="h-10 w-10 rounded-full bg-white hover:bg-slate-50 border border-slate-200/80 flex items-center justify-center text-slate-600 transition-colors shadow-2xs"
          >
            <ArrowUpDown className="h-4 w-4" />
          </button>

          {/* Date Selector Pill */}
          <button
            type="button"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white hover:bg-slate-50 border border-slate-200/80 text-xs font-semibold text-slate-800 transition-colors shadow-2xs"
          >
            <Calendar className="h-3.5 w-3.5 text-slate-500" />
            <span>20-27 Jan 2025</span>
            <ChevronDown className="h-3 w-3 text-slate-400" />
          </button>

          {/* Add Widget Ghost Button */}
          <button
            type="button"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-slate-300/80 hover:bg-white text-xs font-semibold text-slate-700 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Widget</span>
          </button>

          {/* Create a Report Pill Button */}
          <button
            type="button"
            onClick={() => onNavigateToView("compliance")}
            className="inline-flex items-center px-4 py-2 rounded-full bg-[#f1f5f9] hover:bg-slate-200/80 text-xs font-semibold text-slate-900 transition-colors shadow-2xs"
          >
            <span>Create a Report</span>
          </button>
        </div>
      </div>

      {/* Main 3-Column Card Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Column 1: Tall Feature Card (approx 28% width) */}
        <div className="lg:col-span-3 xl:col-span-3">
          <TallFeatureCard
            onLearnMore={() => onNavigateToView("standards")}
            onDismiss={() => {}}
          />
        </div>

        {/* Column 2: Center Column (approx 42% width) */}
        <div className="lg:col-span-5 xl:col-span-5 space-y-5 flex flex-col justify-between">
          <ComplianceActivityCard
            onExpand={() => onNavigateToView("compliance")}
          />
          <ComplianceActionsCard
            onExpand={() => onNavigateToView("compliance")}
          />
        </div>

        {/* Column 3: Right Column (approx 30% width) */}
        <div className="lg:col-span-4 xl:col-span-4 space-y-5 flex flex-col justify-between">
          {/* Top Split Row: Documents (Left) and Applicable Requirements (Right) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <DocumentsCard onOpen={() => onNavigateToView("documents")} />
            <ApplicableRequirementsCard
              onOpen={() => onNavigateToView("compliance")}
            />
          </div>

          {/* Bottom Card: Compliance Status */}
          <ComplianceStatusCard
            onExpand={() => onNavigateToView("compliance")}
          />
        </div>
      </div>
    </div>
  );
}

export default DashboardView;
