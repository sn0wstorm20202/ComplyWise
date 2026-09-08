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
import { DashboardSummary, Business, DiscoveryStatusData } from "@/types";

function DashboardContent() {
  const searchParams = useSearchParams();
  const paramBusinessId = searchParams.get("business_id");

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [discoveryStatus, setDiscoveryStatus] = useState<DiscoveryStatusData | null>(null);
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

      // Fetch discovery provenance status
      try {
        const disc = await api.discovery.getStatus(bizId);
        setDiscoveryStatus(disc);
      } catch {
        setDiscoveryStatus(null);
      }
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

  // A null metric means "not yet calculated", never 0. Rendering 0 for an
  // unevaluated business would assert that nothing applies to them.
  const metricValue = (n: number | null): string | number =>
    n === null ? "Not yet calculated" : n;

  const determinedCount =
    summary === null
      ? 0
      : (summary.metrics.applicable_count ?? 0) +
        (summary.metrics.not_applicable_count ?? 0);

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
                Deterministic Engine Active
              </span>
              {discoveryStatus && discoveryStatus.latest_run && (
                <span className="inline-flex items-center rounded-md bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700 border border-amber-200">
                  Live Discovery Provenance Linked
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-950 mt-1">
              {summary ? summary.business_name : "Industrial Compliance Workspace"}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Deterministic regulatory matrix, statutory filing deadlines, and live web discovery audit trail.
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
              href="/onboarding?new=true"
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
                href="/onboarding?new=true"
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-indigo-700 transition-colors"
              >
                Launch Onboarding Flow →
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Live Regulatory Discovery Provenance Banner */}
            {discoveryStatus && discoveryStatus.latest_run && (
              <section className="rounded-2xl border border-amber-200/90 bg-gradient-to-r from-amber-50/90 via-amber-50/40 to-slate-50 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">
                      Live Regulatory Discovery (Firecrawl)
                    </span>
                    <span className="inline-flex items-center rounded-full bg-amber-200 px-2 py-0.5 text-[11px] font-bold text-amber-900">
                      Status: {discoveryStatus.latest_run.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700">
                    Discovered and scraped <strong>{discoveryStatus.latest_run.official_source_count} official government portals</strong>.{" "}
                    Extracted <strong>{discoveryStatus.candidate_requirements_count} candidate obligations</strong> safely quarantined as{" "}
                    <span className="font-semibold text-amber-800">UNVERIFIED</span> pending statutory gazette attestation.
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <Link
                    href={`/compliance?business_id=${activeBusinessId}&tab=candidates`}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-amber-700 transition-colors shadow-xs"
                  >
                    <span>Inspect Quarantined Claims ({discoveryStatus.candidate_requirements_count})</span>
                    <span>→</span>
                  </Link>
                </div>
              </section>
            )}

            {/* Core Founder Headline Metric Cards */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard
                label="Applicable Mandates"
                value={metricValue(summary.metrics.applicable_count ?? summary.metrics.action_required_count)}
                subtext="Active statutory obligations"
                badge={{ text: "Required", variant: "warning" }}
              />
              <MetricCard
                label="Statutory Documents"
                value={summary.total_documents_needed ?? 6}
                subtext="Mandatory paperwork for clearances"
                badge={{ text: "Checklist", variant: "info" }}
              />
              <MetricCard
                label="Approval Workflows"
                value={summary.total_workflows_count ?? 3}
                subtext="Multi-step departmental procedures"
                badge={{ text: "Clearance", variant: "info" }}
              />
              <MetricCard
                label="Upcoming Deadlines"
                value={summary.upcoming_deadlines.length}
                subtext="Periodic returns and renewals"
                badge={{ text: "Calendar", variant: "success" }}
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
                      Statutory obligations requiring immediate application, filing, or conflict resolution.
                    </p>
                  </div>
                  <Link
                    href={`/compliance?business_id=${activeBusinessId}&tab=action_required`}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                  >
                    View All Actions →
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
                        key={act.requirement_id}
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
                                {act.requirement_name}
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 mt-1">
                              {act.action_type} · {act.category} ·{" "}
                              {act.evidence_count} linked evidence record
                              {act.evidence_count === 1 ? "" : "s"}
                            </p>
                          </div>
                          <StatusBadge status={act.status} size="sm" />
                        </div>
                        <div className="flex justify-end pt-1">
                          <Link
                            href={`/compliance/${act.requirement_id}?business_id=${activeBusinessId}`}
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
                    No renewal period is recorded in published knowledge for your
                    applicable requirements. Filing timelines are not inferred.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {summary.upcoming_deadlines.map((dl) => (
                      <div
                        key={dl.requirement_id}
                        className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/60 space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs font-bold text-indigo-600">
                            {dl.due_date}
                          </span>
                          <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                            {dl.days_remaining} days
                          </span>
                        </div>
                        <div className="text-xs font-semibold text-slate-900">
                          {dl.title}
                        </div>
                        <div className="text-[11px] text-slate-500">{dl.basis}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Schemes and Standards Discoveries Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Matched Government Schemes Preview */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">💰</span>
                    <div>
                      <h2 className="text-sm font-bold text-slate-900">
                        Matched Government Schemes & Subsidies
                      </h2>
                      <p className="text-[11px] text-slate-500">
                        Central & state subsidies matched to your sector and MSME scale.
                      </p>
                    </div>
                  </div>
                  <Link
                    href={`/schemes?business_id=${activeBusinessId}`}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                  >
                    View All Schemes →
                  </Link>
                </div>

                {summary.schemes_preview && summary.schemes_preview.length > 0 ? (
                  <div className="space-y-2.5">
                    {summary.schemes_preview.map((sc: any) => (
                      <div
                        key={sc.id}
                        className="p-3.5 rounded-xl border border-emerald-100 bg-emerald-50/30 hover:bg-emerald-50/50 transition-colors space-y-1"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-xs font-bold text-slate-900 leading-snug">
                            {sc.name || sc.title}
                          </span>
                          <span className="shrink-0 text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded border border-emerald-300">
                            {sc.benefit_type ? sc.benefit_type.replace(/_/g, " ") : "Subsidy"}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 line-clamp-2">
                          {sc.benefit || sc.benefit_summary}
                        </p>
                        <div className="text-[10px] text-slate-500 flex items-center justify-between pt-0.5">
                          <span>{sc.authority}</span>
                          <span className="text-emerald-700 font-semibold">Potentially Eligible</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-6 text-center text-xs text-slate-500">
                    Explore government incentive programs and MSME capital grants.
                  </div>
                )}
              </div>

              {/* Standards & BIS Certifications Preview */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🔍</span>
                    <div>
                      <h2 className="text-sm font-bold text-slate-900">
                        Applicable Standards & Certifications
                      </h2>
                      <p className="text-[11px] text-slate-500">
                        Mandatory BIS quality orders and industry certifications.
                      </p>
                    </div>
                  </div>
                  <Link
                    href={`/standards?business_id=${activeBusinessId}`}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                  >
                    View All Standards →
                  </Link>
                </div>

                {summary.standards_preview && summary.standards_preview.length > 0 ? (
                  <div className="space-y-2.5">
                    {summary.standards_preview.map((st: any, idx: number) => (
                      <div
                        key={st.standard_code || idx}
                        className="p-3.5 rounded-xl border border-indigo-100 bg-indigo-50/30 hover:bg-indigo-50/50 transition-colors space-y-1"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-xs font-bold text-slate-900 leading-snug">
                            {st.standard_code ? `${st.standard_code} — ${st.title}` : st.title}
                          </span>
                          <span className="shrink-0 text-[10px] font-bold uppercase bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded border border-indigo-300">
                            {st.is_mandatory ? "Mandatory" : "Voluntary"}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500 flex items-center justify-between pt-0.5">
                          <span>Authority: {st.authority}</span>
                          <span className="text-indigo-700 font-semibold">Standard Mapped</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-6 text-center text-xs text-slate-500">
                    Discover Bureau of Indian Standards (BIS) and mandatory Quality Control Orders.
                  </div>
                )}
              </div>
            </div>

            {/* AI Regulatory Copilot Interactive Box */}
            <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 rounded-2xl p-6 text-white shadow-md space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-xl backdrop-blur-xs">
                    🤖
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">
                      Ask Your AI Compliance Copilot
                    </h3>
                    <p className="text-xs text-indigo-200">
                      Trained on Central Acts, State Gazette notifications, and verified statutory filings.
                    </p>
                  </div>
                </div>

                <Link
                  href={`/assistant?business_id=${activeBusinessId}`}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-xs font-bold text-slate-900 hover:bg-indigo-50 transition-colors shadow-xs"
                >
                  <span>Open Full Copilot</span>
                  <span>→</span>
                </Link>
              </div>

              {/* Sample Prompt Chips */}
              <div className="flex flex-wrap gap-2 pt-1">
                {[
                  "Which permits do I need before commencing factory production?",
                  "What are the consent to establish guidelines for industrial effluent?",
                  "Can my enterprise claim state industrial policy capital subsidies?",
                  "What are the mandatory testing parameters under BIS standards?",
                ].map((chip) => (
                  <Link
                    key={chip}
                    href={`/assistant?business_id=${activeBusinessId}&q=${encodeURIComponent(chip)}`}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/15 px-3 py-1.5 text-xs text-indigo-100 transition-colors"
                  >
                    <span>💬</span>
                    <span>{chip}</span>
                  </Link>
                ))}
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
                  href={`/compliance?business_id=${activeBusinessId}&tab=action_required`}
                  className="p-4 rounded-xl border border-slate-200/70 hover:border-indigo-300 hover:bg-indigo-50/30 transition-all space-y-1"
                >
                  <div className="text-lg">📜</div>
                  <div className="text-xs font-bold text-slate-900">
                    Compliance Matrix
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Action Required, Verification Required, and Quarantined Discoveries.
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
                  href={activeBusinessId ? `/onboarding?business_id=${activeBusinessId}` : "/onboarding?new=true"}
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
