"use client";

import React, { useState } from "react";

import PageHeader from "./dashboard/PageHeader";
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

      {/* Page Header Area */}
      <PageHeader
        title="Compliance Dashboard"
        selectedDateRange={selectedDateRange}
        onOpenSearch={onOpenNewQuery}
        onToggleSort={() => setActionsDrawerOpen(true)}
        onOpenDateRange={() => setDateRangeModalOpen(true)}
        onAddWidget={() => setAddWidgetModalOpen(true)}
        onCreateReport={() => setReportModalOpen(true)}
      />

      {/* Main 3-Column Card Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 items-stretch">
        {/* Column 1: Feature Card (4 cols, approx 33% width for generous breathing room) */}
        <div className="lg:col-span-4">
          <TallFeatureCard
            featuredStandard={dashboardData.standards.featured}
            onLearnMore={() => onNavigateToView("standards")}
            onDismiss={() => {}}
          />
        </div>

        {/* Column 2: Center Column (4 cols) */}
        <div className="lg:col-span-4 space-y-4 sm:space-y-5 flex flex-col justify-between">
          <ComplianceActivityCard
            activityData={dashboardData.activity}
            onExpand={() => setActivityDrawerOpen(true)}
          />
          <ComplianceActionsCard
            actionsData={dashboardData.actions}
            onExpand={() => setActionsDrawerOpen(true)}
          />
        </div>

        {/* Column 3: Right Column (4 cols) */}
        <div className="lg:col-span-4 space-y-4 sm:space-y-5 flex flex-col justify-between">
          {/* Top Split Row: Documents (Left) and Applicable Requirements (Right) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
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
