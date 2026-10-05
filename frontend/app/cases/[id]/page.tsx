"use client";
import Overlay from "@/components/product/Overlay";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import ErrorState from "@/components/ErrorState";
import { api } from "@/lib/api";
import type {
  ComplianceCaseDetail,
  DocumentRequirementItem,
  DocumentSubmissionItem,
  ExternalApplicationStatusItem,
  WorkflowEventItem,
} from "@/types";
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Clock,
  ExternalLink,
  Eye,
  FileCheck,
  FileClock,
  FileText,
  FileUp,
  History,
  Info,
  Layers,
  Send,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Upload,
  UserCheck,
} from "lucide-react";

interface CasePageProps {
  params: Promise<{ id: string }>;
}

export default function CaseDetailPage({ params }: CasePageProps) {
  const resolvedParams = use(params);
  const caseId = resolvedParams.id;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [caseData, setCaseData] = useState<ComplianceCaseDetail | null>(null);
  const [timeline, setTimeline] = useState<WorkflowEventItem[]>([]);
  const [activeTab, setActiveTab] = useState<"documents" | "form" | "portal" | "timeline">("documents");

  // Document Upload State
  const [uploadingDocId, setUploadingDocId] = useState<string | null>(null);
  const [uploadSuccessMsg, setUploadSuccessMsg] = useState<string | null>(null);
  const [uploadErrorMsg, setUploadErrorMsg] = useState<string | null>(null);

  // Form State
  const [submittingForm, setSubmittingForm] = useState(false);
  const [formData, setFormData] = useState({
    applicant_full_name: "",
    designation: "Managing Director",
    pan_number: "",
    registered_address: "",
    declaration_confirmed: true,
  });

  // External Portal Tracking State
  const [portalModalOpen, setPortalModalOpen] = useState(false);
  const [portalStatusForm, setPortalStatusForm] = useState({
    portal_name: "",
    status_code: "APPROVED",
    application_reference_number: "",
    portal_remarks: "",
  });

  // Query Clarification Response State
  const [queryResponseText, setQueryResponseText] = useState("");
  const [submittingQueryResponse, setSubmittingQueryResponse] = useState(false);

  useEffect(() => {
    loadCase();
  }, [caseId]);

  async function loadCase() {
    setLoading(true);
    setError(null);
    try {
      const [detailRes, timelineRes] = await Promise.all([
        api.cases.getCase(caseId),
        api.cases.getTimeline(caseId),
      ]);
      setCaseData(detailRes);
      setTimeline(timelineRes);

      // Initialize portal modal defaults
      setPortalStatusForm((prev) => ({
        ...prev,
        portal_name: detailRes.authority || "Official Government Portal",
        application_reference_number: "",
      }));
    } catch (err: any) {
      setError(err?.message || "Failed to load compliance case.");
    } finally {
      setLoading(false);
    }
  }

  async function handleRespondQuery(e: React.FormEvent) {
    e.preventDefault();
    if (!queryResponseText.trim()) return;

    setSubmittingQueryResponse(true);
    try {
      await api.cases.respondQuery(caseId, queryResponseText);
      setQueryResponseText("");
      setUploadSuccessMsg("Clarification submitted. Case returned to Compliance Officer review.");
      await loadCase();
    } catch (err: any) {
      setUploadErrorMsg(err?.message || "Failed to submit clarification.");
    } finally {
      setSubmittingQueryResponse(false);
    }
  }


  async function handleFileUpload(docReqId: string, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingDocId(docReqId);
    setUploadSuccessMsg(null);
    setUploadErrorMsg(null);

    try {
      const res = await api.cases.uploadDocument(caseId, docReqId, file);
      setUploadSuccessMsg(
        `Uploaded version ${res.submission.version_number}. AI Precheck result: ${res.review.status.replace(/_/g, " ")}.`
      );
      // Reload updated case state and timeline
      await loadCase();
    } catch (err: any) {
      setUploadErrorMsg(err?.message || "Failed to upload document.");
    } finally {
      setUploadingDocId(null);
    }
  }

  async function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmittingForm(true);
    setError(null);
    try {
      await api.cases.submitForm(caseId, formData);
      await loadCase();
    } catch (err: any) {
      setError(err?.message || "Failed to submit statutory form.");
    } finally {
      setSubmittingForm(false);
    }
  }

  async function handleRecordPortalStatus(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api.cases.recordExternalStatus(caseId, portalStatusForm);
      setPortalModalOpen(false);
      await loadCase();
    } catch (err: any) {
      setError(err?.message || "Failed to record portal status.");
    }
  }

  if (loading) {
    return (
      <AppShell activeView="workflows">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <LoadingSkeleton count={4} />
        </div>
      </AppShell>
    );
  }

  if (error || !caseData) {
    return (
      <AppShell activeView="workflows">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <ErrorState message={error || "Case not found."} onRetry={loadCase} />
        </div>
      </AppShell>
    );
  }

  const currentStep = caseData.workflow_instance?.current_step;
  const currentStepCode = currentStep?.code || "DOCUMENT_COLLECTION";
  const currentStepSeq = currentStep?.sequence || 1;

  const stepsList = caseData.workflow_steps || [];

  return (
    <AppShell activeView="workflows">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Breadcrumb & Navigation */}
        <div className="flex items-center justify-between">
          <Link
            href="/cases"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Compliance Cases
          </Link>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-muted-foreground px-2.5 py-1 bg-muted rounded-md">
              {caseData.case_number}
            </span>
            <span className="text-xs text-muted-foreground font-medium">{caseData.business_name}</span>
          </div>
        </div>

        {/* Case Header Card */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary">
                  {caseData.authority}
                </span>
                <span className="text-xs font-mono text-muted-foreground">{caseData.requirement_id_code}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground mt-2">
                {caseData.requirement_name}
              </h1>
              <p className="text-xs text-muted-foreground mt-1">
                Keep the evidence, review decisions and authority updates for this requirement together.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="px-3 py-1.5 rounded-lg border border-border bg-background text-xs">
                <span className="text-muted-foreground block text-[10px] font-medium">PRIORITY</span>
                <span className="font-bold text-foreground">{caseData.priority}</span>
              </div>

              <div className="px-3.5 py-1.5 rounded-lg border border-border bg-background text-xs">
                <span className="text-muted-foreground block text-[10px] font-medium">CASE STATUS</span>
                <span className="font-bold text-foreground">{caseData.status_code.replace(/_/g, " ")}</span>
              </div>

              <button
                onClick={() => setPortalModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[var(--ui-sage-soft)] dark:border-[var(--ui-sage-soft)] bg-[var(--ui-sage-faint)] dark:bg-[var(--ui-sage)]/40 text-[var(--ui-sage)] dark:text-[var(--ui-sage)] text-xs font-semibold hover:bg-[var(--ui-sage-soft)] transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Govt Portal Tracking
              </button>
            </div>
          </div>

          {/* Stepper Progress Bar (6 Primitives) */}
          <div className="mt-8 pt-6 border-t border-border">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
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

        {/* Canonical Current Task Card (§40, §41: "What Must I Do Right Now?") */}
        {caseData.current_task && (
          <div
            className={`p-5 rounded-2xl border shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 ${
              caseData.current_task.is_action_required
                ? "border-amber-300 bg-amber-50/70 dark:bg-amber-950/30 dark:border-amber-900 text-amber-950 dark:text-amber-200"
                : "border-[var(--ui-sage-soft)] bg-[var(--ui-info-soft)]/50 dark:bg-[var(--ui-text)]/20 dark:border-[var(--ui-sage-soft)] text-[var(--ui-info)] dark:text-[var(--ui-info-soft)]"
            }`}
          >
            <div className="flex items-start gap-3">
              {caseData.current_task.is_action_required ? (
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-[var(--ui-info)] shrink-0 mt-0.5" />
              )}
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider block opacity-75">
                  CURRENT ACTION REQUIRED &bull; WHAT MUST I DO?
                </span>
                <h4 className="text-base font-bold mt-0.5">{caseData.current_task.title}</h4>
                <p className="text-xs leading-relaxed mt-1 opacity-90 max-w-2xl">
                  {caseData.current_task.description}
                </p>
              </div>
            </div>

            {caseData.current_task.button_label && (
              <button
                onClick={() => {
                  if (caseData.current_task?.action_type === "COMPLETE_FORM") setActiveTab("form");
                  else setActiveTab("documents");
                }}
                className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-foreground text-background text-xs font-bold hover:opacity-90 shadow-sm transition-all"
              >
                {caseData.current_task.button_label}
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {/* Dynamic Contextual Action Banner */}
        {caseData.status_code === "ACTION_REQUIRED" && (
          <div className="p-5 rounded-2xl border border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-900 text-amber-900 dark:text-amber-200 shadow-sm space-y-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-sm font-bold">Action Required: Compliance Officer Scrutiny Query Raised</h4>
                <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                  The compliance officer reviewed your statutory document submissions and raised queries requiring clarification or corrected evidence.
                  Review the specific requirements below in the <strong>Documents & Evidence</strong> tab, upload corrected documents, or submit clarification notes.
                </p>
              </div>
            </div>

            {/* Interactive Query Clarification Response Form */}
            <form onSubmit={handleRespondQuery} className="pt-2 border-t border-amber-200 dark:border-amber-900/60 space-y-2">
              <label className="text-[11px] font-bold text-amber-950 dark:text-amber-200 block">
                Submit Clarification Response to Compliance Officer:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={queryResponseText}
                  onChange={(e) => setQueryResponseText(e.target.value)}
                  placeholder="e.g., We have re-uploaded the registered premises proof reflecting the updated trade trade license number..."
                  className="flex-1 text-xs rounded-xl border border-amber-300 dark:border-amber-800 bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
                <button
                  type="submit"
                  disabled={submittingQueryResponse || !queryResponseText.trim()}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-colors shadow-sm shrink-0 flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  {submittingQueryResponse ? "Submitting..." : "Send Clarification"}
                </button>
              </div>
            </form>
          </div>
        )}


        {caseData.status_code === "HUMAN_REVIEW" && (
          <div className="p-4 rounded-xl border border-[var(--ui-sage-soft)] bg-[var(--ui-info-soft)] dark:bg-[var(--ui-text)]/30 dark:border-[var(--ui-sage-soft)] text-[var(--ui-info)] dark:text-[var(--ui-info-soft)] shadow-sm flex items-start gap-3">
            <UserCheck className="w-5 h-5 text-[var(--ui-info)] shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-sm font-bold">In Human Review: Compliance Officer Verification</h4>
              <p className="text-xs text-[var(--ui-info)] dark:text-[var(--ui-info)] leading-relaxed">
                Your evidence is with a compliance reviewer. Decisions and requests for clarification will appear in this case. After approval, continue with the filing steps provided here.
              </p>
            </div>
          </div>
        )}

        {caseData.status_code === "EXTERNAL_PROCESSING" && (
          <div className="p-4 rounded-xl border border-[var(--ui-sage-soft)] bg-[var(--ui-sage-faint)] dark:bg-[var(--ui-sage)]/30 dark:border-[var(--ui-sage-soft)] text-[var(--ui-sage)] dark:text-[var(--ui-sage-soft)] shadow-sm flex items-start gap-3">
            <Clock className="w-5 h-5 text-[var(--ui-sage)] shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-sm font-bold">Statutory Government Department Scrutiny</h4>
              <p className="text-xs text-[var(--ui-sage)] dark:text-[var(--ui-sage)] leading-relaxed">
                Application filed with <strong>{caseData.authority}</strong> official portal. The department is currently
                processing the submission. Periodic status synchronizations will automatically reflect here.
              </p>
            </div>
          </div>
        )}

        {caseData.status_code === "COMPLETED" && (
          <div className="p-4 rounded-xl border border-[var(--ui-sage-soft)] bg-[var(--ui-sage-faint)] dark:bg-[var(--ui-sage)]/30 dark:border-[var(--ui-sage-soft)] text-[var(--ui-sage)] dark:text-[var(--ui-sage-soft)] shadow-sm flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-[var(--ui-sage)] shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-sm font-bold">Statutory Clearance Granted & Active</h4>
              <p className="text-xs text-[var(--ui-sage)] dark:text-[var(--ui-sage)] leading-relaxed">
                All statutory requirements completed. Official compliance registration is confirmed.
                Statutory renewal cycles have been scheduled on your compliance calendar.
              </p>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <nav aria-label="Case sections" className="grid grid-cols-2 sm:flex border-b border-border gap-3 sm:gap-6">
          {[
            { id: "documents", label: `Evidence (${caseData.document_requirements.length})`, icon: FileText },
            { id: "form", label: "Forms", icon: FileCheck },
            { id: "portal", label: `Portal updates (${caseData.external_statuses.length})`, icon: ExternalLink },
            { id: "timeline", label: `History (${timeline.length})`, icon: History },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                aria-pressed={isActive}
                onClick={() => setActiveTab(tab.id as any)}
                className={`pb-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors ${
                  isActive
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* Feedback Messages */}
        {uploadSuccessMsg && (
          <div className="p-3 bg-[var(--ui-sage-faint)] border border-[var(--ui-sage-soft)] text-[var(--ui-sage)] rounded-lg text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[var(--ui-sage)] shrink-0" />
            {uploadSuccessMsg}
          </div>
        )}
        {uploadErrorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-300 text-rose-800 rounded-lg text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            {uploadErrorMsg}
          </div>
        )}

        {/* TAB 1: Documents & Evidence */}
        {activeTab === "documents" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-foreground">Mandatory Document Requirements</h3>
                <p className="text-xs text-muted-foreground">
                  Versioned statutory uploads with automated OCR extraction & AI precheck. Never overwrites historical submissions.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {caseData.document_requirements.map((doc) => {
                const latestSub = doc.latest_submission;
                const latestReview = latestSub?.latest_review;
                const isVerified = doc.status_code === "VERIFIED";

                return (
                  <div
                    key={doc.id}
                    className="p-5 rounded-xl border border-border bg-card shadow-sm space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-foreground">{doc.name}</span>
                          {doc.required && (
                            <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">
                              MANDATORY
                            </span>
                          )}
                          <span className="text-xs font-mono text-muted-foreground">({doc.document_type_code})</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{doc.description}</p>
                      </div>

                      <div className="flex items-center gap-3">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                            isVerified
                              ? "bg-[var(--ui-sage-soft)] text-[var(--ui-sage)] dark:bg-[var(--ui-sage)] dark:text-[var(--ui-sage)]"
                              : doc.status_code === "ISSUE"
                              ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                              : doc.status_code === "UPLOADED"
                              ? "bg-[var(--ui-info-soft)] text-[var(--ui-info)] dark:bg-[var(--ui-text)] dark:text-[var(--ui-info)]"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {doc.status_code.replace(/_/g, " ")}
                        </span>

                        {/* File Upload Button */}
                        <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors shadow-sm">
                          <Upload className="w-3.5 h-3.5" />
                          {doc.has_submission ? "Upload New Version" : "Upload Document"}
                          <input
                            type="file"
                            className="hidden"
                            onChange={(e) => handleFileUpload(doc.id, e)}
                            disabled={uploadingDocId === doc.id}
                          />
                        </label>
                      </div>
                    </div>

                    {uploadingDocId === doc.id && (
                      <div className="flex items-center gap-2 text-xs text-primary font-medium p-2 bg-primary/5 rounded-lg border border-primary/20">
                        <span className="w-3.5 h-3.5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                        Running OCR text extraction & AI precheck verification...
                      </div>
                    )}

                    {/* Dynamic 3-Step Lifecycle Stepper */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-muted/30 p-2.5 rounded-xl border border-border/60 text-xs">
                      {/* Step 1: Upload */}
                      <div className={`p-2.5 rounded-lg border flex items-center gap-2.5 transition-colors ${
                        latestSub ? "border-[var(--ui-sage-soft)] bg-[var(--ui-sage-faint)]/60 dark:bg-[var(--ui-sage)]/30 text-[var(--ui-sage)] dark:text-[var(--ui-sage-soft)]" : "border-border bg-background text-muted-foreground"
                      }`}>
                        {latestSub ? <CheckCircle2 className="w-4 h-4 text-[var(--ui-sage)] shrink-0" /> : <Upload className="w-4 h-4 text-muted-foreground shrink-0" />}
                        <div>
                          <span className="font-bold block text-[10px] uppercase tracking-wider">1. Upload</span>
                          <span className="text-[11px] font-medium opacity-90">{latestSub ? `v${latestSub.version_number} Uploaded` : "Upload Required"}</span>
                        </div>
                      </div>

                      {/* Step 2: AI Pre-Validation */}
                      <div className={`p-2.5 rounded-lg border flex items-center gap-2.5 transition-colors ${
                        !latestSub ? "border-border bg-background text-muted-foreground opacity-60" :
                        latestReview?.status === "INTERNAL_HUMAN_QUERY" ? "border-amber-300 bg-amber-50/60 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200" :
                        "border-[var(--ui-sage-soft)] bg-[var(--ui-sage-faint)]/60 dark:bg-[var(--ui-sage)]/30 text-[var(--ui-sage)] dark:text-[var(--ui-sage-soft)]"
                      }`}>
                        {latestSub ? <Sparkles className="w-4 h-4 text-[var(--ui-sage)] shrink-0" /> : <Clock className="w-4 h-4 text-muted-foreground shrink-0" />}
                        <div>
                          <span className="font-bold block text-[10px] uppercase tracking-wider">2. AI Pre-Check</span>
                          <span className="text-[11px] font-medium opacity-90">{latestSub ? "Automated Check Passed" : "Pending Upload"}</span>
                        </div>
                      </div>

                      {/* Step 3: Human Officer Review */}
                      <div className={`p-2.5 rounded-lg border flex items-center gap-2.5 transition-colors ${
                        !latestSub ? "border-border bg-background text-muted-foreground opacity-60" :
                        latestSub.status_code === "INTERNAL_HUMAN_APPROVED" ? "border-[var(--ui-sage-soft)] bg-[var(--ui-sage-faint)]/60 dark:bg-[var(--ui-sage)]/30 text-[var(--ui-sage)] dark:text-[var(--ui-sage-soft)]" :
                        latestSub.status_code === "INTERNAL_HUMAN_QUERY" ? "border-amber-300 bg-amber-50/60 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200" :
                        "border-[var(--ui-sage-soft)] bg-[var(--ui-info-soft)]/60 dark:bg-[var(--ui-text)]/30 text-[var(--ui-info)] dark:text-[var(--ui-info-soft)]"
                      }`}>
                        {latestSub?.status_code === "INTERNAL_HUMAN_APPROVED" ? (
                          <CheckCircle2 className="w-4 h-4 text-[var(--ui-sage)] shrink-0" />
                        ) : latestSub?.status_code === "INTERNAL_HUMAN_QUERY" ? (
                          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                        ) : latestSub ? (
                          <Clock className="w-4 h-4 text-[var(--ui-info)] shrink-0" />
                        ) : (
                          <ShieldCheck className="w-4 h-4 text-muted-foreground shrink-0" />
                        )}
                        <div>
                          <span className="font-bold block text-[10px] uppercase tracking-wider">3. Officer Scrutiny</span>
                          <span className="text-[11px] font-medium opacity-90">
                            {latestSub?.status_code === "INTERNAL_HUMAN_APPROVED"
                              ? "Approved by Officer"
                              : latestSub?.status_code === "INTERNAL_HUMAN_QUERY"
                              ? "Clarification Queried"
                              : latestSub
                              ? "In Review Queue"
                              : "Awaiting Upload"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Explanatory Context Message & Structured Findings */}
                    {latestSub && (
                      <div className="text-xs space-y-2">
                        {/* 1. Human Decision Status */}
                        {latestSub.status_code === "INTERNAL_HUMAN_APPROVED" ? (
                          <div className="p-3 rounded-xl bg-[var(--ui-sage-faint)] dark:bg-[var(--ui-sage)]/40 border border-[var(--ui-sage-soft)] dark:border-[var(--ui-sage-soft)] text-[var(--ui-sage)] dark:text-[var(--ui-sage-soft)] flex items-center gap-2.5">
                            <CheckCircle2 className="w-4 h-4 text-[var(--ui-sage)] shrink-0" />
                            <div>
                              <span className="font-bold block">Document Verified & Approved</span>
                              <span className="text-[11px] opacity-90">Statutory evidence confirmed by Compliance Officer. Requirement complete.</span>
                            </div>
                          </div>
                        ) : latestSub.status_code === "INTERNAL_HUMAN_QUERY" ? (
                          <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-950 dark:text-amber-200 space-y-2.5 shadow-xs">
                            <div className="flex items-center gap-2 font-bold text-amber-900 dark:text-amber-200">
                              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                              <span>Compliance Officer Query & Required Correction:</span>
                            </div>
                            <p className="p-2.5 rounded-lg bg-background border border-amber-200 dark:border-amber-900 font-mono text-[11px] leading-relaxed text-foreground">
                              {latestReview?.reviewer_comments || "Officer requested a correction. Please review the details and upload an updated file."}
                            </p>
                            <div className="flex items-center justify-between pt-1">
                              <span className="text-[11px] text-amber-800 dark:text-amber-300 font-medium">
                                Upload corrected version (v{(latestSub?.version_number || 1) + 1}) to resolve query:
                              </span>
                              <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-xs transition-colors">
                                <Upload className="w-3.5 h-3.5" />
                                <span>Upload Corrected File</span>
                                <input
                                  type="file"
                                  className="hidden"
                                  accept=".pdf,.png,.jpg,.jpeg"
                                  onChange={(e) => handleFileUpload(doc.id, e)}
                                  disabled={uploadingDocId === doc.id}
                                />
                              </label>
                            </div>
                          </div>
                        ) : latestSub.status_code === "PRECHECK_ERROR" || latestSub.status_code === "PRECHECK_RETRYING" ? (
                          /* 2. Technical AI Error (distinct from rejection) */
                          <div className="p-3 rounded-xl bg-[var(--ui-info-soft)] dark:bg-[var(--ui-text)]/40 border border-[var(--ui-sage-soft)] dark:border-[var(--ui-sage-soft)] text-[var(--ui-info)] dark:text-[var(--ui-info-soft)] space-y-1">
                            <div className="flex items-center gap-2 font-bold text-[var(--ui-info)] dark:text-[var(--ui-info-soft)]">
                              <Info className="w-4 h-4 text-[var(--ui-info)] shrink-0" />
                              <span>AI validation temporarily unavailable</span>
                            </div>
                            <p className="text-[11px] leading-relaxed">
                              Your document was uploaded successfully. It has <strong>NOT</strong> been rejected. Status: Waiting for compliance officer verification.
                            </p>
                          </div>
                        ) : (
                          /* 3. Under Human Review */
                          <div className="p-3 rounded-xl bg-[var(--ui-info-soft)]/60 dark:bg-[var(--ui-text)]/30 border border-[var(--ui-sage-soft)] dark:border-[var(--ui-sage-soft)] text-[var(--ui-info)] dark:text-[var(--ui-info-soft)] flex items-center gap-2">
                            <Clock className="w-4 h-4 text-[var(--ui-info)] shrink-0" />
                            <span>Your document is with a compliance reviewer. Review any requests for clarification here.</span>
                          </div>
                        )}

                        {/* Structured AI Findings (Advisory) */}
                        {latestReview?.findings && latestReview.findings.length > 0 && (
                          <div className="p-3 rounded-xl bg-muted/30 border border-border/80 space-y-2">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="font-bold text-foreground flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5 text-[var(--ui-sage)]" />
                                Automated Diagnostic Findings (Advisory):
                              </span>
                              <span className="text-[10px] text-muted-foreground">Compliance officer makes final decision</span>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {latestReview.findings.map((f: any, fIdx: number) => {
                                const code = typeof f === "string" ? f : f?.finding_code || f?.code || "DIAGNOSTIC";
                                const isWarning = typeof f === "object" && (f?.severity === "WARNING" || f?.severity === "ERROR" || f?.severity === "CRITICAL");
                                return (
                                  <span
                                    key={fIdx}
                                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-mono font-semibold ${
                                      isWarning
                                        ? "bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-950 dark:text-amber-200"
                                        : "bg-[var(--ui-sage-soft)] text-[var(--ui-sage)] border border-[var(--ui-sage-soft)] dark:bg-[var(--ui-sage)] dark:text-[var(--ui-sage-soft)]"
                                    }`}
                                  >
                                    {isWarning ? <AlertTriangle className="w-3 h-3 text-amber-600" /> : <CheckCircle2 className="w-3 h-3 text-[var(--ui-sage)]" />}
                                    {code.replace(/_/g, " ")}
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Submissions & Version History */}
                    {doc.submissions && doc.submissions.length > 0 && (
                      <div className="pt-3 border-t border-border/60 space-y-2">
                        <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                          Version History ({doc.submissions.length})
                        </span>
                        <div className="divide-y divide-border/40 rounded-lg border border-border/60 bg-muted/20 overflow-hidden">
                          {doc.submissions.map((sub) => {
                            const viewLink = sub.view_url || `/api/v1/documents/${sub.id}/view`;
                            return (
                              <div key={sub.id} className="p-3 text-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-foreground px-1.5 py-0.5 bg-background border border-border rounded text-[10px]">
                                      v{sub.version_number}
                                    </span>
                                    <span className="font-medium text-foreground">{sub.file_name}</span>
                                    <span className="text-[10px] text-muted-foreground font-mono">
                                      {(sub.file_size_bytes / 1024).toFixed(1)} KB
                                    </span>
                                  </div>
                                  <p className="text-[10px] text-muted-foreground font-mono">
                                    SHA-256: {sub.checksum ? sub.checksum.slice(0, 16) + "..." : "None"} &bull; Uploaded {new Date(sub.created_at).toLocaleString()}
                                  </p>
                                </div>

                                <div className="flex items-center gap-2">
                                  {sub.latest_review && (
                                    <span
                                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                        sub.latest_review.status === "INTERNAL_HUMAN_APPROVED"
                                          ? "bg-[var(--ui-sage-soft)] text-[var(--ui-sage)]"
                                          : sub.latest_review.status === "INTERNAL_HUMAN_QUERY"
                                          ? "bg-amber-100 text-amber-800"
                                          : "bg-rose-100 text-rose-800"
                                      }`}
                                    >
                                      {sub.latest_review.status.replace(/_/g, " ")}
                                    </span>
                                  )}

                                  <a
                                    href={viewLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-2.5 py-1 rounded-lg border border-border bg-background hover:bg-muted text-[11px] font-semibold flex items-center gap-1 text-foreground transition-colors"
                                  >
                                    <Eye className="w-3 h-3" />
                                    View
                                  </a>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: Statutory Application Form */}
        {activeTab === "form" && (
          <div className="p-6 rounded-2xl border border-border bg-card shadow-sm space-y-6">
            <div>
              <h3 className="text-base font-bold text-foreground">Standard Statutory Application Filing</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Statutory declaration form conforming to {caseData.authority} electronic filing guidelines.
              </p>
            </div>

            {caseData.form_submissions && caseData.form_submissions.length > 0 && (
              <div className="p-4 rounded-xl bg-[var(--ui-sage-faint)]/50 border border-[var(--ui-sage-soft)] dark:bg-[var(--ui-sage)]/20 text-[var(--ui-sage)] dark:text-[var(--ui-sage)] text-xs flex items-center justify-between">
                <span className="flex items-center gap-2 font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-[var(--ui-sage)]" />
                  Statutory Application Form Submitted ({caseData.form_submissions[0].form_code})
                </span>
                <span className="text-[11px] text-muted-foreground font-mono">
                  Filed on {new Date(caseData.form_submissions[0].submitted_at).toLocaleString()}
                </span>
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-4 max-w-2xl">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Authorized Signatory Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rajesh Kumar Sharma"
                  value={formData.applicant_full_name}
                  onChange={(e) => setFormData({ ...formData, applicant_full_name: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Designation</label>
                  <input
                    type="text"
                    required
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Signatory PAN Number</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ABCDE1234F"
                    value={formData.pan_number}
                    onChange={(e) => setFormData({ ...formData, pan_number: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Registered Manufacturing Premises Address <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Plot No. 42, Industrial Area, Phase II..."
                  value={formData.registered_address}
                  onChange={(e) => setFormData({ ...formData, registered_address: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="flex items-start gap-2 pt-2">
                <input
                  type="checkbox"
                  id="decl"
                  checked={formData.declaration_confirmed}
                  onChange={(e) => setFormData({ ...formData, declaration_confirmed: e.target.checked })}
                  className="rounded border-border mt-0.5 text-primary focus:ring-primary"
                />
                <label htmlFor="decl" className="text-xs text-muted-foreground leading-normal">
                  I solemnly declare that all particulars stated herein and accompanying statutory documents are genuine,
                  correct, and comply fully with all applicable central and state regulatory acts.
                </label>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submittingForm || !formData.declaration_confirmed}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  {submittingForm ? "Filing Application..." : "Submit Statutory Application"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 3: Government Portal Tracking */}
        {activeTab === "portal" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-foreground">Official Government Portal Tracking</h3>
                <p className="text-xs text-muted-foreground">
                  Synchronized portal status reports from {caseData.authority}.
                </p>
              </div>
              <button
                onClick={() => setPortalModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold"
              >
                Record Portal Update
              </button>
            </div>

            {caseData.external_statuses.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-border rounded-xl bg-card">
                <Clock className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">
                  No government portal tracking entries logged yet. Complete form preparation to file application.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border border border-border rounded-xl bg-card overflow-hidden">
                {caseData.external_statuses.map((st) => (
                  <div key={st.id} className="p-4 text-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-foreground text-sm">{st.portal_name}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[var(--ui-sage-soft)] text-[var(--ui-sage)]">
                          {st.status_code}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Application Ref: <span className="font-mono font-medium text-foreground">{st.application_reference_number}</span>
                      </p>
                      {st.portal_remarks && (
                        <p className="text-xs text-muted-foreground mt-0.5 italic">&ldquo;{st.portal_remarks}&rdquo;</p>
                      )}
                    </div>
                    <span className="text-[11px] text-muted-foreground font-mono">
                      {new Date(st.status_date).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: Audit Event Timeline */}
        {activeTab === "timeline" && (
          <div className="p-6 rounded-2xl border border-border bg-card shadow-sm space-y-4">
            <div>
              <h3 className="text-base font-bold text-foreground">Immutable Regulatory Audit Trail</h3>
              <p className="text-xs text-muted-foreground">
                Chronological ledger of every workflow transition, precheck evaluation, and compliance review.
              </p>
            </div>

            <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
              {timeline.map((evt) => (
                <div key={evt.id} className="relative">
                  <div className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-primary ring-4 ring-background" />
                  <div className="p-3.5 rounded-lg border border-border/60 bg-muted/20 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-foreground font-mono">{evt.event_code}</span>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {new Date(evt.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-muted-foreground">{evt.notes}</p>
                    <div className="flex items-center gap-2 pt-1 text-[10px] text-muted-foreground/70">
                      <span>Actor: <strong className="text-foreground">{evt.actor_type}</strong></span>
                      {evt.actor_email && <span>({evt.actor_email})</span>}
                      {evt.from_step_code && evt.to_step_code && (
                        <span>&bull; {evt.from_step_code} &rarr; {evt.to_step_code}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modal: Record Portal Status */}
      {portalModalOpen && (
        <Overlay open onClose={() => setPortalModalOpen(false)} title="Record portal status">
          <div className="bg-card border border-border rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-foreground">Record Government Portal Status</h3>
            <form onSubmit={handleRecordPortalStatus} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Portal Name</label>
                <input
                  type="text"
                  required
                  value={portalStatusForm.portal_name}
                  onChange={(e) => setPortalStatusForm({ ...portalStatusForm, portal_name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg bg-background"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Status Code</label>
                <select
                  value={portalStatusForm.status_code}
                  onChange={(e) => setPortalStatusForm({ ...portalStatusForm, status_code: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg bg-background"
                >
                  <option value="APPROVED">APPROVED (Official Clearance Granted)</option>
                  <option value="QUERY_RAISED">QUERY_RAISED (Official Department Query)</option>
                  <option value="PROCESSING">PROCESSING (Under Department Scrutiny)</option>
                  <option value="REJECTED">REJECTED (Application Rejected)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Application Reference Number</label>
                <input
                  type="text"
                  required
                  value={portalStatusForm.application_reference_number}
                  onChange={(e) => setPortalStatusForm({ ...portalStatusForm, application_reference_number: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg bg-background font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Portal Remarks</label>
                <textarea
                  rows={2}
                  value={portalStatusForm.portal_remarks}
                  onChange={(e) => setPortalStatusForm({ ...portalStatusForm, portal_remarks: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg bg-background"
                  placeholder="e.g. Approved and digital certificate issued."
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setPortalModalOpen(false)}
                  className="px-3.5 py-1.5 border rounded-lg text-muted-foreground hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-primary text-primary-foreground font-semibold rounded-lg"
                >
                  Save Portal Status
                </button>
              </div>
            </form>
          </div>
        </Overlay>
      )}
    </AppShell>
  );
}
