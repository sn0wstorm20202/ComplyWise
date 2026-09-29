"use client";

import React, { useState } from "react";
import {
  FileText,
  Search,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Clock,
  Eye,
  ExternalLink,
  ShieldCheck,
  FileCheck,
  Download,
  AlertTriangle,
  Send,
  User,
  Hash,
  Sparkles,
} from "lucide-react";
import type { AdminScrutinyData } from "@/types";
import { casesApi } from "@/lib/api/cases";

interface AdminDocumentsTabProps {
  data: AdminScrutinyData;
  onRefresh?: () => void;
}

export function AdminDocumentsTab({ data, onRefresh }: AdminDocumentsTabProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [selectedDocId, setSelectedDocId] = useState<string | null>(
    data.uploaded_documents && data.uploaded_documents.length > 0
      ? data.uploaded_documents[0].id
      : null
  );

  // Review action state
  const [reviewAction, setReviewAction] = useState<"APPROVE" | "QUERY" | "REJECT">("APPROVE");
  const [reviewRemarks, setReviewRemarks] = useState("");
  const [requiredAction, setRequiredAction] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const docs = data.uploaded_documents || [];

  const filteredDocs = docs.filter((doc) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !search ||
      doc.file_name.toLowerCase().includes(q) ||
      doc.requirement_name.toLowerCase().includes(q) ||
      (doc.case_number && doc.case_number.toLowerCase().includes(q));

    if (!matchesSearch) return false;

    if (statusFilter === "APPROVED") {
      return (
        doc.status_code === "INTERNAL_HUMAN_APPROVED" ||
        doc.status_code === "APPROVED" ||
        doc.latest_review?.status === "APPROVED"
      );
    }
    if (statusFilter === "PENDING") {
      return (
        doc.status_code === "PENDING_REVIEW" ||
        doc.status_code === "UPLOADED" ||
        !doc.latest_review ||
        doc.latest_review?.status === "PENDING"
      );
    }
    if (statusFilter === "QUERY") {
      return (
        doc.status_code === "QUERY_RAISED" ||
        doc.latest_review?.status === "QUERY" ||
        doc.latest_review?.status === "QUERY_RAISED"
      );
    }
    if (statusFilter === "REJECTED") {
      return (
        doc.status_code === "REJECTED" ||
        doc.latest_review?.status === "REJECTED"
      );
    }
    return true;
  });

  const selectedDoc = docs.find((d) => d.id === selectedDocId) || filteredDocs[0] || null;

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoc) return;

    setSubmittingReview(true);
    setActionSuccess(null);
    setActionError(null);

    try {
      if (reviewAction === "APPROVE") {
        await casesApi.adminApprove(
          selectedDoc.case_id,
          reviewRemarks || "Document approved after administrative scrutiny.",
          selectedDoc.id
        );
        setActionSuccess("Document successfully approved.");
      } else if (reviewAction === "QUERY") {
        if (!reviewRemarks || !requiredAction) {
          throw new Error("Both reason and required action are mandatory to raise a query.");
        }
        await casesApi.adminQuery(
          selectedDoc.case_id,
          reviewRemarks,
          requiredAction,
          selectedDoc.id
        );
        setActionSuccess("Query dispatched to applicant.");
      } else if (reviewAction === "REJECT") {
        if (!reviewRemarks) {
          throw new Error("Mandatory reason is required to reject a document submission.");
        }
        await casesApi.adminReject(
          selectedDoc.case_id,
          reviewRemarks,
          selectedDoc.id
        );
        setActionSuccess("Document submission rejected.");
      }

      setReviewRemarks("");
      setRequiredAction("");
      if (onRefresh) {
        onRefresh();
      }
    } catch (err: any) {
      setActionError(err.message || "Failed to record review action.");
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Summary */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <ShieldCheck className="w-3 h-3 mr-1" />
                Statutory Evidence Verification
              </span>
              <span className="text-xs text-slate-500 font-mono">
                {docs.length} Uploaded Submissions
              </span>
            </div>
            <h2 className="text-xl font-bold text-[#0F172A]">
              Document Verification &amp; OCR Inspection Cockpit
            </h2>
            <p className="text-sm text-slate-600 mt-1 max-w-3xl">
              Inspect uploaded filings, review cryptographic SHA-256 hashes, view AI precheck OCR
              findings, and record officer review approvals or queries.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-center">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Total Files
              </div>
              <div className="text-lg font-bold text-[#0F172A]">{docs.length}</div>
            </div>
            <div className="px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-xl text-center">
              <div className="text-xs font-semibold text-amber-700 uppercase tracking-wider">
                Pending Review
              </div>
              <div className="text-lg font-bold text-amber-700">
                {
                  docs.filter(
                    (d) =>
                      d.status_code === "PENDING_REVIEW" ||
                      d.status_code === "UPLOADED" ||
                      !d.latest_review
                  ).length
                }
              </div>
            </div>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by file name, requirement, case..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-[#18181B] rounded-xl text-sm transition-all focus:outline-none focus:ring-1 focus:ring-[#18181B]"
            />
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
            <button
              onClick={() => setStatusFilter("ALL")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                statusFilter === "ALL"
                  ? "bg-[#18181B] text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              All ({docs.length})
            </button>
            <button
              onClick={() => setStatusFilter("PENDING")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                statusFilter === "PENDING"
                  ? "bg-[#18181B] text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Pending Scrutiny
            </button>
            <button
              onClick={() => setStatusFilter("APPROVED")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                statusFilter === "APPROVED"
                  ? "bg-emerald-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Approved
            </button>
            <button
              onClick={() => setStatusFilter("QUERY")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                statusFilter === "QUERY"
                  ? "bg-amber-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Query Raised
            </button>
          </div>
        </div>
      </div>

      {docs.length === 0 ? (
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-12 text-center shadow-sm">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-[#0F172A]">No Document Submissions</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
            The applicant has not yet uploaded statutory documentation for this business. When files
            are submitted, they will appear here with cryptographic integrity verification.
          </p>
        </div>
      ) : (
        /* Split Pane Review Layout */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Submissions List */}
          <div className="lg:col-span-5 space-y-3">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-1">
              Filing Registry ({filteredDocs.length})
            </div>

            <div className="space-y-2.5 max-h-[750px] overflow-y-auto pr-1">
              {filteredDocs.map((doc) => {
                const isSelected = selectedDoc && selectedDoc.id === doc.id;
                const status = doc.latest_review?.status || doc.status_code || "PENDING";
                const isApproved =
                  status === "APPROVED" || status === "INTERNAL_HUMAN_APPROVED";
                const isQuery = status === "QUERY" || status === "QUERY_RAISED";
                const isRejected = status === "REJECTED";

                return (
                  <div
                    key={doc.id}
                    onClick={() => {
                      setSelectedDocId(doc.id);
                      setActionSuccess(null);
                      setActionError(null);
                    }}
                    className={`p-4 rounded-xl border text-left cursor-pointer transition-all ${
                      isSelected
                        ? "bg-slate-50 border-[#18181B] ring-1 ring-[#18181B] shadow-sm"
                        : "bg-white border-[#E2E8F0] hover:border-slate-300 shadow-xs"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <span className="font-mono text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                        {doc.case_number || "CASE"}
                      </span>

                      {isApproved && (
                        <span className="inline-flex items-center text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Approved
                        </span>
                      )}
                      {isQuery && (
                        <span className="inline-flex items-center text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          Query
                        </span>
                      )}
                      {isRejected && (
                        <span className="inline-flex items-center text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                          <XCircle className="w-3 h-3 mr-1" />
                          Rejected
                        </span>
                      )}
                      {!isApproved && !isQuery && !isRejected && (
                        <span className="inline-flex items-center text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                          <Clock className="w-3 h-3 mr-1" />
                          Pending Scrutiny
                        </span>
                      )}
                    </div>

                    <h4 className="text-sm font-bold text-[#0F172A] leading-snug line-clamp-1">
                      {doc.requirement_name}
                    </h4>
                    <p className="text-xs text-slate-500 font-mono mt-0.5 truncate">
                      {doc.file_name}
                    </p>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 mt-3 pt-2 border-t border-slate-100">
                      <span>{doc.uploaded_at ? new Date(doc.uploaded_at).toLocaleDateString() : "Recent"}</span>
                      <span>v{doc.version_number}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Selected Document Inspection Cockpit */}
          <div className="lg:col-span-7">
            {selectedDoc ? (
              <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-sm space-y-6">
                {/* Header & Meta */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {selectedDoc.case_number}
                      </span>
                      <span className="text-xs text-slate-500">v{selectedDoc.version_number}</span>
                    </div>
                    <h3 className="text-lg font-bold text-[#0F172A]">
                      {selectedDoc.requirement_name}
                    </h3>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">
                      {selectedDoc.file_name}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href={selectedDoc.stream_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-xs transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Open Document</span>
                    </a>
                  </div>
                </div>

                {/* Cryptographic Hash & Security Info */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-700 flex items-center gap-1">
                      <Hash className="w-3.5 h-3.5 text-slate-400" />
                      SHA-256 Checksum:
                    </span>
                    <span className="font-mono text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200 truncate max-w-[280px]">
                      {selectedDoc.checksum || "Computed on storage"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">MIME Type / File Size:</span>
                    <span className="font-mono text-slate-700">
                      {selectedDoc.mime_type || "application/pdf"} •{" "}
                      {selectedDoc.file_size_bytes
                        ? `${Math.round(selectedDoc.file_size_bytes / 1024)} KB`
                        : "Standard"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Uploaded By:</span>
                    <span className="font-medium text-slate-700">
                      {selectedDoc.uploaded_by_email || data.business.owner_email || "Applicant"}
                    </span>
                  </div>
                </div>

                {/* AI Precheck / OCR Findings */}
                {selectedDoc.latest_review ? (
                  <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-indigo-950 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                        AI Precheck &amp; Inspection Findings
                      </span>
                      <span className="font-mono text-[11px] text-indigo-700 bg-indigo-100/70 px-2 py-0.5 rounded font-semibold">
                        {selectedDoc.latest_review.review_type}
                      </span>
                    </div>

                    {selectedDoc.latest_review.reviewer_comments && (
                      <p className="text-indigo-900 leading-relaxed">
                        {selectedDoc.latest_review.reviewer_comments}
                      </p>
                    )}

                    {selectedDoc.latest_review.findings && (
                      <pre className="text-[11px] font-mono bg-white/80 p-2.5 rounded-lg border border-indigo-200 text-slate-800 overflow-x-auto">
                        {typeof selectedDoc.latest_review.findings === "string"
                          ? selectedDoc.latest_review.findings
                          : JSON.stringify(selectedDoc.latest_review.findings, null, 2)}
                      </pre>
                    )}
                  </div>
                ) : (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-500 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <span>No automated OCR analysis or prior officer findings recorded.</span>
                  </div>
                )}

                {/* Officer Scrutiny Action Box */}
                <form
                  onSubmit={handleReviewSubmit}
                  className="pt-5 border-t border-slate-100 space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Record Officer Scrutiny Action
                    </h4>
                    <span className="text-[11px] text-slate-400">Audited in Workflow Log</span>
                  </div>

                  {/* Action Selector */}
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setReviewAction("APPROVE")}
                      className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all border ${
                        reviewAction === "APPROVE"
                          ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => setReviewAction("QUERY")}
                      className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all border ${
                        reviewAction === "QUERY"
                          ? "bg-amber-600 text-white border-amber-600 shadow-sm"
                          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Raise Query
                    </button>
                    <button
                      type="button"
                      onClick={() => setReviewAction("REJECT")}
                      className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all border ${
                        reviewAction === "REJECT"
                          ? "bg-rose-600 text-white border-rose-600 shadow-sm"
                          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      Reject
                    </button>
                  </div>

                  {/* Remarks input */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {reviewAction === "APPROVE"
                        ? "Approval Remarks (Optional)"
                        : reviewAction === "QUERY"
                        ? "Deficiency Description / Query Reason (Mandatory)"
                        : "Rejection Rationale (Mandatory)"}
                    </label>
                    <textarea
                      rows={2}
                      value={reviewRemarks}
                      onChange={(e) => setReviewRemarks(e.target.value)}
                      placeholder={
                        reviewAction === "APPROVE"
                          ? "Document conforms to statutory standards..."
                          : "State the defect or deficiency identified..."
                      }
                      className="w-full px-3 py-2 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-[#18181B] rounded-xl text-xs transition-all focus:outline-none focus:ring-1 focus:ring-[#18181B]"
                    />
                  </div>

                  {/* Additional Action Requirement if QUERY */}
                  {reviewAction === "QUERY" && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Specific Action Required from Applicant
                      </label>
                      <input
                        type="text"
                        value={requiredAction}
                        onChange={(e) => setRequiredAction(e.target.value)}
                        placeholder="e.g. Upload signed Board Resolution with seal"
                        className="w-full px-3 py-2 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-[#18181B] rounded-xl text-xs transition-all focus:outline-none focus:ring-1 focus:ring-[#18181B]"
                      />
                    </div>
                  )}

                  {actionSuccess && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{actionSuccess}</span>
                    </div>
                  )}
                  {actionError && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>{actionError}</span>
                    </div>
                  )}

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={submittingReview}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-[#18181B] text-white hover:bg-[#27272A] disabled:opacity-50 transition-colors shadow-sm"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{submittingReview ? "Recording Action..." : "Commit Officer Action"}</span>
                    </button>
                  </div>
                </form>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
