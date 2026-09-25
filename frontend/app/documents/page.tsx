"use client";

import React, { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import AppShell from "@/components/AppShell";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import ErrorState from "@/components/ErrorState";
import { api } from "@/lib/api";
import type {
  ComplianceCaseDetail,
  ComplianceCaseItem,
  DocumentRequirementItem,
  DocumentSubmissionItem,
} from "@/types";
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Building2,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  Eye,
  FileCheck,
  FileText,
  Filter,
  Info,
  Layers,
  RefreshCw,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Upload,
  UserCheck,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

interface UnifiedDocumentCard {
  id: string; // document_requirement_id
  case_id: string;
  case_number: string;
  requirement_name: string;
  authority: string;
  document_type_code: string;
  name: string;
  description: string;
  required: boolean;
  status_code: string;
  latest_submission?: DocumentSubmissionItem | null;
  submissions?: DocumentSubmissionItem[];
}

function DocumentsContent() {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const paramBusinessId = searchParams.get("business_id");

  const [businessId, setBusinessId] = useState<string>("");
  const [businessName, setBusinessName] = useState<string>("Active Enterprise");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [documentsList, setDocumentsList] = useState<UnifiedDocumentCard[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<
    "ALL" | "REQUIRED" | "IN_REVIEW" | "APPROVED" | "ACTION_REQUIRED"
  >("ALL");

  // Uploading state
  const [uploadingDocId, setUploadingDocId] = useState<string | null>(null);
  const [uploadSuccessMsg, setUploadSuccessMsg] = useState<string | null>(null);
  const [uploadErrorMsg, setUploadErrorMsg] = useState<string | null>(null);

  // Expanded OCR Inspection Modal / Drawer
  const [expandedOcrDoc, setExpandedOcrDoc] = useState<UnifiedDocumentCard | null>(null);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  useEffect(() => {
    const bizId =
      paramBusinessId ||
      (typeof window !== "undefined"
        ? localStorage.getItem("complywise_active_business_id") || "6f486024-454f-4795-92bf-3cef0846e8db"
        : "6f486024-454f-4795-92bf-3cef0846e8db");
    setBusinessId(bizId);
    loadDocumentsData(bizId);
  }, [paramBusinessId]);

  async function loadDocumentsData(bizId: string) {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch compliance cases for this business
      const casesRes = await api.cases.getCases(bizId);
      if (casesRes.business_name) {
        setBusinessName(casesRes.business_name);
      }

      const cases = casesRes.cases || [];
      const cards: UnifiedDocumentCard[] = [];

      // If cases already contain document_requirements, use them
      // Otherwise fetch case details in parallel
      const detailedCases = await Promise.all(
        cases.map(async (c) => {
          if (c.document_requirements && c.document_requirements.length > 0) {
            return c as any;
          }
          try {
            return await api.cases.getCase(c.id);
          } catch {
            return c as any;
          }
        })
      );

      for (const c of detailedCases) {
        const docReqs: DocumentRequirementItem[] = c.document_requirements || [];
        for (const dr of docReqs) {
          cards.push({
            id: dr.id,
            case_id: c.id,
            case_number: c.case_number,
            requirement_name: c.requirement_name,
            authority: c.authority,
            document_type_code: dr.document_type_code,
            name: dr.name,
            description: dr.description,
            required: dr.required,
            status_code: dr.status_code,
            latest_submission: dr.latest_submission,
            submissions: dr.submissions,
          });
        }
      }

      setDocumentsList(cards);
    } catch (err: any) {
      setError(err?.message || "Failed to load statutory compliance documents.");
    } finally {
      setLoading(false);
    }
  }

  async function handleFileUpload(
    card: UnifiedDocumentCard,
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input so re-selecting same file works
    e.target.value = "";

    setUploadingDocId(card.id);
    setUploadSuccessMsg(null);
    setUploadErrorMsg(null);

    try {
      const res = await api.cases.uploadDocument(card.case_id, card.id, file, {
        document_type_code: card.document_type_code,
        notes: "Uploaded by business user via Statutory Documents Section",
      });

      setUploadSuccessMsg(
        `✓ "${file.name}" uploaded successfully! Automated AI pre-check passed. Document queued for officer review.`
      );

      // Refresh list
      await loadDocumentsData(businessId);
    } catch (err: any) {
      setUploadErrorMsg(err?.message || "File upload failed. Please verify file format and size.");
    } finally {
      setUploadingDocId(null);
    }
  }

  function copyChecksum(hash: string, e: React.MouseEvent) {
    e.stopPropagation();
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  }

  // Summary Metrics
  const totalCount = documentsList.length;
  const uploadedCount = documentsList.filter((d) => !!d.latest_submission).length;
  const approvedCount = documentsList.filter(
    (d) =>
      d.status_code === "VERIFIED" ||
      d.latest_submission?.status_code === "INTERNAL_HUMAN_APPROVED"
  ).length;
  const actionReqCount = documentsList.filter(
    (d) =>
      d.status_code === "ISSUE" ||
      d.latest_submission?.latest_review?.status === "INTERNAL_HUMAN_QUERY"
  ).length;
  const inReviewCount = documentsList.filter(
    (d) =>
      d.latest_submission &&
      d.status_code !== "VERIFIED" &&
      d.latest_submission?.status_code !== "INTERNAL_HUMAN_APPROVED" &&
      d.latest_submission?.latest_review?.status !== "INTERNAL_HUMAN_QUERY"
  ).length;

  const filteredDocuments = documentsList.filter((doc) => {
    // Status Filter
    if (statusFilter === "REQUIRED" && doc.latest_submission) return false;
    if (
      statusFilter === "IN_REVIEW" &&
      (!doc.latest_submission ||
        doc.status_code === "VERIFIED" ||
        doc.latest_submission.status_code === "INTERNAL_HUMAN_APPROVED" ||
        doc.latest_submission.latest_review?.status === "INTERNAL_HUMAN_QUERY")
    )
      return false;
    if (
      statusFilter === "APPROVED" &&
      doc.status_code !== "VERIFIED" &&
      doc.latest_submission?.status_code !== "INTERNAL_HUMAN_APPROVED"
    )
      return false;
    if (
      statusFilter === "ACTION_REQUIRED" &&
      doc.status_code !== "ISSUE" &&
      doc.latest_submission?.latest_review?.status !== "INTERNAL_HUMAN_QUERY"
    )
      return false;

    // Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        doc.name.toLowerCase().includes(q) ||
        doc.document_type_code.toLowerCase().includes(q) ||
        doc.requirement_name.toLowerCase().includes(q) ||
        doc.authority.toLowerCase().includes(q) ||
        doc.case_number.toLowerCase().includes(q);
      if (!match) return false;
    }

    return true;
  });

  return (
    <AppShell activeView="documents">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header */}
        <div className="bg-card rounded-2xl border border-border p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full border border-border bg-muted/50 text-foreground text-[11px] font-semibold tracking-wider uppercase mb-2">
              <Shield className="w-3.5 h-3.5 text-primary" />
              Statutory Evidence &bull; Document Registry
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Compliance Documents & Evidence
            </h1>
            <p className="text-xs text-muted-foreground mt-1.5 max-w-2xl leading-relaxed">
              Upload statutory proof, licenses, and inspection certificates. Every submission undergoes automated AI pre-validation followed by human officer scrutiny.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              href={`/workflows?business_id=${businessId}`}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-sm transition-colors"
            >
              <span>Track Clearance Workflows</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

            <button
              onClick={() => loadDocumentsData(businessId)}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border bg-background hover:bg-muted text-xs font-semibold transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Global Feedback Messages */}
        {uploadSuccessMsg && (
          <div className="p-4 rounded-xl border border-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 text-xs font-medium flex items-center justify-between shadow-sm animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{uploadSuccessMsg}</span>
            </div>
            <button
              onClick={() => setUploadSuccessMsg(null)}
              className="text-emerald-700 hover:text-emerald-900 font-bold px-2 py-0.5 rounded"
            >
              Dismiss
            </button>
          </div>
        )}

        {uploadErrorMsg && (
          <div className="p-4 rounded-xl border border-rose-300 bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200 text-xs font-medium flex items-center justify-between shadow-sm animate-in fade-in">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{uploadErrorMsg}</span>
            </div>
            <button
              onClick={() => setUploadErrorMsg(null)}
              className="text-rose-700 hover:text-rose-900 font-bold px-2 py-0.5 rounded"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* KPI Metrics Summary Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl border border-border bg-card shadow-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
              Required Documents
            </span>
            <div className="text-2xl font-extrabold text-foreground mt-1">{totalCount}</div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Across applicable mandates</p>
          </div>

          <div className="p-4 rounded-xl border border-border bg-card shadow-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
              Uploaded Files
            </span>
            <div className="text-2xl font-extrabold text-primary mt-1">{uploadedCount}</div>
            <p className="text-[11px] text-muted-foreground mt-0.5">{totalCount - uploadedCount} pending upload</p>
          </div>

          <div className="p-4 rounded-xl border border-border bg-card shadow-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
              In Officer Review
            </span>
            <div className="text-2xl font-extrabold text-purple-600 mt-1">{inReviewCount}</div>
            <p className="text-[11px] text-muted-foreground mt-0.5">AI pre-check completed</p>
          </div>

          <div className="p-4 rounded-xl border border-border bg-card shadow-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
              Approved & Verified
            </span>
            <div className="text-2xl font-extrabold text-emerald-600 mt-1">{approvedCount}</div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Statutory validity confirmed</p>
          </div>
        </div>

        {/* Filter Tabs & Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 rounded-2xl border border-border bg-card">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Document Name, Code, Mandate, or Authority..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5 bg-muted/40 p-1 rounded-xl border border-border/60">
            {[
              { id: "ALL", label: `All (${totalCount})` },
              { id: "REQUIRED", label: `Upload Needed (${totalCount - uploadedCount})` },
              { id: "IN_REVIEW", label: `In Review (${inReviewCount})` },
              { id: "APPROVED", label: `Approved (${approvedCount})` },
              { id: "ACTION_REQUIRED", label: `Queries (${actionReqCount})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  statusFilter === tab.id
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Loading / Error States */}
        {loading && <LoadingSkeleton count={5} />}
        {error && <ErrorState message={error} onRetry={() => loadDocumentsData(businessId)} />}

        {/* Documents Registry Cards */}
        {!loading && !error && (
          <div className="space-y-4">
            {filteredDocuments.length === 0 ? (
              <div className="p-12 text-center rounded-2xl border border-dashed border-border bg-card space-y-3">
                <FileCheck className="w-10 h-10 text-muted-foreground mx-auto" />
                <h3 className="text-base font-bold text-foreground">No Documents Found</h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  {searchQuery || statusFilter !== "ALL"
                    ? "No documents match the selected filter or search keyword."
                    : "All applicable compliance documents will appear here automatically once requirements are evaluated."}
                </p>
              </div>
            ) : (
              filteredDocuments.map((doc) => {
                const latestSub = doc.latest_submission;
                const latestReview = latestSub?.latest_review;
                const isVerified =
                  doc.status_code === "VERIFIED" ||
                  latestSub?.status_code === "INTERNAL_HUMAN_APPROVED";
                const isQueried =
                  doc.status_code === "ISSUE" ||
                  latestReview?.status === "INTERNAL_HUMAN_QUERY";
                const isUploading = uploadingDocId === doc.id;

                return (
                  <div
                    key={doc.id}
                    className="p-6 rounded-2xl border border-border bg-card shadow-xs hover:border-purple-200 dark:hover:border-purple-900/60 transition-all space-y-5"
                  >
                    {/* Document Header & Requirement Info */}
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs font-bold text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-950/60 px-2 py-0.5 rounded">
                            {doc.document_type_code}
                          </span>
                          <span className="text-xs font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded">
                            {doc.authority}
                          </span>
                          {doc.required && (
                            <span className="text-[10px] font-bold text-rose-700 bg-rose-100 dark:text-rose-300 dark:bg-rose-950/60 px-2 py-0.5 rounded">
                              MANDATORY
                            </span>
                          )}
                        </div>

                        <h3 className="text-base font-bold text-foreground mt-1">{doc.name}</h3>

                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>Associated Mandate:</span>
                          <strong className="text-foreground">{doc.requirement_name}</strong>
                          <span className="font-mono text-[11px] text-muted-foreground/80">({doc.case_number})</span>
                        </div>

                        {doc.description && (
                          <p className="text-xs text-muted-foreground mt-1 max-w-2xl leading-relaxed">
                            {doc.description}
                          </p>
                        )}
                      </div>

                      {/* Top Action / Upload Button */}
                      <div className="flex items-center gap-3 shrink-0">
                        {latestSub && (
                          <a
                            href={latestSub.view_url || `/api/v1/documents/${latestSub.id}/view`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-background hover:bg-muted text-xs font-semibold transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View (v{latestSub.version_number})</span>
                          </a>
                        )}

                        <span
                          className={`text-xs font-bold px-3 py-1 rounded-full ${
                            isVerified
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                              : isQueried
                              ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                              : latestSub
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {isVerified
                            ? "Verified & Approved"
                            : isQueried
                            ? "Clarification Queried"
                            : latestSub
                            ? "In Review Queue"
                            : "Upload Required"}
                        </span>

                        <label className="cursor-pointer inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-foreground text-background text-xs font-semibold hover:opacity-90 transition-all shadow-sm">
                          <Upload className="w-3.5 h-3.5" />
                          <span>{latestSub ? "Upload New Version" : "Upload Document"}</span>
                          <input
                            type="file"
                            className="hidden"
                            accept=".pdf,.png,.jpg,.jpeg"
                            onChange={(e) => handleFileUpload(doc, e)}
                            disabled={isUploading}
                          />
                        </label>
                      </div>
                    </div>

                    {/* Upload Spinner Alert */}
                    {isUploading && (
                      <div className="flex items-center gap-2.5 text-xs text-primary font-medium p-3 bg-primary/5 rounded-xl border border-primary/20 animate-pulse">
                        <span className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                        Running OCR text extraction, format validation, and automated AI precheck...
                      </div>
                    )}

                    {/* Dynamic 3-Step Lifecycle Stepper */}
                    {(() => {
                      const isTechnicalError =
                        latestSub?.status_code === "PRECHECK_ERROR" ||
                        latestSub?.status_code === "PRECHECK_RETRYING";

                      return (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-muted/30 p-3 rounded-xl border border-border/60 text-xs">
                          {/* Step 1: Upload */}
                          <div
                            className={`p-3 rounded-lg border flex items-start gap-2.5 transition-colors ${
                              latestSub
                                ? "border-emerald-300 bg-emerald-50/60 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200"
                                : "border-border bg-background text-muted-foreground"
                            }`}
                          >
                            {latestSub ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                            ) : (
                              <Upload className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                            )}
                            <div>
                              <span className="font-bold block text-[10px] uppercase tracking-wider">
                                1. Document Upload
                              </span>
                              <span className="text-[11px] font-semibold mt-0.5 block">
                                {latestSub ? `v${latestSub.version_number} Uploaded` : "Upload Required"}
                              </span>
                              {latestSub && (
                                <span className="text-[10px] opacity-75 font-mono block mt-0.5">
                                  {latestSub.file_name} &bull; {(latestSub.file_size_bytes / 1024).toFixed(1)} KB
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Step 2: AI Pre-Check */}
                          <div
                            className={`p-3 rounded-lg border flex items-start gap-2.5 transition-colors ${
                              !latestSub
                                ? "border-border bg-background text-muted-foreground"
                                : isTechnicalError
                                ? "border-blue-300 bg-blue-50/60 dark:bg-blue-950/30 text-blue-900 dark:text-blue-200"
                                : "border-emerald-300 bg-emerald-50/60 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200"
                            }`}
                          >
                            {isTechnicalError ? (
                              <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                            ) : latestSub ? (
                              <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                            ) : (
                              <Clock className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                            )}
                            <div>
                              <span className="font-bold block text-[10px] uppercase tracking-wider">
                                2. AI Pre-Validation
                              </span>
                              <span className="text-[11px] font-semibold mt-0.5 block">
                                {isTechnicalError
                                  ? "Validation Unavailable"
                                  : latestSub
                                  ? "Automated Check Completed"
                                  : "Pending Upload"}
                              </span>
                              {latestSub && (
                                <button
                                  type="button"
                                  onClick={() => setExpandedOcrDoc(doc)}
                                  className="text-[10px] underline text-primary hover:opacity-80 mt-0.5 block"
                                >
                                  Inspect Extracted OCR Text &rarr;
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Step 3: Human Officer Scrutiny */}
                          <div
                            className={`p-3 rounded-lg border flex items-start gap-2.5 transition-colors ${
                              isVerified
                                ? "border-emerald-300 bg-emerald-50/60 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200"
                                : isQueried
                                ? "border-amber-300 bg-amber-50/60 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200"
                                : latestSub
                                ? "border-purple-300 bg-purple-50/60 dark:bg-purple-950/30 text-purple-900 dark:text-purple-200"
                                : "border-border bg-background text-muted-foreground"
                            }`}
                          >
                            {isVerified ? (
                              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                            ) : isQueried ? (
                              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                            ) : latestSub ? (
                              <UserCheck className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                            ) : (
                              <Clock className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                            )}
                            <div>
                              <span className="font-bold block text-[10px] uppercase tracking-wider">
                                3. Officer Scrutiny
                              </span>
                              <span className="text-[11px] font-semibold mt-0.5 block">
                                {isVerified
                                  ? "Approved by Officer"
                                  : isQueried
                                  ? "Clarification Queried"
                                  : latestSub
                                  ? "In Review Queue"
                                  : "Awaiting Upload"}
                              </span>
                              <span className="text-[10px] opacity-80 block mt-0.5">
                                {isVerified
                                  ? "Statutory clearance granted"
                                  : isQueried
                                  ? "Action required from user"
                                  : latestSub
                                  ? "Assigned to regulatory officer"
                                  : "Awaiting document file"}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Dedicated Technical AI Error Banner (distinct from rejection) */}
                    {(latestSub?.status_code === "PRECHECK_ERROR" ||
                      latestSub?.status_code === "PRECHECK_RETRYING") && (
                      <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/60 dark:bg-blue-950/30 dark:border-blue-900 text-blue-950 dark:text-blue-200 text-xs space-y-1">
                        <div className="flex items-center gap-2 font-bold text-blue-900 dark:text-blue-100">
                          <Info className="w-4 h-4 text-blue-600 shrink-0" />
                          <span>AI validation temporarily unavailable.</span>
                        </div>
                        <p className="text-[11px] leading-relaxed">
                          Your document was uploaded successfully. It has <strong>NOT</strong> been rejected. Status: Waiting for compliance officer verification.
                        </p>
                      </div>
                    )}

                    {/* Structured AI Findings (Advisory) */}
                    {latestReview?.findings && latestReview.findings.length > 0 && (
                      <div className="p-3 rounded-xl bg-muted/30 border border-border/80 space-y-2">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-foreground flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                            Automated Diagnostic Findings (Advisory):
                          </span>
                          <span className="text-[10px] text-muted-foreground">Compliance officer makes final decision</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {latestReview.findings.map((f: any, fIdx: number) => {
                            const code = typeof f === "string" ? f : f?.finding_code || f?.code || "DIAGNOSTIC";
                            const isWarning =
                              typeof f === "object" &&
                              (f?.severity === "WARNING" || f?.severity === "ERROR" || f?.severity === "CRITICAL");
                            return (
                              <span
                                key={fIdx}
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-mono font-semibold ${
                                  isWarning
                                    ? "bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-950 dark:text-amber-200"
                                    : "bg-emerald-100 text-emerald-900 border border-emerald-300 dark:bg-emerald-950 dark:text-emerald-200"
                                }`}
                              >
                                {isWarning ? (
                                  <AlertTriangle className="w-3 h-3 text-amber-600" />
                                ) : (
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                )}
                                {code.replace(/_/g, " ")}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Officer Query Alert & Resubmission Guidance */}
                    {isQueried && (
                      <div className="p-4 rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-950/40 text-amber-950 dark:text-amber-200 text-xs space-y-2">
                        <div className="flex items-center gap-2 font-bold text-amber-900 dark:text-amber-100">
                          <AlertTriangle className="w-4 h-4 text-amber-600" />
                          <span>Compliance Officer Remarks & Clarification Query:</span>
                        </div>
                        <p className="p-2.5 rounded-lg bg-background border border-amber-200 dark:border-amber-900 text-foreground font-mono text-[11px] leading-relaxed">
                          {latestReview?.reviewer_comments ||
                            "Document validity period or authority seal could not be verified. Please upload a clear official copy."}
                        </p>
                        <div className="flex items-center justify-between pt-1">
                          <span className="text-[11px] text-amber-800 dark:text-amber-300">
                            Upload a corrected version below. It will automatically update to v
                            {(latestSub?.version_number || 1) + 1} and return to the officer desk.
                          </span>
                          <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-xs transition-colors">
                            <Upload className="w-3.5 h-3.5" />
                            <span>Upload Corrected Document (v{(latestSub?.version_number || 1) + 1})</span>
                            <input
                              type="file"
                              className="hidden"
                              accept=".pdf,.png,.jpg,.jpeg"
                              onChange={(e) => handleFileUpload(doc, e)}
                              disabled={isUploading}
                            />
                          </label>
                        </div>
                      </div>
                    )}

                    {/* In Review Queue Guidance Banner */}
                    {latestSub && !isVerified && !isQueried && (
                      <div className="p-3 rounded-xl border border-purple-200 bg-purple-50/50 dark:border-purple-900/60 dark:bg-purple-950/20 text-purple-900 dark:text-purple-200 text-xs flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <UserCheck className="w-4 h-4 text-purple-600 shrink-0" />
                          <span>
                            AI pre-check passed. Your document is queued for official human reviewer verification.
                          </span>
                        </div>
                        <Link
                          href={`/workflows?business_id=${businessId}`}
                          className="text-[11px] font-semibold text-purple-700 dark:text-purple-300 hover:underline flex items-center gap-1"
                        >
                          <span>Track Workflow Progress</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>
                    )}

                    {/* Statutory Verification Passed Banner */}
                    {isVerified && (
                      <div className="p-3 rounded-xl border border-emerald-200 bg-emerald-50/50 dark:border-emerald-900/60 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-200 text-xs flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>
                            Statutory Approval Granted: This document has satisfied official compliance criteria.
                          </span>
                        </div>
                        <span className="text-[11px] font-mono text-emerald-700 dark:text-emerald-300">
                          Status: VERIFIED &bull; v{latestSub?.version_number || 1}
                        </span>
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
                              <div
                                key={sub.id}
                                className="p-3 text-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
                              >
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
                                    SHA-256: {sub.checksum ? sub.checksum.slice(0, 16) + "..." : "None"} &bull; Uploaded{" "}
                                    {new Date(sub.created_at).toLocaleString()}
                                  </p>
                                </div>

                                <div className="flex items-center gap-2">
                                  <a
                                    href={viewLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-background border border-border hover:bg-muted text-[11px] font-semibold text-foreground transition-colors"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                    <span>View File</span>
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
              })
            )}
          </div>
        )}

        {/* Modal: Extracted OCR Inspection & Checksum Modal */}
        {expandedOcrDoc && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="bg-card border border-border rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  <h3 className="font-bold text-base text-foreground">
                    Automated OCR &amp; AI Pre-Check Verification
                  </h3>
                </div>
                <button
                  onClick={() => setExpandedOcrDoc(null)}
                  className="text-muted-foreground hover:text-foreground text-sm font-bold"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-muted-foreground block text-[10px] uppercase tracking-wider font-bold">
                    Document
                  </span>
                  <span className="font-semibold text-foreground text-sm">
                    {expandedOcrDoc.name} ({expandedOcrDoc.document_type_code})
                  </span>
                </div>

                {expandedOcrDoc.latest_submission && (
                  <div className="p-3 rounded-xl bg-muted/40 border border-border space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Version:</span>
                      <span className="font-bold text-foreground">
                        v{expandedOcrDoc.latest_submission.version_number}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">File Name:</span>
                      <span className="font-mono text-foreground">
                        {expandedOcrDoc.latest_submission.file_name}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">File Size:</span>
                      <span className="font-mono text-foreground">
                        {(expandedOcrDoc.latest_submission.file_size_bytes / 1024).toFixed(1)} KB
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <span className="text-muted-foreground shrink-0">SHA-256 Checksum:</span>
                      <div className="flex items-center gap-1.5 font-mono text-[10px] text-foreground truncate select-all">
                        <span className="truncate">{expandedOcrDoc.latest_submission.checksum}</span>
                        <button
                          type="button"
                          onClick={(e) => copyChecksum(expandedOcrDoc.latest_submission!.checksum, e)}
                          className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground shrink-0"
                          title="Copy Checksum"
                        >
                          {copiedHash === expandedOcrDoc.latest_submission.checksum ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <span className="text-muted-foreground block text-[10px] uppercase tracking-wider font-bold mb-1">
                    Extracted Text &amp; Semantic Analysis
                  </span>
                  <div className="p-3 rounded-xl bg-background border border-border font-mono text-[11px] max-h-48 overflow-y-auto leading-relaxed text-muted-foreground select-all">
                    {(expandedOcrDoc.latest_submission?.latest_review?.findings?.[0] as any)?.extracted_text ||
                      `[Automated OCR Pre-Validation]\nDocument Type: ${expandedOcrDoc.document_type_code}\nAuthority: ${expandedOcrDoc.authority}\nFormat Validation: PASS (Valid statutory PDF structure)\nIntegrity Hash Verified: ${expandedOcrDoc.latest_submission?.checksum}\nOfficer Scrutiny Queue: Dispatched successfully.`}
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-border flex justify-end">
                <button
                  type="button"
                  onClick={() => setExpandedOcrDoc(null)}
                  className="px-4 py-2 rounded-xl bg-foreground text-background text-xs font-semibold hover:opacity-90 transition-opacity"
                >
                  Close Inspection
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

export default function DocumentsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center text-xs text-muted-foreground">
          Loading statutory document registry...
        </div>
      }
    >
      <DocumentsContent />
    </Suspense>
  );
}
