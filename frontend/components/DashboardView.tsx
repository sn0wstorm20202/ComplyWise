"use client";

import React, { useState } from "react";
import {
  Folder,
  LayoutDashboard,
  Search,
  ArrowUpDown,
  Calendar,
  Plus,
  ChevronDown,
} from "lucide-react";
import TallFeatureCard from "./dashboard/TallFeatureCard";
import ComplianceActivityCard from "./dashboard/ComplianceActivityCard";
import DocumentsCard from "./dashboard/DocumentsCard";
import ApplicableRequirementsCard from "./dashboard/ApplicableRequirementsCard";
import ComplianceActionsCard from "./dashboard/ComplianceActionsCard";
import ComplianceStatusCard from "./dashboard/ComplianceStatusCard";
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
  const { profile, dashboardData, liveDashboardSummary } = useBusinessContext();

  // Slide-over drawers & modal states
  const [documentsDrawerOpen, setDocumentsDrawerOpen] = useState(false);
  const [requirementsDrawerOpen, setRequirementsDrawerOpen] = useState(false);
  const [actionsDrawerOpen, setActionsDrawerOpen] = useState(false);
  const [dateRangeModalOpen, setDateRangeModalOpen] = useState(false);
  const [selectedDateRange, setSelectedDateRange] = useState("20-27 Jan 2025");

  const handleNavigate = (view: string) => onNavigateToView(view as NavView);

  return (
    <div className="space-y-4 sm:space-y-5 pb-8 select-none">
      {/* 1. Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs text-[#71717A]">
        <button
          type="button"
          onClick={() => handleNavigate("dashboard")}
          className="flex items-center gap-1.5 hover:text-[#A4A5AA] transition-colors cursor-pointer"
        >
          <Folder className="h-3.5 w-3.5" />
          <span>Home Page</span>
        </button>
        <span className="text-white/[0.2]">→</span>
        <span className="flex items-center gap-1.5 text-[#F2F2F0] font-medium">
          <LayoutDashboard className="h-3.5 w-3.5 text-[#6E82FF]" />
          <span>Dashboard</span>
        </span>
      </div>

      {/* 2. Main Title Row & Action Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <h1 className="text-2xl sm:text-[28px] font-semibold text-[#F2F2F0] tracking-tight font-sans">
            Compliance Dashboard
          </h1>
          {profile?.businessName && (
            <p className="text-xs text-[#71717A] mt-0.5 font-medium">
              Statutory oversight for <span className="text-[#A4A5AA]">{profile.businessName}</span>
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap shrink-0">
          {/* Search Trigger Button */}
          <button
            type="button"
            onClick={onOpenNewQuery}
            title="Ask AI or search obligations"
            aria-label="Search compliance records"
            className="h-8 w-8 rounded-[8px] bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] flex items-center justify-center text-[#A4A5AA] hover:text-[#F2F2F0] transition-colors cursor-pointer"
          >
            <Search className="h-3.5 w-3.5" />
          </button>

          {/* Filter / Sort Button */}
          <button
            type="button"
            onClick={() => setRequirementsDrawerOpen(true)}
            title="Filter statutory requirements"
            aria-label="Filter requirements"
            className="h-8 w-8 rounded-[8px] bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] flex items-center justify-center text-[#A4A5AA] hover:text-[#F2F2F0] transition-colors cursor-pointer"
          >
            <ArrowUpDown className="h-3.5 w-3.5" />
          </button>

          {/* Date Range Dropdown Pill */}
          <button
            type="button"
            onClick={() => setDateRangeModalOpen(true)}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-medium text-[#F2F2F0] transition-colors cursor-pointer shadow-xs"
          >
            <Calendar className="h-3.5 w-3.5 text-[#71717A]" />
            <span>{selectedDateRange}</span>
            <ChevronDown className="h-3 w-3 text-[#71717A]" />
          </button>

          {/* + Add Widget */}
          <button
            type="button"
            onClick={() => setActionsDrawerOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-medium text-[#A4A5AA] hover:text-[#F2F2F0] transition-colors cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Widget</span>
          </button>

          {/* Create a Report CTA */}
          <button
            type="button"
            onClick={() => handleNavigate("updates")}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/[0.08] hover:bg-white/[0.14] border border-white/[0.12] text-xs font-medium text-[#F2F2F0] transition-all cursor-pointer shadow-xs"
          >
            <span>Create a Report</span>
          </button>
        </div>
      </div>

      {/* 3. Primary Reference Asymmetric 2-Column Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-stretch">
        {/* Left Column: 5 Columns Desktop -> TallFeatureCard */}
        <div className="xl:col-span-5 flex">
          <TallFeatureCard
            featuredStandard={{
              code: liveDashboardSummary?.standards_preview?.[0]?.standard_code || dashboardData.standards.featured.code,
              title: "Stay Compliant",
              badge: `★ ${liveDashboardSummary?.standards_preview?.[0]?.standard_code || dashboardData.standards.featured.code}`,
              description: liveDashboardSummary?.standards_preview?.[0]?.title || dashboardData.standards.featured.description,
              authority: liveDashboardSummary?.standards_preview?.[0]?.authority || dashboardData.standards.featured.authority,
              points: dashboardData.standards.featured.points,
            }}
            onLearnMore={() => handleNavigate("standards")}
            onDismiss={() => {}}
          />
        </div>

        {/* Right Column: 7 Columns Desktop -> 2 Rows of Complementary Cards */}
        <div className="xl:col-span-7 flex flex-col gap-5 justify-between">
          {/* Row 1: 3 Cards (Compliance Activity | Documents | Applicable Requirements) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 items-stretch flex-1">
            <ComplianceActivityCard
              activityData={dashboardData.activity}
              onExpand={() => setActionsDrawerOpen(true)}
            />
            <DocumentsCard
              documentsData={{
                totalCount: liveDashboardSummary?.total_documents_needed || dashboardData.documents.totalCount,
                onTrackCount: dashboardData.documents.onTrackCount,
                changeThisWeek: dashboardData.documents.changeThisWeek,
                verifiedPercentage: dashboardData.documents.verifiedPercentage,
                underReviewPercentage: dashboardData.documents.underReviewPercentage,
              }}
              onOpen={() => setDocumentsDrawerOpen(true)}
            />
            <ApplicableRequirementsCard
              requirementsData={{
                applicableCount: liveDashboardSummary?.metrics?.applicable_count ?? dashboardData.requirements.applicableCount,
                isStandardsRatio: dashboardData.requirements.isStandardsRatio,
              }}
              onOpen={() => setRequirementsDrawerOpen(true)}
            />
          </div>

          {/* Row 2: 2 Cards (Compliance Actions | Compliance Status) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 items-stretch flex-1">
            <ComplianceActionsCard
              actionsData={{
                openCount: liveDashboardSummary?.priority_actions?.length ?? dashboardData.actions.openCount,
                changeFromLastWeek: dashboardData.actions.changeFromLastWeek,
                highPriorityCount: dashboardData.actions.highPriorityCount,
                totalCount: dashboardData.actions.totalCount,
                timeline: dashboardData.actions.timeline,
              }}
              onExpand={() => setActionsDrawerOpen(true)}
            />
            <ComplianceStatusCard
              categoryBreakdown={{
                Overall: {
                  category: "Overall",
                  healthPercentage: liveDashboardSummary?.compliance_readiness ?? dashboardData.complianceHealth.percentage,
                  compliantCount: dashboardData.complianceHealth.compliantCount,
                  inProgressCount: dashboardData.complianceHealth.inProgressCount,
                  overdueCount: dashboardData.complianceHealth.overdueCount,
                  inProgressPercentage: dashboardData.complianceHealth.inProgressPercentage,
                  overduePercentage: dashboardData.complianceHealth.overduePercentage,
                },
                "Electrical / Machinery": {
                  category: "Electrical / Machinery",
                  healthPercentage: 79,
                  compliantCount: 78,
                  inProgressCount: 24,
                  overdueCount: 9,
                  inProgressPercentage: 12,
                  overduePercentage: 9,
                },
                "Food Safety & FSSAI": {
                  category: "Food Safety & FSSAI",
                  healthPercentage: 91,
                  compliantCount: 48,
                  inProgressCount: 12,
                  overdueCount: 3,
                  inProgressPercentage: 6,
                  overduePercentage: 3,
                },
                "Environment & Pollution": {
                  category: "Environment & Pollution",
                  healthPercentage: 94,
                  compliantCount: 36,
                  inProgressCount: 8,
                  overdueCount: 2,
                  inProgressPercentage: 4,
                  overduePercentage: 2,
                },
              }}
              onExpand={() => handleNavigate("compliance")}
            />
          </div>
        </div>
      </div>

      {/* 4. Slide-Over Drawers & Modals */}
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

