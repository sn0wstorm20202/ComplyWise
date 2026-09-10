"use client";

import React, { useEffect, useState, use, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import StatusBadge from "@/components/StatusBadge";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import ErrorState from "@/components/ErrorState";
import { api } from "@/lib/api";
import { sanitizeExternalUrl } from "@/lib/url";
import { RequirementDetail } from "@/types";

interface PageProps {
  params: Promise<{ id: string }>;
}

function RequirementDetailContent({ params }: PageProps) {
  const resolvedParams = use(params);
  const requirementId = resolvedParams.id;

  const searchParams = useSearchParams();
  const paramBusinessId = searchParams.get("business_id");

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<RequirementDetail | null>(null);
  const [businessId, setBusinessId] = useState<string>("");

  useEffect(() => {
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
        setLoading(false);
        return;
      }

      loadDetail(bizId);
    }

    async function loadDetail(bizId: string) {
      setLoading(true);
      setError(null);
      try {
        const data = await api.compliance.getDetail(bizId, requirementId);
        setDetail(data);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load requirement details.");
      } finally {
        setLoading(false);
      }
    }

    init();
  }, [requirementId, paramBusinessId]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header Breadcrumb & Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Link href={`/dashboard?business_id=${businessId}`} className="hover:text-slate-900">
              Dashboard
            </Link>
            <span>/</span>
            <Link href={`/compliance?business_id=${businessId}`} className="hover:text-slate-900">
              Compliance Matrix
            </Link>
            <span>/</span>
            <span className="font-mono font-bold text-slate-700">{requirementId}</span>
          </div>

          <Link
            href={`/compliance?business_id=${businessId}`}
            className="rounded-lg border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            ← Back to Matrix
          </Link>
        </div>

        {error && (
          <ErrorState
            title="Obligation Detail Notice"
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
          <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-xs">
            <h3 className="text-sm font-bold text-slate-900">Requirement Not Found</h3>
            <p className="text-xs text-slate-500 mt-1">
              Could not locate statutory specification for ID: {requirementId}.
            </p>
          </div>
        ) : (
          <>
            {/* Obligation Top Hero */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded border border-indigo-200">
                      {detail.requirement_id}
                    </span>
                    <span className="text-xs font-semibold text-slate-700">
                      {detail.authority}
                    </span>
                    <span className="text-slate-300">·</span>
                    <span className="text-xs text-slate-500">
                      Jurisdiction: {detail.jurisdiction}
                    </span>
                  </div>
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-950">
                    {detail.name}
                  </h1>
                  <p className="text-xs text-slate-500">
                    Category: {detail.category} · Regulatory domain evaluated via deterministic rule engine.
                  </p>
                </div>

                <div className="shrink-0 flex items-center gap-2">
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
                        className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-1.5 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition-colors shadow-2xs"
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
              <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-3">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-white text-xs font-bold">
                    1
                  </span>
                  <h2 className="text-sm font-bold text-slate-900">
                    Why does this requirement apply to your enterprise?
                  </h2>
                </div>

                <div className="space-y-3 pt-1">
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                    {detail.why_it_applies.summary}
                  </p>

                  {(detail.why_it_applies.matched_rule_id || detail.why_it_applies.evaluation_notes) && (
                    <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-4 space-y-1.5">
                      {detail.why_it_applies.matched_rule_id && (
                        <div className="text-xs font-mono text-indigo-700">
                          Matched Rule ID: {detail.why_it_applies.matched_rule_id}
                        </div>
                      )}
                      {detail.why_it_applies.evaluation_notes && (
                        <div className="text-xs text-slate-600 italic">
                          Note: {detail.why_it_applies.evaluation_notes}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Question 2: What do I need? */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-3">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-white text-xs font-bold">
                    2
                  </span>
                  <h2 className="text-sm font-bold text-slate-900">
                    What documents and evidentiary proofs do you need?
                  </h2>
                </div>

                <div className="space-y-4 pt-1">
                  {/* No document list is held for most requirements today. Saying so
                      is the honest state; an empty grid would read as "none needed". */}
                  {detail.what_you_need.documents_available ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {detail.what_you_need.documents.map((doc, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-100 bg-slate-50/60 text-xs text-slate-800"
                        >
                          <span className="text-emerald-600 font-bold">✓</span>
                          <span>{doc}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 p-3 rounded-xl border border-slate-100 bg-slate-50/60">
                      {detail.what_you_need.not_recorded_note ??
                        "No document list is recorded in published knowledge for this requirement."}
                    </p>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
                    <div className="p-3 rounded-xl border border-slate-100 bg-slate-50/50">
                      <span className="font-semibold text-slate-600 block">Statutory Fee:</span>
                      <span className="text-slate-900 font-medium mt-0.5 block">
                        {detail.what_you_need.statutory_fee_estimate}
                      </span>
                    </div>
                    <div className="p-3 rounded-xl border border-slate-100 bg-slate-50/50">
                      <span className="font-semibold text-slate-600 block">Validity Period:</span>
                      <span className="text-slate-900 font-medium mt-0.5 block">
                        {detail.what_you_need.renewal_period_years !== null
                          ? `${detail.what_you_need.renewal_period_years} year(s) — renewal cycle recorded in published knowledge`
                          : detail.what_you_need.validity_period}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Question 3: What do I do next? */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-3">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-white text-xs font-bold">
                    3
                  </span>
                  <h2 className="text-sm font-bold text-slate-900">
                    What are the immediate next procedural steps?
                  </h2>
                </div>

                <div className="space-y-2.5 pt-1">
                  {/* Application steps come from published requirement metadata. Where
                      none are recorded, no procedure is invented here. */}
                  {detail.what_to_do_next.steps_available ? (
                    detail.what_to_do_next.steps.map((step, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-100 bg-slate-50/60 text-xs"
                      >
                        <span className="font-bold text-indigo-600 shrink-0">
                          Step {idx + 1}:
                        </span>
                        <span className="text-slate-800">{step}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-500 p-3.5 rounded-xl border border-slate-100 bg-slate-50/60">
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
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-indigo-100 bg-indigo-50/50 text-xs">
                        <div className="space-y-0.5 min-w-0">
                          <span className="font-bold text-indigo-950 block">
                            Direct Statutory Application Portal:
                          </span>
                          <span className="text-slate-600 font-medium block">
                            {filingPortalName}
                          </span>
                        </div>
                        <a
                          href={filingPortalUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-600 font-semibold text-white hover:bg-indigo-700 transition shadow-xs shrink-0 self-start sm:self-auto"
                        >
                          <span>Open Filing Portal</span>
                          <span>↗</span>
                        </a>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Question 4: Where did this come from? (Statutory evidence) */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-3">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-white text-xs font-bold">
                    4
                  </span>
                  <h2 className="text-sm font-bold text-slate-900">
                    Statutory Evidence & Legal Authority Citation Trace
                  </h2>
                </div>

                {detail.statutory_evidence.length === 0 ? (
                  <p className="text-xs text-slate-500 py-4">
                    Statutory citation trace registered under standard Central Gazettes.
                  </p>
                ) : (
                  <div className="space-y-3 pt-1">
                    {detail.statutory_evidence.map((ev) => (
                      <div
                        key={ev.evidence_id}
                        className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 space-y-2"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <span className="font-mono text-xs font-bold text-indigo-700">
                              {ev.evidence_id}
                            </span>
                            <span className="text-slate-300 mx-2">·</span>
                            <span className="text-xs font-semibold text-slate-900">
                              {ev.source_title} ({ev.authority})
                            </span>
                          </div>
                          <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-200">
                            {ev.verification_status}
                          </span>
                        </div>

                        <div className="text-xs text-slate-700 font-mono bg-white p-2.5 rounded-lg border border-slate-200/80">
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
                                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
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
      </main>
    </div>
  );
}

export default function RequirementDetailPage({ params }: PageProps) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center text-sm text-slate-500">
          Loading requirement details...
        </div>
      }
    >
      <RequirementDetailContent params={params} />
    </Suspense>
  );
}
