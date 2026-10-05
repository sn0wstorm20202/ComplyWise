"use client";
import Overlay from "@/components/product/Overlay";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { AdminShell } from "@/components/AdminShell";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import ErrorState from "@/components/ErrorState";
import { AdminPdfViewer } from "@/components/AdminPdfViewer";
import { api } from "@/lib/api";
import type {
  CaseQueryItem,
  CaseRequirementDispositionItem,
  ComplianceCaseDetail,
  DeadlineItem,
  DocumentRequirementItem,
  DocumentSubmissionItem,
  WorkflowEventItem,
} from "@/types";
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  Bell,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  ExternalLink,
  Eye,
  FileCheck,
  FileText,
  HelpCircle,
  History,
  Info,
  Layers,
  Plus,
  Send,
  Shield,
  ShieldAlert,
  ShieldCheck,
  User,
  UserCheck,
  UserPlus,
  XCircle,
  Zap,
} from "lucide-react";

interface AdminCasePageProps {
  params: Promise<{ id: string }>;
}

export default function AdminCaseDetailPage({ params }: AdminCasePageProps) {
  const resolvedParams = use(params);
  const caseId = resolvedParams.id;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [caseData, setCaseData] = useState<ComplianceCaseDetail | null>(null);
  const [docRequirements, setDocRequirements] = useState<DocumentRequirementItem[]>([]);
  const [timeline, setTimeline] = useState<WorkflowEventItem[]>([]);
  const [dispositions, setDispositions] = useState<CaseRequirementDispositionItem[]>([]);
  const [catalogRequirements, setCatalogRequirements] = useState<any[]>([]);
  const [deadlines, setDeadlines] = useState<DeadlineItem[]>([]);
  const [queries, setQueries] = useState<CaseQueryItem[]>([]);

  // Selected submission for document scrutiny
  const [selectedDocReqId, setSelectedDocReqId] = useState<string | null>(null);
  const [selectedSubmissionVersion, setSelectedSubmissionVersion] = useState<number | null>(null);

  // Scrutiny Action Modals
  const [actionType, setActionType] = useState<"APPROVE" | "QUERY" | "REJECT" | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionReason, setActionReason] = useState("");
  const [actionRequiredNote, setActionRequiredNote] = useState("");
  const [submittingAction, setSubmittingAction] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);
  const [showAllVariables, setShowAllVariables] = useState(false);

  // Assignment Modal
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assignPriority, setAssignPriority] = useState<"HIGH" | "MEDIUM" | "LOW">("MEDIUM");

  // Government Status Form
  const [govModalOpen, setGovModalOpen] = useState(false);
  const [govStatusForm, setGovStatusForm] = useState({
    portal_name: "",
    status_code: "APPROVED",
    application_reference_number: "",
    portal_remarks: "",
  });

  // Requirement Disposition Modal
  const [dispositionModalOpen, setDispositionModalOpen] = useState(false);
  const [targetReqCode, setTargetReqCode] = useState<string>("");
  const [dispositionMode, setDispositionMode] = useState<"CONFIRM" | "NOT_REQUIRED" | "ADD">("NOT_REQUIRED");
  const [dispositionReason, setDispositionReason] = useState("");
  const [submittingDisposition, setSubmittingDisposition] = useState(false);

  // Deadline Modal
  const [deadlineModalOpen, setDeadlineModalOpen] = useState(false);
  const [deadlineForm, setDeadlineForm] = useState({
    title: "",
    due_at: "",
    description: "",
    priority: "MEDIUM",
    notes: "",
  });
  const [sendingAlertId, setSendingAlertId] = useState<string | null>(null);
  const [alertSuccessMsg, setAlertSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    loadCase();
  }, [caseId]);

  async function loadCase() {
    setLoading(true);
    setError(null);
    try {
      // Fetch 360-degree review packet
      const packet = await api.cases.getReviewPacket(caseId);
      setCaseData(packet.case);
      setTimeline(packet.audit_events || []);
      setDispositions(packet.dispositions || []);
      setDeadlines(packet.deadlines || []);
      setQueries(packet.queries || []);

      // Authoritative document requirements list
      const reqs = (packet.document_requirements && packet.document_requirements.length > 0)
        ? packet.document_requirements
        : (packet.case?.document_requirements || []);
      setDocRequirements(reqs);

      // Also fetch catalog requirements for adding new requirements
      try {
        const reqRes = await api.cases.getRequirements(caseId);
        setCatalogRequirements(reqRes.catalog_requirements || []);
      } catch (e) {
        // non-blocking
      }

      // Default select the first requirement that has an uploaded file
      if (reqs.length > 0) {
        setSelectedDocReqId((currentId) => {
          if (currentId && reqs.some((r: any) => r.id === currentId)) {
            return currentId;
          }
          const withSub = reqs.find((r: any) => (r.submissions && r.submissions.length > 0) || r.latest_submission);
          return withSub ? withSub.id : reqs[0].id;
        });
      }

      setAssignPriority(packet.case.priority || "MEDIUM");
      setGovStatusForm({
        portal_name: packet.case.authority || "Official Regulatory Portal",
        status_code: "APPROVED",
        application_reference_number: "",
        portal_remarks: "",
      });
    } catch (err: any) {
      setError(err?.message || "Failed to load admin case review packet.");
    } finally {
      setLoading(false);
    }
  }

  async function handleExecuteScrutiny(e: React.FormEvent) {
    e.preventDefault();
    if (!caseData || !actionType) return;

    setSubmittingAction(true);
    setActionError(null);
    setActionSuccessMsg(null);
    setError(null);

    // Current targeted submission
    const currentDoc =
      docRequirements.find((d) => d.id === selectedDocReqId) ||
      caseData.document_requirements?.find((d) => d.id === selectedDocReqId);
    const sub = selectedSubmissionVersion
      ? currentDoc?.submissions?.find((s) => s.version_number === selectedSubmissionVersion) || currentDoc?.latest_submission
      : currentDoc?.latest_submission;
    const subId = sub?.id;
    const expectedVersion = caseData.concurrency_version;

    try {
      if (actionType === "APPROVE") {
        await api.cases.adminApprove(
          caseId,
          actionReason || "Approved after compliance scrutiny.",
          subId,
          expectedVersion
        );
        setActionSuccessMsg(`Document "${sub?.file_name || currentDoc?.name}" approved. Case workflow advanced.`);
      } else if (actionType === "QUERY") {
        await api.cases.adminQuery(
          caseId,
          actionReason || "Document requires correction.",
          actionRequiredNote || "Upload updated valid statutory evidence.",
          subId,
          expectedVersion
        );
        setActionSuccessMsg(`Clarification query raised for "${sub?.file_name || currentDoc?.name}". Case transitioned to Action Required.`);
      } else if (actionType === "REJECT") {
        await api.cases.adminReject(
          caseId,
          actionReason || "Does not satisfy statutory criteria.",
          subId,
          expectedVersion
        );
        setActionSuccessMsg(`Document "${sub?.file_name || currentDoc?.name}" rejected. Scrutiny determination recorded.`);
      }

      setActionType(null);
      setActionReason("");
      setActionRequiredNote("");
      await loadCase();
    } catch (err: any) {
      setActionError(err?.message || "Your decision wasn't saved. Please try again.");
    } finally {
      setSubmittingAction(false);
    }
  }

  async function handleAssignTask(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api.cases.assignCase(caseId, undefined, assignPriority, "CLAIM");
      setAssignModalOpen(false);
      await loadCase();
    } catch (err: any) {
      setError(err?.message || "Failed to assign case.");
    }
  }

  async function handleRecordGovStatus(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api.cases.recordExternalStatus(caseId, govStatusForm);
      setGovModalOpen(false);
      await loadCase();
    } catch (err: any) {
      setError(err?.message || "Failed to record portal status.");
    }
  }

  async function handleDispositionSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!targetReqCode) return;
    setSubmittingDisposition(true);
    setError(null);

    try {
      if (dispositionMode === "CONFIRM") {
        await api.cases.confirmRequirement(caseId, targetReqCode, dispositionReason);
        setActionSuccessMsg(`Requirement ${targetReqCode} confirmed as REQUIRED.`);
      } else if (dispositionMode === "NOT_REQUIRED") {
        await api.cases.markNotRequired(caseId, targetReqCode, dispositionReason);
        setActionSuccessMsg(`Requirement ${targetReqCode} marked as NOT_REQUIRED.`);
      } else if (dispositionMode === "ADD") {
        await api.cases.addRequirement(caseId, targetReqCode, dispositionReason);
        setActionSuccessMsg(`Requirement ${targetReqCode} attached from catalog.`);
      }

      setDispositionModalOpen(false);
      setDispositionReason("");
      await loadCase();
    } catch (err: any) {
      setError(err?.message || "Failed to update requirement disposition.");
    } finally {
      setSubmittingDisposition(false);
    }
  }

  async function handleCreateDeadlineSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!deadlineForm.title || !deadlineForm.due_at) return;

    try {
      await api.cases.createDeadline(caseId, {
        title: deadlineForm.title,
        due_at: deadlineForm.due_at,
        description: deadlineForm.description,
        priority: deadlineForm.priority,
        notes: deadlineForm.notes,
      });
      setDeadlineModalOpen(false);
      setDeadlineForm({ title: "", due_at: "", description: "", priority: "MEDIUM", notes: "" });
      setAlertSuccessMsg("Statutory deadline successfully scheduled.");
      await loadCase();
    } catch (err: any) {
      setError(err?.message || "Failed to create deadline.");
    }
  }

  async function handleSendAlertNow(deadlineId: string) {
    setSendingAlertId(deadlineId);
    setAlertSuccessMsg(null);
    try {
      const res = await api.cases.sendDeadlineAlert(deadlineId, "Officer triggered instant compliance dispatch.");
      setAlertSuccessMsg(`Alert dispatched immediately to ${res.result?.recipient || "user"}.`);
      await loadCase();
    } catch (err: any) {
      setError(err?.message || "Failed to send instant deadline alert.");
    } finally {
      setSendingAlertId(null);
    }
  }

  if (loading) {
    return (
      <AdminShell>
        <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
          <LoadingSkeleton />
        </div>
      </AdminShell>
    );
  }

  if (error && !caseData) {
    return (
      <AdminShell>
        <div className="max-w-7xl mx-auto px-4 py-8">
          <ErrorState message={error} onRetry={loadCase} />
        </div>
      </AdminShell>
    );
  }

  if (!caseData) return null;

  // Selected document requirement and submission resolution
  const authoritativeDocReqs = docRequirements.length > 0 ? docRequirements : (caseData.document_requirements || []);
  const selectedDocReq =
    authoritativeDocReqs.find((d) => d.id === selectedDocReqId) ||
    authoritativeDocReqs[0] ||
    null;

  const submissions = selectedDocReq?.submissions || [];
  const activeSubmission = selectedSubmissionVersion
    ? submissions.find((s) => s.version_number === selectedSubmissionVersion) || selectedDocReq?.latest_submission
    : selectedDocReq?.latest_submission || null;

  const currentStepSeq = caseData.workflow_instance?.current_step?.sequence ?? 1;
  const stepsList = caseData.workflow_steps || [];
  const bContext: NonNullable<ComplianceCaseDetail["business_context"]> = caseData.business_context || {
    business_name: caseData.business_name || "Enterprise",
    state: "Not provided",
    district: "Not provided",
    business_type: "Not provided",
    product: "Not provided",
    workers: "Not provided",
    power_load: "Not provided",
    investment: "Not provided",
  };

  return (
    <AdminShell>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Back Link */}
        <div className="flex items-center justify-between">
          <Link
            href="/admin/cases"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Case Review Queue
          </Link>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-muted text-muted-foreground border border-border">
              v{caseData.concurrency_version ?? 1} (concurrency)
            </span>
          </div>
        </div>

        {/* Action Success Toast */}
        {actionSuccessMsg && (
          <div className="p-3.5 bg-[var(--ui-sage-faint)] dark:bg-[var(--ui-sage)]/40 border border-[var(--ui-sage-soft)] dark:border-[var(--ui-sage-soft)] text-[var(--ui-sage)] dark:text-[var(--ui-sage-soft)] rounded-xl text-xs flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 text-[var(--ui-sage)] shrink-0" />
              {actionSuccessMsg}
            </div>
            <button onClick={() => setActionSuccessMsg(null)} className="text-[var(--ui-sage)] hover:text-[var(--ui-sage)] text-xs font-bold">
              ✕
            </button>
          </div>
        )}

        {/* Alert Success Toast */}
        {alertSuccessMsg && (
          <div className="p-3.5 bg-[var(--ui-info-soft)] dark:bg-[var(--ui-text)]/40 border border-[var(--ui-sage-soft)] dark:border-[var(--ui-sage-soft)] text-[var(--ui-info)] dark:text-[var(--ui-info-soft)] rounded-xl text-xs flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2 font-medium">
              <Bell className="w-4 h-4 text-[var(--ui-info)] shrink-0" />
              {alertSuccessMsg}
            </div>
            <button onClick={() => setAlertSuccessMsg(null)} className="text-[var(--ui-info)] hover:text-[var(--ui-info)] text-xs font-bold">
              ✕
            </button>
          </div>
        )}

        {/* Global Error Notice */}
        {error && (
          <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200 rounded-xl text-xs flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              {error}
            </div>
            <button onClick={() => setError(null)} className="text-rose-700 hover:text-rose-900 text-xs font-bold">
              ✕
            </button>
          </div>
        )}

        {/* Hero Banner: Case Identity & Scrutiny Status */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                  {caseData.case_number}
                </span>
                <span className="text-xs font-semibold text-muted-foreground">&bull;</span>
                <span className="text-xs font-bold text-foreground">{caseData.business_name}</span>
                <span className="text-xs font-semibold text-muted-foreground">&bull;</span>
                <span className="font-mono text-xs text-muted-foreground">{caseData.requirement_id_code}</span>
              </div>

              <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
                {caseData.requirement_name}
              </h1>

              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground pt-1">
                <span>Authority: <strong className="text-foreground">{caseData.authority}</strong></span>
                <span>&bull;</span>
                <span>Reviewer: <strong className="text-foreground">{caseData.assigned_reviewer_name || "Unassigned"}</strong></span>
                <span>&bull;</span>
                <span>Priority: <strong className="text-foreground">{caseData.priority}</strong></span>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setAssignModalOpen(true)}
                className="px-3 py-2 rounded-lg border border-border hover:bg-muted text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <UserPlus className="w-3.5 h-3.5 text-primary" />
                Claim / Assign
              </button>

              <button
                onClick={() => setGovModalOpen(true)}
                className="px-3 py-2 rounded-lg border border-[var(--ui-sage-soft)] dark:border-[var(--ui-sage-soft)] bg-[var(--ui-sage-faint)] dark:bg-[var(--ui-sage)]/40 text-[var(--ui-sage)] dark:text-[var(--ui-sage)] hover:bg-[var(--ui-sage-soft)] text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Government Status
              </button>
            </div>
          </div>

          {/* Workflow Stepper */}
          <div className="mt-8 pt-6 border-t border-border">
            <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-3">
              Workflow State Machine Progress
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2">
              {stepsList.map((st) => {
                const isCompleted = st.sequence < currentStepSeq || caseData.status_code === "COMPLETED";
                const isCurrent = st.sequence === currentStepSeq && caseData.status_code !== "COMPLETED";

                return (
                  <div
                    key={st.id}
                    className={`p-3 rounded-xl border text-xs transition-all ${
                      isCompleted
                        ? "border-[var(--ui-sage-soft)] bg-[var(--ui-sage-faint)]/50 dark:border-[var(--ui-sage-soft)] dark:bg-[var(--ui-sage)]/20 text-[var(--ui-sage)] dark:text-[var(--ui-sage)]"
                        : isCurrent
                        ? "border-primary bg-primary/5 text-primary shadow-sm font-semibold"
                        : "border-border/60 bg-muted/20 text-muted-foreground opacity-60"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-bold">STEP {st.sequence}</span>
                      {isCompleted ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-[var(--ui-sage)]" />
                      ) : isCurrent ? (
                        <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-muted-foreground/30" />
                      )}
                    </div>
                    <p className="font-semibold line-clamp-1">{st.name}</p>
                    <p className="text-[10px] text-muted-foreground/80 mt-0.5 line-clamp-1">{st.code}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 4 Pillars of Admin Case Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* LEFT COLUMN: Pillar 1, 2, 3 */}
          <div className="lg:col-span-8 space-y-6">
            {/* PILLAR 1: Evaluated Business Profile Version & Statutory Mandate (§8, §9, §42) */}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-border/60 pb-3">
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-[var(--ui-sage)] dark:text-[var(--ui-sage)]" />
                  <div>
                    <h3 className="text-sm font-bold text-foreground">
                      Business Profile Version & Mandate Basis
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Authoritative parameters evaluated for this compliance case
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-[var(--ui-sage-soft)] text-[var(--ui-sage)] dark:bg-[var(--ui-sage)]/70 dark:text-[var(--ui-sage)]">
                    <Layers className="w-3.5 h-3.5" />
                    Version v{bContext.profile_version || 1}
                  </span>
                  {(caseData.business || caseData.business_id) && (
                    <Link
                      href={`/admin/businesses?id=${caseData.business || caseData.business_id}`}
                      className="text-xs font-semibold text-[var(--ui-sage)] hover:text-[var(--ui-sage)] dark:text-[var(--ui-sage)] hover:underline flex items-center gap-1"
                    >
                      All Profiles &rarr;
                    </Link>
                  )}
                </div>
              </div>

              {/* Core Operational Parameters Declared by User */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-muted/40 border border-border/50">
                  <span className="text-muted-foreground block text-[10px] font-medium uppercase tracking-wider">State & District</span>
                  <span className="font-bold text-foreground mt-0.5 block">{bContext.state}, {bContext.district}</span>
                </div>
                <div className="p-3 rounded-lg bg-muted/40 border border-border/50">
                  <span className="text-muted-foreground block text-[10px] font-medium uppercase tracking-wider">Industry & Activity</span>
                  <span className="font-bold text-foreground mt-0.5 block line-clamp-1">{bContext.business_type}</span>
                  <span className="text-[10px] text-muted-foreground line-clamp-1">{bContext.product}</span>
                </div>
                <div className="p-3 rounded-lg bg-muted/40 border border-border/50">
                  <span className="text-muted-foreground block text-[10px] font-medium uppercase tracking-wider">Workforce & Power</span>
                  <span className="font-bold text-foreground mt-0.5 block">{bContext.workers} Employees</span>
                  <span className="text-[10px] text-muted-foreground">{bContext.power_load}</span>
                </div>
                <div className="p-3 rounded-lg bg-muted/40 border border-border/50">
                  <span className="text-muted-foreground block text-[10px] font-medium uppercase tracking-wider">Hazard Declarations</span>
                  <span className="font-bold text-foreground mt-0.5 block">
                    {bContext.uses_hazardous_substances == null && bContext.generates_hazardous_waste == null ? "Not provided" : bContext.uses_hazardous_substances || bContext.generates_hazardous_waste ? (
                      <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Hazardous
                      </span>
                    ) : (
                      <span className="text-[var(--ui-sage)] dark:text-[var(--ui-sage)] flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Non-Hazardous
                      </span>
                    )}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    Inv: {bContext.investment !== "Not Specified" ? `₹${bContext.investment}` : "Standard"}
                  </span>
                </div>
              </div>

              {/* Statutory Applicability Reason */}
              {caseData.why_applicable && (
                <div className="p-3.5 rounded-xl bg-[var(--ui-info-soft)]/60 dark:bg-[var(--ui-text)]/30 border border-[var(--ui-sage-soft)] dark:border-[var(--ui-sage-soft)]/60 text-xs">
                  <div className="flex items-center gap-2 text-[var(--ui-info)] dark:text-[var(--ui-info)] font-bold mb-1">
                    <Shield className="w-3.5 h-3.5" />
                    <span>Statutory Mandate Trigger:</span>
                  </div>
                  <p className="text-[var(--ui-info)] dark:text-[var(--ui-info-soft)] leading-relaxed font-medium">
                    {caseData.why_applicable}
                  </p>
                </div>
              )}

              {/* Collapsible Questionnaire Intake */}
              {bContext.answered_variables && bContext.answered_variables.length > 0 && (
                <div className="border border-border/80 rounded-xl overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setShowAllVariables(!showAllVariables)}
                    className="w-full px-4 py-2.5 bg-muted/30 hover:bg-muted/50 flex items-center justify-between text-xs font-semibold text-foreground transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <FileCheck className="w-3.5 h-3.5 text-[var(--ui-sage)]" />
                      Detailed Questionnaire Intake for Profile v{bContext.profile_version || 1}
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--ui-sage-soft)] text-[var(--ui-sage)] dark:bg-[var(--ui-sage)] dark:text-[var(--ui-sage)]">
                        {bContext.answered_variables.length} declarations
                      </span>
                    </span>
                    {showAllVariables ? (
                      <ChevronUp className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    )}
                  </button>

                  {showAllVariables && (
                    <div className="divide-y divide-border/60 bg-background max-h-72 overflow-y-auto">
                      {bContext.answered_variables.map((item: any) => (
                        <div key={item.key} className="px-4 py-2 text-xs flex items-center justify-between gap-4">
                          <div>
                            <span className="font-semibold text-foreground">{item.label}</span>
                            <span className="text-[10px] text-muted-foreground font-mono ml-2">({item.key})</span>
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-foreground font-mono">
                              {typeof item.value === "boolean" ? (item.value ? "Yes" : "No") : String(item.value)}
                              {item.unit ? ` ${item.unit}` : ""}
                            </span>
                            <span className="block text-[10px] text-muted-foreground">
                              {item.origin || "USER_PROVIDED"}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* PILLAR 2: FIX #1 — Admin PDF Document Scrutiny Desk & Direct Adjudication Controls */}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border/70 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary">
                      <FileText className="w-3.5 h-3.5" />
                      Statutory Document Scrutiny Desk
                    </span>
                    <span className="text-xs text-muted-foreground font-mono">
                      {authoritativeDocReqs.filter((d) => (d.submissions && d.submissions.length > 0) || d.latest_submission).length} of {authoritativeDocReqs.length} Documents Uploaded
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-foreground mt-1">
                    Document Verification & Officer Determination
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Authorized inline document viewing with short-lived HMAC security. Approve, query, or reject documents directly from this scrutiny desk.
                  </p>
                </div>

                {/* Quick indicator if any uploaded documents need officer action */}
                <div className="flex items-center gap-2">
                  {authoritativeDocReqs.filter((d) => (d.submissions && d.submissions.length > 0) || d.latest_submission).length > 0 ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-[var(--ui-info-soft)] text-[var(--ui-info)] dark:bg-[var(--ui-text)]/60 dark:text-[var(--ui-info)] border border-[var(--ui-sage-soft)] dark:border-[var(--ui-sage-soft)]/60">
                      <Clock className="w-3.5 h-3.5 text-[var(--ui-info)]" />
                      Evidence Uploaded
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-muted text-muted-foreground">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                      Pending User Uploads
                    </span>
                  )}
                </div>
              </div>

              {/* Requirement Tabs */}
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2 pb-1">
                  {authoritativeDocReqs.map((doc) => {
                    const hasSub = !!doc.latest_submission || (doc.submissions && doc.submissions.length > 0);
                    const isSelected = doc.id === selectedDocReq?.id;
                    const isApproved = doc.latest_submission?.status_code === "INTERNAL_HUMAN_APPROVED";
                    const isQuery = doc.latest_submission?.status_code === "INTERNAL_HUMAN_QUERY";
                    const isRejected = doc.latest_submission?.status_code === "INTERNAL_HUMAN_REJECTED";

                    return (
                      <button
                        key={doc.id}
                        onClick={() => {
                          setSelectedDocReqId(doc.id);
                          setSelectedSubmissionVersion(null);
                        }}
                        className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                          isSelected
                            ? "bg-primary text-primary-foreground shadow-sm ring-2 ring-primary/20"
                            : "bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground border border-border/50"
                        }`}
                      >
                        {isApproved ? (
                          <CheckCircle2 className={`w-3.5 h-3.5 ${isSelected ? "text-[var(--ui-sage)]" : "text-[var(--ui-sage)]"}`} />
                        ) : isQuery ? (
                          <AlertTriangle className={`w-3.5 h-3.5 ${isSelected ? "text-amber-300" : "text-amber-500"}`} />
                        ) : isRejected ? (
                          <XCircle className={`w-3.5 h-3.5 ${isSelected ? "text-rose-300" : "text-rose-500"}`} />
                        ) : hasSub ? (
                          <Clock className={`w-3.5 h-3.5 ${isSelected ? "text-[var(--ui-info-soft)]" : "text-[var(--ui-info)]"}`} />
                        ) : (
                          <span className={`w-2 h-2 rounded-full ${isSelected ? "bg-primary-foreground/50" : "bg-muted-foreground/40"}`} />
                        )}
                        <span className="line-clamp-1">{doc.name}</span>
                        {doc.latest_submission && (
                          <span className={`font-mono text-[10px] px-1.5 py-0.2 rounded font-bold ${
                            isSelected ? "bg-primary-foreground/20 text-primary-foreground" : "bg-background border border-border text-foreground"
                          }`}>
                            v{doc.latest_submission.version_number}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Helpful Switcher notice if user selected a requirement without upload, but other requirements HAVE uploads */}
                {!activeSubmission && authoritativeDocReqs.some((d) => !!d.latest_submission || (d.submissions && d.submissions.length > 0)) && (
                  <div className="p-2.5 rounded-lg bg-[var(--ui-info-soft)]/70 dark:bg-[var(--ui-text)]/30 border border-[var(--ui-sage-soft)] dark:border-[var(--ui-sage-soft)]/40 text-xs text-[var(--ui-info)] dark:text-[var(--ui-info)] flex items-center justify-between gap-3">
                    <span className="flex items-center gap-2">
                      <Info className="w-4 h-4 shrink-0 text-[var(--ui-info)]" />
                      &quot;{selectedDocReq?.name}&quot; has not been uploaded yet. Other requirements have uploaded files ready for review:
                    </span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {authoritativeDocReqs
                        .filter((d) => !!d.latest_submission || (d.submissions && d.submissions.length > 0))
                        .map((d) => (
                          <button
                            key={d.id}
                            onClick={() => {
                              setSelectedDocReqId(d.id);
                              setSelectedSubmissionVersion(null);
                            }}
                            className="px-2 py-0.5 rounded bg-[var(--ui-text)] text-white hover:bg-[var(--ui-text)] text-[11px] font-bold shadow-xs"
                          >
                            View {d.name.split(" ")[0]} &rarr;
                          </button>
                        ))}
                    </div>
                  </div>
                )}
              </div>

              {/* DIRECT DOCUMENT ADJUDICATION ACTION BAR */}
              {activeSubmission ? (
                <div className="p-4 rounded-xl border border-primary/20 bg-muted/30 dark:bg-muted/10 space-y-3">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    {/* Active File Metadata */}
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20 shrink-0">
                        <FileCheck className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-xs text-foreground">
                            {activeSubmission.file_name}
                          </span>
                          <span className="font-mono text-[10px] px-2 py-0.5 rounded-md bg-background border border-border font-bold text-foreground">
                            v{activeSubmission.version_number}
                          </span>
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              activeSubmission.status_code === "INTERNAL_HUMAN_APPROVED"
                                ? "bg-[var(--ui-sage-soft)] text-[var(--ui-sage)] dark:bg-[var(--ui-sage)] dark:text-[var(--ui-sage)]"
                                : activeSubmission.status_code === "INTERNAL_HUMAN_QUERY"
                                ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                                : activeSubmission.status_code === "INTERNAL_HUMAN_REJECTED"
                                ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                                : "bg-[var(--ui-info-soft)] text-[var(--ui-info)] dark:bg-[var(--ui-text)] dark:text-[var(--ui-info)]"
                            }`}
                          >
                            {activeSubmission.status_code?.replace(/_/g, " ") || "PENDING REVIEW"}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          Requirement: <strong>{selectedDocReq?.name}</strong> &bull; Size: {(activeSubmission.file_size_bytes / 1024).toFixed(1)} KB &bull; Uploaded {new Date(activeSubmission.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    {/* ADJUDICATION OPTIONS RIGHT IN THE VIEW FILE SECTION */}
                    <div className="flex items-center gap-2 flex-wrap shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setActionType("APPROVE");
                          setActionReason("Statutory evidence verified and compliant with regulatory requirements.");
                        }}
                        disabled={submittingAction}
                        className="px-3.5 py-2 rounded-xl bg-[var(--ui-sage)] hover:bg-[var(--ui-sage)] active:bg-[var(--ui-sage)] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-50"
                        title="Approve this document submission"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Approve Document</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setActionType("QUERY");
                          setActionReason("");
                          setActionRequiredNote(`Please upload a clear, valid official copy of ${selectedDocReq?.name || "the requested document"} satisfying statutory standards.`);
                        }}
                        disabled={submittingAction}
                        className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-50"
                        title="Raise clarification query requiring user re-upload"
                      >
                        <AlertTriangle className="w-4 h-4" />
                        <span>Raise Clarification Query</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setActionType("REJECT");
                          setActionReason("");
                        }}
                        disabled={submittingAction}
                        className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-50"
                        title="Reject this document submission"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Reject Document</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : null}

              {/* Embedded PDF Viewer with Zoom, Version Switcher, Findings, and Toolbar Actions */}
              <AdminPdfViewer
                submission={activeSubmission || null}
                requirement={selectedDocReq}
                allVersions={submissions}
                selectedVersion={selectedSubmissionVersion}
                onSelectVersion={(v) => setSelectedSubmissionVersion(v)}
                onApprove={() => {
                  setActionType("APPROVE");
                  setActionReason("Statutory evidence verified and compliant with regulatory requirements.");
                }}
                onQuery={() => {
                  setActionType("QUERY");
                  setActionReason("");
                  setActionRequiredNote(`Please upload a clear, valid official copy of ${selectedDocReq?.name || "the requested document"} satisfying statutory standards.`);
                }}
                onReject={() => {
                  setActionType("REJECT");
                  setActionReason("");
                }}
                isActionLoading={submittingAction}
              />
            </div>

            {/* PILLAR 3: Statutory vs Admin Requirement Control Center (§11-§16, §40) */}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-primary" />
                    Statutory Applicability vs Operational Case Disposition
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Separation of statutory rule engine truth from Compliance Officer operational determinations.
                  </p>
                </div>

                {catalogRequirements.length > 0 && (
                  <button
                    onClick={() => {
                      setDispositionMode("ADD");
                      setTargetReqCode(catalogRequirements[0]?.requirement_id || "");
                      setDispositionReason("");
                      setDispositionModalOpen(true);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Attach from Catalog
                  </button>
                )}
              </div>

              <div className="divide-y divide-border/60 border border-border rounded-xl overflow-hidden bg-background">
                {dispositions.length > 0 ? (
                  dispositions.map((disp) => {
                    const isNotReq = disp.admin_disposition === "NOT_REQUIRED";
                    const isConfirmed = disp.admin_disposition === "CONFIRMED_REQUIRED";

                    return (
                      <div key={disp.id} className="p-4 text-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-foreground text-sm">{disp.requirement_name || disp.requirement_id_code}</span>
                            <span className="font-mono text-[10px] text-muted-foreground">({disp.requirement_id_code})</span>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                            <span>
                              Rule Truth:{" "}
                              <strong className="text-foreground">{disp.original_applicability_status}</strong>
                            </span>
                            <span>&bull;</span>
                            <span>
                              Source:{" "}
                              <strong className="text-foreground">{disp.source}</strong>
                            </span>
                            {disp.reviewer_name && (
                              <>
                                <span>&bull;</span>
                                <span>By: <strong className="text-foreground">{disp.reviewer_name}</strong></span>
                              </>
                            )}
                          </div>

                          {disp.reason && (
                            <p className="text-muted-foreground text-[11px] italic bg-muted/30 px-2 py-1 rounded">
                              Rationale: {disp.reason}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                              isConfirmed
                                ? "bg-[var(--ui-sage-soft)] text-[var(--ui-sage)] dark:bg-[var(--ui-sage)] dark:text-[var(--ui-sage)]"
                                : isNotReq
                                ? "bg-[var(--ui-inset)] text-[var(--ui-text)] dark:bg-[var(--ui-text)] dark:text-[var(--ui-muted)]"
                                : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                            }`}
                          >
                            {disp.admin_disposition.replace(/_/g, " ")}
                          </span>

                          {/* Disposition Actions */}
                          {isNotReq ? (
                            <button
                              onClick={() => {
                                setDispositionMode("CONFIRM");
                                setTargetReqCode(disp.requirement_id_code);
                                setDispositionReason("");
                                setDispositionModalOpen(true);
                              }}
                              className="px-2.5 py-1 rounded-lg border border-border hover:bg-muted text-[11px] font-semibold text-foreground"
                            >
                              Restore Required
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setDispositionMode("NOT_REQUIRED");
                                setTargetReqCode(disp.requirement_id_code);
                                setDispositionReason("");
                                setDispositionModalOpen(true);
                              }}
                              className="px-2.5 py-1 rounded-lg border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950 text-[11px] font-semibold"
                            >
                              Mark Not Required
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-6 text-center text-xs text-muted-foreground">
                    Primary case requirement active. Additional requirements can be attached from the statutory catalog.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Pillar 4 & Deadlines */}
          <div className="lg:col-span-4 space-y-6">
            {/* Case Officer Assignment & Review Status Desk */}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4 sticky top-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-primary" />
                  Case Clearance Overview
                </h3>
                <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-primary/10 text-primary font-bold">
                  v{caseData.concurrency_version ?? 1}
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3.5 rounded-xl bg-muted/40 border border-border/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-[11px]">Workflow State:</span>
                    <span className="font-bold text-foreground">{caseData.status_code?.replace(/_/g, " ")}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-[11px]">Current Step:</span>
                    <span className="font-semibold text-foreground">{caseData.current_step_name || "Document Review"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-[11px]">Assigned Officer:</span>
                    <span className="font-semibold text-foreground">
                      {caseData.assigned_reviewer_name || caseData.assigned_reviewer_email || "Unassigned (Pooled)"}
                    </span>
                  </div>
                </div>

                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => setAssignModalOpen(true)}
                    className="w-full py-2 px-3 rounded-xl border border-border hover:bg-muted text-xs font-semibold text-foreground flex items-center justify-center gap-2 transition-colors"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    {caseData.assigned_reviewer ? "Reassign / Escalate Case" : "Claim Review Task"}
                  </button>
                </div>

                <div className="p-2.5 rounded-lg bg-[var(--ui-info-soft)]/60 dark:bg-[var(--ui-text)]/30 border border-[var(--ui-sage-soft)] dark:border-[var(--ui-sage-soft)]/40 text-[11px] text-[var(--ui-info)] dark:text-[var(--ui-info)]">
                  <p className="leading-relaxed">
                    <strong>Direct Adjudication:</strong> Approve, query, or reject documents directly from the <strong>Statutory Document Scrutiny Desk</strong> on the left.
                  </p>
                </div>
              </div>

              {/* Concurrency Indicator */}
              <div className="pt-3 border-t border-border flex items-center justify-between text-[11px] text-muted-foreground">
                <span>Concurrency Version:</span>
                <span className="font-mono font-bold text-foreground">{caseData.concurrency_version ?? 1}</span>
              </div>
            </div>

            {/* DEADLINE MANAGEMENT & INSTANT ALERTS CARD (§18-§21) */}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary" />
                    Compliance Deadlines & Alerts
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Statutory & administrative deadlines with multi-channel dispatch.
                  </p>
                </div>

                <button
                  onClick={() => setDeadlineModalOpen(true)}
                  className="p-1.5 rounded-lg border border-border hover:bg-muted text-muted-foreground transition-colors"
                  title="Add Deadline"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                {deadlines.length > 0 ? (
                  deadlines.map((dl) => {
                    const isSending = sendingAlertId === dl.id;
                    const isOverdue = dl.is_overdue || (dl.days_remaining !== undefined && dl.days_remaining < 0);

                    return (
                      <div key={dl.id} className="p-3.5 rounded-xl border border-border bg-background space-y-2 text-xs">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="font-bold text-foreground block">{dl.title}</span>
                            <span className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                              <Clock className="w-3 h-3" />
                              Due: {new Date(dl.due_at).toLocaleDateString()}
                              {dl.days_remaining !== undefined && (
                                <strong className={isOverdue ? "text-rose-600 ml-1" : "text-[var(--ui-sage)] ml-1"}>
                                  ({isOverdue ? `${Math.abs(dl.days_remaining)}d overdue` : `${dl.days_remaining}d left`})
                                </strong>
                              )}
                            </span>
                          </div>

                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              isOverdue
                                ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                                : "bg-[var(--ui-info-soft)] text-[var(--ui-info)] dark:bg-[var(--ui-text)] dark:text-[var(--ui-info)]"
                            }`}
                          >
                            {dl.priority}
                          </span>
                        </div>

                        {/* Send Alert Now Button */}
                        <div className="pt-2 border-t border-border/60 flex items-center justify-between">
                          <span className="text-[10px] text-muted-foreground">
                            {dl.metadata?.alerts_sent_count ? `Dispatched ${dl.metadata.alerts_sent_count}x` : "No manual alerts yet"}
                          </span>

                          <button
                            onClick={() => handleSendAlertNow(dl.id)}
                            disabled={isSending}
                            className="px-2.5 py-1 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-[11px] font-semibold flex items-center gap-1 transition-colors disabled:opacity-50"
                          >
                            <Bell className="w-3 h-3" />
                            {isSending ? "Dispatching..." : "Send Alert Now"}
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-6 text-center border border-dashed border-border rounded-xl text-muted-foreground text-xs space-y-2">
                    <Calendar className="w-8 h-8 text-muted-foreground/40 mx-auto" />
                    <p>No compliance deadlines configured for this case.</p>
                    <button
                      onClick={() => setDeadlineModalOpen(true)}
                      className="px-3 py-1.5 rounded-lg border border-border hover:bg-muted text-xs font-semibold text-foreground"
                    >
                      + Create Deadline
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Audit Timeline */}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <History className="w-4 h-4 text-primary" />
                Case Audit Trail ({timeline.length})
              </h3>

              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {timeline.map((ev) => (
                  <div key={ev.id} className="p-3 rounded-lg border border-border bg-background text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-foreground text-[11px]">{ev.event_code}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-muted text-muted-foreground">
                        {ev.actor_type}
                      </span>
                    </div>
                    {ev.notes && <p className="text-muted-foreground text-[11px] leading-relaxed">{ev.notes}</p>}
                    <p className="text-[10px] text-muted-foreground/60 font-mono">
                      {new Date(ev.created_at).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* SCRUTINY ACTION MODAL */}
        {actionType && (
          <Overlay open onClose={() => setActionType(null)} title="Record reviewer decision">
            <div className="bg-card border border-border rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                  {actionType === "APPROVE" && <CheckCircle2 className="w-5 h-5 text-[var(--ui-sage)]" />}
                  {actionType === "QUERY" && <AlertTriangle className="w-5 h-5 text-amber-600" />}
                  {actionType === "REJECT" && <XCircle className="w-5 h-5 text-destructive" />}
                  Confirm Document Determination: {actionType}
                </h3>
                <button
                  onClick={() => setActionType(null)}
                  className="text-muted-foreground hover:text-foreground text-xs"
                >
                  ✕
                </button>
              </div>

              {/* Document Context in Modal */}
              <div className="p-3.5 rounded-xl bg-muted/50 border border-border/70 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-foreground">{selectedDocReq?.name || "Requirement"}</span>
                  {activeSubmission && (
                    <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-primary/10 text-primary font-bold">
                      v{activeSubmission.version_number}
                    </span>
                  )}
                </div>
                {activeSubmission && (
                  <p className="text-[11px] text-muted-foreground truncate">
                    Target Evidence: <strong className="text-foreground">{activeSubmission.file_name}</strong> ({(activeSubmission.file_size_bytes / 1024).toFixed(1)} KB)
                  </p>
                )}
              </div>

              <form onSubmit={handleExecuteScrutiny} className="space-y-4">
                {actionError && <p role="alert" className="text-sm text-[var(--ui-danger)]">{actionError}</p>}
                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">
                    {actionType === "QUERY" ? "Discrepancy / Query Reason *" : "Official Remarks *"}
                  </label>
                  <textarea
                    required
                    value={actionReason}
                    onChange={(e) => setActionReason(e.target.value)}
                    rows={3}
                    placeholder={
                      actionType === "QUERY"
                        ? "e.g., GST address does not match site layout address."
                        : actionType === "APPROVE"
                        ? "All statutory evidence verified and compliant."
                        : "State reasons why application criteria were not fulfilled."
                    }
                    className="w-full text-xs rounded-xl border border-input bg-background p-3 focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                </div>

                {actionType === "QUERY" && (
                  <div>
                    <label className="text-xs font-semibold text-foreground block mb-1">
                      Required User Action *
                    </label>
                    <textarea
                      required
                      value={actionRequiredNote}
                      onChange={(e) => setActionRequiredNote(e.target.value)}
                      rows={2}
                      placeholder="e.g., Please upload updated registered address proof with matching survey number."
                      className="w-full text-xs rounded-xl border border-input bg-background p-3 focus:ring-1 focus:ring-primary focus:outline-none"
                    />
                  </div>
                )}

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setActionType(null)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold border border-border hover:bg-muted text-foreground"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingAction}
                    className={`px-5 py-2 rounded-xl text-xs font-bold text-white shadow-sm transition-colors ${
                      actionType === "APPROVE"
                        ? "bg-[var(--ui-sage)] hover:bg-[var(--ui-sage)]"
                        : actionType === "QUERY"
                        ? "bg-amber-600 hover:bg-amber-700"
                        : "bg-destructive hover:bg-destructive/90"
                    }`}
                  >
                    {submittingAction ? "Processing..." : `Submit ${actionType}`}
                  </button>
                </div>
              </form>
            </div>
          </Overlay>
        )}

        {/* REQUIREMENT DISPOSITION MODAL (§11-§16, §40) */}
        {dispositionModalOpen && (
          <Overlay open onClose={() => setDispositionModalOpen(false)} title="Review requirement">
            <div className="bg-card border border-border rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-primary" />
                {dispositionMode === "NOT_REQUIRED"
                  ? "Mark Requirement NOT REQUIRED"
                  : dispositionMode === "CONFIRM"
                  ? "Confirm Requirement REQUIRED"
                  : "Attach Requirement from Catalog"}
              </h3>

              <form onSubmit={handleDispositionSubmit} className="space-y-4 text-xs">
                {dispositionMode === "ADD" ? (
                  <div>
                    <label className="font-semibold block mb-1">Select Catalog Requirement *</label>
                    <select
                      value={targetReqCode}
                      onChange={(e) => setTargetReqCode(e.target.value)}
                      className="w-full rounded-xl border border-input bg-background p-2.5 font-semibold"
                    >
                      {catalogRequirements.map((cr) => (
                        <option key={cr.requirement_id} value={cr.requirement_id}>
                          {cr.requirement_id}: {cr.name} ({cr.authority})
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Requirement Code</span>
                    <span className="font-mono font-bold text-foreground text-sm">{targetReqCode}</span>
                  </div>
                )}

                <div>
                  <label className="font-semibold block mb-1">
                    {dispositionMode === "NOT_REQUIRED" ? "Mandatory Legal & Operational Rationale *" : "Reason / Justification"}
                  </label>
                  <textarea
                    required={dispositionMode === "NOT_REQUIRED"}
                    rows={3}
                    value={dispositionReason}
                    onChange={(e) => setDispositionReason(e.target.value)}
                    placeholder={
                      dispositionMode === "NOT_REQUIRED"
                        ? "e.g., Enterprise operating as non-manufacturing service unit; certified zero effluent discharge by pollution control board."
                        : "Operational determination for this compliance case."
                    }
                    className="w-full rounded-xl border border-input bg-background p-3 focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  {dispositionMode === "NOT_REQUIRED" && (
                    <p className="text-[10px] text-muted-foreground mt-1">
                      Important: Rule engine truth is preserved. This operational override is recorded with full audit provenance.
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setDispositionModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-border hover:bg-muted font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingDisposition}
                    className="px-5 py-2 rounded-xl font-bold bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    {submittingDisposition ? "Saving..." : "Save Determination"}
                  </button>
                </div>
              </form>
            </div>
          </Overlay>
        )}

        {/* CREATE DEADLINE MODAL */}
        {deadlineModalOpen && (
          <Overlay open onClose={() => setDeadlineModalOpen(false)} title="Create deadline">
            <div className="bg-card border border-border rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Schedule Statutory Compliance Deadline
              </h3>

              <form onSubmit={handleCreateDeadlineSubmit} className="space-y-3 text-xs">
                <div>
                  <label className="font-semibold block mb-1">Deadline Title *</label>
                  <input
                    type="text"
                    required
                    value={deadlineForm.title}
                    onChange={(e) => setDeadlineForm({ ...deadlineForm, title: e.target.value })}
                    placeholder="e.g. Consent to Operate Renewal Filing"
                    className="w-full rounded-xl border border-input bg-background p-2.5"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold block mb-1">Due Date *</label>
                    <input
                      type="date"
                      required
                      value={deadlineForm.due_at}
                      onChange={(e) => setDeadlineForm({ ...deadlineForm, due_at: e.target.value })}
                      className="w-full rounded-xl border border-input bg-background p-2.5 font-mono"
                    />
                  </div>

                  <div>
                    <label className="font-semibold block mb-1">Priority</label>
                    <select
                      value={deadlineForm.priority}
                      onChange={(e) => setDeadlineForm({ ...deadlineForm, priority: e.target.value })}
                      className="w-full rounded-xl border border-input bg-background p-2.5"
                    >
                      <option value="HIGH">HIGH</option>
                      <option value="MEDIUM">MEDIUM</option>
                      <option value="LOW">LOW</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="font-semibold block mb-1">Description / Legal Basis</label>
                  <textarea
                    rows={2}
                    value={deadlineForm.description}
                    onChange={(e) => setDeadlineForm({ ...deadlineForm, description: e.target.value })}
                    placeholder="Statutory citation or compliance note."
                    className="w-full rounded-xl border border-input bg-background p-2.5"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setDeadlineModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-border hover:bg-muted"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl font-bold bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    Create Deadline
                  </button>
                </div>
              </form>
            </div>
          </Overlay>
        )}

        {/* ASSIGNMENT MODAL (§13) */}
        {assignModalOpen && (
          <Overlay open onClose={() => setAssignModalOpen(false)} title="Assign case">
            <div className="bg-card border border-border rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-primary" />
                Claim Review Task
              </h3>

              <form onSubmit={handleAssignTask} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">Priority Tier</label>
                  <select
                    value={assignPriority}
                    onChange={(e: any) => setAssignPriority(e.target.value)}
                    className="w-full text-xs rounded-xl border border-input bg-background p-2.5"
                  >
                    <option value="HIGH">HIGH</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="LOW">LOW</option>
                  </select>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setAssignModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold border border-border hover:bg-muted"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    Claim Scrutiny Task
                  </button>
                </div>
              </form>
            </div>
          </Overlay>
        )}

        {/* GOVERNMENT STATUS MODAL */}
        {govModalOpen && (
          <Overlay open onClose={() => setGovModalOpen(false)} title="Record authority status">
            <div className="bg-card border border-border rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <ExternalLink className="w-5 h-5 text-[var(--ui-sage)]" />
                Record External Portal Status
              </h3>

              <form onSubmit={handleRecordGovStatus} className="space-y-3 text-xs">
                <div>
                  <label className="font-semibold block mb-1">Portal Name</label>
                  <input
                    type="text"
                    value={govStatusForm.portal_name}
                    onChange={(e) => setGovStatusForm({ ...govStatusForm, portal_name: e.target.value })}
                    className="w-full rounded-xl border border-input bg-background p-2.5"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Application Reference Number</label>
                  <input
                    type="text"
                    value={govStatusForm.application_reference_number}
                    onChange={(e) => setGovStatusForm({ ...govStatusForm, application_reference_number: e.target.value })}
                    className="w-full rounded-xl border border-input bg-background p-2.5 font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Official Portal Status</label>
                  <select
                    value={govStatusForm.status_code}
                    onChange={(e) => setGovStatusForm({ ...govStatusForm, status_code: e.target.value })}
                    className="w-full rounded-xl border border-input bg-background p-2.5"
                  >
                    <option value="SUBMITTED">SUBMITTED (Filed)</option>
                    <option value="PROCESSING">PROCESSING (Under Scrutiny)</option>
                    <option value="QUERY_RAISED">QUERY_RAISED (Official Query)</option>
                    <option value="APPROVED">APPROVED (Clearance Granted)</option>
                    <option value="REJECTED">REJECTED (Denied)</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold block mb-1">Department Remarks</label>
                  <textarea
                    rows={2}
                    value={govStatusForm.portal_remarks}
                    onChange={(e) => setGovStatusForm({ ...govStatusForm, portal_remarks: e.target.value })}
                    className="w-full rounded-xl border border-input bg-background p-2.5"
                    placeholder="Official comments from government department."
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setGovModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-border hover:bg-muted"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl font-bold bg-[var(--ui-sage)] text-white hover:bg-[var(--ui-sage)]"
                  >
                    Record Status
                  </button>
                </div>
              </form>
            </div>
          </Overlay>
        )}
      </div>
    </AdminShell>
  );
}
