"use client";

import React, { useState, useMemo } from "react";
import {
  Folder,
  Search,
  ArrowUpDown,
  Calendar,
  Plus,
  ChevronDown,
  ShieldCheck,
  Building2,
  Award,
} from "lucide-react";
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
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";

interface DashboardViewProps {
  onNavigateToView: (view: NavView) => void;
  onOpenNewQuery?: () => void;
}

function getStatutoryCertificate(profileName: string, bisReg?: string): string {
  if (bisReg && bisReg !== "Statutory Verification Active" && !bisReg.includes("undefined")) {
    return bisReg;
  }
  const name = (profileName || "").toLowerCase();
  if (name.includes("eastern") || name.includes("smart device")) {
    return "CM/L-7892341 (IS 16444:2015)";
  }
  if (name.includes("aero") || name.includes("aeroharvest")) {
    return "DGCA/UAS/TC-44129 (CAR Sec 3)";
  }
  if (name.includes("renew") || name.includes("renewcell")) {
    return "CPCB/EPR-BW-2024/0912 (E-Waste & EPR)";
  }
  if (name.includes("aarohan") || name.includes("bioharvest")) {
    return "FSSAI-10024021001489 / NPOP-IN-912";
  }
  if (name.includes("ganesh")) {
    return "CM/L-8291043 (AIS 156 Phase 2 / UL 2580)";
  }
  if (name.includes("bluepeak") || name.includes("medtech")) {
    return "CDSCO/MD-5/MFG/2024/718 (ISO 13485:2016)";
  }
  return bisReg || "CM/L-7892341 (BIS Standard Marked)";
}

export function DashboardView({
  onNavigateToView,
  onOpenNewQuery,
}: DashboardViewProps) {
  const { profile, dashboardData, liveDashboardSummary } = useBusinessContext();
  const { user } = useAuth();
  const { t } = useLanguage();

  const userName = user?.full_name || profile?.officer || "Somsubhra Dalui";
  const activeCompanyName = profile?.businessName || "Eastern Smart Devices Private Limited";
  const certificateNumber = getStatutoryCertificate(activeCompanyName, profile?.bisRegistration);

  // Slide-over drawers & modal states
  const [documentsDrawerOpen, setDocumentsDrawerOpen] = useState(false);
  const [requirementsDrawerOpen, setRequirementsDrawerOpen] = useState(false);
  const [actionsDrawerOpen, setActionsDrawerOpen] = useState(false);
  const [dateRangeModalOpen, setDateRangeModalOpen] = useState(false);
  const [selectedDateRange, setSelectedDateRange] = useState("20–27 Jan 2025");

  const dynamicCategoryBreakdown = useMemo(() => {
    const breakdown = { ...dashboardData.categoryBreakdown };
    if (
      liveDashboardSummary?.compliance_readiness !== undefined &&
      liveDashboardSummary?.compliance_readiness !== null &&
      breakdown.Overall
    ) {
      breakdown.Overall = {
        ...breakdown.Overall,
        healthPercentage: liveDashboardSummary.compliance_readiness,
      };
    }
    return breakdown;
  }, [dashboardData.categoryBreakdown, liveDashboardSummary]);

  const handleNavigate = (view: string) => onNavigateToView(view as NavView);

  return (
    <div className="space-y-5 pb-8 select-none">
      {/* 1. Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs text-[#64748B]">
        <button
          type="button"
          onClick={() => handleNavigate("dashboard")}
          className="flex items-center gap-1.5 hover:text-[#0F172A] transition-colors cursor-pointer"
        >
          <Folder className="h-3.5 w-3.5" />
          <span>{t("navigation.dashboard")}</span>
        </button>
        <span className="text-[#CBD5E1]">›</span>
        <span className="flex items-center gap-1.5 text-[#0F172A] font-semibold">
          <Folder className="h-3.5 w-3.5 text-[#64748B]" />
          <span>{t("navigation.dashboard")}</span>
        </span>
      </div>

      {/* 2. Main Title Row & Action Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 pb-1">
        <div className="space-y-1.5">
          {/* Executive Greeting */}
          <div className="flex items-center gap-2 text-xs font-semibold text-[#059669]">
            <span className="h-2 w-2 rounded-full bg-[#10B981] animate-pulse shrink-0" />
            <span>Hello, {userName}</span>
            <span className="text-[#CBD5E1]">•</span>
            <span className="text-[#64748B] font-medium">{profile?.role || "Statutory Compliance Officer"}</span>
          </div>

          {/* Level 1: Large Title */}
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0F172A] tracking-tight font-sans">
            {t("dashboard.title")}
          </h1>

          {/* Company Name (prominent & larger) + Dashboard designation */}
          <div className="flex flex-wrap items-baseline gap-2 pt-0.5">
            <span className="text-xl sm:text-2xl font-bold text-[#1E293B] tracking-tight">
              {activeCompanyName}
            </span>
            <span className="text-xs sm:text-sm font-semibold text-[#64748B]">
              {t("common.appName")}
            </span>
          </div>

          {/* Professional Statutory Compliance Certificate Pill & Badges */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F0FDF4] border border-[#BBF7D0] text-xs font-medium text-[#166534] shadow-2xs">
              <ShieldCheck className="h-3.5 w-3.5 text-[#16A34A] shrink-0" />
              <span>Statutory Compliance Certificate:</span>
              <span className="font-bold text-[#14532D]">
                {certificateNumber}
              </span>
            </div>

            {profile?.district && profile?.state && (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#F8FAFC] border border-[#E2E8F0] text-xs font-medium text-[#475569] shadow-2xs">
                <Building2 className="h-3.5 w-3.5 text-[#64748B] shrink-0" />
                <span>{profile.district}, {profile.state}</span>
              </div>
            )}

            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#F8FAFC] border border-[#E2E8F0] text-[11px] font-semibold text-[#0284C7] shadow-2xs">
              <Award className="h-3 w-3 text-[#0284C7] shrink-0" />
              <span>BIS Standard Marked & NABL Verified</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap shrink-0 pt-1">
          {/* Search Trigger Button */}
          <button
            type="button"
            onClick={onOpenNewQuery}
            title="Ask AI or search obligations"
            aria-label="Search compliance records"
            className="h-8 w-8 rounded-full bg-white hover:bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center text-[#64748B] hover:text-[#0F172A] shadow-2xs transition-colors cursor-pointer"
          >
            <Search className="h-3.5 w-3.5" />
          </button>

          {/* Filter / Sort Button */}
          <button
            type="button"
            onClick={() => setRequirementsDrawerOpen(true)}
            title="Filter statutory requirements"
            aria-label="Filter requirements"
            className="h-8 w-8 rounded-full bg-white hover:bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center text-[#64748B] hover:text-[#0F172A] shadow-2xs transition-colors cursor-pointer"
          >
            <ArrowUpDown className="h-3.5 w-3.5" />
          </button>

          {/* Date Range Dropdown Pill */}
          <button
            type="button"
            onClick={() => setDateRangeModalOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white hover:bg-[#F8FAFC] border border-[#E2E8F0] text-xs font-medium text-[#0F172A] transition-colors cursor-pointer shadow-2xs"
          >
            <Calendar className="h-3.5 w-3.5 text-[#64748B]" />
            <span>{selectedDateRange}</span>
            <ChevronDown className="h-3 w-3 text-[#64748B]" />
          </button>

          {/* + Add Widget */}
          <button
            type="button"
            onClick={() => setActionsDrawerOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white hover:bg-[#F8FAFC] border border-[#E2E8F0] text-xs font-medium text-[#334155] hover:text-[#0F172A] transition-colors cursor-pointer shadow-2xs"
          >
            <Plus className="h-3.5 w-3.5 text-[#64748B]" />
            <span>Add Widget</span>
          </button>

          {/* Create a Report CTA */}
          <button
            type="button"
            onClick={() => handleNavigate("updates")}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white hover:bg-[#F8FAFC] border border-[#E2E8F0] text-xs font-medium text-[#0F172A] transition-all cursor-pointer shadow-2xs"
          >
            <span>Create a Report</span>
          </button>
        </div>
      </div>

      {/* 3. Primary Reference White Mode Grid (5 Cards: 2 Rows, TallFeatureCard Removed) */}
      <div className="flex flex-col gap-5">
        {/* Row 1: 3 Cards (Compliance Activity | Documents | Applicable Requirements) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch">
          <div className="md:col-span-12 lg:col-span-5 flex">
            <ComplianceActivityCard
              activityData={dashboardData.activity}
              onExpand={() => setActionsDrawerOpen(true)}
            />
          </div>
          <div className="md:col-span-6 lg:col-span-4 flex">
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
          </div>
          <div className="md:col-span-6 lg:col-span-3 flex">
            <ApplicableRequirementsCard
              requirementsData={{
                applicableCount: liveDashboardSummary?.metrics?.applicable_count ?? dashboardData.requirements.applicableCount,
                isStandardsRatio: dashboardData.requirements.isStandardsRatio,
              }}
              onOpen={() => setRequirementsDrawerOpen(true)}
            />
          </div>
        </div>

        {/* Row 2: 2 Cards (Compliance Actions | Compliance Status) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          <div className="lg:col-span-7 flex">
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
          </div>
          <div className="lg:col-span-5 flex">
            <ComplianceStatusCard
              categoryBreakdown={dynamicCategoryBreakdown}
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

