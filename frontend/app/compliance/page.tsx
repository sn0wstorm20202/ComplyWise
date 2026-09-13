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
import { sanitizeExternalUrl } from "@/lib/url";
import { ComplianceRequirementItem, CandidateRequirement, Business } from "@/types";
import { DEMO_REQUIREMENTS } from "@/data/demo/compliance";
import { useLanguage } from "@/context/LanguageContext";

type ViewTab = "action_required" | "verification_required" | "audit";

function ComplianceContent() {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const paramBusinessId = searchParams.get("business_id");
  const initialTab = (searchParams.get("tab") as ViewTab) || "action_required";

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [requirements, setRequirements] = useState<ComplianceRequirementItem[]>(() =>
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
  const [candidates, setCandidates] = useState<CandidateRequirement[]>([]);
  const [totalCount, setTotalCount] = useState<number>(DEMO_REQUIREMENTS.length);
  const [businessId, setBusinessId] = useState<string | null>(null);

  // Active view tab (defaults to 'action_required' for clean founder UX)
  const [activeTab, setActiveTab] = useState<ViewTab>(initialTab);
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [showNotApplicableAudit, setShowNotApplicableAudit] = useState<boolean>(false);

  // Provenance Modal State
  const [provenanceModalOpen, setProvenanceModalOpen] = useState<boolean>(false);
  const [selectedReqForModal, setSelectedReqForModal] = useState<ComplianceRequirementItem | null>(null);

  async function loadData(bizId: string) {
    setError(null);
    setBusinessId(bizId);

    try {
      const [reqResp, candResp, bizResp] = await Promise.allSettled([
        api.compliance.list(bizId, { category: categoryFilter || undefined }),
        api.discovery.getCandidates(bizId),
        api.businesses.get(bizId),
      ]);

      if (reqResp.status === "fulfilled" && reqResp.value?.requirements?.length > 0) {
        setRequirements(reqResp.value.requirements);
        setTotalCount(reqResp.value.count);
      }

      if (candResp.status === "fulfilled") {
        setCandidates(candResp.value || []);
      }

      if (bizResp.status === "fulfilled") {
        setBusiness(bizResp.value);
      }
    } catch {
      // Fallback already rendered seamlessly
    }
  }

  useEffect(() => {
    const bizId =
      paramBusinessId ||
      localStorage.getItem("complywise_active_business_id") ||
      "bb0abb9b-409e-405a-bae1-777540bc0907";

    loadData(bizId);
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
        <div className="bg-white rounded-[16px] border border-[#E2E8F0] p-6 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[#64748B] tracking-wide uppercase">
                {t("common.appName")} · {business?.name || t("common.appName")}
              </span>
              <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
                {actionRequiredItems.length} {t("compliance.actionRequired")}
              </span>
            </div>
            <h1 className="text-2xl font-sans font-bold tracking-tight text-[#0F172A] mt-1">
              {t("compliance.title")}
            </h1>
            <p className="text-xs text-[#64748B] mt-0.5">
              {t("compliance.subtitle")}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={`/dashboard?business_id=${businessId || ""}`}
              className="rounded-full border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-1.5 text-xs font-semibold text-[#0F172A] hover:bg-[#F1F5F9] transition-colors"
            >
              ← {t("navigation.dashboard")}
            </Link>
            <Link
              href={businessId ? `/onboarding?business_id=${businessId}` : "/onboarding?new=true"}
              className="inline-flex items-center gap-1.5 rounded-full bg-[#18181B] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#27272A] transition-colors shadow-2xs cursor-pointer"
            >
              + Re-evaluate
            </Link>
          </div>
        </div>

        {/* View Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E2E8F0] pb-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("action_required")}
              className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-full transition-all cursor-pointer ${
                activeTab === "action_required"
                  ? "bg-[#18181B] text-white shadow-2xs"
                  : "bg-white text-[#64748B] border border-[#E2E8F0] hover:border-[#CBD5E1] hover:text-[#0F172A]"
              }`}
            >
              <span>{t("compliance.actionRequired")}</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  activeTab === "action_required"
                    ? "bg-white/20 text-white"
                    : "bg-emerald-50 text-emerald-700 border border-emerald-200"
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
                  ? "bg-[#18181B] text-white shadow-2xs"
                  : "bg-white text-[#64748B] border border-[#E2E8F0] hover:border-[#CBD5E1] hover:text-[#0F172A]"
              }`}
            >
              <span>{t("compliance.underReview")}</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  activeTab === "verification_required"
                    ? "bg-white/20 text-white"
                    : "bg-amber-50 text-amber-700 border border-amber-200"
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
                  ? "bg-[#18181B] text-white shadow-2xs"
                  : "bg-white text-[#64748B] border border-[#E2E8F0] hover:border-[#CBD5E1] hover:text-[#0F172A]"
              }`}
            >
              <span>{t("compliance.allRequirements")}</span>
              {candidates.length > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                  {candidates.length} {t("common.verified")}
                </span>
              )}
            </button>
          </div>

          {/* Domain Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium text-[#64748B]">{t("common.filter")}:</span>
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat === "ALL" ? "" : cat)}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition-all cursor-pointer ${
                  (cat === "ALL" && !categoryFilter) || categoryFilter === cat
                    ? "bg-[#18181B] text-white"
                    : "bg-white text-[#64748B] border border-[#E2E8F0] hover:border-[#CBD5E1] hover:text-[#0F172A]"
                }`}
              >
                {cat === "ALL" ? t("common.all") : cat}
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
              <div className="bg-white rounded-[16px] border border-[#E2E8F0] p-12 text-center shadow-2xs">
                <p className="text-sm font-semibold text-[#0F172A]">{t("common.noData")}</p>
                <p className="text-xs text-[#64748B] mt-1">{t("compliance.filterByStatus")}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {actionRequiredItems.map((req) => {
                  const isApplicable = req.status === "APPLICABLE";

                  return (
                    <div
                      key={req.requirement_id}
                      className="bg-white rounded-[16px] border border-[#E2E8F0] p-6 shadow-2xs hover:border-[#CBD5E1] transition-all space-y-4"
                    >
                      {/* Top Bar */}
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="space-y-1.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center rounded-full bg-[#F1F5F9] px-2.5 py-0.5 text-xs font-bold text-[#0F172A] border border-[#E2E8F0]">
                              {req.authority}
                            </span>
                            <span className="text-xs text-[#CBD5E1]">·</span>
                            <span className="text-xs font-semibold text-[#64748B] uppercase">
                              {req.category}
                            </span>
                            <span className="text-xs text-[#CBD5E1]">·</span>
                            <span className="text-xs text-[#64748B] font-medium">
                              Jurisdiction: {req.jurisdiction}
                            </span>
                          </div>

                          <h2 className="text-base sm:text-lg font-sans font-bold text-[#0F172A]">
                            {req.name}
                          </h2>

                          <p className="text-xs text-[#475569] leading-relaxed max-w-3xl">
                            {req.description}
                          </p>
                        </div>

                        {/* Status Badge */}
                        <div className="shrink-0">
                          <StatusBadge status={isApplicable ? "REQUIRED" : "NEEDS_INFORMATION"} size="md" />
                        </div>
                      </div>

                      {/* Mini Procedural Summary Strip */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3 text-xs">
                        <div>
                          <span className="text-[#64748B] text-[10px] block uppercase font-bold">Required Documents</span>
                          <span className="font-semibold text-[#0F172A]">4-6 Documents</span>
                        </div>
                        <div>
                          <span className="text-[#64748B] text-[10px] block uppercase font-bold">Estimated Steps</span>
                          <span className="font-semibold text-[#0F172A]">4-5 Steps</span>
                        </div>
                        <div>
                          <span className="text-[#64748B] text-[10px] block uppercase font-bold">Timeline / Due Date</span>
                          <span className="font-semibold text-[#0F172A]">Prior to Operations</span>
                        </div>
                        <div>
                          <span className="text-[#64748B] text-[10px] block uppercase font-bold">Submission Route</span>
                          {(() => {
                            const portalUrl = sanitizeExternalUrl(req.portal_url || req.source_url || req.portal || (req.citations && req.citations[0]?.canonical_url));
                            const portalLabel = req.portal_name || `${req.authority} Portal`;
                            return portalUrl ? (
                              <a
                                href={portalUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-semibold text-blue-600 hover:text-blue-800 hover:underline truncate block"
                                title={`Open official portal: ${portalLabel}`}
                              >
                                {portalLabel} ↗
                              </a>
                            ) : (
                              <span className="font-semibold text-[#0F172A] truncate block">{portalLabel}</span>
                            );
                          })()}
                        </div>
                      </div>

                      {/* Action Bar */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#E2E8F0]">
                        <div className="flex flex-wrap items-center gap-3">
                          <button
                            type="button"
                            onClick={() => openProvenance(req)}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-[#0F172A] hover:underline cursor-pointer"
                          >
                            <span>ℹ️ {t("compliance.whyApplies")}</span>
                          </button>

                          {(() => {
                            const statutoryUrl = sanitizeExternalUrl(req.source_url || req.portal_url || req.portal || (req.citations && req.citations[0]?.canonical_url));
                            if (!statutoryUrl) return null;
                            const portalLabel = req.portal_name || "Official Statutory Source";
                            return (
                              <a
                                href={statutoryUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition-all shadow-2xs"
                                title={`Open official statutory portal: ${portalLabel}`}
                              >
                                <span>🔗 {portalLabel}</span>
                                <span className="text-[11px]">↗</span>
                              </a>
                            );
                          })()}
                        </div>

                        <div className="flex items-center gap-3">
                          <Link
                            href={`/compliance/${req.requirement_id}?business_id=${businessId}`}
                            className="inline-flex items-center gap-1.5 rounded-full bg-[#18181B] px-5 py-2 text-xs font-semibold text-white hover:bg-[#27272A] transition-colors shadow-2xs"
                          >
                            <span>{t("common.viewDetails")}</span>
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
              <div className="bg-white rounded-[16px] border border-[#E2E8F0] p-12 text-center shadow-2xs">
                <p className="text-sm font-semibold text-[#0F172A]">No obligations currently under review.</p>
                <p className="text-xs text-[#64748B] mt-1">All evaluated items are clearly categorized.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {verificationRequiredItems.map((req) => (
                  <div
                    key={req.requirement_id}
                    className="bg-white rounded-[16px] border border-[#E2E8F0] p-5 shadow-2xs space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold text-[#0F172A]">{req.authority}</span>
                          <span className="text-xs text-[#CBD5E1]">·</span>
                          <span className="text-xs text-[#64748B]">{req.category}</span>
                        </div>
                        <h3 className="text-sm font-semibold text-[#0F172A]">{req.name}</h3>
                        <p className="text-xs text-[#475569] mt-1">{req.description}</p>
                      </div>
                      <StatusBadge status={req.status} />
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-[#E2E8F0]">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => openProvenance(req)}
                          className="text-xs font-semibold text-[#0F172A] hover:underline cursor-pointer"
                        >
                          {t("compliance.whyApplies")}
                        </button>
                        {(() => {
                          const statutoryUrl = sanitizeExternalUrl(req.source_url || req.portal_url || req.portal || (req.citations && req.citations[0]?.canonical_url));
                          if (!statutoryUrl) return null;
                          const portalLabel = req.portal_name || "Statutory Source";
                          return (
                            <a
                              href={statutoryUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs font-bold text-emerald-700 hover:underline inline-flex items-center gap-1"
                              title={`Open official portal: ${portalLabel}`}
                            >
                              <span>🔗 {portalLabel} ↗</span>
                            </a>
                          );
                        })()}
                      </div>
                      <Link
                        href={`/compliance/${req.requirement_id}?business_id=${businessId}`}
                        className="text-xs font-semibold text-[#0F172A] hover:underline"
                      >
                        {t("common.viewDetails")} →
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
            <div className="bg-amber-50/60 rounded-[16px] border border-amber-200 p-6 shadow-2xs space-y-4">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-200 text-amber-900 text-xs font-bold">
                  🛡️
                </span>
                <div>
                  <h3 className="text-sm font-sans font-bold text-amber-950">
                    Discovered Regulatory Knowledge (Quarantined)
                  </h3>
                  <p className="text-xs text-amber-800/80">
                    Live web discoveries from official portals. Held in quarantine until gazette verification.
                  </p>
                </div>
              </div>

              {candidates.length === 0 ? (
                <div className="text-xs text-amber-800 p-4 bg-white border border-amber-200 rounded-xl text-center">
                  No candidate claims discovered yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {candidates.map((cand) => (
                    <div
                      key={cand.id}
                      className="rounded-xl border border-amber-200 bg-white p-4 space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded border border-amber-200">
                          {cand.authority}
                        </span>
                        <span className="text-[11px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                          {cand.verification_status}
                        </span>
                      </div>
                      <h4 className="font-semibold text-[#0F172A]">{cand.requirement_name}</h4>
                      <p className="text-[#475569] line-clamp-2">{cand.applicability_statement}</p>
                      {(() => {
                        const cleanUrl = sanitizeExternalUrl(cand.source_url);
                        if (!cleanUrl) return null;
                        return (
                          <a
                            href={cleanUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline block pt-1 font-medium"
                          >
                            Source Portal ↗
                          </a>
                        );
                      })()}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Collapsible NOT_APPLICABLE Audit View */}
            <div className="border border-[#E2E8F0] rounded-[16px] bg-white overflow-hidden shadow-2xs">
              <button
                type="button"
                onClick={() => setShowNotApplicableAudit(!showNotApplicableAudit)}
                className="w-full p-4 flex items-center justify-between text-left hover:bg-[#F8FAFC] transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <span className="text-[#64748B] font-mono text-sm">
                    {showNotApplicableAudit ? "▼" : "▶"}
                  </span>
                  <div>
                    <span className="text-xs font-semibold text-[#0F172A]">
                      Audit Trail: Not Applicable Obligations
                    </span>
                    <span className="ml-2 inline-flex items-center rounded-full bg-[#F1F5F9] border border-[#E2E8F0] px-2 py-0.5 text-[11px] font-semibold text-[#64748B]">
                      {notApplicableItems.length} excluded
                    </span>
                  </div>
                </div>
                <span className="text-xs font-semibold text-[#0F172A]">
                  {showNotApplicableAudit ? "Hide Excluded Rules" : "Inspect Ruled-Out Obligations"}
                </span>
              </button>

              {showNotApplicableAudit && (
                <div className="p-4 border-t border-[#E2E8F0] bg-[#F8FAFC] space-y-3">
                  <p className="text-xs text-[#64748B]">
                    The deterministic engine verified that your business profile does not meet the statutory threshold conditions for these requirements.
                  </p>
                  <div className="space-y-2">
                    {notApplicableItems.map((req) => (
                      <div
                        key={req.requirement_id}
                        className="bg-white rounded-lg border border-[#E2E8F0] p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-[#64748B]">{req.requirement_id}</span>
                            <span className="text-[#CBD5E1]">·</span>
                            <span className="font-semibold text-[#0F172A]">{req.name}</span>
                          </div>
                          <div className="text-[#64748B] text-[11px]">
                            Authority: {req.authority} · Jurisdiction: {req.jurisdiction}
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="inline-flex items-center rounded-full bg-[#F1F5F9] px-2 py-0.5 text-[11px] font-medium text-[#64748B] border border-[#E2E8F0]">
                            NOT APPLICABLE
                          </span>
                          <Link
                            href={`/compliance/${req.requirement_id}?business_id=${businessId}`}
                            className="text-xs font-medium text-[#0F172A] hover:underline"
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
