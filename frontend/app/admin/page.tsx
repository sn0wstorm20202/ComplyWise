"use client";
import Overlay from "@/components/product/Overlay";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { AdminShell } from "@/components/AdminShell";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import ErrorState from "@/components/ErrorState";
import { api } from "@/lib/api";
import type { AdminCasesSummary, Business, ComplianceCaseDetail, ComplianceCaseItem } from "@/types";
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
  Layers,
  Mail,
  MapPin,
  RefreshCw,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  User,
  UserCheck,
  XCircle,
  Zap,
} from "lucide-react";

export default function AdminControlRoomPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<AdminCasesSummary | null>(null);
  const [queueCases, setQueueCases] = useState<ComplianceCaseItem[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [priorityFilter, setPriorityFilter] = useState<string>("ALL");

  // Quick Review Modal State
  const [selectedCase, setSelectedCase] = useState<ComplianceCaseDetail | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [reviewAction, setReviewAction] = useState<"APPROVE" | "QUERY" | "REJECT">("APPROVE");
  const [reviewComments, setReviewComments] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    loadControlRoomData();
  }, []);

  async function loadControlRoomData() {
    setLoading(true);
    setError(null);
    try {
      const [sumRes, queueRes, bizRes] = await Promise.all([
        api.cases.getAdminSummary(),
        api.cases.getAdminReviewQueue(),
        api.businesses.getAdminBusinesses().catch(() => ({ total_count: 0, businesses: [] })),
      ]);
      setSummary(sumRes);
      setQueueCases(queueRes.cases || []);
      setBusinesses(bizRes.businesses || []);
    } catch (err: any) {
      setError(err?.message || "Failed to load admin compliance control room.");
    } finally {
      setLoading(false);
    }
  }

  function copyBusinessId(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  async function openQuickReviewModal(caseId: string) {
    setModalLoading(true);
    try {
      const detail = await api.cases.getCase(caseId);
      setSelectedCase(detail);
      setReviewAction("APPROVE");
      setReviewComments("");
    } catch (err: any) {
      setError(err?.message || "Could not retrieve case details.");
    } finally {
      setModalLoading(false);
    }
  }

  async function handleExecuteReview(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedCase) return;

    const sub = selectedCase.document_requirements.find((d) => d.latest_submission)?.latest_submission;
    if (!sub && reviewAction === "APPROVE") {
      alert("No document submission found to approve on this case.");
      return;
    }

    setSubmittingReview(true);
    try {
      if (reviewAction === "APPROVE") {
        await api.cases.adminApprove(selectedCase.id, reviewComments, sub?.id);
      } else if (reviewAction === "QUERY") {
        await api.cases.adminQuery(selectedCase.id, reviewComments, "Please upload corrected document.", sub?.id);
      } else {
        await api.cases.adminReject(selectedCase.id, reviewComments, sub?.id);
      }

      setActionSuccessMsg(`Review successfully executed: ${reviewAction}.`);
      await loadControlRoomData();
      setTimeout(() => {
        setSelectedCase(null);
        setActionSuccessMsg(null);
      }, 1200);
    } catch (err: any) {
      setError(err?.message || "Failed to execute review action.");
    } finally {
      setSubmittingReview(false);
    }
  }

  const filteredQueue = queueCases.filter((c) => {
    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        c.requirement_name.toLowerCase().includes(q) ||
        c.case_number.toLowerCase().includes(q) ||
        (c.business_name && c.business_name.toLowerCase().includes(q)) ||
        c.authority.toLowerCase().includes(q);
      if (!matchesSearch) return false;
    }

    // Status filter
    if (statusFilter !== "ALL" && c.status_code !== statusFilter) {
      return false;
    }

    // Priority filter
    if (priorityFilter !== "ALL" && c.priority !== priorityFilter) {
      return false;
    }

    return true;
  });

  return (
    <AdminShell activeTab="dashboard">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Control Room Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/60 pb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[var(--ui-sage-soft)] text-[var(--ui-sage)] dark:bg-[var(--ui-sage)]/70 dark:text-[var(--ui-sage)]">
                Compliance Officer Portal
              </span>
              <span className="text-xs text-muted-foreground font-mono">Control Room &bull; Live Operations</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground mt-1">
              Compliance review
            </h1>
            <p className="text-sm text-muted-foreground mt-1 max-w-3xl">
              Platform-wide regulatory oversight. Monitor user declarations, inspect profile versions, scrutinize uploaded statutory evidence, and issue official determinations.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadControlRoomData}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border bg-background hover:bg-muted text-xs font-semibold transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>

            <Link
              href="/admin/businesses"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[var(--ui-sage)] hover:bg-[var(--ui-sage)] text-white text-xs font-semibold shadow-sm transition-colors"
            >
              <Building2 className="w-3.5 h-3.5" />
              Businesses & Profile Versions
            </Link>
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

        {/* Global Loading / Error State */}
        {loading && <LoadingSkeleton count={6} />}
        {error && <ErrorState message={error} onRetry={loadControlRoomData} />}

        {!loading && !error && (
          <>
            {/* KPI Executive Summary Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {/* Human Review Needed */}
              <div className="p-5 rounded-2xl border border-[var(--ui-sage-soft)] dark:border-[var(--ui-sage-soft)] bg-[var(--ui-sage-faint)]/50 dark:bg-[var(--ui-sage)]/20 shadow-sm relative overflow-hidden">
                <div className="flex items-center justify-between text-[var(--ui-sage)] dark:text-[var(--ui-sage)]">
                  <span className="text-xs font-bold uppercase tracking-wider">Scrutiny Required</span>
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div className="text-3xl font-extrabold text-[var(--ui-sage)] dark:text-[var(--ui-sage-soft)] mt-2">
                  {summary?.in_human_review ?? queueCases.length}
                </div>
                <p className="text-[11px] text-[var(--ui-sage)]/80 dark:text-[var(--ui-sage)] mt-1">
                  Awaiting officer determination
                </p>
                {((summary?.in_human_review ?? queueCases.length) > 0) && (
                  <span className="absolute top-2 right-2 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--ui-sage-soft)] opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--ui-sage)]" />
                  </span>
                )}
              </div>

              {/* Total Active Cases */}
              <div className="p-5 rounded-2xl border border-border bg-card shadow-sm">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-xs font-bold uppercase tracking-wider">Total Platform Cases</span>
                  <Layers className="w-5 h-5 text-primary" />
                </div>
                <div className="text-3xl font-extrabold text-foreground mt-2">
                  {summary?.total_cases ?? 0}
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">Across all onboarded businesses</p>
              </div>

              {/* Queries Raised */}
              <div className="p-5 rounded-2xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/40 dark:bg-amber-950/10 shadow-sm">
                <div className="flex items-center justify-between text-amber-700 dark:text-amber-400">
                  <span className="text-xs font-bold uppercase tracking-wider">Queries Out</span>
                  <Clock className="w-5 h-5" />
                </div>
                <div className="text-3xl font-extrabold text-amber-900 dark:text-amber-100 mt-2">
                  {summary?.queries_awaiting ?? 0}
                </div>
                <p className="text-[11px] text-amber-700/80 dark:text-amber-400 mt-1">Pending user re-submission</p>
              </div>

              {/* Government Portal Scrutiny */}
              <div className="p-5 rounded-2xl border border-[var(--ui-sage-soft)] dark:border-[var(--ui-sage-soft)]/60 bg-[var(--ui-info-soft)]/40 dark:bg-[var(--ui-text)]/10 shadow-sm">
                <div className="flex items-center justify-between text-[var(--ui-info)] dark:text-[var(--ui-info)]">
                  <span className="text-xs font-bold uppercase tracking-wider">Govt Processing</span>
                  <ExternalLink className="w-5 h-5" />
                </div>
                <div className="text-3xl font-extrabold text-[var(--ui-info)] dark:text-[var(--ui-info-soft)] mt-2">
                  {summary?.external_processing ?? 0}
                </div>
                <p className="text-[11px] text-[var(--ui-info)]/80 dark:text-[var(--ui-info)] mt-1">Active external portal status</p>
              </div>

              {/* Completed Cases */}
              <div className="p-5 rounded-2xl border border-[var(--ui-sage-soft)] dark:border-[var(--ui-sage-soft)]/60 bg-[var(--ui-sage-faint)]/40 dark:bg-[var(--ui-sage)]/10 shadow-sm">
                <div className="flex items-center justify-between text-[var(--ui-sage)] dark:text-[var(--ui-sage)]">
                  <span className="text-xs font-bold uppercase tracking-wider">Completed</span>
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div className="text-3xl font-extrabold text-[var(--ui-sage)] dark:text-[var(--ui-sage-soft)] mt-2">
                  {summary?.completed_cases ?? 0}
                </div>
                <p className="text-[11px] text-[var(--ui-sage)]/80 dark:text-[var(--ui-sage)] mt-1">Full statutory approval</p>
              </div>
            </div>

            {/* Business-Wise Enterprises Organization Section */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-[var(--ui-sage)]" />
                    Registered Enterprises &amp; Account Workspaces
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Organized business-wise across all user accounts. Inspect operational profile versions, mandatory compliances, and uploaded documents.
                  </p>
                </div>
                <Link
                  href="/admin/businesses"
                  className="text-xs font-semibold text-[var(--ui-sage)] dark:text-[var(--ui-sage)] hover:text-[var(--ui-sage)] dark:hover:text-[var(--ui-sage-soft)] flex items-center gap-1 group"
                >
                  <span>View All Enterprises ({businesses.length})</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>

              {businesses.length === 0 ? (
                <div className="p-8 text-center rounded-2xl border border-dashed border-border bg-card">
                  <p className="text-xs text-muted-foreground">No registered businesses found in the platform.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {businesses.slice(0, 6).map((b) => {
                    const ownerEmail = (b as any).owner_email;
                    const ownerName = (b as any).owner_name;
                    const casesCount = (b as any).cases_count ?? 0;
                    const docsCount = (b as any).documents_count ?? 0;
                    const pendingReviews = (b as any).pending_reviews_count ?? 0;

                    return (
                      <div
                        key={b.id}
                        className="rounded-2xl border border-border bg-card p-5 hover:border-[var(--ui-sage-soft)] dark:hover:border-[var(--ui-sage-soft)] transition-all shadow-sm flex flex-col justify-between space-y-4 group"
                      >
                        <div>
                          {/* Business Header & Type */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-muted px-2 py-0.5 rounded">
                                {b.legal_structure?.replace(/_/g, " ") || b.business_type || "Enterprise"}
                              </span>
                              <h3 className="font-bold text-foreground text-sm mt-1.5 line-clamp-1 group-hover:text-[var(--ui-sage)] dark:group-hover:text-[var(--ui-sage)] transition-colors">
                                {b.name}
                              </h3>
                            </div>
                            <span className="text-[10px] font-bold text-[var(--ui-sage)] dark:text-[var(--ui-sage)] bg-[var(--ui-sage-soft)] dark:bg-[var(--ui-sage)]/60 px-2 py-0.5 rounded shrink-0">
                              Profile v{b.current_profile_version || b.profile_version || 1}
                            </span>
                          </div>

                          {/* Business ID Box */}
                          <div className="mt-3 p-2 rounded-xl bg-muted/50 border border-border/60 flex items-center justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <span className="text-[9px] uppercase tracking-wider text-muted-foreground block font-bold">
                                Business ID
                              </span>
                              <span className="font-mono text-xs font-semibold text-foreground truncate block select-all">
                                {b.id}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => copyBusinessId(b.id, e)}
                              className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0"
                              title="Copy Business ID"
                            >
                              {copiedId === b.id ? (
                                <Check className="w-3.5 h-3.5 text-[var(--ui-sage)]" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>

                          {/* Account Owner & Location */}
                          <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                            {ownerEmail && (
                              <div className="flex items-center gap-1.5 truncate">
                                <Mail className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
                                <span className="truncate">{ownerEmail}</span>
                                {ownerName && (
                                  <span className="text-[11px] text-muted-foreground/80">({ownerName})</span>
                                )}
                              </div>
                            )}
                            {(b.district || b.state) && (
                              <div className="flex items-center gap-1.5">
                                <MapPin className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
                                <span>{[b.district, b.state].filter(Boolean).join(", ")}</span>
                              </div>
                            )}
                          </div>

                          {/* Compliance & Document Stats */}
                          <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[11px] bg-muted/30 p-2 rounded-xl border border-border/50">
                            <div>
                              <span className="text-muted-foreground block text-[9px] uppercase tracking-wider">Cases</span>
                              <span className="font-bold text-foreground">{casesCount}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground block text-[9px] uppercase tracking-wider">Files</span>
                              <span className="font-bold text-foreground">{docsCount}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground block text-[9px] uppercase tracking-wider">Pending</span>
                              <span className={`font-bold ${pendingReviews > 0 ? "text-[var(--ui-sage)] dark:text-[var(--ui-sage)]" : "text-foreground"}`}>
                                {pendingReviews}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Bottom Link to Dedicated Command Desk */}
                        <div className="pt-3 border-t border-border flex items-center justify-between">
                          <span className="text-[11px] text-muted-foreground">
                            {casesCount > 0 ? "Mandates evaluated" : "Awaiting assessment"}
                          </span>
                          <Link
                            href={`/admin/businesses/${b.id}`}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--ui-sage)] dark:text-[var(--ui-sage)] hover:text-[var(--ui-sage)] dark:hover:text-[var(--ui-sage-soft)] hover:underline"
                          >
                            <span>Open Desk</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Quick Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 rounded-2xl border border-border bg-card">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter by Business, Requirement, Case ID, or Authority..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 bg-background border border-border rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="HUMAN_REVIEW">In Human Review</option>
                  <option value="ACTION_REQUIRED">Action Required (Queried)</option>
                  <option value="OPEN">Open</option>
                  <option value="COMPLETED">Completed</option>
                </select>

                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="px-3 py-2 bg-background border border-border rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="ALL">All Priorities</option>
                  <option value="HIGH">High Priority</option>
                  <option value="MEDIUM">Medium Priority</option>
                  <option value="LOW">Low Priority</option>
                </select>

                <Link
                  href="/admin/cases"
                  className="px-3.5 py-2 rounded-xl border border-border bg-muted/40 hover:bg-muted text-xs font-semibold text-foreground transition-colors flex items-center gap-1.5"
                >
                  <Filter className="w-3.5 h-3.5" />
                  View All Cases
                </Link>
              </div>
            </div>

            {/* Action Queue Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5 text-[var(--ui-sage)]" />
                    Action Required Review Queue
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Cases flagged for human officer scrutiny or awaiting statutory determination
                  </p>
                </div>
                <span className="text-xs font-bold text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
                  {filteredQueue.length} Cases in Queue
                </span>
              </div>

              {filteredQueue.length === 0 ? (
                <div className="p-12 text-center rounded-2xl border border-dashed border-border bg-card space-y-3">
                  <CheckCircle2 className="w-10 h-10 text-[var(--ui-sage)] mx-auto" />
                  <h3 className="text-base font-bold text-foreground">Review Queue Clear</h3>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                    All document submissions have been scrutinized or no pending human review cases match the active filter.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredQueue.map((c) => {
                    const isHigh = c.priority === "HIGH";
                    const isHumanReview = c.status_code === "HUMAN_REVIEW";
                    const isActionReq = c.status_code === "ACTION_REQUIRED";

                    return (
                      <div
                        key={c.id}
                        className="rounded-2xl border border-border bg-card p-5 hover:border-[var(--ui-sage-soft)] dark:hover:border-[var(--ui-sage-soft)] transition-all shadow-sm flex flex-col justify-between space-y-4"
                      >
                        <div>
                          {/* Card Header & Badges */}
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-mono text-[11px] font-bold text-[var(--ui-sage)] dark:text-[var(--ui-sage)] bg-[var(--ui-sage-soft)] dark:bg-[var(--ui-sage)]/60 px-2 py-0.5 rounded">
                                {c.case_number}
                              </span>
                              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-muted px-2 py-0.5 rounded">
                                {c.authority}
                              </span>
                              {isHigh && (
                                <span className="text-[10px] font-bold text-rose-700 bg-rose-100 dark:text-rose-300 dark:bg-rose-950/60 px-2 py-0.5 rounded">
                                  HIGH PRIORITY
                                </span>
                              )}
                            </div>

                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                isHumanReview
                                  ? "bg-[var(--ui-sage-soft)] text-[var(--ui-sage)] dark:bg-[var(--ui-sage)] dark:text-[var(--ui-sage)]"
                                  : isActionReq
                                  ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                                  : "bg-muted text-muted-foreground"
                              }`}
                            >
                              {c.status_code.replace(/_/g, " ")}
                            </span>
                          </div>

                          {/* Requirement & Business Name */}
                          <h3 className="font-bold text-foreground text-sm mt-3 line-clamp-1">
                            {c.requirement_name}
                          </h3>
                          <p className="text-xs font-semibold text-muted-foreground mt-0.5 flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                            {c.business_name || "Enterprise Client"}
                          </p>

                          {/* Evaluated Operational Profile Context */}
                          <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] bg-muted/40 p-2.5 rounded-xl border border-border/60">
                            <div>
                              <span className="text-muted-foreground block text-[9px] uppercase tracking-wider">
                                Evaluated Profile
                              </span>
                              <span className="font-bold text-foreground">
                                Profile v{c.profile_version || 1}
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground block text-[9px] uppercase tracking-wider">
                                Current Step
                              </span>
                              <span className="font-semibold text-foreground line-clamp-1">
                                {c.current_step_name || "Document Scrutiny"}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Card Bottom Controls */}
                        <div className="pt-3 border-t border-border flex items-center justify-between gap-3">
                          <button
                            onClick={() => openQuickReviewModal(c.id)}
                            className="text-xs font-semibold text-[var(--ui-sage)] dark:text-[var(--ui-sage)] hover:text-[var(--ui-sage)] hover:underline flex items-center gap-1"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                            Quick Determination
                          </button>

                          <Link
                            href={`/admin/cases/${c.id}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-foreground text-background hover:bg-foreground/90 text-xs font-semibold transition-colors"
                          >
                            <span>Open Desk</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}

        {/* Quick Review / Scrutiny Modal */}
        {selectedCase && (
          <Overlay open onClose={() => setSelectedCase(null)} title="Review case">
            <div className="bg-card border border-border rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-[var(--ui-sage)]" />
                  <h3 className="font-bold text-sm text-foreground">
                    Direct Scrutiny Determination
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedCase(null)}
                  className="p-1 text-muted-foreground hover:text-foreground rounded-lg"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              {modalLoading ? (
                <div className="py-8 text-center">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[var(--ui-sage)]" />
                  <p className="text-xs text-muted-foreground mt-2">Loading case details...</p>
                </div>
              ) : (
                <form onSubmit={handleExecuteReview} className="space-y-4">
                  <div className="p-3 bg-muted/40 rounded-xl border border-border text-xs space-y-1">
                    <p className="font-bold text-foreground">{selectedCase.requirement_name}</p>
                    <p className="text-muted-foreground">
                      Business: {selectedCase.business_name || "Enterprise Client"} &bull; Case: {selectedCase.case_number}
                    </p>
                    <p className="text-[11px] text-[var(--ui-sage)] dark:text-[var(--ui-sage)] font-semibold">
                      Evaluated Profile: Version v{(selectedCase.business_context as any)?.profile_version || 1}
                    </p>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-foreground block mb-1">
                      Determination Action
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setReviewAction("APPROVE")}
                        className={`py-2 px-3 rounded-lg text-xs font-bold border transition-colors ${
                          reviewAction === "APPROVE"
                            ? "bg-[var(--ui-sage)] text-white border-[var(--ui-sage-soft)]"
                            : "border-border text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => setReviewAction("QUERY")}
                        className={`py-2 px-3 rounded-lg text-xs font-bold border transition-colors ${
                          reviewAction === "QUERY"
                            ? "bg-amber-600 text-white border-amber-600"
                            : "border-border text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        Raise Query
                      </button>
                      <button
                        type="button"
                        onClick={() => setReviewAction("REJECT")}
                        className={`py-2 px-3 rounded-lg text-xs font-bold border transition-colors ${
                          reviewAction === "REJECT"
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
                      Officer Remarks & Audit Notes
                    </label>
                    <textarea
                      rows={3}
                      value={reviewComments}
                      onChange={(e) => setReviewComments(e.target.value)}
                      placeholder={
                        reviewAction === "APPROVE"
                          ? "Verified statutory requirements and uploaded document certificates."
                          : reviewAction === "QUERY"
                          ? "Specify missing stamps, signature discrepancy, or expired validity date..."
                          : "Specify why this application violates statutory regulatory rules..."
                      }
                      className="w-full p-2.5 bg-background border border-border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[var(--ui-sage-soft)]/20"
                      required={reviewAction !== "APPROVE"}
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setSelectedCase(null)}
                      className="px-3.5 py-1.5 border border-border rounded-lg text-xs font-semibold text-muted-foreground hover:bg-muted"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submittingReview}
                      className="px-4 py-1.5 bg-[var(--ui-sage)] hover:bg-[var(--ui-sage)] text-white text-xs font-semibold rounded-lg shadow-sm disabled:opacity-50"
                    >
                      {submittingReview ? "Executing..." : "Confirm Determination"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </Overlay>
        )}
      </div>
    </AdminShell>
  );
}
