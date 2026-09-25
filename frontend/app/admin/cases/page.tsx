"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { AdminShell } from "@/components/AdminShell";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import ErrorState from "@/components/ErrorState";
import { api } from "@/lib/api";
import type { AdminCasesSummary, ComplianceCaseDetail, ComplianceCaseItem } from "@/types";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  ExternalLink,
  Eye,
  FileCheck,
  FileText,
  Filter,
  Layers,
  RefreshCw,
  Search,
  Shield,
  ShieldAlert,
  UserCheck,
  XCircle,
} from "lucide-react";

export default function AdminCasesReviewPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<AdminCasesSummary | null>(null);
  const [queueCases, setQueueCases] = useState<ComplianceCaseItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Review Modal State
  const [selectedCase, setSelectedCase] = useState<ComplianceCaseDetail | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [reviewAction, setReviewAction] = useState<"APPROVE" | "QUERY" | "REJECT">("APPROVE");
  const [reviewComments, setReviewComments] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    loadAdminData();
  }, []);

  async function loadAdminData() {
    setLoading(true);
    setError(null);
    try {
      const [sumRes, queueRes] = await Promise.all([
        api.cases.getAdminSummary(),
        api.cases.getAdminReviewQueue(),
      ]);
      setSummary(sumRes);
      setQueueCases(queueRes.cases || []);
    } catch (err: any) {
      setError(err?.message || "Failed to load admin compliance queue.");
    } finally {
      setLoading(false);
    }
  }

  async function openReviewModal(caseId: string) {
    setModalLoading(true);
    setSelectedCase(null);
    setReviewComments("");
    setActionSuccessMsg(null);
    try {
      const detail = await api.cases.getCase(caseId);
      setSelectedCase(detail);
    } catch (err: any) {
      setError(err?.message || "Failed to load case details.");
    } finally {
      setModalLoading(false);
    }
  }

  async function handleExecuteReview(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedCase) return;

    // Find first submission that needs review or latest submission
    const docReq = selectedCase.document_requirements.find((d) => d.latest_submission);
    const sub = docReq?.latest_submission;

    if (!sub) {
      setError("No document submission found to review on this case.");
      return;
    }

    setSubmittingReview(true);
    try {
      await api.cases.reviewSubmission(sub.id, reviewAction, reviewComments, [
        { code: "OFFICER_REMARKS", message: reviewComments || "Reviewed by compliance officer." },
      ]);
      setActionSuccessMsg(`Review successfully executed: ${reviewAction}.`);
      await loadAdminData();
      setTimeout(() => {
        setSelectedCase(null);
      }, 1200);
    } catch (err: any) {
      setError(err?.message || "Failed to execute review action.");
    } finally {
      setSubmittingReview(false);
    }
  }

  const filteredQueue = queueCases.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.requirement_name.toLowerCase().includes(q) ||
      c.case_number.toLowerCase().includes(q) ||
      (c.business_name && c.business_name.toLowerCase().includes(q)) ||
      c.authority.toLowerCase().includes(q)
    );
  });

  return (
    <AdminShell activeTab="cases">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/60 pb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
                Staff & Compliance Officer Portal
              </span>
              <span className="text-xs text-muted-foreground font-mono">Platform Scrutiny Queue</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground mt-1">
              Compliance Review Workspace
            </h1>
            <p className="text-sm text-muted-foreground mt-1 max-w-3xl">
              Internal regulatory officer desk. Scrutinize pre-validated document submissions, raise statutory queries,
              and approve cases to advance to statutory form submission.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/cases"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg border border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            >
              User Cases View
            </Link>
            <button
              onClick={loadAdminData}
              disabled={loading}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh Queue
            </button>
          </div>
        </div>

        {/* KPI Metrics (§6: What needs human attention right now?) */}
        {summary && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="p-4 rounded-xl border border-blue-500/20 bg-blue-50/40 dark:bg-blue-950/20 shadow-sm">
              <span className="text-xs font-medium text-blue-700 dark:text-blue-400 flex items-center justify-between">
                Pending Reviews <UserCheck className="w-4 h-4 text-blue-600" />
              </span>
              <p className="text-2xl font-bold text-blue-900 dark:text-blue-300 mt-2">
                {summary.pending_reviews ?? summary.in_human_review}
              </p>
              <span className="text-[10px] text-muted-foreground block mt-0.5">Awaiting officer verification</span>
            </div>

            <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-50/40 dark:bg-amber-950/20 shadow-sm">
              <span className="text-xs font-medium text-amber-700 dark:text-amber-400 flex items-center justify-between">
                Queries Awaiting <AlertTriangle className="w-4 h-4 text-amber-600" />
              </span>
              <p className="text-2xl font-bold text-amber-900 dark:text-amber-300 mt-2">
                {summary.queries_awaiting ?? summary.queries_raised}
              </p>
              <span className="text-[10px] text-muted-foreground block mt-0.5">User correction pending</span>
            </div>

            <div className="p-4 rounded-xl border border-purple-500/20 bg-purple-50/40 dark:bg-purple-950/20 shadow-sm">
              <span className="text-xs font-medium text-purple-700 dark:text-purple-400 flex items-center justify-between">
                Forms Ready <FileCheck className="w-4 h-4 text-purple-600" />
              </span>
              <p className="text-2xl font-bold text-purple-900 dark:text-purple-300 mt-2">
                {summary.forms_ready ?? 0}
              </p>
              <span className="text-[10px] text-muted-foreground block mt-0.5">Documents approved</span>
            </div>

            <div className="p-4 rounded-xl border border-border bg-card shadow-sm">
              <span className="text-xs font-medium text-muted-foreground flex items-center justify-between">
                External Processing <Clock className="w-4 h-4 text-primary" />
              </span>
              <p className="text-2xl font-bold text-foreground mt-2">
                {summary.external_processing ?? summary.in_government_scrutiny}
              </p>
              <span className="text-[10px] text-muted-foreground block mt-0.5">Statutory portal scrutiny</span>
            </div>

            <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-50/40 dark:bg-emerald-950/20 shadow-sm">
              <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400 flex items-center justify-between">
                Completed & Verified <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </span>
              <p className="text-2xl font-bold text-emerald-900 dark:text-emerald-300 mt-2">
                {summary.completed_cases}
              </p>
              <span className="text-[10px] text-muted-foreground block mt-0.5">Clearance active</span>
            </div>
          </div>
        )}

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-muted/40 p-3 rounded-xl border border-border">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-foreground">Officer Scrutiny Queue</span>
            <span className="text-xs font-mono text-muted-foreground">({filteredQueue.length} cases)</span>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search queue by case, business, requirement..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-background rounded-lg border border-border focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        {/* Review Queue Table (§7) */}
        {loading ? (
          <div className="py-12">
            <LoadingSkeleton count={3} />
          </div>
        ) : error ? (
          <ErrorState message={error} onRetry={loadAdminData} />
        ) : filteredQueue.length === 0 ? (
          <div className="text-center py-16 px-4 rounded-2xl border border-dashed border-border bg-card">
            <CheckCircle2 className="w-12 h-12 text-emerald-500/40 mx-auto mb-2" />
            <h3 className="text-base font-semibold text-foreground">Review Queue is Clear</h3>
            <p className="text-xs text-muted-foreground mt-1">
              No cases currently pending compliance officer scrutiny.
            </p>
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/50 border-b border-border text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Case #</th>
                    <th className="py-3 px-4">Business</th>
                    <th className="py-3 px-4">Requirement & Authority</th>
                    <th className="py-3 px-4">Priority</th>
                    <th className="py-3 px-4">Current Status</th>
                    <th className="py-3 px-4">Workflow Step</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filteredQueue.map((c) => {
                    const statusColor =
                      c.status_code === "ACTION_REQUIRED"
                        ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                        : c.status_code === "HUMAN_REVIEW"
                        ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                        : "bg-muted text-muted-foreground";

                    return (
                      <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-primary">
                          <Link href={`/admin/cases/${c.id}`} className="hover:underline">
                            {c.case_number}
                          </Link>
                        </td>
                        <td className="py-3.5 px-4 font-medium text-foreground">{c.business_name || "Business"}</td>
                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-foreground block">{c.requirement_name}</span>
                          <span className="text-[10px] text-muted-foreground font-mono">{c.authority}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              c.priority === "HIGH"
                                ? "text-rose-600 bg-rose-50"
                                : "text-amber-600 bg-amber-50"
                            }`}
                          >
                            {c.priority}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${statusColor}`}>
                            {c.status_code.replace(/_/g, " ")}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-medium text-foreground">{c.current_step_name || "Document Review"}</td>
                        <td className="py-3.5 px-4 text-right space-x-2">
                          <Link
                            href={`/admin/cases/${c.id}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors shadow-sm"
                          >
                            <Shield className="w-3.5 h-3.5" />
                            Open Workspace
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Review Action Modal */}
      {selectedCase && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <span className="font-mono text-xs text-muted-foreground">{selectedCase.case_number}</span>
                <h3 className="text-base font-bold text-foreground">{selectedCase.requirement_name}</h3>
              </div>
              <button
                onClick={() => setSelectedCase(null)}
                className="text-muted-foreground hover:text-foreground text-xs"
              >
                ✕ Close
              </button>
            </div>

            {actionSuccessMsg ? (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                {actionSuccessMsg}
              </div>
            ) : (
              <form onSubmit={handleExecuteReview} className="space-y-4 text-xs">
                {/* Document Submissions in Case */}
                <div className="space-y-2">
                  <label className="block font-semibold text-foreground">Submitted Statutory Evidence</label>
                  <div className="divide-y divide-border/60 border border-border rounded-lg bg-muted/20 p-2 max-h-40 overflow-y-auto">
                    {selectedCase.document_requirements.map((d) => {
                      const sub = d.latest_submission;
                      return (
                        <div key={d.id} className="py-2 text-xs flex items-center justify-between">
                          <div>
                            <span className="font-medium text-foreground block">{d.name}</span>
                            <span className="text-[10px] text-muted-foreground font-mono">
                              {sub ? `File: ${sub.file_name} (v${sub.version_number})` : "No upload yet"}
                            </span>
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                              d.status_code === "VERIFIED"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {d.status_code}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Scrutiny Decision Choice */}
                <div>
                  <label className="block font-semibold text-foreground mb-1">Scrutiny Determination</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setReviewAction("APPROVE")}
                      className={`p-2.5 rounded-lg border text-center font-semibold transition-all ${
                        reviewAction === "APPROVE"
                          ? "border-emerald-500 bg-emerald-50 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200 ring-2 ring-emerald-500/20"
                          : "border-border text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4 mx-auto mb-1 text-emerald-600" />
                      Approve & Advance
                    </button>

                    <button
                      type="button"
                      onClick={() => setReviewAction("QUERY")}
                      className={`p-2.5 rounded-lg border text-center font-semibold transition-all ${
                        reviewAction === "QUERY"
                          ? "border-amber-500 bg-amber-50 text-amber-900 dark:bg-amber-950 dark:text-amber-200 ring-2 ring-amber-500/20"
                          : "border-border text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      <AlertTriangle className="w-4 h-4 mx-auto mb-1 text-amber-600" />
                      Raise Query
                    </button>

                    <button
                      type="button"
                      onClick={() => setReviewAction("REJECT")}
                      className={`p-2.5 rounded-lg border text-center font-semibold transition-all ${
                        reviewAction === "REJECT"
                          ? "border-rose-500 bg-rose-50 text-rose-900 dark:bg-rose-950 dark:text-rose-200 ring-2 ring-rose-500/20"
                          : "border-border text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      <XCircle className="w-4 h-4 mx-auto mb-1 text-rose-600" />
                      Reject Documents
                    </button>
                  </div>
                </div>

                {/* Findings & Remarks */}
                <div>
                  <label className="block font-semibold text-foreground mb-1">
                    Compliance Officer Scrutiny Notes & Remarks <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={reviewComments}
                    onChange={(e) => setReviewComments(e.target.value)}
                    placeholder={
                      reviewAction === "QUERY"
                        ? "Detail specific findings (e.g. 'Page 3 requires structural engineer certification stamp')..."
                        : "Enter approval comments and statutory verification reference..."
                    }
                    className="w-full px-3 py-2 border rounded-lg bg-background text-xs"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setSelectedCase(null)}
                    className="px-3.5 py-1.5 border rounded-lg text-muted-foreground hover:bg-muted"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingReview}
                    className="px-4 py-1.5 bg-primary text-primary-foreground font-semibold rounded-lg shadow-sm disabled:opacity-50"
                  >
                    {submittingReview ? "Submitting..." : "Submit Scrutiny Determination"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </AdminShell>
  );
}
