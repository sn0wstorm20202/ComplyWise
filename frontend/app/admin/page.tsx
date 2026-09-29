"use client";

import React, { useEffect, useState, useCallback, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AdminShell } from "@/components/AdminShell";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import ErrorState from "@/components/ErrorState";
import { api } from "@/lib/api";
import type {
  AdminCasesSummary,
  AdminScrutinyData,
  Business,
  ComplianceCaseDetail,
  ComplianceCaseItem,
} from "@/types";

// Modular Admin Tab Components
import { AdminOverviewTab } from "@/components/admin/AdminOverviewTab";
import { AdminComplianceScrutinyTab } from "@/components/admin/AdminComplianceScrutinyTab";
import { AdminSchemesTab } from "@/components/admin/AdminSchemesTab";
import { AdminStandardsTab } from "@/components/admin/AdminStandardsTab";
import { AdminDocumentsTab } from "@/components/admin/AdminDocumentsTab";
import { AdminWorkflowsTab } from "@/components/admin/AdminWorkflowsTab";
import { AdminCalendarTab } from "@/components/admin/AdminCalendarTab";
import { AdminFactProvenanceTab } from "@/components/admin/AdminFactProvenanceTab";

import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  Eye,
  FileCheck,
  FileText,
  GitPullRequest,
  Layers,
  MapPin,
  RefreshCw,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  User,
  XCircle,
  Award,
  Gift,
  Database,
} from "lucide-react";

export type AdminTabType =
  | "overview"
  | "compliance"
  | "schemes"
  | "standards"
  | "documents"
  | "workflows"
  | "calendar"
  | "provenance";

function AdminControlRoomContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const businessId = searchParams?.get("business_id") || null;
  const assessmentId = searchParams?.get("assessment_id") || null;
  const currentTab = (searchParams?.get("tab") as AdminTabType) || "overview";

  // State when no business is selected (Global Control Room)
  const [globalLoading, setGlobalLoading] = useState(true);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [summary, setSummary] = useState<AdminCasesSummary | null>(null);
  const [queueCases, setQueueCases] = useState<ComplianceCaseItem[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [businessSearchQuery, setBusinessSearchQuery] = useState("");

  // Quick Review Modal State for Global Queue
  const [selectedCase, setSelectedCase] = useState<ComplianceCaseDetail | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [reviewAction, setReviewAction] = useState<"APPROVE" | "QUERY" | "REJECT">("APPROVE");
  const [reviewComments, setReviewComments] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  // State when a business IS selected (Business Scrutiny Cockpit)
  const [scrutinyLoading, setScrutinyLoading] = useState(false);
  const [scrutinyError, setScrutinyError] = useState<string | null>(null);
  const [scrutinyData, setScrutinyData] = useState<AdminScrutinyData | null>(null);

  // Load global data if no business is selected
  useEffect(() => {
    if (!businessId) {
      loadGlobalData();
    }
  }, [businessId]);

  // Load scrutiny data when businessId or assessmentId changes
  useEffect(() => {
    if (businessId) {
      loadScrutinyData(businessId, assessmentId);
    }
  }, [businessId, assessmentId]);

  async function loadGlobalData() {
    setGlobalLoading(true);
    setGlobalError(null);
    try {
      const [sumRes, queueRes, bizRes] = await Promise.all([
        api.cases.getAdminSummary().catch(() => null),
        api.cases.getAdminReviewQueue().catch(() => ({ queue_count: 0, cases: [] })),
        api.businesses.getAdminBusinesses().catch(() => ({ total_count: 0, businesses: [] })),
      ]);
      setSummary(sumRes);
      setQueueCases(queueRes.cases || []);
      setBusinesses(bizRes.businesses || []);
    } catch (err: any) {
      setGlobalError(err?.message || "Failed to load admin control room data.");
    } finally {
      setGlobalLoading(false);
    }
  }

  const loadScrutinyData = useCallback(async (bId: string, aId?: string | null) => {
    setScrutinyLoading(true);
    setScrutinyError(null);
    try {
      const data = await api.businesses.getAdminBusinessOverview(bId, aId || undefined);
      setScrutinyData(data);
    } catch (err: any) {
      setScrutinyError(
        err?.message || "Failed to retrieve compliance scrutiny data for this business."
      );
    } finally {
      setScrutinyLoading(false);
    }
  }, []);

  function handleTabChange(newTab: string) {
    const params = new URLSearchParams(searchParams?.toString() || "");
    params.set("tab", newTab);
    router.push(`/admin?${params.toString()}`);
  }

  function handleSelectBusiness(bId: string | null) {
    if (bId) {
      router.push(`/admin?business_id=${bId}&tab=overview`);
    } else {
      router.push("/admin");
    }
  }

  function handleSelectAssessment(aId: string | null) {
    if (!businessId) return;
    const params = new URLSearchParams(searchParams?.toString() || "");
    if (aId) {
      params.set("assessment_id", aId);
    } else {
      params.delete("assessment_id");
    }
    router.push(`/admin?${params.toString()}`);
  }

  async function openQuickReviewModal(caseId: string) {
    setModalLoading(true);
    try {
      const detail = await api.cases.getCase(caseId);
      setSelectedCase(detail);
      setReviewAction("APPROVE");
      setReviewComments("");
    } catch (err: any) {
      alert(err?.message || "Could not retrieve case details.");
    } finally {
      setModalLoading(false);
    }
  }

  async function handleExecuteGlobalReview(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedCase) return;

    setSubmittingReview(true);
    try {
      if (reviewAction === "APPROVE") {
        await api.cases.adminApprove(selectedCase.id, reviewComments);
      } else if (reviewAction === "QUERY") {
        await api.cases.adminQuery(
          selectedCase.id,
          reviewComments || "Discrepancy identified in statutory filing.",
          "Please re-upload compliant documentation."
        );
      } else {
        await api.cases.adminReject(selectedCase.id, reviewComments || "Filing rejected.");
      }
      setSelectedCase(null);
      loadGlobalData();
    } catch (err: any) {
      alert(err?.message || "Failed to commit review action.");
    } finally {
      setSubmittingReview(false);
    }
  }

  // Filtered enterprises for global directory
  const filteredBusinesses = businesses.filter((b) => {
    const q = businessSearchQuery.toLowerCase();
    return (
      !businessSearchQuery ||
      b.name.toLowerCase().includes(q) ||
      (b.state && b.state.toLowerCase().includes(q)) ||
      (b.owner_email && b.owner_email.toLowerCase().includes(q))
    );
  });

  return (
    <AdminShell
      activeBusinessId={businessId}
      activeAssessmentId={assessmentId}
      currentBusinessName={scrutinyData?.business.name}
      assessments={scrutinyData?.assessments || []}
      onSelectBusiness={handleSelectBusiness}
      onSelectAssessment={handleSelectAssessment}
    >
      {/* ------------------------------------------------------------- */}
      {/* MODE A: NO BUSINESS SELECTED -> GLOBAL CONTROL ROOM HOME      */}
      {/* ------------------------------------------------------------- */}
      {!businessId ? (
        <div className="space-y-6">
          {/* Welcome & Global Banner */}
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <ShieldCheck className="w-3 h-3 mr-1" />
                    System Operational
                  </span>
                  <span className="text-xs text-slate-500 font-mono">
                    Deterministic Compliance Intelligence
                  </span>
                </div>
                <h1 className="text-2xl font-bold text-[#0F172A]">
                  Admin Scrutiny &amp; Governance Control Room
                </h1>
                <p className="text-sm text-slate-600 mt-1 max-w-3xl">
                  Select a business from the directory below or use the search bar above to launch
                  the 360° Compliance Scrutiny Cockpit, verify cryptographic Engine 2 CIRs, and
                  record statutory dispositions.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={loadGlobalData}
                  disabled={globalLoading}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${globalLoading ? "animate-spin" : ""}`} />
                  <span>Refresh Queue</span>
                </button>
              </div>
            </div>

            {/* Global Metric Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 mt-6 pt-5 border-t border-slate-100">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Total Enterprises
                </div>
                <div className="text-2xl font-bold text-[#0F172A] mt-1">{businesses.length}</div>
                <div className="text-xs text-slate-500 mt-0.5">Enrolled businesses</div>
              </div>

              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <div className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider">
                  Pending Scrutiny
                </div>
                <div className="text-2xl font-bold text-amber-700 mt-1">
                  {summary?.pending_review_count ?? queueCases.length}
                </div>
                <div className="text-xs text-amber-700/80 mt-0.5">Awaiting officer review</div>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <div className="text-[11px] font-semibold text-blue-700 uppercase tracking-wider">
                  Total Workflow Cases
                </div>
                <div className="text-2xl font-bold text-blue-700 mt-1">
                  {summary?.total_cases ?? 0}
                </div>
                <div className="text-xs text-blue-700/80 mt-0.5">Across all tenants</div>
              </div>

              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                <div className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">
                  Completed / Approved
                </div>
                <div className="text-2xl font-bold text-emerald-700 mt-1">
                  {summary?.approved_count ?? 0}
                </div>
                <div className="text-xs text-emerald-700/80 mt-0.5">Statutory approvals</div>
              </div>
            </div>
          </div>

          {globalLoading ? (
            <LoadingSkeleton count={3} />
          ) : globalError ? (
            <ErrorState title="Control Room Error" message={globalError} onRetry={loadGlobalData} />
          ) : (
            <>
              {/* Enterprise Directory Section */}
              <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-sm p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-bold text-[#0F172A]">
                      Select an Enterprise for Scrutiny
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Choose an enterprise to examine Engine 2 AST traces, statutory evidence, and
                      filing dossiers.
                    </p>
                  </div>

                  <div className="relative w-full sm:w-80">
                    <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search enterprise name, state, owner..."
                      value={businessSearchQuery}
                      onChange={(e) => setBusinessSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-[#18181B] rounded-xl text-xs transition-all focus:outline-none focus:ring-1 focus:ring-[#18181B]"
                    />
                  </div>
                </div>

                {filteredBusinesses.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200">
                    <p className="text-xs text-slate-500 font-medium">
                      No businesses found matching &quot;{businessSearchQuery}&quot;.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                    {filteredBusinesses.map((b) => (
                      <div
                        key={b.id}
                        onClick={() => handleSelectBusiness(b.id)}
                        className="p-4 rounded-xl border border-slate-200 bg-white hover:border-[#18181B] hover:shadow-sm cursor-pointer transition-all flex flex-col justify-between group"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <span className="font-mono text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                              {b.id.slice(0, 8)}...
                            </span>
                            {b.state && (
                              <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <MapPin className="w-2.5 h-2.5" />
                                {b.state}
                              </span>
                            )}
                          </div>

                          <h3 className="text-sm font-bold text-[#0F172A] group-hover:text-blue-600 transition-colors line-clamp-1">
                            {b.name}
                          </h3>

                          <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                            <User className="w-3 h-3 text-slate-400" />
                            <span className="truncate">{b.owner_email || "System Tenant"}</span>
                          </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                          <span className="text-slate-400 font-mono text-[11px]">
                            Profile v{b.active_profile_version_number || b.current_profile_version || 1}
                          </span>
                          <span className="font-semibold text-slate-800 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                            <span>Open Cockpit</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Review Queue Table */}
              <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-sm p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-[#0F172A]">
                      High-Priority Officer Review Queue
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Filings requiring immediate human officer scrutiny or query response.
                    </p>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                    {queueCases.length} In Queue
                  </span>
                </div>

                {queueCases.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                    <h3 className="text-xs font-bold text-[#0F172A]">Review Queue Clear</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      No statutory filings are currently awaiting administrative scrutiny.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50/75 border-b border-[#E2E8F0] text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                          <th className="py-3 px-3">Case #</th>
                          <th className="py-3 px-3">Business</th>
                          <th className="py-3 px-3">Requirement</th>
                          <th className="py-3 px-3">Status</th>
                          <th className="py-3 px-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E2E8F0]">
                        {queueCases.slice(0, 8).map((c) => (
                          <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="py-3 px-3 font-mono font-semibold text-[#0F172A]">
                              {c.case_number}
                            </td>
                            <td className="py-3 px-3 font-medium text-slate-800">
                              {c.business_name || "Enterprise"}
                            </td>
                            <td className="py-3 px-3 max-w-xs truncate text-slate-600">
                              {c.requirement_name}
                            </td>
                            <td className="py-3 px-3">
                              <span className="inline-flex items-center text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                                <Clock className="w-3 h-3 mr-1" />
                                {c.status_code}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-right">
                              <button
                                onClick={() => openQuickReviewModal(c.id)}
                                className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-[#18181B] text-white hover:bg-[#27272A] transition-colors"
                              >
                                Scrutinize
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Quick Review Modal */}
          {selectedCase && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-mono text-xs font-bold text-slate-500">
                      {selectedCase.case_number}
                    </span>
                    <h3 className="text-base font-bold text-[#0F172A] mt-0.5">
                      Statutory Review Scrutiny
                    </h3>
                  </div>
                  <button
                    onClick={() => setSelectedCase(null)}
                    className="text-slate-400 hover:text-slate-600 text-sm font-semibold"
                  >
                    ✕
                  </button>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1">
                  <div className="font-semibold text-slate-800">
                    {selectedCase.requirement_name}
                  </div>
                  <div className="text-slate-500">{selectedCase.authority}</div>
                </div>

                <form onSubmit={handleExecuteGlobalReview} className="space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setReviewAction("APPROVE")}
                      className={`py-2 px-3 rounded-xl text-xs font-semibold border ${
                        reviewAction === "APPROVE"
                          ? "bg-emerald-600 text-white border-emerald-600"
                          : "bg-white text-slate-700 border-slate-200"
                      }`}
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => setReviewAction("QUERY")}
                      className={`py-2 px-3 rounded-xl text-xs font-semibold border ${
                        reviewAction === "QUERY"
                          ? "bg-amber-600 text-white border-amber-600"
                          : "bg-white text-slate-700 border-slate-200"
                      }`}
                    >
                      Query
                    </button>
                    <button
                      type="button"
                      onClick={() => setReviewAction("REJECT")}
                      className={`py-2 px-3 rounded-xl text-xs font-semibold border ${
                        reviewAction === "REJECT"
                          ? "bg-rose-600 text-white border-rose-600"
                          : "bg-white text-slate-700 border-slate-200"
                      }`}
                    >
                      Reject
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Scrutiny Remarks
                    </label>
                    <textarea
                      rows={3}
                      value={reviewComments}
                      onChange={(e) => setReviewComments(e.target.value)}
                      placeholder="Record mandatory reason or approval notes..."
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-[#18181B]"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setSelectedCase(null)}
                      className="px-3 py-2 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submittingReview}
                      className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#18181B] text-white hover:bg-[#27272A] disabled:opacity-50"
                    >
                      {submittingReview ? "Recording..." : `Confirm ${reviewAction}`}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* ------------------------------------------------------------- */
        /* MODE B: BUSINESS SELECTED -> 360° SCRUTINY COCKPIT            */
        /* ------------------------------------------------------------- */
        <div className="space-y-6">
          {scrutinyLoading && !scrutinyData ? (
            <LoadingSkeleton count={4} />
          ) : scrutinyError ? (
            <ErrorState
              title="Scrutiny Data Load Error"
              message={scrutinyError}
              onRetry={() => loadScrutinyData(businessId, assessmentId)}
            />
          ) : scrutinyData ? (
            <>
              {/* Business Cockpit Header */}
              <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                        TENANT: {scrutinyData.business.id.slice(0, 8)}
                      </span>
                      {scrutinyData.business.primary_state && (
                        <span className="inline-flex items-center text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full">
                          <MapPin className="w-3 h-3 mr-1 text-slate-400" />
                          {scrutinyData.business.primary_state}
                        </span>
                      )}
                      {scrutinyData.business.incorporation_type && (
                        <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                          {scrutinyData.business.incorporation_type}
                        </span>
                      )}
                      {scrutinyData.cir_is_valid && (
                        <span className="inline-flex items-center text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <ShieldCheck className="w-3 h-3 mr-1" />
                          HMAC CIR Verified
                        </span>
                      )}
                    </div>

                    <h1 className="text-2xl font-bold text-[#0F172A]">
                      {scrutinyData.business.name}
                    </h1>

                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-3">
                      <span>Owner: {scrutinyData.business.owner_email || "System User"}</span>
                      <span>•</span>
                      <span>
                        Profile Snapshot v{scrutinyData.profile.version_number} (
                        {scrutinyData.profile.change_note})
                      </span>
                      {scrutinyData.decision_run && (
                        <>
                          <span>•</span>
                          <span className="font-mono">
                            Decision Run: {scrutinyData.decision_run.id.slice(0, 8)}
                          </span>
                        </>
                      )}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/dashboard?business_id=${scrutinyData.business.id}`}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>User Dashboard</span>
                    </Link>
                    <button
                      onClick={() => loadScrutinyData(businessId, assessmentId)}
                      disabled={scrutinyLoading}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                    >
                      <RefreshCw
                        className={`w-3.5 h-3.5 ${scrutinyLoading ? "animate-spin" : ""}`}
                      />
                      <span>Refresh</span>
                    </button>
                  </div>
                </div>

                {/* Tab Navigation Pill Bar */}
                <div className="flex items-center gap-1.5 mt-6 pt-5 border-t border-slate-100 overflow-x-auto">
                  <button
                    onClick={() => handleTabChange("overview")}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 ${
                      currentTab === "overview"
                        ? "bg-[#18181B] text-white shadow-sm"
                        : "bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  >
                    <Shield className="w-3.5 h-3.5" />
                    <span>Control Room Overview</span>
                  </button>

                  <button
                    onClick={() => handleTabChange("compliance")}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 ${
                      currentTab === "compliance"
                        ? "bg-[#18181B] text-white shadow-sm"
                        : "bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Engine 2 Scrutiny</span>
                    <span className="font-mono text-[10px] ml-1 px-1.5 py-0.2 rounded bg-indigo-500/20">
                      {scrutinyData.engine2_results.length}
                    </span>
                  </button>

                  <button
                    onClick={() => handleTabChange("schemes")}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 ${
                      currentTab === "schemes"
                        ? "bg-[#18181B] text-white shadow-sm"
                        : "bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  >
                    <Gift className="w-3.5 h-3.5" />
                    <span>Subsidies &amp; Schemes</span>
                    <span className="font-mono text-[10px] ml-1 px-1.5 py-0.2 rounded bg-slate-200 text-slate-700">
                      {scrutinyData.schemes.length}
                    </span>
                  </button>

                  <button
                    onClick={() => handleTabChange("standards")}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 ${
                      currentTab === "standards"
                        ? "bg-[#18181B] text-white shadow-sm"
                        : "bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  >
                    <Award className="w-3.5 h-3.5" />
                    <span>Standards &amp; QCOs</span>
                    <span className="font-mono text-[10px] ml-1 px-1.5 py-0.2 rounded bg-slate-200 text-slate-700">
                      {scrutinyData.standards.length}
                    </span>
                  </button>

                  <button
                    onClick={() => handleTabChange("documents")}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 ${
                      currentTab === "documents"
                        ? "bg-[#18181B] text-white shadow-sm"
                        : "bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  >
                    <FileCheck className="w-3.5 h-3.5" />
                    <span>Document Verification</span>
                    <span className="font-mono text-[10px] ml-1 px-1.5 py-0.2 rounded bg-slate-200 text-slate-700">
                      {scrutinyData.uploaded_documents.length}
                    </span>
                  </button>

                  <button
                    onClick={() => handleTabChange("workflows")}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 ${
                      currentTab === "workflows"
                        ? "bg-[#18181B] text-white shadow-sm"
                        : "bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  >
                    <GitPullRequest className="w-3.5 h-3.5" />
                    <span>Cases &amp; Filings</span>
                    <span className="font-mono text-[10px] ml-1 px-1.5 py-0.2 rounded bg-slate-200 text-slate-700">
                      {scrutinyData.compliance_cases.length}
                    </span>
                  </button>

                  <button
                    onClick={() => handleTabChange("calendar")}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 ${
                      currentTab === "calendar"
                        ? "bg-[#18181B] text-white shadow-sm"
                        : "bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Statutory Calendar</span>
                  </button>

                  <button
                    onClick={() => handleTabChange("provenance")}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 ${
                      currentTab === "provenance"
                        ? "bg-[#18181B] text-white shadow-sm"
                        : "bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  >
                    <Database className="w-3.5 h-3.5" />
                    <span>Fact Provenance</span>
                  </button>
                </div>
              </div>

              {/* Render Active Tab Content */}
              {currentTab === "overview" && (
                <AdminOverviewTab
                  data={scrutinyData}
                  onNavigateTab={handleTabChange}
                  onRefresh={() => loadScrutinyData(businessId, assessmentId)}
                />
              )}

              {currentTab === "compliance" && (
                <AdminComplianceScrutinyTab
                  data={scrutinyData}
                  onRefresh={() => loadScrutinyData(businessId, assessmentId)}
                />
              )}

              {currentTab === "schemes" && <AdminSchemesTab data={scrutinyData} />}

              {currentTab === "standards" && <AdminStandardsTab data={scrutinyData} />}

              {currentTab === "documents" && (
                <AdminDocumentsTab
                  data={scrutinyData}
                  onRefresh={() => loadScrutinyData(businessId, assessmentId)}
                />
              )}

              {currentTab === "workflows" && (
                <AdminWorkflowsTab
                  data={scrutinyData}
                  onRefresh={() => loadScrutinyData(businessId, assessmentId)}
                />
              )}

              {currentTab === "calendar" && (
                <AdminCalendarTab
                  data={scrutinyData}
                  onRefresh={() => loadScrutinyData(businessId, assessmentId)}
                />
              )}

              {currentTab === "provenance" && <AdminFactProvenanceTab data={scrutinyData} />}
            </>
          ) : null}
        </div>
      )}
    </AdminShell>
  );
}

export default function AdminControlRoomPage() {
  return (
    <Suspense fallback={<LoadingSkeleton count={3} />}>
      <AdminControlRoomContent />
    </Suspense>
  );
}
