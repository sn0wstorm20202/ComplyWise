"use client";

import React, { useState } from "react";
import {
  Folder,
  ChevronRight,
  Search,
  ArrowUpDown,
  Calendar,
  ChevronDown,
  Plus,
  Building2,
  Sparkles,
} from "lucide-react";
import TallFeatureCard from "./dashboard/TallFeatureCard";
import ComplianceActivityCard from "./dashboard/ComplianceActivityCard";
import ComplianceActionsCard from "./dashboard/ComplianceActionsCard";
import DocumentsCard from "./dashboard/DocumentsCard";
import ApplicableRequirementsCard from "./dashboard/ApplicableRequirementsCard";
import ComplianceStatusCard from "./dashboard/ComplianceStatusCard";
import {
  ActivityTimelineDrawer,
  ActionsListDrawer,
  RequirementsListDrawer,
  DocumentsPreviewDrawer,
  DateRangeModal,
  AddWidgetModal,
  CreateReportModal,
} from "./dashboard/DashboardDrawers";
import { NavView } from "./Sidebar";
import { useBusinessContext } from "@/context/BusinessContext";

interface DashboardViewProps {
  onNavigateToView: (view: NavView) => void;
  onOpenNewQuery?: () => void;
}

export function DashboardView({
  onNavigateToView,
  onOpenNewQuery,
}: DashboardViewProps) {
  const { profile, dashboardData, isDemoMode } = useBusinessContext();

  // Drawer and modal states
  const [activityDrawerOpen, setActivityDrawerOpen] = useState(false);
  const [actionsDrawerOpen, setActionsDrawerOpen] = useState(false);
  const [requirementsDrawerOpen, setRequirementsDrawerOpen] = useState(false);
  const [documentsDrawerOpen, setDocumentsDrawerOpen] = useState(false);
  const [dateRangeModalOpen, setDateRangeModalOpen] = useState(false);
  const [addWidgetModalOpen, setAddWidgetModalOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [selectedDateRange, setSelectedDateRange] = useState("20-27 Jan 2025");

  return (
    <div className="space-y-6 pb-6 select-none">
      {/* Demo Data Notification Banner */}
      {isDemoMode && (
        <div className="px-4 py-2 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-indigo-900">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-indigo-600 shrink-0" />
            <span>
              Active Regulatory Profile: <strong>{profile.businessName}</strong> ({profile.state} · {profile.scale.split("(")[0]})
            </span>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 font-bold text-[10px]">
              <Sparkles className="h-3 w-3" />
              <span>Reactive Context Live</span>
            </span>
          </div>
        </div>
      )}

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
            title="Open Regulatory Search (Cmd+K)"
            className="h-10 w-10 rounded-full bg-white hover:bg-slate-50 border border-slate-200/80 flex items-center justify-center text-slate-600 transition-colors shadow-2xs cursor-pointer"
          >
            <Search className="h-4 w-4" />
          </button>

          {/* Sort / Filter circle button */}
          <button
            type="button"
            aria-label="Filter"
            onClick={() => setActionsDrawerOpen(true)}
            title="Sort and filter priority actions"
            className="h-10 w-10 rounded-full bg-white hover:bg-slate-50 border border-slate-200/80 flex items-center justify-center text-slate-600 transition-colors shadow-2xs cursor-pointer"
          >
            <ArrowUpDown className="h-4 w-4" />
          </button>

          {/* Date Selector Pill */}
          <button
            type="button"
            onClick={() => setDateRangeModalOpen(true)}
            title="Select audit period"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white hover:bg-slate-50 border border-slate-200/80 text-xs font-semibold text-slate-800 transition-colors shadow-2xs cursor-pointer"
          >
            <Calendar className="h-3.5 w-3.5 text-slate-500" />
            <span>{selectedDateRange}</span>
            <ChevronDown className="h-3 w-3 text-slate-400" />
          </button>

          {/* Add Widget Ghost Button */}
          <button
            type="button"
            onClick={() => setAddWidgetModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-slate-300/80 hover:bg-white text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Widget</span>
          </button>

          {/* Create a Report Pill Button */}
          <button
            type="button"
            onClick={() => setReportModalOpen(true)}
            className="inline-flex items-center px-4 py-2 rounded-full bg-[#f1f5f9] hover:bg-slate-200/80 text-xs font-semibold text-slate-900 transition-colors shadow-2xs cursor-pointer"
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
            featuredStandard={dashboardData.standards.featured}
            onLearnMore={() => onNavigateToView("standards")}
            onDismiss={() => {}}
          />
        </div>

        {/* Column 2: Center Column (approx 42% width) */}
        <div className="lg:col-span-5 xl:col-span-5 space-y-5 flex flex-col justify-between">
          <ComplianceActivityCard
            activityData={dashboardData.activity}
            onExpand={() => setActivityDrawerOpen(true)}
          />
          <ComplianceActionsCard
            actionsData={dashboardData.actions}
            onExpand={() => setActionsDrawerOpen(true)}
          />
        </div>

        {/* Column 3: Right Column (approx 30% width) */}
        <div className="lg:col-span-4 xl:col-span-4 space-y-5 flex flex-col justify-between">
          {/* Top Split Row: Documents (Left) and Applicable Requirements (Right) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <DocumentsCard
              documentsData={dashboardData.documents}
              onOpen={() => setDocumentsDrawerOpen(true)}
            />
            <ApplicableRequirementsCard
              requirementsData={dashboardData.requirements}
              onOpen={() => setRequirementsDrawerOpen(true)}
            />
          </div>

          {/* Bottom Card: Compliance Status */}
          <ComplianceStatusCard
            categoryBreakdown={dashboardData.categoryBreakdown}
            onExpand={() => onNavigateToView("compliance")}
          />
        </div>
      </div>

      {/* Slide-over Drawers & Modals */}
      <ActivityTimelineDrawer
        isOpen={activityDrawerOpen}
        onClose={() => setActivityDrawerOpen(false)}
        data={dashboardData}
      />

      <ActionsListDrawer
        isOpen={actionsDrawerOpen}
        onClose={() => setActionsDrawerOpen(false)}
        data={dashboardData}
      />

      <RequirementsListDrawer
        isOpen={requirementsDrawerOpen}
        onClose={() => setRequirementsDrawerOpen(false)}
        data={dashboardData}
      />

      <DocumentsPreviewDrawer
        isOpen={documentsDrawerOpen}
        onClose={() => setDocumentsDrawerOpen(false)}
        data={dashboardData}
      />

      <DateRangeModal
        isOpen={dateRangeModalOpen}
        onClose={() => setDateRangeModalOpen(false)}
        selectedRange={selectedDateRange}
        onSelectRange={(r) => setSelectedDateRange(r)}
      />

      <AddWidgetModal
        isOpen={addWidgetModalOpen}
        onClose={() => setAddWidgetModalOpen(false)}
      />

      <CreateReportModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        data={dashboardData}
      />
    </div>
  );
}

export default DashboardView;
