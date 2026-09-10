"use client";

import React, { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import AppShell from "@/components/AppShell";
import StatusBadge from "@/components/StatusBadge";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import ErrorState from "@/components/ErrorState";
import WhyThisAppliesModal from "@/components/WhyThisAppliesModal";
import { api } from "@/lib/api";
import { ComplianceRequirementItem, CandidateRequirement, Business } from "@/types";

type ViewTab = "action_required" | "verification_required" | "audit";

function ComplianceContent() {
  const searchParams = useSearchParams();
  const paramBusinessId = searchParams.get("business_id");
  const initialTab = (searchParams.get("tab") as ViewTab) || "action_required";

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [requirements, setRequirements] = useState<ComplianceRequirementItem[]>([]);
  const [candidates, setCandidates] = useState<CandidateRequirement[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [businessId, setBusinessId] = useState<string | null>(null);

  // Active view tab (defaults to 'action_required' for clean founder UX)
  const [activeTab, setActiveTab] = useState<ViewTab>(initialTab);
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [showNotApplicableAudit, setShowNotApplicableAudit] = useState<boolean>(false);

  // Provenance Modal State
  const [provenanceModalOpen, setProvenanceModalOpen] = useState<boolean>(false);
  const [selectedReqForModal, setSelectedReqForModal] = useState<ComplianceRequirementItem | null>(null);

  async function loadData(bizId: string) {
    setLoading(true);
    setError(null);
    try {
      // Load business details
      try {
        const biz = await api.businesses.get(bizId);
        setBusiness(biz);
      } catch {
        // non-fatal
      }

      // Load all deterministic requirements
      const resp = await api.compliance.list(bizId, {
        category: categoryFilter || undefined,
      });
      setRequirements(resp.requirements);
      setTotalCount(resp.count);
      setBusinessId(bizId);

      // Load candidate requirements from live discovery
      try {
        const candList = await api.discovery.getCandidates(bizId);
        setCandidates(candList);
      } catch {
        setCandidates([]);
      }
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
        await loadData(bizId);
      } else {
        try {
          const list = await api.businesses.list();
          if (list.length > 0) {
            await loadData(list[0].id);
          } else {
            setLoading(false);
          }
        } catch {
          setLoading(false);
        }
      }
    }
    init();
  }, [paramBusinessId, categoryFilter]);

  // Filtering buckets
  const actionRequiredItems = requirements.filter(
    (r) => r.status === "APPLICABLE" || r.status === "NEEDS_INFORMATION"
  );
  const verificationRequiredItems = requirements.filter(
    (r) => r.status === "UNVERIFIED" || r.status === "CONFLICT_REVIEW"
  );
  const notApplicableItems = requirements.filter(
    (r) => r.status === "NOT_APPLICABLE"
  );

  const categories = ["ALL", "FOOD", "ENVIRONMENT", "LABOUR", "REGISTRATION", "STANDARD"];

  function openProvenance(req: ComplianceRequirementItem) {
    setSelectedReqForModal(req);
    setProvenanceModalOpen(true);
  }

  return (
    <AppShell activeView="compliance">
      <div className="space-y-6">
        {/* Header Banner */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-indigo-600 tracking-wide uppercase">
                Compliance Plan · {business?.name || "Your Company"}
              </span>
              <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
                {actionRequiredItems.length} Requirements Identified
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-950 mt-1">
              Your Compliance Requirements
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Clearance requirements and regulatory licenses identified for your business.
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
              href={businessId ? `/onboarding?business_id=${businessId}` : "/onboarding?new=true"}
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors shadow-xs"
            >
              + Re-evaluate
            </Link>
          </div>
        </div>

        {/* View Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("action_required")}
              className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                activeTab === "action_required"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
              }`}
            >
              <span>Your Compliance Requirements</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  activeTab === "action_required"
                    ? "bg-emerald-500 text-slate-950"
                    : "bg-emerald-100 text-emerald-800"
                }`}
              >
                {actionRequiredItems.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("verification_required")}
              className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                activeTab === "verification_required"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
              }`}
            >
              <span>Under Review</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  activeTab === "verification_required"
                    ? "bg-indigo-500 text-white"
                    : "bg-indigo-100 text-indigo-800"
                }`}
              >
                {verificationRequiredItems.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("audit")}
              className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl transition-all ${
                activeTab === "audit"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
              }`}
            >
              <span>Regulatory Intelligence & Audit</span>
              {candidates.length > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-200 text-amber-900">
                  {candidates.length} Discovered
                </span>
              )}
            </button>
          </div>

          {/* Domain Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium text-slate-400">Sector:</span>
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat === "ALL" ? "" : cat)}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                  (cat === "ALL" && !categoryFilter) || categoryFilter === cat
                    ? "bg-indigo-600 text-white"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <ErrorState
            title="Compliance Plan Notice"
            message={error}
            onRetry={() => businessId && loadData(businessId)}
          />
        )}

        {/* Loading Skeleton */}
        {loading ? (
          <div className="space-y-4">
            <LoadingSkeleton count={4} className="h-28 w-full" />
          </div>
        ) : activeTab === "action_required" ? (
          /* PRIMARY FOUNDER VIEW: ACTION REQUIRED ONLY */
          <div className="space-y-4">
            {actionRequiredItems.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-xs">
                <p className="text-sm font-semibold text-slate-700">No active requirements identified for this filter.</p>
                <p className="text-xs text-slate-500 mt-1">Check the &quot;Under Review&quot; or &quot;Regulatory Intelligence&quot; tabs for other items.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {actionRequiredItems.map((req) => {
                  const isApplicable = req.status === "APPLICABLE";
                  const friendlyStatus = isApplicable ? "Required" : "Information Needed";

                  return (
                    <div
                      key={req.requirement_id}
                      className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs hover:border-indigo-200 hover:shadow-md transition-all space-y-4"
                    >
                      {/* Top Bar */}
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="space-y-1.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-bold text-indigo-700 border border-indigo-100">
                              {req.authority}
                            </span>
                            <span className="text-xs text-slate-400">·</span>
                            <span className="text-xs font-semibold text-slate-600 uppercase">
                              {req.category}
                            </span>
                            <span className="text-xs text-slate-400">·</span>
                            <span className="text-xs text-slate-500 font-medium">
                              Jurisdiction: {req.jurisdiction}
                            </span>
                          </div>

                          <h2 className="text-base sm:text-lg font-bold text-slate-950">
                            {req.name}
                          </h2>

                          <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
                            {req.description}
                          </p>
                        </div>

                        {/* Status Badge */}
                        <div className="shrink-0">
                          <StatusBadge status={isApplicable ? "REQUIRED" : "NEEDS_INFORMATION"} size="md" />
                        </div>
                      </div>

                      {/* Mini Procedural Summary Strip */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50/80 border border-slate-100 rounded-xl p-3 text-xs">
                        <div>
                          <span className="text-slate-400 text-[10px] block uppercase font-bold">Required Documents</span>
                          <span className="font-semibold text-slate-800">4-6 Documents</span>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[10px] block uppercase font-bold">Estimated Steps</span>
                          <span className="font-semibold text-slate-800">4-5 Steps</span>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[10px] block uppercase font-bold">Timeline / Due Date</span>
                          <span className="font-semibold text-slate-800">Prior to Operations</span>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[10px] block uppercase font-bold">Submission Route</span>
                          <span className="font-semibold text-indigo-600 truncate block">Official Portal</span>
                        </div>
                      </div>

                      {/* Action Bar */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => openProvenance(req)}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-indigo-600 transition-colors"
                        >
                          <span>ℹ️ Why do I need this?</span>
                        </button>

                        <div className="flex items-center gap-3">
                          <Link
                            href={`/compliance/${req.requirement_id}?business_id=${businessId}`}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors shadow-xs"
                          >
                            <span>View Requirement</span>
                            <span>→</span>
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : activeTab === "verification_required" ? (
          /* VERIFICATION REQUIRED / UNDER REVIEW */
          <div className="space-y-4">
            {verificationRequiredItems.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-xs">
                <p className="text-sm font-semibold text-slate-700">No obligations currently under review.</p>
                <p className="text-xs text-slate-500 mt-1">All evaluated items are clearly categorized.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {verificationRequiredItems.map((req) => (
                  <div
                    key={req.requirement_id}
                    className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold text-slate-700">{req.authority}</span>
                          <span className="text-xs text-slate-400">·</span>
                          <span className="text-xs text-slate-500">{req.category}</span>
                        </div>
                        <h3 className="text-sm font-bold text-slate-900">{req.name}</h3>
                        <p className="text-xs text-slate-600 mt-1">{req.description}</p>
                      </div>
                      <StatusBadge status={req.status} />
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => openProvenance(req)}
                        className="text-xs font-semibold text-slate-600 hover:text-indigo-600"
                      >
                        Why do I need this?
                      </button>
                      <Link
                        href={`/compliance/${req.requirement_id}?business_id=${businessId}`}
                        className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                      >
                        View Details →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* REGULATORY INTELLIGENCE & AUDIT TAB */
          <div className="space-y-6">
            {/* Live Discovery Quarantined Claims */}
            <div className="bg-white rounded-2xl border border-amber-200/80 p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-white text-xs font-bold">
                  🛡️
                </span>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Discovered Regulatory Knowledge (Quarantined)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Live web discoveries from official portals. Held in quarantine until gazette verification.
                  </p>
                </div>
              </div>

              {candidates.length === 0 ? (
                <div className="text-xs text-slate-500 p-4 bg-slate-50 rounded-xl text-center">
                  No candidate claims discovered yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {candidates.map((cand) => (
                    <div
                      key={cand.id}
                      className="rounded-xl border border-amber-200/80 bg-amber-50/30 p-4 space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded">
                          {cand.authority}
                        </span>
                        <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                          {cand.verification_status}
                        </span>
                      </div>
                      <h4 className="font-bold text-slate-900">{cand.requirement_name}</h4>
                      <p className="text-slate-600 line-clamp-2">{cand.applicability_statement}</p>
                      {cand.source_url && (
                        <a
                          href={cand.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-600 hover:underline block pt-1 font-medium"
                        >
                          Source Portal ↗
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Collapsible NOT_APPLICABLE Audit View */}
            <div className="border border-slate-200 rounded-2xl bg-white overflow-hidden shadow-xs">
              <button
                type="button"
                onClick={() => setShowNotApplicableAudit(!showNotApplicableAudit)}
                className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-slate-400 font-mono text-sm">
                    {showNotApplicableAudit ? "▼" : "▶"}
                  </span>
                  <div>
                    <span className="text-xs font-bold text-slate-800">
                      Audit Trail: Not Applicable Obligations
                    </span>
                    <span className="ml-2 inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                      {notApplicableItems.length} excluded
                    </span>
                  </div>
                </div>
                <span className="text-xs font-semibold text-indigo-600">
                  {showNotApplicableAudit ? "Hide Excluded Rules" : "Inspect Ruled-Out Obligations"}
                </span>
              </button>

              {showNotApplicableAudit && (
                <div className="p-4 border-t border-slate-100 bg-slate-50/50 space-y-3">
                  <p className="text-xs text-slate-500">
                    The deterministic engine verified that your business profile does not meet the statutory threshold conditions for these requirements.
                  </p>
                  <div className="space-y-2">
                    {notApplicableItems.map((req) => (
                      <div
                        key={req.requirement_id}
                        className="bg-white rounded-lg border border-slate-200 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-slate-600">{req.requirement_id}</span>
                            <span className="text-slate-400">·</span>
                            <span className="font-semibold text-slate-800">{req.name}</span>
                          </div>
                          <div className="text-slate-500 text-[11px]">
                            Authority: {req.authority} · Jurisdiction: {req.jurisdiction}
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="inline-flex items-center rounded bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 border border-slate-200">
                            NOT APPLICABLE
                          </span>
                          <Link
                            href={`/compliance/${req.requirement_id}?business_id=${businessId}`}
                            className="text-xs font-medium text-indigo-600 hover:underline"
                          >
                            Trace →
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Why This Applies Modal */}
      <WhyThisAppliesModal
        isOpen={provenanceModalOpen}
        onClose={() => setProvenanceModalOpen(false)}
        requirement={selectedReqForModal}
        businessName={business?.name}
        businessState={(business as any)?.current_profile?.profile_data?.state}
      />
    </AppShell>
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
