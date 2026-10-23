"use client";

import type { DashboardSummary } from "@/types/dashboard";
import { ComplianceActivityCard } from "./ComplianceActivityCard";
import { DocumentsCard } from "./DocumentsCard";
import { ApplicableRequirementsCard } from "./ApplicableRequirementsCard";
import { ComplianceActionsCard } from "./ComplianceActionsCard";
import { ComplianceStatusCard } from "./ComplianceStatusCard";

interface DashboardOverviewProps {
  summary: DashboardSummary;
  onOpenActivity: () => void;
  onOpenDocuments: () => void;
  onOpenRequirements: () => void;
  onOpenStandards: () => void;
  onOpenActions: () => void;
  onOpenWorkflows: () => void;
}

export function DashboardOverview({ summary, onOpenActivity, onOpenDocuments, onOpenRequirements,
  onOpenStandards, onOpenActions, onOpenWorkflows }: DashboardOverviewProps) {
  const widgets = summary.widgets;
  if (!widgets) return null;
  const assessed = summary.has_evaluation;
  const needsInformation = summary.metrics.needs_information_count;
  const conflicts = summary.metrics.conflict_review_count;
  const reviewCount = assessed && needsInformation != null && conflicts != null
    ? needsInformation + conflicts : null;

  return <section aria-label="Business workspace overview" className="space-y-5">
    <div className="grid grid-cols-1 gap-5 md:grid-cols-12 items-stretch">
      <div className="md:col-span-12 lg:col-span-5">
        <ComplianceActivityCard activityData={widgets.activity} onExpand={onOpenActivity} />
      </div>
      <div className="md:col-span-6 lg:col-span-4">
        <DocumentsCard documentsData={widgets.documents} onOpen={onOpenDocuments} />
      </div>
      <div className="md:col-span-6 lg:col-span-3">
        <ApplicableRequirementsCard requirementsData={{
          applicableCount: assessed ? summary.metrics.applicable_count : null,
          standardsCount: assessed ? summary.total_standards_count ?? null : null,
        }} onOpen={onOpenRequirements} onOpenStandards={onOpenStandards} />
      </div>
    </div>
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-12 items-stretch">
      <div className="lg:col-span-7">
        <ComplianceActionsCard actionsData={{
          openCount: assessed ? summary.metrics.action_required_count : null,
          reviewCount,
          timeline: widgets.activity.daily.map(day => ({ day: day.day, count: day.tasks })),
        }} onExpand={onOpenActions} />
      </div>
      <div className="lg:col-span-5">
        <ComplianceStatusCard categoryBreakdown={widgets.cases} onExpand={onOpenWorkflows} />
      </div>
    </div>
  </section>;
}
