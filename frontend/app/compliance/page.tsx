"use client";

import React, { useEffect, useState, useRef, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import AppShell from "@/components/AppShell";
import RequirementCard from "@/components/product/RequirementCard";
import StatusBadge from "@/components/StatusBadge";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import ErrorState from "@/components/ErrorState";
import WhyThisAppliesModal from "@/components/WhyThisAppliesModal";
import { api } from "@/lib/api";
import { sanitizeExternalUrl } from "@/lib/url";
import { ComplianceRequirementItem, CandidateRequirement, Business } from "@/types";
import { resolveAuthorityPortalUrl } from "@/lib/authorityPortals";
import { useLanguage } from "@/context/LanguageContext";
import { useBusinessContext } from "@/context/BusinessContext";

type ViewTab = "action_required" | "verification_required" | "audit";

function ComplianceContent() {
  const { t } = useLanguage();
  const { activeBusinessId: contextBusinessId, activeAssessmentId } = useBusinessContext();
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

  const requestVersion = useRef(0);
  async function loadData(bizId: string) {
    const version = ++requestVersion.current;
    setLoading(true);
    setError(null);
    setBusinessId(bizId);

    try {
      const explicitRunId = searchParams.get("run_id");
      const explicitAssessmentId = searchParams.get("assessment_id") || (bizId === contextBusinessId ? activeAssessmentId : undefined) || undefined;

      // 1. Fetch business profile, canonical business compliance list, and candidate regulations concurrently
      const [bizResp, reqResp, candResp] = await Promise.allSettled([
        api.businesses.get(bizId),
        api.compliance.list(bizId, {
          category: categoryFilter || undefined,
          assessment_id: explicitAssessmentId,
        }),
        api.discovery.getCandidates(bizId),
      ]);

      if (version !== requestVersion.current) return;
      let loadedBusiness: Business | null = null;
      if (bizResp.status === "fulfilled" && bizResp.value) {
        loadedBusiness = bizResp.value;
        setBusiness(loadedBusiness);
      }

      if (candResp.status === "fulfilled") {
        setCandidates(candResp.value || []);
      }

      let loadedItems: ComplianceRequirementItem[] = [];

      // 2. Primary canonical source: backend evaluated statutory compliance list for this business
      if (
        reqResp.status === "fulfilled" &&
        reqResp.value &&
        reqResp.value.requirements &&
        reqResp.value.requirements.length > 0
      ) {
        loadedItems = reqResp.value.requirements.map((req) => ({
          ...req,
          portal_url: req.result_origin === "LLM_FALLBACK_RESULT" ? undefined : resolveAuthorityPortalUrl(
            req.authority,
            req.name,
            req.portal_url || req.portal || req.source_url
          ),
        }));
      }

      // Applicability belongs to the evaluated backend response, never to name-based UI heuristics.
      if (reqResp.status === "rejected" && loadedItems.length === 0) throw reqResp.reason;
      setRequirements(loadedItems);
      setTotalCount(loadedItems.length);
    } catch {
      if (version !== requestVersion.current) return;
      setRequirements([]);
      setTotalCount(0);
      setError("We couldn't load your requirements. Please try again.");
    } finally {
      if (version === requestVersion.current) setLoading(false);
    }
  }

  useEffect(() => {
    // Priority: URL param > context (authoritative server-synced business) > localStorage
    // Do NOT fall back to a hardcoded UUID — that causes cross-company data leakage
    const bizId =
      paramBusinessId ||
      contextBusinessId ||
      (typeof window !== "undefined" ? localStorage.getItem("complywise_active_business_id") : null);

    if (!bizId) { setRequirements([]); setTotalCount(0); setLoading(false); return; }

    // Clear stale requirements immediately before loading new company data
    setRequirements([]);
    setTotalCount(0);
    setBusiness(null);

    loadData(bizId);
  }, [paramBusinessId, contextBusinessId, activeAssessmentId, searchParams, categoryFilter]); // Re-run when business switches

  // Filtering buckets
  const actionRequiredItems = requirements.filter(
    (r) =>
      r.user_action_required !== false && (r.admin_disposition === "CONFIRMED_REQUIRED" || r.status === "SUGGESTED" ||
      r.status === "APPLICABLE" ||
      r.status === "NEEDS_INFORMATION" ||
      (r.status as string) === "NEEDS_VERIFICATION")
  );
  const verificationRequiredItems = requirements.filter(
    (r) =>
      r.user_action_required !== false && (r.status === "UNVERIFIED" ||
      r.status === "CONFLICT_REVIEW" ||
      (r.status as string) === "NEEDS_VERIFICATION")
  );
  const notApplicableItems = requirements.filter(
    (r) => r.status === "NOT_APPLICABLE" || r.user_action_required === false
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
        <div className="bg-white rounded-[16px] border border-[var(--ui-border)] p-6 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[var(--ui-secondary)] tracking-wide uppercase">
                {t("common.appName")} · {business?.name || t("common.appName")}
              </span>
              <span className="inline-flex items-center rounded-full bg-[var(--ui-sage-faint)] px-2.5 py-0.5 text-xs font-semibold text-[var(--ui-sage)] border border-[var(--ui-sage-soft)]">
                {actionRequiredItems.length} {t("compliance.actionRequired")}
              </span>
            </div>
            <h1 className="text-2xl font-sans font-bold tracking-tight text-[var(--ui-text)] mt-1">
              {t("compliance.title")}
            </h1>
            <p className="text-xs text-[var(--ui-secondary)] mt-0.5">
              Reviewed requirements and contextual next steps for this assessment. Planning guidance is identified separately from published-rule decisions.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={`/dashboard?business_id=${businessId || ""}`}
              className="rounded-full border border-[var(--ui-border)] bg-[var(--ui-bg)] px-4 py-1.5 text-xs font-semibold text-[var(--ui-text)] hover:bg-[var(--ui-inset)] transition-colors"
            >
              ← {t("navigation.dashboard")}
            </Link>
            <Link
              href={businessId ? `/onboarding?business_id=${businessId}` : "/onboarding?new=true"}
              className="inline-flex items-center gap-1.5 rounded-full bg-[var(--ui-text)] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[var(--ui-text)] transition-colors shadow-2xs cursor-pointer"
            >
              + Re-evaluate
            </Link>
          </div>
        </div>

        {/* View Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--ui-border)] pb-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("action_required")}
              className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-full transition-all cursor-pointer ${
                activeTab === "action_required"
                  ? "bg-[var(--ui-text)] text-white shadow-2xs"
                  : "bg-white text-[var(--ui-secondary)] border border-[var(--ui-border)] hover:border-[var(--ui-border-strong)] hover:text-[var(--ui-text)]"
              }`}
            >
              <span>{t("compliance.actionRequired")}</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  activeTab === "action_required"
                    ? "bg-white/20 text-white"
                    : "bg-[var(--ui-sage-faint)] text-[var(--ui-sage)] border border-[var(--ui-sage-soft)]"
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
                  ? "bg-[var(--ui-text)] text-white shadow-2xs"
                  : "bg-white text-[var(--ui-secondary)] border border-[var(--ui-border)] hover:border-[var(--ui-border-strong)] hover:text-[var(--ui-text)]"
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
                  ? "bg-[var(--ui-text)] text-white shadow-2xs"
                  : "bg-white text-[var(--ui-secondary)] border border-[var(--ui-border)] hover:border-[var(--ui-border-strong)] hover:text-[var(--ui-text)]"
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
            <span className="text-xs font-medium text-[var(--ui-secondary)]">{t("common.filter")}:</span>
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat === "ALL" ? "" : cat)}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition-all cursor-pointer ${
                  (cat === "ALL" && !categoryFilter) || categoryFilter === cat
                    ? "bg-[var(--ui-text)] text-white"
                    : "bg-white text-[var(--ui-secondary)] border border-[var(--ui-border)] hover:border-[var(--ui-border-strong)] hover:text-[var(--ui-text)]"
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
              <div className="bg-white rounded-[16px] border border-[var(--ui-border)] p-12 text-center shadow-2xs">
                <p className="text-sm font-semibold text-[var(--ui-text)]">{t("common.noData")}</p>
                <p className="text-xs text-[var(--ui-secondary)] mt-1">{t("compliance.filterByStatus")}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {actionRequiredItems.map(req => <RequirementCard key={req.requirement_id} requirement={req} businessId={businessId} assessmentId={searchParams.get("assessment_id") || (businessId === contextBusinessId ? activeAssessmentId : undefined)} onInspect={() => openProvenance(req)} />)}
              </div>
            )}
          </div>
        ) : activeTab === "verification_required" ? (
          /* VERIFICATION REQUIRED / UNDER REVIEW */
          <div className="space-y-4">
            {verificationRequiredItems.length === 0 ? (
              <div className="bg-white rounded-[16px] border border-[var(--ui-border)] p-12 text-center shadow-2xs">
                <p className="text-sm font-semibold text-[var(--ui-text)]">No obligations currently under review.</p>
                <p className="text-xs text-[var(--ui-secondary)] mt-1">All evaluated items are clearly categorized.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {verificationRequiredItems.map((req) => (
                  <div
                    key={req.requirement_id}
                    className="bg-white rounded-[16px] border border-[var(--ui-border)] p-5 shadow-2xs space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold text-[var(--ui-text)]">{req.authority}</span>
                          <span className="text-xs text-[var(--ui-border-strong)]">·</span>
                          <span className="text-xs text-[var(--ui-secondary)]">{req.category}</span>
                        </div>
                        <h3 className="text-sm font-semibold text-[var(--ui-text)]">{req.name}</h3>
                        <p className="text-xs text-[var(--ui-secondary)] mt-1">{req.description}</p>
                      </div>
                      <StatusBadge status={req.status} />
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-[var(--ui-border)]">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => openProvenance(req)}
                          className="text-xs font-semibold text-[var(--ui-text)] hover:underline cursor-pointer"
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
                              className="text-xs font-bold text-[var(--ui-sage)] hover:underline inline-flex items-center gap-1"
                              title={`Open official portal: ${portalLabel}`}
                            >
                              <span>🔗 {portalLabel} ↗</span>
                            </a>
                          );
                        })()}
                      </div>
                      <div className="flex items-center gap-3">
                        <Link
                          href={`/workflows?business_id=${businessId || ""}&requirement_id=${req.requirement_id}`}
                          className="text-xs font-semibold text-[var(--ui-info)] hover:underline inline-flex items-center gap-1"
                        >
                          <span>⚡ Execute Workflow</span>
                          <span>→</span>
                        </Link>
                        <Link
                          href={`/compliance/${req.requirement_id}?business_id=${businessId}`}
                          className="text-xs font-semibold text-[var(--ui-text)] hover:underline"
                        >
                          {t("common.viewDetails")} →
                        </Link>
                      </div>
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
                      <h4 className="font-semibold text-[var(--ui-text)]">{cand.requirement_name}</h4>
                      <p className="text-[var(--ui-secondary)] line-clamp-2">{cand.applicability_statement}</p>
                      {(() => {
                        const cleanUrl = sanitizeExternalUrl(cand.source_url);
                        if (!cleanUrl) return null;
                        return (
                          <a
                            href={cleanUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[var(--ui-info)] hover:underline block pt-1 font-medium"
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
            <div className="border border-[var(--ui-border)] rounded-[16px] bg-white overflow-hidden shadow-2xs">
              <button
                type="button"
                onClick={() => setShowNotApplicableAudit(!showNotApplicableAudit)}
                className="w-full p-4 flex items-center justify-between text-left hover:bg-[var(--ui-bg)] transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <span className="text-[var(--ui-secondary)] font-mono text-sm">
                    {showNotApplicableAudit ? "▼" : "▶"}
                  </span>
                  <div>
                    <span className="text-xs font-semibold text-[var(--ui-text)]">
                      Audit Trail: Not Applicable Obligations
                    </span>
                    <span className="ml-2 inline-flex items-center rounded-full bg-[var(--ui-inset)] border border-[var(--ui-border)] px-2 py-0.5 text-[11px] font-semibold text-[var(--ui-secondary)]">
                      {notApplicableItems.length} excluded
                    </span>
                  </div>
                </div>
                <span className="text-xs font-semibold text-[var(--ui-text)]">
                  {showNotApplicableAudit ? "Hide Excluded Rules" : "Inspect Ruled-Out Obligations"}
                </span>
              </button>

              {showNotApplicableAudit && (
                <div className="p-4 border-t border-[var(--ui-border)] bg-[var(--ui-bg)] space-y-3">
                  <p className="text-xs text-[var(--ui-secondary)]">
                    The deterministic engine verified that your business profile does not meet the statutory threshold conditions for these requirements.
                  </p>
                  <div className="space-y-2">
                    {notApplicableItems.map((req) => (
                      <div
                        key={req.requirement_id}
                        className="bg-white rounded-lg border border-[var(--ui-border)] p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-[var(--ui-secondary)]">{req.requirement_id}</span>
                            <span className="text-[var(--ui-border-strong)]">·</span>
                            <span className="font-semibold text-[var(--ui-text)]">{req.name}</span>
                          </div>
                          <div className="text-[var(--ui-secondary)] text-[11px]">
                            Authority: {req.authority} · Jurisdiction: {req.jurisdiction}
                          </div>
                          {req.review_reason && <p className="text-[var(--ui-sage)] mt-2">Reviewer note: {req.review_reason}</p>}
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="inline-flex items-center rounded-full bg-[var(--ui-inset)] px-2 py-0.5 text-[11px] font-medium text-[var(--ui-secondary)] border border-[var(--ui-border)]">
                            {req.user_action_required === false ? "NO ACTION NEEDED" : "NOT APPLICABLE"}
                          </span>
                          <Link
                            href={`/compliance/${req.requirement_id}?business_id=${businessId}`}
                            className="text-xs font-medium text-[var(--ui-text)] hover:underline"
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
        <div className="min-h-screen bg-[var(--ui-bg)] flex items-center justify-center text-sm text-[var(--ui-secondary)]">
          Loading compliance requirements...
        </div>
      }
    >
      <ComplianceContent />
    </Suspense>
  );
}
