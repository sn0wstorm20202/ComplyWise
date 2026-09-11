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
import { DEMO_REQUIREMENTS } from "@/data/demo/compliance";

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
    } catch {
      // Backend offline fallback: provide DEMO_REQUIREMENTS
      setRequirements(
        DEMO_REQUIREMENTS.map((req) => ({
          requirement_id: req.id,
          name: req.title,
          status: req.status as any,
          category: req.category,
          authority: req.authority,
          domain: "BIS Scheme-I",
          jurisdiction: "CENTRAL",
          citation_count: req.statutoryCitations.length,
          evidence_count: req.statutoryCitations.length,
          description: req.explanation,
          citations: req.statutoryCitations.map((c) => ({
            evidence_id: c,
            locator: c,
            authority: req.authority,
            excerpt: `Statutory mandate under ${c}`,
            verification_status: "VERIFIED" as const,
            source_title: "Official Gazette / BIS Schedule",
            canonical_url: "https://egazette.gov.in",
          })),
        }))
      );
      setTotalCount(DEMO_REQUIREMENTS.length);
      setBusinessId(bizId || "demo-biz");
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
            await loadData("demo-biz");
          }
        } catch {
          await loadData("demo-biz");
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
        <div className="bg-[#040406] rounded-[10px] border border-[#1c1d22] p-6 shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[#cc9166] tracking-wide uppercase">
                Compliance Plan · {business?.name || "Your Company"}
              </span>
              <span className="inline-flex items-center rounded-full bg-emerald-950/40 px-2.5 py-0.5 text-xs font-semibold text-emerald-400 border border-emerald-800/40">
                {actionRequiredItems.length} Requirements Identified
              </span>
            </div>
            <h1 className="text-2xl font-serif font-medium tracking-tight text-[#ffffff] mt-1">
              Your Compliance Requirements
            </h1>
            <p className="text-xs text-[#777a88] mt-0.5">
              Clearance requirements and regulatory licenses identified for your business.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={`/dashboard?business_id=${businessId || ""}`}
              className="rounded-full border border-[#2e3038] bg-[#121317] px-4 py-1.5 text-xs font-semibold text-[#e2e3e9] hover:border-[#cc9166]/50 transition-colors"
            >
              ← Dashboard
            </Link>
            <Link
              href={businessId ? `/onboarding?business_id=${businessId}` : "/onboarding?new=true"}
              className="inline-flex items-center gap-1.5 rounded-full bg-[#ffffff] px-4 py-1.5 text-xs font-semibold text-[#08080a] hover:bg-[#e2e3e9] transition-colors shadow-sm cursor-pointer"
            >
              + Re-evaluate
            </Link>
          </div>
        </div>

        {/* View Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1c1d22] pb-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("action_required")}
              className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-full transition-all cursor-pointer ${
                activeTab === "action_required"
                  ? "bg-[#ffffff] text-[#08080a] shadow-xs"
                  : "bg-[#121317] text-[#9194a1] border border-[#1c1d22] hover:border-[#2e3038] hover:text-[#ffffff]"
              }`}
            >
              <span>Your Compliance Requirements</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  activeTab === "action_required"
                    ? "bg-[#08080a] text-[#ffffff]"
                    : "bg-emerald-950/60 text-emerald-400 border border-emerald-800/40"
                }`}
              >
                {actionRequiredItems.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("verification_required")}
              className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-full transition-all cursor-pointer ${
                activeTab === "verification_required"
                  ? "bg-[#ffffff] text-[#08080a] shadow-xs"
                  : "bg-[#121317] text-[#9194a1] border border-[#1c1d22] hover:border-[#2e3038] hover:text-[#ffffff]"
              }`}
            >
              <span>Under Review</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  activeTab === "verification_required"
                    ? "bg-[#08080a] text-[#ffffff]"
                    : "bg-[#1c140d] text-[#cc9166] border border-[#cc9166]/40"
                }`}
              >
                {verificationRequiredItems.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("audit")}
              className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-full transition-all cursor-pointer ${
                activeTab === "audit"
                  ? "bg-[#ffffff] text-[#08080a] shadow-xs"
                  : "bg-[#121317] text-[#9194a1] border border-[#1c1d22] hover:border-[#2e3038] hover:text-[#ffffff]"
              }`}
            >
              <span>Regulatory Intelligence &amp; Audit</span>
              {candidates.length > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-950/60 text-amber-400 border border-amber-800/40">
                  {candidates.length} Discovered
                </span>
              )}
            </button>
          </div>

          {/* Domain Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium text-[#777a88]">Sector:</span>
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat === "ALL" ? "" : cat)}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition-all cursor-pointer ${
                  (cat === "ALL" && !categoryFilter) || categoryFilter === cat
                    ? "bg-[#cc9166] text-[#08080a]"
                    : "bg-[#121317] text-[#9194a1] border border-[#1c1d22] hover:border-[#2e3038] hover:text-[#ffffff]"
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
              <div className="bg-[#040406] rounded-[10px] border border-[#1c1d22] p-12 text-center shadow-2xl">
                <p className="text-sm font-semibold text-[#ffffff]">No active requirements identified for this filter.</p>
                <p className="text-xs text-[#777a88] mt-1">Check the &quot;Under Review&quot; or &quot;Regulatory Intelligence&quot; tabs for other items.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {actionRequiredItems.map((req) => {
                  const isApplicable = req.status === "APPLICABLE";

                  return (
                    <div
                      key={req.requirement_id}
                      className="bg-[#040406] rounded-[10px] border border-[#1c1d22] p-6 shadow-2xl hover:border-[#2e3038] transition-colors space-y-4"
                    >
                      {/* Top Bar */}
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="space-y-1.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center rounded-full bg-[#1c140d] px-2.5 py-0.5 text-xs font-bold text-[#cc9166] border border-[#cc9166]/40">
                              {req.authority}
                            </span>
                            <span className="text-xs text-[#5e616e]">·</span>
                            <span className="text-xs font-semibold text-[#9194a1] uppercase">
                              {req.category}
                            </span>
                            <span className="text-xs text-[#5e616e]">·</span>
                            <span className="text-xs text-[#777a88] font-medium">
                              Jurisdiction: {req.jurisdiction}
                            </span>
                          </div>

                          <h2 className="text-base sm:text-lg font-serif font-semibold text-[#ffffff]">
                            {req.name}
                          </h2>

                          <p className="text-xs text-[#777a88] leading-relaxed max-w-3xl">
                            {req.description}
                          </p>
                        </div>

                        {/* Status Badge */}
                        <div className="shrink-0">
                          <StatusBadge status={isApplicable ? "REQUIRED" : "NEEDS_INFORMATION"} size="md" />
                        </div>
                      </div>

                      {/* Mini Procedural Summary Strip */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#121317] border border-[#1c1d22] rounded-xl p-3 text-xs">
                        <div>
                          <span className="text-[#777a88] text-[10px] block uppercase font-bold">Required Documents</span>
                          <span className="font-semibold text-[#ffffff]">4-6 Documents</span>
                        </div>
                        <div>
                          <span className="text-[#777a88] text-[10px] block uppercase font-bold">Estimated Steps</span>
                          <span className="font-semibold text-[#ffffff]">4-5 Steps</span>
                        </div>
                        <div>
                          <span className="text-[#777a88] text-[10px] block uppercase font-bold">Timeline / Due Date</span>
                          <span className="font-semibold text-[#ffffff]">Prior to Operations</span>
                        </div>
                        <div>
                          <span className="text-[#777a88] text-[10px] block uppercase font-bold">Submission Route</span>
                          <span className="font-semibold text-[#cc9166] truncate block">Official Portal</span>
                        </div>
                      </div>

                      {/* Action Bar */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#1c1d22]">
                        <button
                          type="button"
                          onClick={() => openProvenance(req)}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-[#cc9166] hover:underline cursor-pointer"
                        >
                          <span>ℹ️ Why do I need this?</span>
                        </button>

                        <div className="flex items-center gap-3">
                          <Link
                            href={`/compliance/${req.requirement_id}?business_id=${businessId}`}
                            className="inline-flex items-center gap-1.5 rounded-full bg-[#ffffff] px-5 py-2 text-xs font-semibold text-[#08080a] hover:bg-[#e2e3e9] transition-colors shadow-sm"
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
              <div className="bg-[#040406] rounded-[10px] border border-[#1c1d22] p-12 text-center shadow-2xl">
                <p className="text-sm font-semibold text-[#ffffff]">No obligations currently under review.</p>
                <p className="text-xs text-[#777a88] mt-1">All evaluated items are clearly categorized.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {verificationRequiredItems.map((req) => (
                  <div
                    key={req.requirement_id}
                    className="bg-[#040406] rounded-[10px] border border-[#1c1d22] p-5 shadow-2xl space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold text-[#cc9166]">{req.authority}</span>
                          <span className="text-xs text-[#5e616e]">·</span>
                          <span className="text-xs text-[#777a88]">{req.category}</span>
                        </div>
                        <h3 className="text-sm font-semibold text-[#ffffff]">{req.name}</h3>
                        <p className="text-xs text-[#777a88] mt-1">{req.description}</p>
                      </div>
                      <StatusBadge status={req.status} />
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-[#1c1d22]">
                      <button
                        type="button"
                        onClick={() => openProvenance(req)}
                        className="text-xs font-semibold text-[#cc9166] hover:underline cursor-pointer"
                      >
                        Why do I need this?
                      </button>
                      <Link
                        href={`/compliance/${req.requirement_id}?business_id=${businessId}`}
                        className="text-xs font-semibold text-[#ffffff] hover:text-[#cc9166]"
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
            <div className="bg-[#1c140d] rounded-[10px] border border-amber-800/40 p-6 shadow-2xl space-y-4">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#cc9166] text-[#08080a] text-xs font-bold">
                  🛡️
                </span>
                <div>
                  <h3 className="text-sm font-serif font-semibold text-amber-300">
                    Discovered Regulatory Knowledge (Quarantined)
                  </h3>
                  <p className="text-xs text-amber-400/80">
                    Live web discoveries from official portals. Held in quarantine until gazette verification.
                  </p>
                </div>
              </div>

              {candidates.length === 0 ? (
                <div className="text-xs text-[#777a88] p-4 bg-[#040406] border border-amber-900/30 rounded-xl text-center">
                  No candidate claims discovered yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {candidates.map((cand) => (
                    <div
                      key={cand.id}
                      className="rounded-xl border border-amber-800/30 bg-[#040406] p-4 space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/40">
                          {cand.authority}
                        </span>
                        <span className="text-[11px] font-semibold text-amber-300 bg-amber-950/40 border border-amber-800/30 px-2 py-0.5 rounded-full">
                          {cand.verification_status}
                        </span>
                      </div>
                      <h4 className="font-semibold text-[#ffffff]">{cand.requirement_name}</h4>
                      <p className="text-[#9194a1] line-clamp-2">{cand.applicability_statement}</p>
                      {cand.source_url && (
                        <a
                          href={cand.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#cc9166] hover:underline block pt-1 font-medium"
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
            <div className="border border-[#1c1d22] rounded-[10px] bg-[#040406] overflow-hidden shadow-2xl">
              <button
                type="button"
                onClick={() => setShowNotApplicableAudit(!showNotApplicableAudit)}
                className="w-full p-4 flex items-center justify-between text-left hover:bg-[#121317]/50 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <span className="text-[#777a88] font-mono text-sm">
                    {showNotApplicableAudit ? "▼" : "▶"}
                  </span>
                  <div>
                    <span className="text-xs font-semibold text-[#ffffff]">
                      Audit Trail: Not Applicable Obligations
                    </span>
                    <span className="ml-2 inline-flex items-center rounded-full bg-[#121317] border border-[#1c1d22] px-2 py-0.5 text-[11px] font-semibold text-[#777a88]">
                      {notApplicableItems.length} excluded
                    </span>
                  </div>
                </div>
                <span className="text-xs font-semibold text-[#cc9166]">
                  {showNotApplicableAudit ? "Hide Excluded Rules" : "Inspect Ruled-Out Obligations"}
                </span>
              </button>

              {showNotApplicableAudit && (
                <div className="p-4 border-t border-[#1c1d22] bg-[#08080a] space-y-3">
                  <p className="text-xs text-[#777a88]">
                    The deterministic engine verified that your business profile does not meet the statutory threshold conditions for these requirements.
                  </p>
                  <div className="space-y-2">
                    {notApplicableItems.map((req) => (
                      <div
                        key={req.requirement_id}
                        className="bg-[#121317] rounded-lg border border-[#1c1d22] p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-[#777a88]">{req.requirement_id}</span>
                            <span className="text-[#5e616e]">·</span>
                            <span className="font-semibold text-[#e2e3e9]">{req.name}</span>
                          </div>
                          <div className="text-[#777a88] text-[11px]">
                            Authority: {req.authority} · Jurisdiction: {req.jurisdiction}
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="inline-flex items-center rounded-full bg-[#08080a] px-2 py-0.5 text-[11px] font-medium text-[#777a88] border border-[#1c1d22]">
                            NOT APPLICABLE
                          </span>
                          <Link
                            href={`/compliance/${req.requirement_id}?business_id=${businessId}`}
                            className="text-xs font-medium text-[#cc9166] hover:underline"
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
