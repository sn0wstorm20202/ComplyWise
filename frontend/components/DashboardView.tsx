"use client";

import React, { useState } from "react";
import {
  ShieldCheck,
  AlertCircle,
  Clock,
  FileText,
  BookOpen,
  ArrowRight,
  GitFork,
  Scale,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Plus,
} from "lucide-react";
import ComplianceHealth from "@/components/ComplianceHealth";
import MetricCard from "@/components/MetricCard";
import DeadlineRow from "@/components/DeadlineRow";
import RegulationRow from "@/components/RegulationRow";
import WorkflowRow from "@/components/WorkflowRow";
import DocumentRow from "@/components/DocumentRow";
import StandardRow from "@/components/StandardRow";
import BISAgent from "@/components/BISAgent";
import StatusBadge from "@/components/StatusBadge";
import {
  dashboardMetrics,
  priorityActions,
  upcomingDeadlines,
  regulatoryChanges,
  workflows,
  documents,
  standards,
  PriorityAction,
} from "@/lib/mockData";
import { NavView } from "./Sidebar";

interface DashboardViewProps {
  onNavigateToView: (view: NavView) => void;
  onOpenNewQuery: () => void;
}

export function DashboardView({ onNavigateToView, onOpenNewQuery }: DashboardViewProps) {
  const [activeRegFilter, setActiveRegFilter] = useState<"ALL" | "QCO" | "CIRCULAR">("ALL");

  const filteredRegs = regulatoryChanges.filter((r) => {
    if (activeRegFilter === "QCO") return r.category.includes("QCO");
    if (activeRegFilter === "CIRCULAR") return r.category.includes("Circular");
    return true;
  });

  return (
    <div className="space-y-8">
      {/* Top Banner & Primary Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-blue-900 tracking-wide uppercase">
              Command Center
            </span>
            <span className="text-slate-300">·</span>
            <span className="text-xs font-medium text-slate-500">
              Surveillance Cycle 2025–26
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-950 mt-0.5">
            Compliance Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Your regulatory overview at a glance.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onOpenNewQuery}
            type="button"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-900 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-950 transition-colors shadow-xs"
          >
            <Plus className="h-4 w-4" />
            <span>New Query</span>
          </button>
        </div>
      </div>

      {/* Primary Compliance-Health Module + Supporting Metrics */}
      <div className="space-y-4">
        {/* Large Primary Compliance Health Card */}
        <ComplianceHealth
          score={dashboardMetrics.complianceHealth}
          actionRequiredCount={dashboardMetrics.actionRequired}
          applicableCount={dashboardMetrics.applicableRequirements}
          conformingCount={dashboardMetrics.conformingCount}
          auditReadiness={dashboardMetrics.auditReadinessScore}
          surveillanceAuditDate={dashboardMetrics.surveillanceAuditDate}
          surveillanceDaysLeft={dashboardMetrics.surveillanceDaysLeft}
          onViewActions={() => onNavigateToView("compliance")}
        />

        {/* Supporting Compact Metrics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          <MetricCard
            label="Compliance Health"
            value={`${dashboardMetrics.complianceHealth}%`}
            subtext="Audit readiness index"
            badge={{ text: "On Track", variant: "success" }}
          />
          <MetricCard
            label="Action Required"
            value={dashboardMetrics.actionRequired}
            subtext="Mandates pending resolution"
            badge={{ text: "High Urgency", variant: "warning" }}
          />
          <MetricCard
            label="Upcoming Deadlines"
            value={dashboardMetrics.upcomingDeadlines}
            subtext="Next statutory filing in 14d"
            badge={{ text: "Calendar", variant: "info" }}
          />
          <MetricCard
            label="Documents"
            value={dashboardMetrics.documentsCount}
            subtext="8 verified · 2 in review · 1 issue"
            badge={{ text: "11 Total", variant: "neutral" }}
          />
        </div>
      </div>

      {/* Middle Section: Varied Composition (Priority Actions & Workflows vs Deadlines & Standards) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 Columns: Priority Actions & Regulatory Changes */}
        <div className="lg:col-span-7 space-y-6">
          {/* Module 2: Priority Compliance Actions */}
          <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-slate-950">
                    Priority Compliance Actions
                  </h2>
                  <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-900">
                    {priorityActions.length} Pending
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Statutory obligations requiring immediate testing renewal or evidence dossier submission.
                </p>
              </div>

              <button
                onClick={() => onNavigateToView("compliance")}
                className="text-xs font-semibold text-blue-900 hover:text-blue-950 inline-flex items-center gap-1"
              >
                <span>View All</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              {priorityActions.map((action: PriorityAction) => (
                <div
                  key={action.id}
                  className="p-3.5 rounded-lg border border-slate-200/80 bg-slate-50/40 hover:bg-white hover:border-slate-300 transition-all space-y-2"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-blue-900">
                          {action.authority}
                        </span>
                        <span className="text-slate-300">·</span>
                        <span className="font-mono text-xs text-slate-700 font-semibold">
                          {action.standard_code}
                        </span>
                      </div>
                      <div className="text-xs font-bold text-slate-950">
                        {action.title}
                      </div>
                    </div>

                    <span className="inline-flex items-center gap-1 rounded bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold px-2 py-0.5 shrink-0">
                      <Clock className="h-3 w-3" />
                      {action.days_remaining}d left
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    {action.summary}
                  </p>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-100/80 text-[11px]">
                    <span className="font-mono text-[10px] text-slate-400">
                      {action.clause_ref}
                    </span>
                    <button
                      onClick={() => onNavigateToView(action.target_view as NavView)}
                      className="font-semibold text-blue-900 hover:text-blue-950 inline-flex items-center gap-1"
                    >
                      <span>{action.action_cta}</span>
                      <ArrowRight className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Module 4: Regulatory Changes */}
          <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-slate-950">
                    Regulatory Changes & Gazette Notices
                  </h2>
                  <span className="text-[10px] font-semibold text-slate-400">
                    Updated Daily
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Official Gazette of India notifications and BIS technical instructions.
                </p>
              </div>

              <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-md text-[11px]">
                <button
                  onClick={() => setActiveRegFilter("ALL")}
                  className={`px-2 py-0.5 rounded font-medium ${
                    activeRegFilter === "ALL" ? "bg-white text-slate-900 shadow-2xs font-semibold" : "text-slate-600"
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setActiveRegFilter("QCO")}
                  className={`px-2 py-0.5 rounded font-medium ${
                    activeRegFilter === "QCO" ? "bg-white text-slate-900 shadow-2xs font-semibold" : "text-slate-600"
                  }`}
                >
                  QCO Orders
                </button>
                <button
                  onClick={() => setActiveRegFilter("CIRCULAR")}
                  className={`px-2 py-0.5 rounded font-medium ${
                    activeRegFilter === "CIRCULAR" ? "bg-white text-slate-900 shadow-2xs font-semibold" : "text-slate-600"
                  }`}
                >
                  Circulars
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {filteredRegs.map((change) => (
                <RegulationRow key={change.id} change={change} />
              ))}
            </div>
          </div>
        </div>

        {/* Right 5 Columns: Upcoming Deadlines, Active Workflows & Documents */}
        <div className="lg:col-span-5 space-y-6">
          {/* Module 3: Upcoming Deadlines */}
          <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-sm font-bold text-slate-950">
                  Upcoming Deadlines
                </h2>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Statutory filing calendar & renewal cycles.
                </p>
              </div>

              <button
                onClick={() => onNavigateToView("calendar")}
                className="text-xs font-semibold text-blue-900 hover:text-blue-950 inline-flex items-center gap-1"
              >
                <span>Calendar</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="space-y-2.5">
              {upcomingDeadlines.map((dl) => (
                <DeadlineRow
                  key={dl.id}
                  deadline={dl}
                  onSelect={() => onNavigateToView("calendar")}
                />
              ))}
            </div>
          </div>

          {/* Module 5: Active Workflows */}
          <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-sm font-bold text-slate-950">
                  Active Approval Workflows
                </h2>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Multi-step departmental clearance procedures.
                </p>
              </div>

              <button
                onClick={() => onNavigateToView("workflows")}
                className="text-xs font-semibold text-blue-900 hover:text-blue-950 inline-flex items-center gap-1"
              >
                <span>View All</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              {workflows.map((wf) => (
                <WorkflowRow
                  key={wf.id}
                  workflow={wf}
                  onContinue={() => onNavigateToView("workflows")}
                />
              ))}
            </div>
          </div>

          {/* Module 6: Statutory Documents Snapshot */}
          <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-sm font-bold text-slate-950">
                  Statutory Documents
                </h2>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  11 entity proofs & testing dossiers.
                </p>
              </div>

              <button
                onClick={() => onNavigateToView("documents")}
                className="text-xs font-semibold text-blue-900 hover:text-blue-950 inline-flex items-center gap-1"
              >
                <span>All Documents</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="space-y-2">
              {documents.slice(0, 3).map((doc) => (
                <DocumentRow
                  key={doc.id}
                  document={doc}
                  onInspect={() => onNavigateToView("documents")}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Module 8: BIS Agent (Restrained Enterprise Retrieval) */}
      <BISAgent />
    </div>
  );
}

export default DashboardView;
