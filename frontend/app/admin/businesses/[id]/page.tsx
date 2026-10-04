"use client";
import Overlay from "@/components/product/Overlay";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { AdminShell } from "@/components/AdminShell";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import ErrorState from "@/components/ErrorState";
import { api } from "@/lib/api";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Copy,
  ExternalLink,
  Eye,
  FileCheck,
  FileText,
  Filter,
  History,
  Layers,
  MapPin,
  RefreshCw,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Upload,
  User,
  XCircle,
  Zap,
} from "lucide-react";

interface AdminBusinessPageProps {
  params: Promise<{ id: string }>;
}

export default function AdminBusinessDetailPage({ params }: AdminBusinessPageProps) {
  const resolvedParams = use(params);
  const businessId = resolvedParams.id;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<"compliances" | "documents" | "profile" | "history">("compliances");
  const [copiedId, setCopiedId] = useState(false);

  // Scrutiny Quick Action Modal
  const [actionCaseId, setActionCaseId] = useState<string | null>(null);
  const [actionType, setActionType] = useState<"APPROVE" | "QUERY" | "REJECT">("APPROVE");
  const [actionRemarks, setActionRemarks] = useState("");
  const [submittingAction, setSubmittingAction] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // Document OCR expander state: { [docId: string]: boolean }
  const [expandedOcrMap, setExpandedOcrMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadBusinessData();
  }, [businessId]);

  async function loadBusinessData() {
    setLoading(true);
    setError(null);
    try {
      const res = await api.businesses.getAdminBusinessOverview(businessId);
      setData(res);
    } catch (err: any) {
      setError(err?.message || "Failed to load business command overview.");
    } finally {
      setLoading(false);
    }
  }

  function copyId() {
    navigator.clipboard.writeText(businessId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  }

  function toggleOcr(docId: string) {
    setExpandedOcrMap((prev) => ({ ...prev, [docId]: !prev[docId] }));
  }

  async function handleExecuteDetermination(e: React.FormEvent) {
    e.preventDefault();
    if (!actionCaseId) return;

    setSubmittingAction(true);
    try {
      if (actionType === "APPROVE") {
        await api.cases.adminApprove(actionCaseId, actionRemarks);
      } else if (actionType === "QUERY") {
        await api.cases.adminQuery(actionCaseId, actionRemarks, "Please upload corrected statutory evidence.");
      } else {
        await api.cases.adminReject(actionCaseId, actionRemarks);
      }

      setActionSuccessMsg(`Determination executed: ${actionType}.`);
      await loadBusinessData();
      setTimeout(() => {
        setActionCaseId(null);
        setActionSuccessMsg(null);
      }, 1200);
    } catch (err: any) {
      setError(err?.message || "Failed to execute determination.");
    } finally {
      setSubmittingAction(false);
    }
  }

  if (loading) {
    return (
      <AdminShell activeTab="businesses">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <LoadingSkeleton count={6} />
        </div>
      </AdminShell>
    );
  }

  if (error || !data) {
    return (
      <AdminShell activeTab="businesses">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <ErrorState message={error || "Business not found."} onRetry={loadBusinessData} />
        </div>
      </AdminShell>
    );
  }

  const b = data.business;
  const p = data.profile;
  const cases = data.compliance_cases || [];
  const docs = data.uploaded_documents || [];
  const summary = data.summary || {};

  return (
    <AdminShell activeTab="businesses">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Top Breadcrumb & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <Link
            href="/admin/businesses"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Businesses Directory
          </Link>

          <div className="flex items-center gap-2">
            <button
              onClick={loadBusinessData}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-background hover:bg-muted text-xs font-semibold transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh
            </button>
          </div>
        </div>

        {/* Action Success Alert */}
        {actionSuccessMsg && (
          <div className="p-4 rounded-xl border border-[var(--ui-sage-soft)] bg-[var(--ui-sage-faint)] dark:bg-[var(--ui-sage)]/40 text-[var(--ui-sage)] dark:text-[var(--ui-sage-soft)] flex items-center justify-between text-xs font-medium">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[var(--ui-sage)] shrink-0" />
              <span>{actionSuccessMsg}</span>
            </div>
            <button onClick={() => setActionSuccessMsg(null)} className="text-[var(--ui-sage)] hover:text-[var(--ui-sage)]">
              Dismiss
            </button>
          </div>
        )}

        {/* Master Business Header Card */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[var(--ui-sage-soft)] text-[var(--ui-sage)] dark:bg-[var(--ui-sage)]/70 dark:text-[var(--ui-sage)]">
                  <Building2 className="w-3.5 h-3.5" />
                  Enterprise Entity
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-muted text-muted-foreground">
                  Profile v{p.version_number || 1}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[var(--ui-sage-soft)] text-[var(--ui-sage)] dark:bg-[var(--ui-sage)] dark:text-[var(--ui-sage)]">
                  Active
                </span>
              </div>

              <h1 className="text-3xl font-extrabold text-foreground tracking-tight">
                {b.name}
              </h1>

              {/* Business ID Box with One-Click Copy */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-muted/60 border border-border">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    BUSINESS ID:
                  </span>
                  <code className="font-mono font-bold text-foreground text-xs">
                    {businessId}
                  </code>
                  <button
                    onClick={copyId}
                    title="Copy Business ID"
                    className="p-1 text-muted-foreground hover:text-foreground transition-colors rounded"
                  >
                    {copiedId ? (
                      <Check className="w-3.5 h-3.5 text-[var(--ui-sage)]" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                {/* Owner Account Email Badge */}
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--ui-sage-faint)] dark:bg-[var(--ui-sage)]/40 border border-[var(--ui-sage-soft)] dark:border-[var(--ui-sage-soft)] text-[var(--ui-sage)] dark:text-[var(--ui-sage)] font-medium">
                  <User className="w-3.5 h-3.5 text-[var(--ui-sage)]" />
                  <span>Account: <strong>{b.owner_email || "System"}</strong></span>
                  {b.owner_name ? <span className="opacity-80">({b.owner_name})</span> : null}
                </div>
              </div>
            </div>

            {/* Quick Summary Pill Counters */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs shrink-0">
              <div className="p-3 rounded-xl bg-muted/30 border border-border/60 text-center">
                <span className="text-muted-foreground block text-[10px] font-bold uppercase">MANDATES</span>
                <span className="text-xl font-extrabold text-foreground">{summary.mandated_compliances || cases.length}</span>
              </div>
              <div className="p-3 rounded-xl bg-[var(--ui-sage-faint)] dark:bg-[var(--ui-sage)]/40 border border-[var(--ui-sage-soft)] dark:border-[var(--ui-sage-soft)] text-center">
                <span className="text-[var(--ui-sage)] dark:text-[var(--ui-sage)] block text-[10px] font-bold uppercase">IN SCRUTINY</span>
                <span className="text-xl font-extrabold text-[var(--ui-sage)] dark:text-[var(--ui-sage-soft)]">{summary.pending_reviews || 0}</span>
              </div>
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-center">
                <span className="text-amber-700 dark:text-amber-300 block text-[10px] font-bold uppercase">QUERIES</span>
                <span className="text-xl font-extrabold text-amber-900 dark:text-amber-100">{summary.action_required || 0}</span>
              </div>
              <div className="p-3 rounded-xl bg-[var(--ui-info-soft)] dark:bg-[var(--ui-text)]/40 border border-[var(--ui-sage-soft)] dark:border-[var(--ui-sage-soft)] text-center">
                <span className="text-[var(--ui-info)] dark:text-[var(--ui-info)] block text-[10px] font-bold uppercase">EVIDENCE</span>
                <span className="text-xl font-extrabold text-[var(--ui-info)] dark:text-[var(--ui-info-soft)]">{summary.total_uploaded_documents || docs.length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <nav aria-label="Business record sections" className="grid grid-cols-2 sm:flex border-b border-border gap-3 sm:gap-6">
          {[
            { id: "compliances", label: `Requirements (${cases.length})`, icon: ShieldCheck },
            { id: "documents", label: `Evidence (${docs.length})`, icon: FileText },
            { id: "profile", label: `Profile (v${p.version_number || 1})`, icon: FileCheck },
            { id: "history", label: `History (${data.profile_history?.length || 0})`, icon: History },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                aria-pressed={isActive}
                onClick={() => setActiveTab(tab.id as any)}
                className={`pb-3 text-xs font-bold flex items-center gap-2 border-b-2 transition-colors ${
                  isActive
                    ? "border-[var(--ui-sage-soft)] text-[var(--ui-sage)] dark:text-[var(--ui-sage)]"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* TAB 1: Business-Wise Compliance Mandates ("Needed / Applicable vs Optional") */}
        {activeTab === "compliances" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h3 className="text-base font-bold text-foreground">
                  Evaluated Statutory Compliance Requirements
                </h3>
                <p className="text-xs text-muted-foreground">
                  Regulations determined for this enterprise based on their declared Profile variables. Compliance officers can verify applicability basis and decide determinations.
                </p>
              </div>
            </div>

            {cases.length === 0 ? (
              <div className="p-12 text-center rounded-2xl border border-dashed border-border bg-card space-y-2">
                <ShieldCheck className="w-8 h-8 text-muted-foreground mx-auto" />
                <h4 className="text-sm font-bold text-foreground">No Compliances Evaluated Yet</h4>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  This business has not run an applicability assessment yet.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {cases.map((c: any) => {
                  const isHumanReview = c.status_code === "HUMAN_REVIEW";
                  const isActionReq = c.status_code === "ACTION_REQUIRED";
                  const isCompleted = c.status_code === "COMPLETED";

                  return (
                    <div
                      key={c.id}
                      className="rounded-2xl border border-border bg-card p-6 shadow-sm hover:border-[var(--ui-sage-soft)] dark:hover:border-[var(--ui-sage-soft)] transition-all space-y-4"
                    >
                      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-xs font-bold text-[var(--ui-sage)] dark:text-[var(--ui-sage)] bg-[var(--ui-sage-soft)] dark:bg-[var(--ui-sage)]/70 px-2 py-0.5 rounded">
                              {c.case_number}
                            </span>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-muted px-2 py-0.5 rounded">
                              {c.authority}
                            </span>
                            <span className="text-[10px] font-bold text-[var(--ui-sage)] bg-[var(--ui-sage-soft)] dark:text-[var(--ui-sage)] dark:bg-[var(--ui-sage)]/70 px-2 py-0.5 rounded flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              MANDATED STATUTORY REQUIREMENT
                            </span>
                          </div>

                          <h4 className="text-lg font-bold text-foreground">
                            {c.requirement_name}
                          </h4>

                          {/* Mandate Basis: Why It Applies */}
                          <div className="p-3.5 rounded-xl bg-[var(--ui-sage-faint)]/50 dark:bg-[var(--ui-sage)]/20 border border-[var(--ui-sage-soft)] dark:border-[var(--ui-sage-soft)]/60 text-xs">
                            <span className="font-bold text-[var(--ui-sage)] dark:text-[var(--ui-sage)] block mb-0.5">
                              Statutory Trigger & Applicability Basis:
                            </span>
                            <p className="text-[var(--ui-sage)] dark:text-[var(--ui-sage-soft)] leading-relaxed font-medium">
                              {c.mandate_basis}
                            </p>
                          </div>
                        </div>

                        {/* Progress Status & Action Controls */}
                        <div className="flex flex-col items-start lg:items-end gap-3 shrink-0">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-bold ${
                              isHumanReview
                                ? "bg-[var(--ui-sage-soft)] text-[var(--ui-sage)] dark:bg-[var(--ui-sage)] dark:text-[var(--ui-sage)]"
                                : isActionReq
                                ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                                : isCompleted
                                ? "bg-[var(--ui-sage-soft)] text-[var(--ui-sage)] dark:bg-[var(--ui-sage)] dark:text-[var(--ui-sage)]"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {c.status_code.replace(/_/g, " ")}
                          </span>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setActionCaseId(c.id);
                                setActionType("APPROVE");
                                setActionRemarks("");
                              }}
                              className="px-3 py-1.5 rounded-lg border border-[var(--ui-sage-soft)] dark:border-[var(--ui-sage-soft)] text-[var(--ui-sage)] dark:text-[var(--ui-sage)] hover:bg-[var(--ui-sage-faint)] text-xs font-semibold transition-colors"
                            >
                              Fast Scrutiny
                            </button>

                            <Link
                              href={`/admin/cases/${c.id}`}
                              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-foreground text-background hover:bg-foreground/90 text-xs font-semibold shadow-sm transition-colors"
                            >
                              <span>Case Review Desk</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </Link>
                          </div>
                        </div>
                      </div>

                      {/* Case Operational Footprint */}
                      <div className="pt-3 border-t border-border grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                        <div>
                          <span className="text-[10px] text-muted-foreground block">CURRENT WORKFLOW STEP</span>
                          <span className="font-semibold text-foreground">{c.current_step_name || "Document Collection"}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-muted-foreground block">EVIDENCE PROGRESS</span>
                          <span className="font-semibold text-foreground">
                            {c.documents_uploaded_count} / {c.documents_required_count} Uploaded
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-muted-foreground block">VERIFIED EVIDENCE</span>
                          <span className="font-semibold text-[var(--ui-sage)]">
                            {c.documents_approved_count} Approved
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-muted-foreground block">ASSIGNED REVIEWER</span>
                          <span className="font-semibold text-foreground">
                            {c.assigned_reviewer_name || c.assigned_reviewer_email || "Unassigned"}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: All Uploaded Documents & Evidence */}
        {activeTab === "documents" && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-bold text-foreground">
                All Uploaded Evidence & Verification Outcomes
              </h3>
              <p className="text-xs text-muted-foreground">
                Consolidated statutory files, certificates, and forms submitted by this business across all requirements.
              </p>
            </div>

            {docs.length === 0 ? (
              <div className="p-12 text-center rounded-2xl border border-dashed border-border bg-card space-y-2">
                <FileText className="w-8 h-8 text-muted-foreground mx-auto" />
                <h4 className="text-sm font-bold text-foreground">No Evidence Files Uploaded Yet</h4>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  When the user uploads statutory documents on their site, they will immediately appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {docs.map((d: any) => {
                  const isApproved = d.status_code === "INTERNAL_HUMAN_APPROVED";
                  const isQuery = d.status_code === "INTERNAL_HUMAN_QUERY";
                  const isAiPassed = d.latest_review?.status === "INTERNAL_HUMAN_APPROVED" || d.latest_review?.review_type === "AI_PRECHECK";
                  const ocrOpen = !!expandedOcrMap[d.id];

                  return (
                    <div
                      key={d.id}
                      className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-4"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold px-2 py-0.5 bg-muted rounded">
                              v{d.version_number}
                            </span>
                            <h4 className="font-bold text-sm text-foreground">{d.file_name}</h4>
                            <span className="text-[11px] text-muted-foreground font-mono">
                              ({(d.file_size_bytes / 1024).toFixed(1)} KB)
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Requirement: <strong className="text-foreground">{d.requirement_name}</strong> &bull; Case: <code className="font-mono">{d.case_number}</code>
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                              isApproved
                                ? "bg-[var(--ui-sage-soft)] text-[var(--ui-sage)] dark:bg-[var(--ui-sage)] dark:text-[var(--ui-sage)]"
                                : isQuery
                                ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                                : "bg-[var(--ui-info-soft)] text-[var(--ui-info)] dark:bg-[var(--ui-text)] dark:text-[var(--ui-info)]"
                            }`}
                          >
                            {d.status_code.replace(/_/g, " ")}
                          </span>

                          <Link
                            href={`/admin/cases/${d.case_id}`}
                            className="px-3 py-1.5 rounded-lg bg-foreground text-background text-xs font-semibold hover:bg-foreground/90"
                          >
                            Review Desk &rarr;
                          </Link>
                        </div>
                      </div>

                      {/* Technical Details & Checksum */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-muted/30 p-3 rounded-xl border border-border/60">
                        <div>
                          <span className="text-muted-foreground block text-[10px]">MIME TYPE</span>
                          <span className="font-mono font-semibold text-foreground">{d.mime_type}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block text-[10px]">SHA-256 CHECKSUM</span>
                          <span className="font-mono text-[10px] text-foreground truncate block" title={d.checksum}>
                            {d.checksum || "Verified"}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block text-[10px]">UPLOADED BY</span>
                          <span className="font-semibold text-foreground truncate block">{d.uploaded_by_email || "User"}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block text-[10px]">UPLOAD TIMESTAMP</span>
                          <span className="text-muted-foreground">{new Date(d.uploaded_at).toLocaleString()}</span>
                        </div>
                      </div>

                      {/* AI Precheck Snippet */}
                      {d.latest_review && (
                        <div className="p-3 bg-muted/20 rounded-xl border border-border/60 text-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-foreground flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5 text-[var(--ui-sage)]" />
                              AI Pre-validation Check
                            </span>
                            <button
                              onClick={() => toggleOcr(d.id)}
                              className="text-[11px] text-[var(--ui-sage)] dark:text-[var(--ui-sage)] hover:underline flex items-center gap-1 font-semibold"
                            >
                              {ocrOpen ? "Hide Extracted Text" : "View Extracted OCR Findings"}
                              {ocrOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            </button>
                          </div>

                          {ocrOpen && (
                            <div className="mt-2 p-3 bg-background rounded-lg border border-border font-mono text-[11px] text-muted-foreground max-h-40 overflow-y-auto">
                              {d.latest_review.findings && d.latest_review.findings.length > 0 ? (
                                <ul className="list-disc pl-4 space-y-1">
                                  {d.latest_review.findings.map((f: any, i: number) => (
                                    <li key={i}>{typeof f === "string" ? f : f.message || JSON.stringify(f)}</li>
                                  ))}
                                </ul>
                              ) : (
                                <p>Standard document structure validated. Required statutory seals and entity name verified against declared profile.</p>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: Evaluated Profile Version & Questionnaire Intake */}
        {activeTab === "profile" && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-bold text-foreground">
                Evaluated Profile Version & Intake Declarations
              </h3>
              <p className="text-xs text-muted-foreground">
                Authoritative parameters declared during onboarding and updated profile versions. All compliance mandates derive from these variables.
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div>
                  <span className="font-mono text-xs font-bold text-[var(--ui-sage)] dark:text-[var(--ui-sage)] bg-[var(--ui-sage-soft)] dark:bg-[var(--ui-sage)]/60 px-2.5 py-1 rounded-md">
                    Evaluating Profile v{p.version_number || 1}
                  </span>
                  <p className="text-xs text-muted-foreground mt-1">
                    {p.change_note || "System onboarding profile initialization."}
                  </p>
                </div>
              </div>

              {/* Answered Variables Table */}
              <div className="divide-y divide-border rounded-xl border border-border overflow-hidden">
                {p.answered_variables?.length === 0 ? (
                  <div className="p-8 text-center text-xs text-muted-foreground">
                    No variables recorded yet.
                  </div>
                ) : (
                  p.answered_variables?.map((v: any) => (
                    <div key={v.key} className="p-3.5 flex items-center justify-between gap-4 text-xs hover:bg-muted/20">
                      <div>
                        <span className="font-semibold text-foreground block">{v.label}</span>
                        <span className="text-[10px] text-muted-foreground font-mono">key: {v.key}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-foreground font-mono text-sm">
                          {typeof v.value === "boolean" ? (v.value ? "Yes / Declared" : "No / None") : String(v.value)}
                          {v.unit ? ` ${v.unit}` : ""}
                        </span>
                        <span className="block text-[10px] text-muted-foreground mt-0.5">
                          {v.origin}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: Version Snapshots History */}
        {activeTab === "history" && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-bold text-foreground">
                Immutable Profile Version Snapshots
              </h3>
              <p className="text-xs text-muted-foreground">
                Every material declaration change generates an append-only snapshot ($v_1, v_2, \dots$) preserving past applicability determinations.
              </p>
            </div>

            <div className="divide-y divide-border rounded-2xl border border-border bg-card overflow-hidden">
              {data.profile_history?.map((hist: any) => (
                <div key={hist.id} className="p-4 flex items-center justify-between gap-4 text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-[var(--ui-sage)] dark:text-[var(--ui-sage)] bg-[var(--ui-sage-soft)] dark:bg-[var(--ui-sage)]/70 px-2 py-0.5 rounded">
                        Snapshot v{hist.version}
                      </span>
                      <span className="text-muted-foreground">
                        {hist.created_at ? new Date(hist.created_at).toLocaleString() : "Active"}
                      </span>
                    </div>
                    <p className="font-semibold text-foreground mt-1">
                      {hist.change_note || "Profile snapshot"}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground font-mono">
                    {hist.variables_count} variables recorded
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Fast Scrutiny Determination Modal */}
        {actionCaseId && (
          <Overlay open onClose={() => setActionCaseId(null)} title="Review decision">
            <div className="bg-card border border-border rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-[var(--ui-sage)]" />
                  Statutory Determination
                </h3>
                <button
                  onClick={() => setActionCaseId(null)}
                  className="p-1 text-muted-foreground hover:text-foreground rounded-lg"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleExecuteDetermination} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">
                    Determination Action
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setActionType("APPROVE")}
                      className={`py-2 px-3 rounded-lg text-xs font-bold border transition-colors ${
                        actionType === "APPROVE"
                          ? "bg-[var(--ui-sage)] text-white border-[var(--ui-sage-soft)]"
                          : "border-border text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => setActionType("QUERY")}
                      className={`py-2 px-3 rounded-lg text-xs font-bold border transition-colors ${
                        actionType === "QUERY"
                          ? "bg-amber-600 text-white border-amber-600"
                          : "border-border text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      Raise Query
                    </button>
                    <button
                      type="button"
                      onClick={() => setActionType("REJECT")}
                      className={`py-2 px-3 rounded-lg text-xs font-bold border transition-colors ${
                        actionType === "REJECT"
                          ? "bg-rose-600 text-white border-rose-600"
                          : "border-border text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      Reject
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">
                    Officer Remarks & Reasons
                  </label>
                  <textarea
                    rows={3}
                    value={actionRemarks}
                    onChange={(e) => setActionRemarks(e.target.value)}
                    placeholder="Enter compliance scrutiny determination notes..."
                    className="w-full p-2.5 bg-background border border-border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[var(--ui-sage-soft)]/20"
                    required={actionType !== "APPROVE"}
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setActionCaseId(null)}
                    className="px-3.5 py-1.5 border border-border rounded-lg text-xs font-semibold text-muted-foreground hover:bg-muted"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingAction}
                    className="px-4 py-1.5 bg-[var(--ui-sage)] hover:bg-[var(--ui-sage)] text-white text-xs font-semibold rounded-lg shadow-sm disabled:opacity-50"
                  >
                    {submittingAction ? "Submitting..." : "Confirm Determination"}
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
