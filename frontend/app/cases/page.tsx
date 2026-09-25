"use client";

import React, { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import ErrorState from "@/components/ErrorState";
import { api } from "@/lib/api";
import type { BusinessCasesResponse, ComplianceCaseItem } from "@/types";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileCheck,
  FileText,
  Filter,
  FolderSync,
  HelpCircle,
  Layers,
  RefreshCw,
  Search,
  Shield,
  ShieldAlert,
  UserCheck,
} from "lucide-react";

function CasesContent() {
  const searchParams = useSearchParams();
  const paramBizId = searchParams.get("business_id");

  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<BusinessCasesResponse | null>(null);
  const [filter, setFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [businessId, setBusinessId] = useState<string>("");

  useEffect(() => {
    const bizId =
      paramBizId ||
      (typeof window !== "undefined"
        ? localStorage.getItem("complywise_active_business_id") || "bb0abb9b-409e-405a-bae1-777540bc0907"
        : "bb0abb9b-409e-405a-bae1-777540bc0907");
    setBusinessId(bizId);
    loadCases(bizId);
  }, [paramBizId]);

  async function loadCases(bizId: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await api.cases.getCases(bizId);
      setData(res);
    } catch (err: any) {
      setError(err?.message || "Failed to load compliance cases.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSyncCases() {
    if (!businessId) return;
    setSyncing(true);
    try {
      await api.cases.generateCases(businessId);
      await loadCases(businessId);
    } catch (err: any) {
      setError(err?.message || "Could not generate compliance cases.");
    } finally {
      setSyncing(false);
    }
  }

  const casesList = data?.cases || [];

  const filteredCases = casesList.filter((c) => {
    const matchesFilter =
      filter === "ALL"
        ? true
        : filter === "ACTION_REQUIRED"
        ? c.status_code === "ACTION_REQUIRED"
        : filter === "HUMAN_REVIEW"
        ? c.status_code === "HUMAN_REVIEW"
        : filter === "EXTERNAL_PROCESSING"
        ? c.status_code === "EXTERNAL_PROCESSING"
        : filter === "COMPLETED"
        ? c.status_code === "COMPLETED"
        : true;

    const matchesSearch =
      searchQuery.trim() === "" ||
      c.requirement_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.case_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.authority.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  return (
    <AppShell activeView="workflows">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border/60 pb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                End-to-End Regulatory Engine
              </span>
              <span className="text-xs text-muted-foreground font-mono">Workflow Architecture v2.0</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground mt-1">
              Compliance Cases & Workflows
            </h1>
            <p className="text-sm text-muted-foreground mt-1 max-w-3xl">
              Centralized orchestration of applicable regulatory requirements. Every case coordinates versioned document
              collection, AI precheck, human compliance review, statutory forms, and official government portal tracking.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/documents"
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg border border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            >
              <FileText className="w-4 h-4 text-primary" />
              Statutory Documents Registry
            </Link>
            <button
              onClick={handleSyncCases}
              disabled={syncing}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncing ? "animate-spin" : ""}`} />
              {syncing ? "Syncing..." : "Sync Cases from Engine"}
            </button>
          </div>
        </div>

        {/* Metric Cards */}
        {data && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="p-4 rounded-xl border border-border bg-card shadow-sm">
              <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
                <span>Total Cases</span>
                <Layers className="w-4 h-4 text-blue-500" />
              </div>
              <p className="text-2xl font-bold text-foreground mt-2">{data.total_cases}</p>
              <p className="text-[11px] text-muted-foreground mt-1">Active regulatory tracks</p>
            </div>

            <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-50/40 dark:bg-amber-950/20 shadow-sm">
              <div className="flex items-center justify-between text-amber-700 dark:text-amber-400 text-xs font-medium">
                <span>Action Required</span>
                <AlertTriangle className="w-4 h-4 text-amber-600" />
              </div>
              <p className="text-2xl font-bold text-amber-900 dark:text-amber-300 mt-2">
                {data.status_summary.ACTION_REQUIRED || 0}
              </p>
              <p className="text-[11px] text-amber-700/80 dark:text-amber-400/70 mt-1">Officer queries to resolve</p>
            </div>

            <div className="p-4 rounded-xl border border-blue-500/20 bg-blue-50/40 dark:bg-blue-950/20 shadow-sm">
              <div className="flex items-center justify-between text-blue-700 dark:text-blue-400 text-xs font-medium">
                <span>In Human Review</span>
                <UserCheck className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-blue-900 dark:text-blue-300 mt-2">
                {data.status_summary.HUMAN_REVIEW || 0}
              </p>
              <p className="text-[11px] text-blue-700/80 dark:text-blue-400/70 mt-1">Officer verification pending</p>
            </div>

            <div className="p-4 rounded-xl border border-purple-500/20 bg-purple-50/40 dark:bg-purple-950/20 shadow-sm">
              <div className="flex items-center justify-between text-purple-700 dark:text-purple-400 text-xs font-medium">
                <span>Govt Portal Scrutiny</span>
                <Clock className="w-4 h-4 text-purple-600" />
              </div>
              <p className="text-2xl font-bold text-purple-900 dark:text-purple-300 mt-2">
                {data.status_summary.EXTERNAL_PROCESSING || 0}
              </p>
              <p className="text-[11px] text-purple-700/80 dark:text-purple-400/70 mt-1">Departmental filing tracking</p>
            </div>

            <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-50/40 dark:bg-emerald-950/20 shadow-sm">
              <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-400 text-xs font-medium">
                <span>Compliant / Closed</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-2xl font-bold text-emerald-900 dark:text-emerald-300 mt-2">
                {data.status_summary.COMPLETED || 0}
              </p>
              <p className="text-[11px] text-emerald-700/80 dark:text-emerald-400/70 mt-1">Full statutory clearance</p>
            </div>
          </div>
        )}

        {/* Filter Controls & Search */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-muted/40 p-2.5 rounded-xl border border-border">
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            {[
              { id: "ALL", label: "All Cases" },
              { id: "ACTION_REQUIRED", label: "Action Required" },
              { id: "HUMAN_REVIEW", label: "In Review" },
              { id: "EXTERNAL_PROCESSING", label: "Govt Scrutiny" },
              { id: "COMPLETED", label: "Completed" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  filter === tab.id
                    ? "bg-background text-foreground shadow-sm font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search requirement, authority, case..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-background rounded-lg border border-border focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        {/* Main Content Area */}
        {loading ? (
          <div className="py-12">
            <LoadingSkeleton count={3} />
          </div>
        ) : error ? (
          <ErrorState message={error} onRetry={() => loadCases(businessId)} />
        ) : filteredCases.length === 0 ? (
          <div className="text-center py-16 px-4 rounded-2xl border border-dashed border-border bg-card">
            <FileText className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-foreground">No compliance cases match your filter</h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
              {searchQuery
                ? `No cases found matching "${searchQuery}".`
                : "No cases currently exist in this view. Sync cases from your business evaluation."}
            </p>
            <button
              onClick={handleSyncCases}
              disabled={syncing}
              className="mt-4 inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Generate Compliance Cases
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredCases.map((c) => {
              const statusColor =
                c.status_code === "ACTION_REQUIRED"
                  ? "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300"
                  : c.status_code === "HUMAN_REVIEW"
                  ? "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950 dark:text-blue-300"
                  : c.status_code === "EXTERNAL_PROCESSING"
                  ? "bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950 dark:text-purple-300"
                  : c.status_code === "COMPLETED"
                  ? "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300"
                  : "bg-muted text-muted-foreground border-border";

              const priorityColor =
                c.priority === "HIGH"
                  ? "text-rose-600 bg-rose-50 dark:bg-rose-950/40"
                  : c.priority === "MEDIUM"
                  ? "text-amber-600 bg-amber-50 dark:bg-amber-950/40"
                  : "text-slate-600 bg-slate-50 dark:bg-slate-900";

              return (
                <div
                  key={c.id}
                  className="rounded-xl border border-border bg-card p-5 shadow-sm hover:border-primary/40 hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Top Row: Case Number & Badges */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs font-bold text-muted-foreground tracking-wider">
                        {c.case_number}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${priorityColor}`}>
                          {c.priority} PRIORITY
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${statusColor}`}>
                          {c.status_code.replace(/_/g, " ")}
                        </span>
                      </div>
                    </div>

                    {/* Requirement Title */}
                    <h3 className="text-base font-bold text-foreground mt-3 line-clamp-2">
                      {c.requirement_name}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5 font-medium flex items-center gap-1">
                      <Shield className="w-3.5 h-3.5 text-primary" />
                      {c.authority} &bull; {c.requirement_id_code}
                    </p>

                    {/* Step progress banner */}
                    <div className="mt-4 p-3 rounded-lg bg-muted/30 border border-border/60">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground font-medium">
                          Workflow Step {c.current_step_number || 1} of 6
                        </span>
                        <span className="font-semibold text-foreground">
                          {c.current_step_name || "Document Collection"}
                        </span>
                      </div>
                      {/* 6-step progress bar */}
                      <div className="w-full bg-border h-1.5 rounded-full mt-2 overflow-hidden flex">
                        {[1, 2, 3, 4, 5, 6].map((num) => {
                          const currentNum = c.current_step_number || 1;
                          const isDone = num < currentNum || c.status_code === "COMPLETED";
                          const isCurrent = num === currentNum && c.status_code !== "COMPLETED";
                          return (
                            <div
                              key={num}
                              className={`h-full flex-1 border-r border-background/20 last:border-0 ${
                                isDone
                                  ? "bg-emerald-500"
                                  : isCurrent
                                  ? "bg-primary animate-pulse"
                                  : "bg-muted"
                              }`}
                            />
                          );
                        })}
                      </div>
                    </div>

                    {/* Documents summary */}
                    <div className="flex items-center justify-between text-xs text-muted-foreground mt-3 pt-3 border-t border-border/50">
                      <span className="flex items-center gap-1">
                        <FileCheck className="w-3.5 h-3.5 text-emerald-500" />
                        Documents: {c.documents_verified_count} / {c.documents_count} Verified
                      </span>
                      <span>Opened {new Date(c.opened_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Action Link */}
                  <div className="mt-5">
                    <Link
                      href={`/cases/${c.id}`}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-foreground text-background text-xs font-semibold hover:bg-foreground/90 transition-colors shadow-sm"
                    >
                      Open Case Workspace
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}

export default function CasesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-muted-foreground">Loading compliance cases...</div>}>
      <CasesContent />
    </Suspense>
  );
}
