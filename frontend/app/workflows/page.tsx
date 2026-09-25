"use client";

import React, { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import AppShell from "@/components/AppShell";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import ErrorState from "@/components/ErrorState";
import { api } from "@/lib/api";
import type { ComplianceCaseDetail, ComplianceCaseItem } from "@/types";
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileCheck,
  FileText,
  Filter,
  Layers,
  RefreshCw,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  UserCheck,
  Zap,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

interface DynamicWorkflowStage {
  id: string;
  number: number;
  name: string;
  description: string;
  status: "COMPLETED" | "IN_PROGRESS" | "WAITING" | "ACTION_REQUIRED";
  actionLabel?: string;
  actionHref?: string;
  notes?: string;
}

interface DynamicWorkflowItem {
  id: string; // Case UUID
  caseNumber: string;
  title: string;
  authority: string;
  requirementCode: string;
  statusCode: string;
  priority: string;
  progressPercent: number;
  currentStageNumber: number;
  stages: DynamicWorkflowStage[];
  documentsRequiredCount: number;
  documentsUploadedCount: number;
  documentsApprovedCount: number;
  updatedAt: string;
}

function deriveWorkflowFromCase(c: ComplianceCaseItem & { document_requirements?: any[] }): DynamicWorkflowItem {
  const docReqs = c.document_requirements || [];
  const docsReqCount = c.documents_count ?? docReqs.length;
  const docsUpCount = docReqs.filter((d: any) => !!d.latest_submission).length;
  const docsAppCount = docReqs.filter(
    (d: any) =>
      d.status_code === "VERIFIED" ||
      d.latest_submission?.status_code === "INTERNAL_HUMAN_APPROVED"
  ).length;

  const isCompleted = c.status_code === "COMPLETED";
  const isExternal = c.status_code === "EXTERNAL_PROCESSING";
  const isSubmitted = c.status_code === "SUBMITTED";
  const isHumanReview = c.status_code === "HUMAN_REVIEW";
  const isActionReq = c.status_code === "ACTION_REQUIRED";

  // Calculate Stage 1: Document Upload
  const stage1Complete = docsReqCount > 0 && docsUpCount >= docsReqCount;
  const stage1Status = isCompleted || stage1Complete ? "COMPLETED" : "IN_PROGRESS";

  // Calculate Stage 2: Automated AI Precheck
  const stage2Complete = isCompleted || (stage1Complete && docsUpCount > 0);
  const stage2Status = isCompleted
    ? "COMPLETED"
    : stage1Complete
    ? "COMPLETED"
    : docsUpCount > 0
    ? "IN_PROGRESS"
    : "WAITING";

  // Calculate Stage 3: Human Officer Scrutiny
  const stage3Complete = isCompleted || isExternal || isSubmitted || docsAppCount >= docsReqCount;
  let stage3Status: "COMPLETED" | "IN_PROGRESS" | "WAITING" | "ACTION_REQUIRED" = "WAITING";
  if (isCompleted || stage3Complete) {
    stage3Status = "COMPLETED";
  } else if (isActionReq) {
    stage3Status = "ACTION_REQUIRED";
  } else if (isHumanReview || (stage1Complete && !stage3Complete)) {
    stage3Status = "IN_PROGRESS";
  } else {
    stage3Status = "WAITING";
  }

  // Calculate Stage 4: Form Preparation & Filing
  const stage4Complete = isCompleted || isExternal;
  let stage4Status: "COMPLETED" | "IN_PROGRESS" | "WAITING" = "WAITING";
  if (isCompleted || stage4Complete) {
    stage4Status = "COMPLETED";
  } else if (isSubmitted || stage3Complete) {
    stage4Status = "IN_PROGRESS";
  } else {
    stage4Status = "WAITING";
  }

  // Calculate Stage 5: Government Authority Processing
  const stage5Complete = isCompleted;
  let stage5Status: "COMPLETED" | "IN_PROGRESS" | "WAITING" = "WAITING";
  if (isCompleted) {
    stage5Status = "COMPLETED";
  } else if (isExternal) {
    stage5Status = "IN_PROGRESS";
  } else {
    stage5Status = "WAITING";
  }

  // Calculate Stage 6: Statutory Certification
  const stage6Status = isCompleted ? "COMPLETED" : "WAITING";

  // Calculate Progress Percent
  let progress = 15;
  let currentStageNumber = 1;
  if (isCompleted) {
    progress = 100;
    currentStageNumber = 6;
  } else if (isExternal) {
    progress = 85;
    currentStageNumber = 5;
  } else if (isSubmitted || stage4Status === "IN_PROGRESS") {
    progress = 70;
    currentStageNumber = 4;
  } else if (stage3Complete) {
    progress = 60;
    currentStageNumber = 4;
  } else if (stage3Status === "ACTION_REQUIRED") {
    progress = 35;
    currentStageNumber = 3;
  } else if (stage3Status === "IN_PROGRESS") {
    progress = 45;
    currentStageNumber = 3;
  } else if (stage1Complete) {
    progress = 30;
    currentStageNumber = 2;
  } else if (docsUpCount > 0) {
    progress = 20;
    currentStageNumber = 1;
  }

  const stages: DynamicWorkflowStage[] = [
    {
      id: "stage-1",
      number: 1,
      name: "Document & Evidence Collection",
      description: "Gather and upload required statutory certificates, licenses, and proofs.",
      status: stage1Status,
      actionLabel: stage1Status !== "COMPLETED" ? "Upload Evidence in Documents →" : undefined,
      actionHref: "/documents",
      notes:
        docsReqCount > 0
          ? `${docsUpCount} of ${docsReqCount} required statutory documents uploaded.`
          : "Statutory checklist ready.",
    },
    {
      id: "stage-2",
      number: 2,
      name: "Automated AI Pre-Validation",
      description: "OCR text extraction, checksum cryptographic verification, and rule checks.",
      status: stage2Status,
      notes:
        stage2Status === "COMPLETED"
          ? "Automated pre-checks passed with zero blocking discrepancies."
          : stage2Status === "IN_PROGRESS"
          ? "Pre-validation engine processing uploaded files."
          : "Runs automatically as soon as documents are uploaded.",
    },
    {
      id: "stage-3",
      number: 3,
      name: "Regulatory Officer Scrutiny",
      description: "Official compliance officer review, document scrutiny, and mandate determination.",
      status: stage3Status,
      actionLabel:
        stage3Status === "ACTION_REQUIRED" ? "View Officer Query in Documents →" : undefined,
      actionHref: "/documents",
      notes:
        stage3Status === "COMPLETED"
          ? "Officer scrutiny passed: All submitted evidence officially verified & approved."
          : stage3Status === "ACTION_REQUIRED"
          ? "Action Required: The compliance officer requested clarification. Please upload a corrected document."
          : stage3Status === "IN_PROGRESS"
          ? "Currently under scrutiny by certified regulatory compliance officers."
          : "Awaiting document uploads before officer dispatch.",
    },
    {
      id: "stage-4",
      number: 4,
      name: "Form Preparation & Portal Filing",
      description: "Statutory application filing form preparation and verification with government portal formats.",
      status: stage4Status,
      notes:
        stage4Status === "COMPLETED"
          ? "Application filed with official department portal."
          : stage4Status === "IN_PROGRESS"
          ? "Filing dossier prepared with verified evidence attachments."
          : "Unlocks once officer approves statutory evidence.",
    },
    {
      id: "stage-5",
      number: 5,
      name: "Government Authority Processing",
      description: "Official portal tracking, department scrutiny, and statutory status synchronization.",
      status: stage5Status,
      notes:
        stage5Status === "COMPLETED"
          ? "Official government review concluded successfully."
          : stage5Status === "IN_PROGRESS"
          ? `Application registered on ${c.authority} portal. Awaiting statutory issuance.`
          : "Synchronized with official regulatory portals upon submission.",
    },
    {
      id: "stage-6",
      number: 6,
      name: "Statutory Clearance Granted",
      description: "Official certificate issued, clearance active, and renewal anchored on calendar.",
      status: stage6Status,
      notes:
        stage6Status === "COMPLETED"
          ? "Full statutory clearance granted & active."
          : "Final certificate issued upon regulatory department approval.",
    },
  ];

  return {
    id: c.id,
    caseNumber: c.case_number,
    title: c.requirement_name,
    authority: c.authority,
    requirementCode: c.requirement_id_code,
    statusCode: c.status_code,
    priority: c.priority || "MEDIUM",
    progressPercent: progress,
    currentStageNumber,
    stages,
    documentsRequiredCount: docsReqCount,
    documentsUploadedCount: docsUpCount,
    documentsApprovedCount: docsAppCount,
    updatedAt: c.updated_at,
  };
}

function WorkflowsContent() {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const paramBusinessId = searchParams.get("business_id");

  const [businessId, setBusinessId] = useState<string>("");
  const [businessName, setBusinessName] = useState<string>("Active Enterprise");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [workflows, setWorkflows] = useState<DynamicWorkflowItem[]>([]);
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | null>(null);
  const [selectedStageNumber, setSelectedStageNumber] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState<string>("");

  useEffect(() => {
    const bizId =
      paramBusinessId ||
      (typeof window !== "undefined"
        ? localStorage.getItem("complywise_active_business_id") || "6f486024-454f-4795-92bf-3cef0846e8db"
        : "6f486024-454f-4795-92bf-3cef0846e8db");
    setBusinessId(bizId);
    loadWorkflowsData(bizId);
  }, [paramBusinessId]);

  async function loadWorkflowsData(bizId: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await api.cases.getCases(bizId);
      if (res.business_name) {
        setBusinessName(res.business_name);
      }

      const cases = res.cases || [];
      const detailedCases = await Promise.all(
        cases.map(async (c) => {
          if (c.document_requirements && c.document_requirements.length > 0) {
            return c;
          }
          try {
            return await api.cases.getCase(c.id);
          } catch {
            return c;
          }
        })
      );

      const items = detailedCases.map(deriveWorkflowFromCase);
      setWorkflows(items);

      if (items.length > 0 && !selectedWorkflowId) {
        setSelectedWorkflowId(items[0].id);
        setSelectedStageNumber(items[0].currentStageNumber);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to load statutory compliance workflows.");
    } finally {
      setLoading(false);
    }
  }

  const activeWf =
    workflows.find((w) => w.id === selectedWorkflowId) || workflows[0] || null;

  const activeStage =
    activeWf?.stages.find((s) => s.number === selectedStageNumber) ||
    activeWf?.stages[0] ||
    null;

  const filteredWorkflows = workflows.filter((w) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      w.title.toLowerCase().includes(q) ||
      w.caseNumber.toLowerCase().includes(q) ||
      w.authority.toLowerCase().includes(q) ||
      w.requirementCode.toLowerCase().includes(q)
    );
  });

  return (
    <AppShell activeView="workflows">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header */}
        <div className="bg-card rounded-2xl border border-border p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full border border-border bg-muted/50 text-foreground text-[11px] font-semibold tracking-wider uppercase mb-2">
              <Zap className="w-3.5 h-3.5 text-primary" />
              Statutory Approval &bull; Live Clearance Roadmaps
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Compliance Workflows & Clearance Pipeline
            </h1>
            <p className="text-xs text-muted-foreground mt-1.5 max-w-2xl leading-relaxed">
              Real-time multi-stage clearance tracking. As you upload evidence in Documents and officers approve them, each clearance roadmap advances automatically.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              href={`/documents?business_id=${businessId}`}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-sm transition-colors"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Go to Documents Section &rarr;</span>
            </Link>

            <button
              onClick={() => loadWorkflowsData(businessId)}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border bg-background hover:bg-muted text-xs font-semibold transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Global Loading / Error State */}
        {loading && <LoadingSkeleton count={4} />}
        {error && <ErrorState message={error} onRetry={() => loadWorkflowsData(businessId)} />}

        {!loading && !error && workflows.length === 0 && (
          <div className="bg-card rounded-2xl border border-dashed border-border p-12 text-center space-y-3 shadow-xs">
            <Layers className="w-10 h-10 text-muted-foreground mx-auto" />
            <h3 className="text-base font-bold text-foreground">No Active Workflows</h3>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              Compliance clearance workflows are automatically generated when statutory mandates apply to your declared profile.
            </p>
            <Link
              href="/compliance"
              className="inline-flex items-center gap-1 px-4 py-2 rounded-xl bg-foreground text-background text-xs font-semibold hover:opacity-90 transition-opacity"
            >
              <span>View Applicable Mandates</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}

        {!loading && !error && activeWf && (
          <>
            {/* Active Workflow Showcase Interactive Stepper */}
            <div className="p-6 sm:p-8 rounded-2xl border border-border bg-card shadow-sm space-y-6">
              {/* Stepper Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-border pb-5">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-950/60 px-2.5 py-0.5 rounded">
                      {activeWf.caseNumber}
                    </span>
                    <span className="text-xs font-semibold text-muted-foreground bg-muted px-2.5 py-0.5 rounded">
                      {activeWf.authority}
                    </span>
                    <span className="text-xs font-mono text-muted-foreground">
                      {activeWf.requirementCode}
                    </span>
                  </div>

                  <h2 className="text-xl sm:text-2xl font-bold text-foreground mt-2">
                    {activeWf.title}
                  </h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    Statutory Approval Process &bull; Fully synchronized with regulatory officer reviews and official submissions.
                  </p>
                </div>

                <div className="flex flex-col sm:items-end gap-1.5 shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-foreground">Overall Progress:</span>
                    <span className="font-mono text-base font-extrabold text-purple-600 dark:text-purple-400">
                      {activeWf.progressPercent}%
                    </span>
                  </div>
                  <span
                    className={`text-[11px] font-bold px-3 py-1 rounded-full ${
                      activeWf.progressPercent === 100
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                        : activeWf.statusCode === "ACTION_REQUIRED"
                        ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                        : "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300"
                    }`}
                  >
                    {activeWf.progressPercent === 100
                      ? "Clearance Certified"
                      : activeWf.statusCode === "ACTION_REQUIRED"
                      ? "Clarification Queried"
                      : `Stage ${activeWf.currentStageNumber} of 6 In Progress`}
                  </span>
                </div>
              </div>

              {/* Multi-Node Dynamic Stepper Line */}
              <div className="py-4 overflow-x-auto">
                <div className="min-w-[700px] flex items-center justify-between relative px-6">
                  {/* Connecting Track Line */}
                  <div className="absolute left-10 right-10 top-5 h-1.5 bg-muted rounded-full overflow-hidden -z-0">
                    <div
                      className="h-full bg-emerald-600 transition-all duration-500 rounded-full"
                      style={{
                        width: `${((activeWf.currentStageNumber - 1) / 5) * 100}%`,
                      }}
                    />
                  </div>

                  {/* Nodes */}
                  {activeWf.stages.map((st) => {
                    const isCompleted = st.status === "COMPLETED";
                    const isInProgress = st.status === "IN_PROGRESS";
                    const isActionReq = st.status === "ACTION_REQUIRED";
                    const isSelected = st.number === selectedStageNumber;

                    return (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => setSelectedStageNumber(st.number)}
                        className="relative z-10 flex flex-col items-center group cursor-pointer focus:outline-none"
                      >
                        {/* Node Icon */}
                        <div
                          className={`h-11 w-11 rounded-full flex items-center justify-center transition-all duration-300 ${
                            isSelected
                              ? "ring-4 ring-purple-400 dark:ring-purple-600 scale-110 shadow-md"
                              : "hover:scale-105"
                          } ${
                            isCompleted
                              ? "bg-emerald-600 text-white font-bold shadow-sm"
                              : isActionReq
                              ? "bg-amber-500 text-white font-bold ring-2 ring-amber-300 animate-bounce"
                              : isInProgress
                              ? "bg-purple-600 text-white font-bold ring-4 ring-purple-300 dark:ring-purple-800 animate-pulse"
                              : "bg-muted text-muted-foreground font-semibold border-2 border-border"
                          }`}
                        >
                          {isCompleted ? (
                            <CheckCircle2 className="w-5 h-5" />
                          ) : isActionReq ? (
                            <AlertTriangle className="w-5 h-5" />
                          ) : (
                            <span className="text-xs font-bold">{st.number}</span>
                          )}
                        </div>

                        {/* Node Label */}
                        <div className="text-center mt-2.5 max-w-[100px]">
                          <span
                            className={`text-[11px] font-bold block leading-tight ${
                              isSelected
                                ? "text-purple-600 dark:text-purple-400 font-extrabold"
                                : isCompleted
                                ? "text-foreground font-semibold"
                                : isInProgress
                                ? "text-purple-600 font-bold"
                                : "text-muted-foreground"
                            }`}
                          >
                            {st.name}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Selected Stage Detail Panel */}
              {activeStage && (
                <div
                  className={`p-5 rounded-2xl border transition-all ${
                    activeStage.status === "COMPLETED"
                      ? "border-emerald-300 bg-emerald-50/50 dark:border-emerald-900/60 dark:bg-emerald-950/20"
                      : activeStage.status === "ACTION_REQUIRED"
                      ? "border-amber-300 bg-amber-50/60 dark:border-amber-900/60 dark:bg-amber-950/20"
                      : activeStage.status === "IN_PROGRESS"
                      ? "border-purple-300 bg-purple-50/50 dark:border-purple-900/60 dark:bg-purple-950/20"
                      : "border-border bg-muted/30"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-background border border-border">
                          Stage {activeStage.number} of 6
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            activeStage.status === "COMPLETED"
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                              : activeStage.status === "ACTION_REQUIRED"
                              ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                              : activeStage.status === "IN_PROGRESS"
                              ? "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {activeStage.status === "COMPLETED"
                            ? "Stage Completed"
                            : activeStage.status === "ACTION_REQUIRED"
                            ? "Action Required from User"
                            : activeStage.status === "IN_PROGRESS"
                            ? "Active Stage in Progress"
                            : "Waiting for Preceding Stage"}
                        </span>
                      </div>

                      <h3 className="text-lg font-bold text-foreground mt-1">
                        {activeStage.name}
                      </h3>
                      <p className="text-xs text-muted-foreground max-w-2xl leading-relaxed">
                        {activeStage.description}
                      </p>

                      {activeStage.notes && (
                        <p className="text-xs font-medium text-foreground mt-1.5 flex items-center gap-1.5">
                          {activeStage.status === "COMPLETED" ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          ) : activeStage.status === "ACTION_REQUIRED" ? (
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          ) : (
                            <Clock className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                          )}
                          <span>{activeStage.notes}</span>
                        </p>
                      )}
                    </div>

                    {/* Direct Action Button */}
                    {activeStage.actionLabel && activeStage.actionHref && (
                      <Link
                        href={activeStage.actionHref}
                        className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-sm transition-colors"
                      >
                        <span>{activeStage.actionLabel}</span>
                      </Link>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* List of All Applicable Clearance Workflows */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                    <Layers className="w-5 h-5 text-primary" />
                    All Statutory Clearance Roadmaps ({workflows.length})
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Click any workflow to inspect its live stage progression and statutory status
                  </p>
                </div>

                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search workflows..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 bg-card border border-border rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredWorkflows.map((wf) => {
                  const isSelected = wf.id === activeWf.id;
                  const isFinished = wf.progressPercent === 100;
                  const isQueried = wf.statusCode === "ACTION_REQUIRED";

                  return (
                    <div
                      key={wf.id}
                      onClick={() => {
                        setSelectedWorkflowId(wf.id);
                        setSelectedStageNumber(wf.currentStageNumber);
                      }}
                      className={`p-5 rounded-2xl border transition-all cursor-pointer shadow-xs space-y-4 ${
                        isSelected
                          ? "border-purple-500 bg-purple-50/20 dark:bg-purple-950/20 ring-2 ring-purple-500/20"
                          : "border-border bg-card hover:border-purple-300 dark:hover:border-purple-800"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-[11px] font-bold text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-950/60 px-2 py-0.5 rounded">
                              {wf.caseNumber}
                            </span>
                            <span className="text-[10px] font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded">
                              {wf.authority}
                            </span>
                          </div>
                          <h4 className="text-sm font-bold text-foreground line-clamp-1">{wf.title}</h4>
                        </div>

                        <span
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full shrink-0 ${
                            isFinished
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                              : isQueried
                              ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                              : "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300"
                          }`}
                        >
                          {isFinished
                            ? "Completed"
                            : isQueried
                            ? "Queried"
                            : `Stage ${wf.currentStageNumber} Active`}
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-[11px] text-muted-foreground">Clearance Progress</span>
                          <span className="font-mono text-xs font-bold text-foreground">
                            {wf.progressPercent}%
                          </span>
                        </div>
                        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-500 rounded-full ${
                              isFinished ? "bg-emerald-600" : "bg-purple-600"
                            }`}
                            style={{ width: `${wf.progressPercent}%` }}
                          />
                        </div>
                      </div>

                      {/* Footer Stats & Document Action */}
                      <div className="pt-2 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                        <span>
                          {wf.documentsApprovedCount} of {wf.documentsRequiredCount} files approved
                        </span>
                        <Link
                          href="/documents"
                          onClick={(e) => e.stopPropagation()}
                          className="text-xs font-semibold text-purple-700 dark:text-purple-300 hover:underline flex items-center gap-1"
                        >
                          <span>Manage Documents</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}

export default function WorkflowsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center text-xs text-muted-foreground">
          Loading statutory clearance roadmaps...
        </div>
      }
    >
      <WorkflowsContent />
    </Suspense>
  );
}
