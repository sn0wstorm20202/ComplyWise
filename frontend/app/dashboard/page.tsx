"use client";

import React, { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import StatusBadge from "@/components/StatusBadge";
import MetricCard from "@/components/MetricCard";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import ErrorState from "@/components/ErrorState";
import { api } from "@/lib/api";
import { DashboardSummary, Business } from "@/types";

function DashboardContent() {
  const searchParams = useSearchParams();
  const paramBusinessId = searchParams.get("business_id");

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [activeBusinessId, setActiveBusinessId] = useState<string | null>(null);

  async function loadDashboard(bizId: string) {
    setLoading(true);
    setError(null);
    try {
      const data = await api.dashboard.get(bizId);
      setSummary(data);
      setActiveBusinessId(bizId);
      localStorage.setItem("complywise_active_business_id", bizId);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    async function init() {
      setLoading(true);
      try {
        const bizList = await api.businesses.list().catch(() => []);
        setBusinesses(bizList);

        const targetId =
          paramBusinessId ||
          localStorage.getItem("complywise_active_business_id") ||
          (bizList.length > 0 ? bizList[0].id : null);

        if (targetId) {
          await loadDashboard(targetId);
        } else {
          setLoading(false);
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to initialize dashboard.");
        setLoading(false);
      }
    }
    init();
  }, [paramBusinessId]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Top Header & Business Selector */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-indigo-600 tracking-wide uppercase">
                Problem Statement ID: 26130 · Operational Dashboard
              </span>
              <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
                Live Engine
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-950 mt-1">
              {summary ? summary.business_name : "Industrial Compliance Workspace"}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Deterministic regulatory matrix, statutory filing deadlines, and audit trail.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {businesses.length > 1 && (
              <select
                value={activeBusinessId || ""}
                onChange={(e) => loadDashboard(e.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 focus:border-indigo-500 focus:outline-none"
              >
                {businesses.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            )}

            <Link
              href="/onboarding"
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors shadow-xs"
            >
              <span>+ New Assessment</span>
            </Link>
          </div>
        </div>

        {error && (
          <ErrorState
            title="Dashboard Load Notice"
            message={error}
            onRetry={() => activeBusinessId && loadDashboard(activeBusinessId)}
          />
        )}

        {loading ? (
          <div className="space-y-6">
            <LoadingSkeleton count={4} className="h-28 w-full" />
            <LoadingSkeleton count={2} className="h-64 w-full" />
          </div>
        ) : !summary ? (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-xs space-y-4">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 text-2xl font-bold">
              📋
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-slate-950">
                No Active Business Profile Evaluated Yet
              </h2>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Begin by onboarding your enterprise profile, manufacturing processes, and statutory parameters to generate your compliance matrix.
              </p>
            </div>
            <div>
              <Link
                href="/onboarding"
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-indigo-700 transition-colors"
              >
                Launch Onboarding Flow →
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Core Readiness & Metric Cards */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard
                label="Compliance Readiness"
                value={`${summary.readiness.score}%`}
                subtext={`${summary.readiness.compliant_count} of ${summary.readiness.applicable_count} obligations compliant`}
                badge={{
                  text: summary.readiness.status,
                  variant:
                    summary.readiness.status === "HIGH"
                      ? "success"
                      : summary.readiness.status === "MEDIUM"
                      ? "warning"
                      : "neutral",
                }}
              />
              <MetricCard
                label="Action Required"
                value={summary.readiness.action_required_count}
                subtext="Mandatory permits or filings pending"
                badge={{ text: "Urgent", variant: "warning" }}
              />
              <MetricCard
                label="Upcoming Statutory Deadlines"
                value={summary.upcoming_deadlines.length}
                subtext="Filing dates within 90 days"
                badge={{ text: "Calendar", variant: "info" }}
              />
              <MetricCard
                label="Total Requirements Evaluated"
                value={summary.readiness.total_evaluated}
                subtext="Central & State Acts cross-referenced"
                badge={{ text: "Audited", variant: "success" }}
              />
            </section>

            {/* Main Content Grid: Priority Actions & Deadlines */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Priority Actions (2 cols) */}
              <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">
                      Priority Compliance Actions
                    </h2>
                    <p className="text-xs text-slate-500">
                      Immediate statutory items requiring approval or renewal.
                    </p>
                  </div>
                  <Link
                    href={`/compliance?business_id=${activeBusinessId}`}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                  >
                    View All →
                  </Link>
                </div>

                {summary.priority_actions.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-500">
                    No urgent priority actions pending at this time.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {summary.priority_actions.map((act) => (
                      <div
                        key={act.id}
                        className="p-4 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-slate-50 transition-colors space-y-2"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-bold text-indigo-600">
                                {act.authority}
                              </span>
                              <span className="text-slate-300">·</span>
                              <span className="text-xs font-bold text-slate-900">
                                {act.title}
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 mt-1">
                              {act.action_summary}
                            </p>
                          </div>
                          <span
                            className={`shrink-0 inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold border ${
                              act.urgency === "HIGH"
                                ? "bg-rose-50 text-rose-700 border-rose-200"
                                : act.urgency === "MEDIUM"
                                ? "bg-amber-50 text-amber-700 border-amber-200"
                                : "bg-slate-100 text-slate-700 border-slate-200"
                            }`}
                          >
                            {act.urgency} URGENCY
                          </span>
                        </div>
                        <div className="flex justify-end pt-1">
                          <Link
                            href={`/compliance/${act.id}?business_id=${activeBusinessId}`}
                            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                          >
                            Open Obligation Details →
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Statutory Filing Deadlines (1 col) */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">
                      Upcoming Deadlines
                    </h2>
                    <p className="text-xs text-slate-500">
                      Statutory calendar dates.
                    </p>
                  </div>
                  <Link
                    href={`/calendar?business_id=${activeBusinessId}`}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                  >
                    Calendar →
                  </Link>
                </div>

                {summary.upcoming_deadlines.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-500">
                    No statutory deadlines recorded.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {summary.upcoming_deadlines.map((dl) => (
                      <div
                        key={dl.id}
                        className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/60 space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs font-bold text-indigo-600">
                            {dl.due_date}
                          </span>
                          <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                            {dl.status}
                          </span>
                        </div>
                        <div className="text-xs font-semibold text-slate-900">
                          {dl.requirement_name}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Authority: {dl.authority}
                        </div>
                        <div className="text-[11px] text-rose-600 italic">
                          Risk: {dl.penalty_risk}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Quick Navigation Application Surface Grid (Screens 08-15) */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-base font-bold text-slate-900">
                  Compliance Management Modules
                </h2>
                <p className="text-xs text-slate-500">
                  Direct access to specialized statutory and operational surfaces.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
                <Link
                  href={`/compliance?business_id=${activeBusinessId}`}
                  className="p-4 rounded-xl border border-slate-200/70 hover:border-indigo-300 hover:bg-indigo-50/30 transition-all space-y-1"
                >
                  <div className="text-lg">📜</div>
                  <div className="text-xs font-bold text-slate-900">
                    Compliance Matrix
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Filter requirements by authority, category, and status.
                  </div>
                </Link>

                <Link
                  href={`/documents?business_id=${activeBusinessId}`}
                  className="p-4 rounded-xl border border-slate-200/70 hover:border-indigo-300 hover:bg-indigo-50/30 transition-all space-y-1"
                >
                  <div className="text-lg">📁</div>
                  <div className="text-xs font-bold text-slate-900">
                    Statutory Documents
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Manage entity proofs and AI pre-validation checks.
                  </div>
                </Link>

                <Link
                  href={`/workflows?business_id=${activeBusinessId}`}
                  className="p-4 rounded-xl border border-slate-200/70 hover:border-indigo-300 hover:bg-indigo-50/30 transition-all space-y-1"
                >
                  <div className="text-lg">⚡</div>
                  <div className="text-xs font-bold text-slate-900">
                    Approval Workflows
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Track multi-step clearance progression and blockers.
                  </div>
                </Link>

                <Link
                  href={`/calendar?business_id=${activeBusinessId}`}
                  className="p-4 rounded-xl border border-slate-200/70 hover:border-indigo-300 hover:bg-indigo-50/30 transition-all space-y-1"
                >
                  <div className="text-lg">📅</div>
                  <div className="text-xs font-bold text-slate-900">
                    Statutory Calendar
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Never miss annual returns, renewals, or inspection dates.
                  </div>
                </Link>

                <Link
                  href={`/schemes?business_id=${activeBusinessId}`}
                  className="p-4 rounded-xl border border-slate-200/70 hover:border-indigo-300 hover:bg-indigo-50/30 transition-all space-y-1"
                >
                  <div className="text-lg">💰</div>
                  <div className="text-xs font-bold text-slate-900">
                    Schemes & Incentives
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Matched MSME subsidies, capital grants, and Udyam benefits.
                  </div>
                </Link>

                <Link
                  href="/standards"
                  className="p-4 rounded-xl border border-slate-200/70 hover:border-indigo-300 hover:bg-indigo-50/30 transition-all space-y-1"
                >
                  <div className="text-lg">🔍</div>
                  <div className="text-xs font-bold text-slate-900">
                    BIS & Standards Lookup
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Search mandatory quality orders and testing parameters.
                  </div>
                </Link>

                <Link
                  href={`/assistant?business_id=${activeBusinessId}`}
                  className="p-4 rounded-xl border border-slate-200/70 hover:border-indigo-300 hover:bg-indigo-50/30 transition-all space-y-1"
                >
                  <div className="text-lg">🤖</div>
                  <div className="text-xs font-bold text-slate-900">
                    Regulatory Copilot
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Source-grounded legal citations and compliance guidance.
                  </div>
                </Link>

                <Link
                  href="/onboarding"
                  className="p-4 rounded-xl border border-slate-200/70 hover:border-indigo-300 hover:bg-indigo-50/30 transition-all space-y-1"
                >
                  <div className="text-lg">⚙️</div>
                  <div className="text-xs font-bold text-slate-900">
                    Re-run Assessment
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Update variables and re-evaluate compliance rules.
                  </div>
                </Link>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="p-8 text-slate-500 text-sm">Loading dashboard...</div>
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}

