"use client";

import React, { useState } from "react";
import {
  Download,
  ExternalLink,
  Eye,
  FileText,
  Maximize2,
  Minimize2,
  RefreshCw,
  ZoomIn,
  ZoomOut,
  AlertTriangle,
  CheckCircle2,
  Shield,
  Zap,
  Clock,
  Layers,
  XCircle,
} from "lucide-react";
import type {
  DocumentRequirementItem,
  DocumentSubmissionItem,
  StructuredFinding,
} from "@/types";

interface AdminPdfViewerProps {
  submission: DocumentSubmissionItem | null;
  requirement: DocumentRequirementItem | null;
  allVersions?: DocumentSubmissionItem[];
  selectedVersion?: number | null;
  onSelectVersion?: (version: number) => void;
  onApprove?: () => void;
  onQuery?: () => void;
  onReject?: () => void;
  isActionLoading?: boolean;
}

export function AdminPdfViewer({
  submission,
  requirement,
  allVersions = [],
  selectedVersion,
  onSelectVersion,
  onApprove,
  onQuery,
  onReject,
  isActionLoading = false,
}: AdminPdfViewerProps) {
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [iframeKey, setIframeKey] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<"viewer" | "findings" | "metadata">("viewer");

  if (!submission) {
    return (
      <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-border rounded-2xl bg-muted/10 text-center space-y-3">
        <FileText className="w-12 h-12 text-muted-foreground/40" />
        <div>
          <h4 className="text-sm font-bold text-foreground">No Document Submission</h4>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm">
            The business has not uploaded any file for &quot;{requirement?.name || "this requirement"}&quot; yet.
          </p>
        </div>
      </div>
    );
  }

  // Determine authorized view URL with inline Content-Disposition & HMAC
  let viewUrl = submission.view_url || `/api/v1/documents/${submission.id}/view`;
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("complywise_token");
    if (token && !viewUrl.includes("token=")) {
      viewUrl += (viewUrl.includes("?") ? "&" : "?") + `token=${encodeURIComponent(token)}`;
    }
  }
  const isPdf = submission.mime_type === "application/pdf" || submission.file_name.toLowerCase().endsWith(".pdf");

  // Extract structured findings from latest review
  const latestReview = submission.latest_review;
  const rawFindings = latestReview?.findings || [];
  const findings: StructuredFinding[] = rawFindings.map((f: any) => {
    if (typeof f === "object" && f !== null && "finding_code" in f) {
      return f as StructuredFinding;
    }
    return {
      finding_code: f?.code || "GENERAL_FINDING",
      severity: f?.severity || "INFO",
      field: f?.field || "document",
      message: f?.message || (typeof f === "string" ? f : JSON.stringify(f)),
    };
  });

  return (
    <div
      className={`flex flex-col rounded-2xl border border-border bg-card shadow-sm transition-all overflow-hidden ${
        isFullscreen ? "fixed inset-4 z-50 bg-background shadow-2xl" : "h-[680px]"
      }`}
    >
      {/* Top Header & Version Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-border bg-muted/30">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/10 text-primary">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs text-foreground truncate max-w-xs sm:max-w-md">
                {submission.file_name}
              </span>
              <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-primary/15 text-primary font-bold">
                v{submission.version_number}
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground flex items-center gap-2 mt-0.5">
              <span>{(submission.file_size_bytes / 1024).toFixed(1)} KB</span>
              <span>&bull;</span>
              <span>{new Date(submission.created_at).toLocaleDateString()}</span>
              {submission.uploaded_by_email && (
                <>
                  <span>&bull;</span>
                  <span className="truncate max-w-[150px]">{submission.uploaded_by_email}</span>
                </>
              )}
            </p>
          </div>
        </div>

        {/* Version Switcher Navigation (§15, §24) */}
        {allVersions.length > 0 && (
          <div className="flex items-center gap-1.5 bg-background p-1 rounded-xl border border-border/80">
            <span className="text-[11px] font-semibold text-muted-foreground px-2 flex items-center gap-1">
              <Layers className="w-3 h-3 text-primary" />
              History:
            </span>
            {allVersions.map((v) => {
              const isActive = (selectedVersion ?? submission.version_number) === v.version_number;
              const isApproved = v.status_code === "INTERNAL_HUMAN_APPROVED";
              const isQueried = v.status_code === "INTERNAL_HUMAN_QUERY";

              return (
                <button
                  key={v.id}
                  onClick={() => onSelectVersion?.(v.version_number)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold flex items-center gap-1 transition-all ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                  title={`Version ${v.version_number}: ${v.status_code}`}
                >
                  v{v.version_number}
                  {isApproved && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                  {isQueried && <AlertTriangle className="w-3 h-3 text-amber-400" />}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Control Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 border-b border-border/60 bg-muted/10 text-xs">
        {/* View Mode Tabs */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab("viewer")}
            className={`px-3 py-1 rounded-lg font-semibold transition-colors flex items-center gap-1.5 ${
              activeTab === "viewer"
                ? "bg-foreground text-background shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            PDF Canvas
          </button>
          <button
            onClick={() => setActiveTab("findings")}
            className={`px-3 py-1 rounded-lg font-semibold transition-colors flex items-center gap-1.5 ${
              activeTab === "findings"
                ? "bg-foreground text-background shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-blue-500" />
            AI Findings
            {findings.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-blue-500/20 text-blue-600 text-[10px] flex items-center justify-center font-bold">
                {findings.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("metadata")}
            className={`px-3 py-1 rounded-lg font-semibold transition-colors flex items-center gap-1.5 ${
              activeTab === "metadata"
                ? "bg-foreground text-background shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            Verification & Audit
          </button>
        </div>

        {/* Adjudication actions directly in viewer toolbar */}
        {(onApprove || onQuery || onReject) && (
          <div className="flex items-center gap-1.5 py-0.5">
            {onApprove && (
              <button
                type="button"
                onClick={onApprove}
                disabled={isActionLoading}
                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold text-xs flex items-center gap-1 shadow-xs transition-colors disabled:opacity-50"
                title="Approve this document"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Approve</span>
              </button>
            )}
            {onQuery && (
              <button
                type="button"
                onClick={onQuery}
                disabled={isActionLoading}
                className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white font-semibold text-xs flex items-center gap-1 shadow-xs transition-colors disabled:opacity-50"
                title="Raise clarification query on this document"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Query</span>
              </button>
            )}
            {onReject && (
              <button
                type="button"
                onClick={onReject}
                disabled={isActionLoading}
                className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-semibold text-xs flex items-center gap-1 shadow-xs transition-colors disabled:opacity-50"
                title="Reject this document"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Reject</span>
              </button>
            )}
          </div>
        )}

        {/* Viewer Tools */}
        {activeTab === "viewer" && (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setZoomLevel((z) => Math.max(50, z - 15))}
              className="p-1.5 rounded-lg border border-border/60 hover:bg-muted text-muted-foreground transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="font-mono text-[11px] px-1.5 text-muted-foreground min-w-[3rem] text-center">
              {zoomLevel}%
            </span>
            <button
              onClick={() => setZoomLevel((z) => Math.min(200, z + 15))}
              className="p-1.5 rounded-lg border border-border/60 hover:bg-muted text-muted-foreground transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoomLevel(100)}
              className="px-2 py-1 rounded-lg border border-border/60 hover:bg-muted text-[10px] font-mono text-muted-foreground"
            >
              Reset
            </button>

            <div className="h-4 w-px bg-border mx-1" />

            <button
              onClick={() => setIframeKey((k) => k + 1)}
              className="p-1.5 rounded-lg border border-border/60 hover:bg-muted text-muted-foreground transition-colors"
              title="Reload Frame"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>

            <a
              href={viewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-lg border border-border/60 hover:bg-muted text-muted-foreground transition-colors flex items-center gap-1"
              title="Open in new tab"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <a
              href={`${viewUrl}?download=1`}
              download={submission.file_name}
              className="p-1.5 rounded-lg border border-border/60 hover:bg-muted text-muted-foreground transition-colors"
              title="Download file"
            >
              <Download className="w-3.5 h-3.5" />
            </a>

            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 rounded-lg border border-border/60 hover:bg-muted text-muted-foreground transition-colors"
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        )}
      </div>

      {/* Main View Area */}
      <div className="relative flex-1 bg-muted/20 overflow-hidden flex items-center justify-center">
        {activeTab === "viewer" ? (
          isPdf ? (
            <div className="w-full h-full flex flex-col p-2 space-y-1.5">
              <div
                className="w-full flex-1 overflow-auto flex justify-center"
                style={{
                  transform: zoomLevel !== 100 ? `scale(${zoomLevel / 100})` : undefined,
                  transformOrigin: "top center",
                  transition: "transform 0.15s ease-out",
                }}
              >
                <iframe
                  key={iframeKey}
                  src={`${viewUrl}#toolbar=1&navpanes=1`}
                  className="w-full h-full min-h-[460px] rounded-xl border border-border shadow-xs bg-white"
                  title={submission.file_name}
                />
              </div>
              <div className="flex items-center justify-between px-3 py-1.5 bg-muted/40 rounded-lg text-[11px] text-muted-foreground border border-border/50 shrink-0">
                <span className="flex items-center gap-1.5 font-medium truncate">
                  <FileText className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span className="truncate">{submission.file_name} (v{submission.version_number})</span>
                  <span className="font-mono text-[10px]">({(submission.file_size_bytes / 1024).toFixed(1)} KB)</span>
                </span>
                <div className="flex items-center gap-3 shrink-0 font-semibold">
                  <a
                    href={viewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline flex items-center gap-1"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Open in New Tab
                  </a>
                  <a
                    href={`${viewUrl}?download=1`}
                    download={submission.file_name}
                    className="text-primary hover:underline flex items-center gap-1"
                  >
                    <Download className="w-3 h-3" />
                    Download File
                  </a>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-8 space-y-4 text-center">
              <FileText className="w-16 h-16 text-muted-foreground/50" />
              <div>
                <p className="font-semibold text-foreground text-sm">{submission.file_name}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Non-PDF file format ({submission.mime_type}). You can download or view in a new browser tab.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <a
                  href={viewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors flex items-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open in New Tab
                </a>
                <a
                  href={`${viewUrl}?download=1`}
                  download={submission.file_name}
                  className="px-4 py-2 rounded-xl border border-border bg-card text-foreground text-xs font-semibold hover:bg-muted transition-colors flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download File
                </a>
              </div>
            </div>
          )
        ) : activeTab === "findings" ? (
          <div className="w-full h-full overflow-y-auto p-6 space-y-4 bg-background">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Zap className="w-4 h-4 text-blue-600" />
                  Automated OCR & AI Pre-Validation Findings
                </h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Advisory diagnostic report generated on upload. Compliance officer retains sole adjudicative authority.
                </p>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-mono font-bold ${
                  submission.status_code === "PRECHECK_PASSED"
                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                    : submission.status_code === "PRECHECK_FAILED"
                    ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                    : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                }`}
              >
                {submission.status_code.replace(/_/g, " ")}
              </span>
            </div>

            {findings.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {findings.map((f, idx) => {
                  const isWarning = f.severity === "WARNING";
                  const isCritical = f.severity === "CRITICAL" || f.severity === "ERROR";

                  return (
                    <div
                      key={idx}
                      className={`p-4 rounded-xl border text-xs space-y-2 transition-all ${
                        isCritical
                          ? "border-rose-200 bg-rose-50/50 dark:border-rose-900/60 dark:bg-rose-950/20"
                          : isWarning
                          ? "border-amber-200 bg-amber-50/50 dark:border-amber-900/60 dark:bg-amber-950/20"
                          : "border-blue-200 bg-blue-50/50 dark:border-blue-900/60 dark:bg-blue-950/20"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded ${
                            isCritical
                              ? "bg-rose-200 text-rose-900 dark:bg-rose-900 dark:text-rose-100"
                              : isWarning
                              ? "bg-amber-200 text-amber-900 dark:bg-amber-900 dark:text-amber-100"
                              : "bg-blue-200 text-blue-900 dark:bg-blue-900 dark:text-blue-100"
                          }`}
                        >
                          {f.finding_code}
                        </span>
                        {f.confidence !== undefined && (
                          <span className="text-[10px] font-mono text-muted-foreground">
                            {(f.confidence * 100).toFixed(0)}% conf
                          </span>
                        )}
                      </div>

                      {f.message && <p className="font-semibold text-foreground">{f.message}</p>}

                      {(f.expected_value || f.observed_value) && (
                        <div className="space-y-1 pt-1 border-t border-border/40 font-mono text-[11px]">
                          {f.expected_value && (
                            <div className="flex items-center justify-between text-muted-foreground">
                              <span>Expected:</span>
                              <span className="font-semibold text-foreground">{String(f.expected_value)}</span>
                            </div>
                          )}
                          {f.observed_value && (
                            <div className="flex items-center justify-between text-muted-foreground">
                              <span>Observed:</span>
                              <span className="font-semibold text-foreground">{String(f.observed_value)}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center border border-dashed border-border rounded-xl space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                <p className="text-sm font-bold text-foreground">Clean Optical Inspection</p>
                <p className="text-xs text-muted-foreground max-w-md mx-auto">
                  Document satisfies clarity, orientation, statutory entity name matching, and required regulatory metadata.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="w-full h-full overflow-y-auto p-6 space-y-6 bg-background">
            <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              Cryptographic & Storage Traceability
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-xl border border-border bg-muted/20 space-y-1">
                <span className="text-[10px] font-bold text-muted-foreground uppercase">Storage Engine</span>
                <p className="font-semibold text-foreground">Private Supabase Storage Bucket</p>
                <p className="font-mono text-[10px] text-muted-foreground truncate">{submission.storage_path}</p>
              </div>

              <div className="p-3.5 rounded-xl border border-border bg-muted/20 space-y-1">
                <span className="text-[10px] font-bold text-muted-foreground uppercase">Cryptographic Integrity</span>
                <p className="font-semibold text-foreground">SHA-256 Checksum</p>
                <p className="font-mono text-[10px] text-muted-foreground truncate">{submission.checksum || "Computed on Ingestion"}</p>
              </div>

              <div className="p-3.5 rounded-xl border border-border bg-muted/20 space-y-1">
                <span className="text-[10px] font-bold text-muted-foreground uppercase">Security Policy</span>
                <p className="font-semibold text-foreground">Short-Lived Signed HMAC Token</p>
                <p className="text-muted-foreground text-[11px]">Strict Access-Control via Backend Streaming / Signed URL</p>
              </div>

              <div className="p-3.5 rounded-xl border border-border bg-muted/20 space-y-1">
                <span className="text-[10px] font-bold text-muted-foreground uppercase">Audit Provenance</span>
                <p className="font-semibold text-foreground">Uploaded By</p>
                <p className="text-foreground">{submission.uploaded_by_email || "Authorized User"}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminPdfViewer;
