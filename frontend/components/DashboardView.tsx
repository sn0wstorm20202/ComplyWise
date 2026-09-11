"use client";

import React, { useState } from "react";
import { Search, Calendar as CalendarIcon, Sparkles } from "lucide-react";
import DashboardMetricsRow from "./dashboard/DashboardMetricsRow";
import ComplianceOverviewTable from "./dashboard/ComplianceOverviewTable";
import DashboardDeadlinesWidget from "./dashboard/DashboardDeadlinesWidget";
import QuickActionsGrid from "./dashboard/QuickActionsGrid";
import RequirementCategoriesDonut from "./dashboard/RequirementCategoriesDonut";
import DashboardAssistantCard from "./dashboard/DashboardAssistantCard";
import DashboardTrustFooter from "./dashboard/DashboardTrustFooter";
import {
  DocumentsPreviewDrawer,
  RequirementsListDrawer,
  ActionsListDrawer,
  DateRangeModal,
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
  const { profile, dashboardData } = useBusinessContext();

  // Slide-over drawers & modal states
  const [documentsDrawerOpen, setDocumentsDrawerOpen] = useState(false);
  const [requirementsDrawerOpen, setRequirementsDrawerOpen] = useState(false);
  const [actionsDrawerOpen, setActionsDrawerOpen] = useState(false);
  const [dateRangeModalOpen, setDateRangeModalOpen] = useState(false);
  const [selectedDateRange, setSelectedDateRange] = useState("Aug - Sep 2026");

  const handleNavigate = (view: string) => onNavigateToView(view as NavView);

  return (
    <div className="space-y-4 sm:space-y-5 pb-8 select-none">
      {/* Search Header Bar (From Screenshot) */}
      <div className="bg-[#040406] rounded-[10px] border border-[#1c1d22] p-2.5 sm:p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xl">
        <div className="flex items-center gap-2.5 flex-1 max-w-xl">
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-2.5 h-3.5 w-3.5 text-[#5e616e]" />
            <input
              type="text"
              placeholder="Ask anything about your statutory obligations, IS standards, or clearances..."
              onClick={onOpenNewQuery}
              readOnly
              className="w-full rounded-full border border-[#1c1d22] bg-[#121317] pl-9 pr-4 py-1.5 text-xs text-[#ffffff] placeholder-[#5e616e] hover:border-[#2e3038] cursor-pointer transition-colors"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
          <button
            type="button"
            onClick={onOpenNewQuery}
            className="inline-flex items-center gap-1.5 rounded-full bg-[#121317] border border-[#2e3038] hover:border-[#cc9166] text-[#e2e3e9] hover:text-[#ffffff] px-3.5 py-1.5 text-xs font-medium transition-all shadow-xs"
          >
            <Sparkles className="h-3.5 w-3.5 text-[#cc9166]" />
            <span>AI Query</span>
          </button>

          <button
            type="button"
            onClick={() => setDateRangeModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-full border border-[#1c1d22] bg-[#121317] px-3.5 py-1.5 text-xs font-medium text-[#e2e3e9] hover:bg-[#1c1d22] transition-colors"
          >
            <CalendarIcon className="h-3.5 w-3.5 text-[#777a88]" />
            <span>{selectedDateRange}</span>
          </button>
        </div>
      </div>

      {/* 1. TOP METRICS ROW (5 Cards) */}
      <DashboardMetricsRow
        profile={profile}
        onNavigateToView={handleNavigate}
        onOpenCalendar={() => onNavigateToView("calendar")}
        onOpenDocuments={() => setDocumentsDrawerOpen(true)}
        onOpenTasks={() => setActionsDrawerOpen(true)}
      />

      {/* 2. MIDDLE ROW (8 Cols: Compliance Overview Table | 4 Cols: Upcoming Deadlines Widget) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 sm:gap-4 items-stretch">
        <div className="lg:col-span-8 flex">
          <div className="w-full flex flex-col">
            <ComplianceOverviewTable
              onNavigateToView={handleNavigate}
              onSelectRequirement={() => setRequirementsDrawerOpen(true)}
            />
          </div>
        </div>

        <div className="lg:col-span-4 flex">
          <div className="w-full flex flex-col">
            <DashboardDeadlinesWidget onNavigateToView={handleNavigate} />
          </div>
        </div>
      </div>

      {/* 3. BOTTOM ROW (3 Columns: 4 Cols Quick Actions | 4 Cols Category Donut | 4 Cols AI Assistant) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-4 items-stretch">
        <div className="flex">
          <div className="w-full flex flex-col">
            <QuickActionsGrid
              onNavigateToView={handleNavigate}
              onOpenUploadDrawer={() => setDocumentsDrawerOpen(true)}
            />
          </div>
        </div>

        <div className="flex">
          <div className="w-full flex flex-col">
            <RequirementCategoriesDonut onNavigateToView={handleNavigate} />
          </div>
        </div>

        <div className="flex">
          <div className="w-full flex flex-col">
            <DashboardAssistantCard onNavigateToView={handleNavigate} />
          </div>
        </div>
      </div>

      {/* 4. BOTTOM TRUST FOOTER (4 Badges) */}
      <DashboardTrustFooter />

      {/* Drawers & Modals */}
      <DocumentsPreviewDrawer
        isOpen={documentsDrawerOpen}
        onClose={() => setDocumentsDrawerOpen(false)}
        data={dashboardData}
      />

      <RequirementsListDrawer
        isOpen={requirementsDrawerOpen}
        onClose={() => setRequirementsDrawerOpen(false)}
        data={dashboardData}
      />

      <ActionsListDrawer
        isOpen={actionsDrawerOpen}
        onClose={() => setActionsDrawerOpen(false)}
        data={dashboardData}
      />

      <DateRangeModal
        isOpen={dateRangeModalOpen}
        onClose={() => setDateRangeModalOpen(false)}
        selectedRange={selectedDateRange}
        onSelectRange={(r) => setSelectedDateRange(r)}
      />
    </div>
  );
}

export default DashboardView;

