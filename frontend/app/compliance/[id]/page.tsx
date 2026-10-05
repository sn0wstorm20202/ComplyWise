"use client";

import React, { useEffect, useState, useRef, use, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import AppShell from "@/components/AppShell";
import StatusBadge from "@/components/StatusBadge";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import ErrorState from "@/components/ErrorState";
import { api } from "@/lib/api";
import { sanitizeExternalUrl } from "@/lib/url";
import { RequirementDetail } from "@/types";
import Disclosure from "@/components/product/Disclosure";
import { useLanguage } from "@/context/LanguageContext";
import { useBusinessContext } from "@/context/BusinessContext";

interface PageProps {
  params: Promise<{ id: string }>;
}
import { normalizeRequirementDetail } from "@/lib/normalizeRequirementDetail";
export { normalizeRequirementDetail };

function RequirementDetailContent({ params }: PageProps) {
  const { t } = useLanguage();
  const resolvedParams = use(params);
  const requirementId = resolvedParams.id;

  const searchParams = useSearchParams();
  const paramBusinessId = searchParams.get("business_id");
  const { activeBusinessId, activeAssessmentId } = useBusinessContext();
  const assessmentId = searchParams.get("assessment_id") || (!paramBusinessId || paramBusinessId === activeBusinessId ? activeAssessmentId : undefined) || undefined;
  const requestVersion = useRef(0);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<RequirementDetail | null>(null);
  const [businessId, setBusinessId] = useState<string>("");

  useEffect(() => {
    const version = ++requestVersion.current;
    async function init() {
      const bizId =
        paramBusinessId ||
        localStorage.getItem("complywise_active_business_id") ||
        "";
      setBusinessId(bizId);

      if (!bizId) {
        // Try fetching first business
        try {
          const list = await api.businesses.list();
          if (list.length > 0) {
            setBusinessId(list[0].id);
            loadDetail(list[0].id);
            return;
          }
        } catch {
          // ignore
        }
      }

      loadDetail(bizId);
    }

    async function loadDetail(bizId: string) {
      setLoading(true);
      setError(null);
      try {
        if (bizId) {
          const data = await api.compliance.getDetail(bizId, requirementId, assessmentId);
          if (version !== requestVersion.current) return;
          if (!data?.requirement_id) throw new Error("Requirement record unavailable");
          setDetail(normalizeRequirementDetail(data, requirementId));
          return;
        }
        throw new Error("No business ID provided");
      } catch {
        if (version !== requestVersion.current) return;
        setDetail(null);
        setError("We couldn't load this requirement. Your existing assessment is unchanged.");
      } finally {
        if (version === requestVersion.current) setLoading(false);
      }
    }

    init();
    return () => { ++requestVersion.current; };
  }, [requirementId, paramBusinessId, assessmentId]);

  return (
    <AppShell activeView="compliance">
      <div className="space-y-6 pb-6 select-none max-w-5xl mx-auto">
        {/* Header Breadcrumb & Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--ui-secondary)] min-w-0">
            <Link href="/dashboard" className="hover:text-[var(--ui-text)] transition-colors">
              {t("navigation.dashboard")}
            </Link>
            <span>/</span>
            <Link href="/compliance" className="hover:text-[var(--ui-text)] transition-colors">
              {t("navigation.compliance")}
            </Link>
            <span>/</span>
            <span className="font-mono font-bold text-[var(--ui-text)] bg-[var(--ui-inset)] px-2 py-0.5 rounded border border-[var(--ui-border)]">
              <span className="break-all">{requirementId}</span>
            </span>
          </div>

          <Link
            href="/compliance"
            className="rounded-full border border-[var(--ui-border)] bg-white px-4 py-1.5 text-xs font-semibold text-[var(--ui-text)] hover:bg-[var(--ui-bg)] transition-colors shadow-2xs"
          >
            ← {t("common.back")}
          </Link>
        </div>

        {error && (
          <ErrorState
            title="We couldn't load this requirement."
            message={error}
            onRetry={() => window.location.reload()}
          />
        )}

        {loading ? (
          <div className="space-y-6">
            <LoadingSkeleton count={1} className="h-32 w-full" />
            <LoadingSkeleton count={4} className="h-44 w-full" />
          </div>
        ) : !detail ? (
          <div className="bg-white rounded-[16px] border border-[var(--ui-border)] p-12 text-center shadow-2xs">
            <h1 className="text-xl font-semibold text-[var(--ui-text)]">This requirement isn't available.</h1>
            <p className="text-xs text-[var(--ui-secondary)] mt-1">
              Could not locate statutory specification for ID: {requirementId}.
            </p>
          </div>
        ) : (
          <>
            {/* Obligation Top Hero */}
            <div className="bg-white rounded-[16px] border border-[var(--ui-border)] p-6 sm:p-8 shadow-2xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-[var(--ui-text)] bg-[var(--ui-inset)] px-2.5 py-0.5 rounded-full border border-[var(--ui-border)]">
                      {detail.requirement_id}
                    </span>
                    <span className="text-xs font-semibold text-[var(--ui-text)]">
                      {detail.authority}
                    </span>
                    <span className="text-[var(--ui-border-strong)]">·</span>
                    <span className="text-xs text-[var(--ui-secondary)]">
                      Jurisdiction: {detail.jurisdiction}
                    </span>
                  </div>
                  <h1 className="text-xl sm:text-2xl font-sans font-bold tracking-tight text-[var(--ui-text)]">
                    {detail.name}
                  </h1>
                  <p className="text-xs text-[var(--ui-secondary)]">
                    Category: {detail.category}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/workflows?business_id=${businessId}&requirement_id=${detail.requirement_id}${assessmentId ? `&assessment_id=${assessmentId}` : ""}`}
                    className="ui-button ui-button-primary"
                  >
                    <span>Open workflow</span>
                    <span>→</span>
                  </Link>
                  {(() => {
                    const heroUrl = sanitizeExternalUrl(
                      detail.what_to_do_next.portal_url ||
                      detail.what_to_do_next.official_portal ||
                      detail.portal_url ||
                      detail.source_url ||
                      detail.statutory_evidence[0]?.canonical_url
                    );
                    const heroLabel =
                      detail.what_to_do_next.portal_name ||
                      detail.portal_name ||
                      "Official Statutory Portal";
                    if (!heroUrl) return null;
                    return (
                      <a
                        href={heroUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-full bg-[var(--ui-sage-faint)] border border-[var(--ui-sage-soft)] px-3 py-1.5 text-xs font-bold text-[var(--ui-sage)] hover:bg-[var(--ui-sage-soft)] transition-colors shadow-2xs cursor-pointer"
                        title={`Open statutory filing portal: ${heroLabel}`}
                      >
                        <span>🔗 {heroLabel}</span>
                        <span>↗</span>
                      </a>
                    );
                  })()}
                  <StatusBadge status={detail.status} size="md" />
                </div>
              </div>
            </div>

            {/* The 4 Core Questions Grid */}
            <div className="space-y-6">
              {/* Question 1: Why does this apply? */}
              <div className="bg-white rounded-[16px] border border-[var(--ui-border)] p-6 shadow-2xs space-y-3">
                <div className="flex items-center gap-2 border-b border-[var(--ui-border)] pb-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--ui-text)] text-white text-xs font-bold">
                    1
                  </span>
                  <h2 className="text-sm font-sans font-bold text-[var(--ui-text)]">
                    Why does it apply?
                  </h2>
                </div>

                <div className="space-y-3 pt-1">
                  <p className="text-xs sm:text-sm text-[var(--ui-secondary)] leading-relaxed">
                    {detail.why_it_applies.summary}
                  </p>

                  {(detail.why_it_applies.matched_rule_id || detail.why_it_applies.evaluation_notes) && (
                    <Disclosure title="Assessment rule · supporting detail">
                    <div className="rounded-xl border border-[var(--ui-border)] bg-[var(--ui-bg)] p-4 space-y-1.5">
                      {detail.why_it_applies.matched_rule_id && (
                        <div className="text-xs font-mono text-[var(--ui-text)]">
                          Matched Rule ID: {detail.why_it_applies.matched_rule_id}
                        </div>
                      )}
                      {detail.why_it_applies.evaluation_notes && (
                        <div className="text-xs text-[var(--ui-secondary)] italic">
                          Note: {detail.why_it_applies.evaluation_notes}
                        </div>
                      )}
                    </div>
                    </Disclosure>
                  )}
                </div>
              </div>

              {/* Question 2: What do I need? */}
              <div className="bg-white rounded-[16px] border border-[var(--ui-border)] p-6 shadow-2xs space-y-3">
                <div className="flex items-center gap-2 border-b border-[var(--ui-border)] pb-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--ui-text)] text-white text-xs font-bold">
                    2
                  </span>
                  <h2 className="text-sm font-sans font-bold text-[var(--ui-text)]">
                    What do you need?
                  </h2>
                </div>

                <div className="space-y-4 pt-1">
                  {detail.what_you_need.documents_available ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {detail.what_you_need.documents.map((doc, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-2.5 p-3 rounded-xl border border-[var(--ui-border)] bg-[var(--ui-bg)] text-xs text-[var(--ui-text)]"
                        >
                          <span className="text-[var(--ui-sage)] font-bold">✓</span>
                          <span>{doc}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-[var(--ui-secondary)] p-3 rounded-xl border border-[var(--ui-border)] bg-[var(--ui-bg)]">
                      {detail.what_you_need.not_recorded_note ??
                        "No document list is recorded in published knowledge for this requirement."}
                    </p>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
                    <div className="p-3 rounded-xl border border-[var(--ui-border)] bg-[var(--ui-bg)]">
                      <span className="font-medium text-[var(--ui-secondary)] block text-[10px] uppercase">Statutory Fee:</span>
                      <span className="text-[var(--ui-text)] font-medium mt-0.5 block">
                        {detail.what_you_need.statutory_fee_estimate}
                      </span>
                    </div>
                    <div className="p-3 rounded-xl border border-[var(--ui-border)] bg-[var(--ui-bg)]">
                      <span className="font-medium text-[var(--ui-secondary)] block text-[10px] uppercase">Validity Period:</span>
                      <span className="text-[var(--ui-text)] font-medium mt-0.5 block">
                        {detail.what_you_need.renewal_period_years !== null
                          ? `${detail.what_you_need.renewal_period_years} year(s) — renewal cycle recorded in published knowledge`
                          : detail.what_you_need.validity_period}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Question 3: What do I do next? */}
              <div className="bg-white rounded-[16px] border border-[var(--ui-border)] p-6 shadow-2xs space-y-3">
                <div className="flex items-center gap-2 border-b border-[var(--ui-border)] pb-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--ui-text)] text-white text-xs font-bold">
                    3
                  </span>
                  <h2 className="text-sm font-sans font-bold text-[var(--ui-text)]">
                    What should you do next?
                  </h2>
                </div>

                <div className="space-y-2.5 pt-1">
                  {detail.what_to_do_next.steps_available ? (
                    detail.what_to_do_next.steps.map((step, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-3 p-3.5 rounded-xl border border-[var(--ui-border)] bg-[var(--ui-bg)] text-xs"
                      >
                        <span className="font-semibold text-[var(--ui-text)] shrink-0">
                          Step {idx + 1}:
                        </span>
                        <span className="text-[var(--ui-secondary)]">{step}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-[var(--ui-secondary)] p-3.5 rounded-xl border border-[var(--ui-border)] bg-[var(--ui-bg)]">
                      {detail.what_to_do_next.not_recorded_note ??
                        "No application procedure is recorded in published knowledge for this requirement."}
                    </p>
                  )}

                  {(() => {
                    const filingPortalUrl = sanitizeExternalUrl(
                      detail.what_to_do_next.portal_url ||
                      detail.what_to_do_next.official_portal ||
                      detail.portal_url ||
                      detail.source_url
                    );
                    const filingPortalName =
                      detail.what_to_do_next.portal_name ||
                      detail.portal_name ||
                      `${detail.authority} Filing Portal`;
                    if (!filingPortalUrl) return null;
                    return (
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-[var(--ui-sage-soft)] bg-[var(--ui-info-soft)]/50 text-xs">
                        <div className="space-y-0.5 min-w-0">
                          <span className="font-bold text-[var(--ui-info)] block">
                            Direct Statutory Application Portal:
                          </span>
                          <span className="text-[var(--ui-secondary)] font-medium block">
                            {filingPortalName}
                          </span>
                        </div>
                        <a
                          href={filingPortalUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[var(--ui-text)] font-semibold text-white hover:bg-[var(--ui-text)] transition shadow-2xs shrink-0 self-start sm:self-auto cursor-pointer"
                        >
                          <span>Open Filing Portal</span>
                          <span>↗</span>
                        </a>
                      </div>
                    );
                  })()}

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-[var(--ui-sage-soft)] bg-[var(--ui-sage-faint)]/50 text-xs">
                    <div className="space-y-0.5 min-w-0">
                      <span className="font-bold text-[var(--ui-sage)] block">
                        Interactive Clearance Workflow:
                      </span>
                      <span className="text-[var(--ui-secondary)] font-medium block">
                        Manage the steps, documents and references for this requirement.
                      </span>
                    </div>
                    <Link
                      href={`/workflows?business_id=${businessId}&requirement_id=${detail.requirement_id}${assessmentId ? `&assessment_id=${assessmentId}` : ""}`}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[var(--ui-sage)] font-semibold text-white hover:bg-[var(--ui-sage)] transition shadow-2xs shrink-0 self-start sm:self-auto cursor-pointer"
                    >
                      <span>Open Interactive Workflow</span>
                      <span>→</span>
                    </Link>
                  </div>
                </div>
              </div>

              {/* Question 4: Where did this come from? (Statutory evidence) */}
              <div className="bg-white rounded-[16px] border border-[var(--ui-border)] p-6 shadow-2xs space-y-3">
                <div className="flex items-center gap-2 border-b border-[var(--ui-border)] pb-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--ui-text)] text-white text-xs font-bold">
                    4
                  </span>
                  <h2 className="text-sm font-sans font-bold text-[var(--ui-text)]">
                    Where does this come from?
                  </h2>
                </div>

                {detail.statutory_evidence.length === 0 ? (
                  <p className="text-xs text-[var(--ui-secondary)] py-4">
                    No source passage is recorded for this requirement yet.
                  </p>
                ) : (
                  <div className="space-y-3 pt-1">
                    {detail.statutory_evidence.map((ev) => (
                      <div
                        key={ev.evidence_id}
                        className="p-4 rounded-xl border border-[var(--ui-border)] bg-[var(--ui-bg)] space-y-2"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <span className="font-mono text-xs font-bold text-[var(--ui-text)] bg-white px-2 py-0.5 rounded border border-[var(--ui-border)]">
                              {ev.evidence_id}
                            </span>
                            <span className="text-[var(--ui-border-strong)] mx-2">·</span>
                            <span className="text-xs font-semibold text-[var(--ui-text)]">
                              {ev.source_title} ({ev.authority})
                            </span>
                          </div>
                          <span className="inline-flex items-center rounded-full bg-[var(--ui-sage-faint)] px-2.5 py-0.5 text-[11px] font-semibold text-[var(--ui-sage)] border border-[var(--ui-sage-soft)]">
                            {ev.verification_status}
                          </span>
                        </div>

                        <div className="text-xs text-[var(--ui-secondary)] font-mono bg-white p-2.5 rounded-lg border border-[var(--ui-border)]">
                          {ev.locator}: &ldquo;{ev.excerpt}&rdquo;
                        </div>

                        {(() => {
                          const gazetteUrl = sanitizeExternalUrl(ev.canonical_url);
                          if (!gazetteUrl) return null;
                          return (
                            <div className="flex justify-end pt-1">
                              <a
                                href={gazetteUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs font-semibold text-[var(--ui-info)] hover:underline"
                              >
                                Official Gazette Reference ↗
                              </a>
                            </div>
                          );
                        })()}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}

export default function RequirementDetailPage({ params }: PageProps) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[var(--ui-bg)] flex items-center justify-center text-sm text-[var(--ui-secondary)]">
          Loading requirement details...
        </div>
      }
    >
      <RequirementDetailContent params={params} />
    </Suspense>
  );
}
