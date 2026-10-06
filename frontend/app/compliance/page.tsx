"use client";

import React, { useEffect, useState, useRef, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import AppShell from "@/components/AppShell";
import RequirementCard from "@/components/product/RequirementCard";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import ErrorState from "@/components/ErrorState";
import WhyThisAppliesModal from "@/components/WhyThisAppliesModal";
import { api } from "@/lib/api";
import { ComplianceRequirementItem, CandidateRequirement, Business } from "@/types";
import { resolveAuthorityPortalUrl } from "@/lib/authorityPortals";
import { useLanguage } from "@/context/LanguageContext";
import { useBusinessContext } from "@/context/BusinessContext";

function ComplianceContent() {
  const { t } = useLanguage();
  const { activeBusinessId: contextBusinessId, activeAssessmentId } = useBusinessContext();
  const searchParams = useSearchParams();
  const paramBusinessId = searchParams.get("business_id");

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [requirements, setRequirements] = useState<ComplianceRequirementItem[]>([]);
  const [candidates, setCandidates] = useState<CandidateRequirement[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [businessId, setBusinessId] = useState<string | null>(null);

  const [categoryFilter, setCategoryFilter] = useState<string>("");

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
  }, [paramBusinessId, contextBusinessId, activeAssessmentId, searchParams, categoryFilter]);

  // Action Required bucket only: primary founder obligations
  const actionRequiredItems = requirements.filter(
    (r) =>
      r.user_action_required !== false && (r.admin_disposition === "CONFIRMED_REQUIRED" || r.status === "SUGGESTED" ||
      r.status === "APPLICABLE" ||
      r.status === "NEEDS_INFORMATION" ||
      (r.status as string) === "NEEDS_VERIFICATION")
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
              Reviewed requirements and contextual next steps for this assessment. Action required items prioritized for execution.
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

        {/* Controls / Filter Bar: Action Required Only */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--ui-border)] pb-2">
          <div className="flex items-center gap-2">
            <div className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-full bg-[var(--ui-text)] text-white shadow-2xs">
              <span>{t("compliance.actionRequired")}</span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-white">
                {actionRequiredItems.length}
              </span>
            </div>
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
        ) : (
          /* PRIMARY FOUNDER VIEW: ACTION REQUIRED ONLY */
          <div className="space-y-4">
            {actionRequiredItems.length === 0 ? (
              <div className="bg-white rounded-[16px] border border-[var(--ui-border)] p-12 text-center shadow-2xs">
                <p className="text-sm font-semibold text-[var(--ui-text)]">{t("common.noData")}</p>
                <p className="text-xs text-[var(--ui-secondary)] mt-1">{t("compliance.filterByStatus")}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {actionRequiredItems.map((req) => (
                  <RequirementCard
                    key={req.requirement_id}
                    requirement={req}
                    businessId={businessId}
                    assessmentId={
                      searchParams.get("assessment_id") ||
                      (businessId === contextBusinessId ? activeAssessmentId : undefined)
                    }
                    onInspect={() => openProvenance(req)}
                  />
                ))}
              </div>
            )}
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
