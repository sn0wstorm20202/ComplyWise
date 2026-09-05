"use client";

import React, { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import StatusBadge from "@/components/StatusBadge";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import ErrorState from "@/components/ErrorState";
import { api } from "@/lib/api";
import { ComplianceRequirementItem, ApplicabilityStatus } from "@/types";

function ComplianceContent() {
  const searchParams = useSearchParams();
  const paramBusinessId = searchParams.get("business_id");

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [requirements, setRequirements] = useState<ComplianceRequirementItem[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [businessId, setBusinessId] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");

  async function loadRequirements(bizId: string) {
    setLoading(true);
    setError(null);
    try {
      const resp = await api.compliance.list(bizId, {
        status: statusFilter || undefined,
        category: categoryFilter || undefined,
      });
      setRequirements(resp.requirements);
      setTotalCount(resp.count);
      setBusinessId(bizId);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load compliance requirements.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    async function init() {
      const bizId =
        paramBusinessId ||
        localStorage.getItem("complywise_active_business_id") ||
        "";

      if (bizId) {
        await loadRequirements(bizId);
      } else {
        // Try fetching first business
        try {
          const list = await api.businesses.list();
          if (list.length > 0) {
            await loadRequirements(list[0].id);
          } else {
            setLoading(false);
          }
        } catch {
          setLoading(false);
        }
      }
    }
    init();
  }, [paramBusinessId, statusFilter, categoryFilter]);

  const categories = ["ALL", "FOOD", "ENVIRONMENT", "LABOUR", "REGISTRATION"];
  const statuses = [
    "ALL",
    "APPLICABLE",
    "NOT_APPLICABLE",
    "NEEDS_INFORMATION",
    "CONFLICT_REVIEW",
    "UNVERIFIED",
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header Banner */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-indigo-600 tracking-wide uppercase">
                Screen 08 · Statutory Matrix
              </span>
              <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                {totalCount} Total Obligations
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-950 mt-1">
              Compliance Requirements & Obligations
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Deterministic applicability matrix based on registered profile parameters and central/state notifications.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={`/dashboard?business_id=${businessId || ""}`}
              className="rounded-lg border border-slate-300 px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              ← Dashboard
            </Link>
            <Link
              href="/onboarding"
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors shadow-xs"
            >
              + Re-evaluate
            </Link>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Status Filter */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-500 mr-1">Status:</span>
            {statuses.map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st === "ALL" ? "" : st)}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                  (st === "ALL" && !statusFilter) || statusFilter === st
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {st.replace(/_/g, " ")}
              </button>
            ))}
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-500 mr-1">Category:</span>
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat === "ALL" ? "" : cat)}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                  (cat === "ALL" && !categoryFilter) || categoryFilter === cat
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <ErrorState
            title="Compliance Matrix Notice"
            message={error}
            onRetry={() => businessId && loadRequirements(businessId)}
          />
        )}

        {/* Requirements Table / Card List */}
        {loading ? (
          <div className="space-y-4">
            <LoadingSkeleton count={6} className="h-20 w-full" />
          </div>
        ) : requirements.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-xs space-y-3">
            <div className="text-2xl">📋</div>
            <h3 className="text-sm font-bold text-slate-900">
              No Requirements Match Current Filter
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Try adjusting the status or category filters, or run a new evaluation in onboarding.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {requirements.map((req) => (
              <div
                key={req.requirement_id}
                className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs hover:border-indigo-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 max-w-2xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200/60">
                      {req.requirement_id}
                    </span>
                    <span className="text-xs font-semibold text-slate-700">
                      {req.authority}
                    </span>
                    <span className="text-slate-300">·</span>
                    <span className="text-xs text-slate-500">
                      Jurisdiction: {req.jurisdiction}
                    </span>
                    <span className="text-slate-300">·</span>
                    <span className="text-xs font-medium text-slate-500">
                      Domain: {req.category}
                    </span>
                  </div>

                  <h2 className="text-sm font-bold text-slate-900">
                    {req.name}
                  </h2>

                  {req.explanation_reason && (
                    <p className="text-xs text-slate-600">
                      <span className="font-medium text-slate-700">Statutory Trigger:</span>{" "}
                      {req.explanation_reason}
                    </p>
                  )}

                  <div className="flex items-center gap-3 text-[11px] text-slate-400">
                    <span>Evidence: {req.evidence_count} statutory citation(s)</span>
                    {req.matched_rule_id && (
                      <>
                        <span>·</span>
                        <span className="font-mono">Rule: {req.matched_rule_id}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between gap-3 shrink-0">
                  <StatusBadge status={req.status} />

                  <Link
                    href={`/compliance/${req.requirement_id}?business_id=${businessId}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
                  >
                    <span>Full Analysis (4 Questions)</span>
                    <span>→</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default function CompliancePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center text-sm text-slate-500">
          Loading compliance requirements...
        </div>
      }
    >
      <ComplianceContent />
    </Suspense>
  );
}
