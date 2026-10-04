"use client";

import React, { useEffect, useState, useRef, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import AppShell from "@/components/AppShell";
import Disclosure from "@/components/product/Disclosure";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import ErrorState from "@/components/ErrorState";
import { api } from "@/lib/api";
import { StandardItem } from "@/types";
import { sanitizeExternalUrl } from "@/lib/url";

import { useBusinessContext } from "@/context/BusinessContext";
import { useLanguage } from "@/context/LanguageContext";

function StandardsContent() {
  const { t } = useLanguage();
  const { activeBusinessId, activeAssessmentId } = useBusinessContext();
  const searchParams = useSearchParams();
  const paramBusinessId = searchParams.get("business_id");
  const assessmentId = searchParams.get("assessment_id") || (paramBusinessId && paramBusinessId !== activeBusinessId ? undefined : activeAssessmentId);

  const [standards, setStandards] = useState<StandardItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [catalogueNote, setCatalogueNote] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [businessId, setBusinessId] = useState<string>("");
  const [scopeNote, setScopeNote] = useState<string>("");

  const requestVersion = useRef(0);
  async function handleSearch(q: string = "", bid?: string) {
    const version = ++requestVersion.current;
    setLoading(true);
    setError(null);
    try {
      const activeBid = bid ?? businessId;
      if (!activeBid) { setStandards([]); setScopeNote("Select a business to view standards for its assessment."); return; }
      const resp = await api.standards.search(q, activeBid, assessmentId || undefined);
      if (version !== requestVersion.current) return;
      setStandards(resp.standards || []);
      setCatalogueNote(resp.catalogue_available ? "" : resp.catalogue_note);
      setScopeNote(resp.scope_note || "No reviewed standards matched this assessment within the currently supported knowledge scope. Additional review may be required.");
    } catch {
      if (version !== requestVersion.current) return;
      setStandards([]);
      setError("We couldn't search standards. Please try again.");
    } finally {
      if (version === requestVersion.current) setLoading(false);
    }
  }

  useEffect(() => {
    const bid =
      paramBusinessId ||
      activeBusinessId || "";
    setBusinessId(bid);
    handleSearch("", bid);
  }, [paramBusinessId, activeBusinessId, assessmentId]);

  return (
    <AppShell activeView="standards">
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-[16px] border border-[var(--ui-border)] p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full border border-[var(--ui-border)] bg-[var(--ui-inset)] text-[var(--ui-text)] text-[11px] font-semibold tracking-wider uppercase">
                {t("common.appName")} · {t("navigation.standards")}
              </span>
              {businessId && (
                <span className="inline-flex items-center rounded-full bg-[var(--ui-bg)] px-2.5 py-0.5 text-[11px] font-mono text-[var(--ui-text)] border border-[var(--ui-border)]">
                  Selected business
                </span>
              )}
            </div>
            <h1 className="font-sans text-2xl sm:text-3xl text-[var(--ui-text)] font-bold tracking-tight">
              {t("navigation.standards")}
            </h1>
            <p className="text-xs text-[var(--ui-secondary)] mt-1.5 max-w-2xl leading-relaxed">
              Reviewed standards and quality planning for your saved business assessment.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              href={businessId ? `/dashboard?business_id=${businessId}` : "/dashboard"}
              className="rounded-full border border-[var(--ui-border)] bg-[var(--ui-bg)] px-4 py-2 text-xs font-semibold text-[var(--ui-text)] hover:bg-[var(--ui-inset)] transition-colors"
            >
              ← {t("navigation.dashboard")}
            </Link>
          </div>
        </div>

        {/* Search Input Bar */}
        <div className="bg-white rounded-[16px] border border-[var(--ui-border)] p-4 shadow-2xs">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSearch(searchQuery);
            }}
            className="flex items-center gap-3"
          >
            <input
              aria-label="Search standards"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("complianceView.searchPlaceholder")}
              className="flex-1 rounded-full border border-[var(--ui-border)] bg-[var(--ui-bg)] px-4 py-2.5 text-xs text-[var(--ui-text)] placeholder-[var(--ui-muted)] focus:border-[var(--ui-text)] focus:outline-hidden"
            />
            <button
              type="submit"
              disabled={loading}
              className="rounded-full bg-[var(--ui-text)] px-5 py-2.5 text-xs font-semibold text-white hover:bg-[var(--ui-text)] disabled:opacity-50 transition-all shadow-2xs cursor-pointer"
            >
              {t("common.search")}
            </button>
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  handleSearch("");
                }}
                className="rounded-full border border-[var(--ui-border)] px-4 py-2.5 text-xs font-medium text-[var(--ui-secondary)] hover:text-[var(--ui-text)] hover:bg-[var(--ui-bg)] transition-colors cursor-pointer"
              >
                {t("common.cancel")}
              </button>
            )}
          </form>
        </div>

        {error && (
          <ErrorState
            title="Standards Service Notice"
            message={error}
            onRetry={() => handleSearch(searchQuery)}
          />
        )}

        {loading ? (
          <div className="space-y-4">
            <LoadingSkeleton count={3} className="h-40 w-full rounded-[16px]" />
          </div>
        ) : error ? null : standards.length === 0 ? (
          <div className="bg-white rounded-[16px] border border-[var(--ui-border)] p-12 text-center shadow-2xs">
            <div className="text-3xl mb-3">🔍</div>
            <h3 className="font-sans font-bold text-lg text-[var(--ui-text)]">
              {businessId ? "No reviewed standards matched" : "Select a business"}
            </h3>
            <p className="text-xs text-[var(--ui-secondary)] mt-2 max-w-md mx-auto leading-relaxed">
              {searchQuery ? "No results matched this search within the supported knowledge scope." : scopeNote}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {standards.map((st) => (
              <div
                key={st.requirement_id}
                className="bg-white rounded-[16px] border border-[var(--ui-border)] p-6 shadow-2xs hover:border-[var(--ui-border-strong)] transition-all space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-semibold text-[var(--ui-text)] bg-[var(--ui-inset)] border border-[var(--ui-border)] px-2.5 py-0.5 rounded-full">
                        {st.result_origin === "LLM_FALLBACK_RESULT" ? "Quality area to explore" : st.requirement_id}
                      </span>
                      <span className="text-xs font-semibold text-[var(--ui-text)]">
                        {st.authority}
                      </span>
                      <span className="text-[var(--ui-border-strong)]">·</span>
                      <span className="text-xs text-[var(--ui-secondary)]">{st.jurisdiction}</span>
                      <span className="text-[var(--ui-border-strong)]">·</span>
                      <span className="text-xs text-[var(--ui-secondary)]">{st.domain}</span>
                    </div>

                    <h2 className="font-sans text-lg text-[var(--ui-text)] font-bold leading-snug pt-1">
                      {st.title}
                    </h2>

                    {st.description && (
                      <p className="text-xs text-[var(--ui-secondary)] leading-relaxed max-w-3xl">{st.description}</p>
                    )}
                    {st.why_it_matters && <p className="text-xs text-[var(--ui-secondary)]">Why it is relevant: {st.why_it_matters}</p>}
                    <p className="text-xs text-[var(--ui-muted)]">{st.result_origin === "LLM_FALLBACK_RESULT" ? "Contextual planning guidance — no reviewed standard or mandatory status established." : st.is_mandatory === true ? "Mandatory within the recorded rule scope" : st.is_mandatory === false ? "Voluntary" : "Mandatory status not recorded"}</p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="inline-flex items-center rounded-full bg-[var(--ui-inset)] px-3 py-1 text-xs font-semibold text-[var(--ui-text)] border border-[var(--ui-border)]">
                      {st.category}
                    </span>
                    <Link
                      href={`/standards/${st.requirement_id}?business_id=${businessId}${assessmentId ? `&assessment_id=${assessmentId}` : ""}`}
                      className="rounded-full border border-[var(--ui-border)] bg-white px-3.5 py-1 text-xs font-semibold text-[var(--ui-text)] hover:bg-[var(--ui-bg)] transition-colors shadow-2xs"
                    >
                      View details →
                    </Link>
                  </div>
                </div>

                {/* Statutory citations */}
                <Disclosure title={`Evidence & source clauses (${st.citation_count || 0})`}>
                  <span className="text-[11px] font-semibold text-[var(--ui-secondary)] block mb-2 uppercase tracking-wider">
                    Statutory Evidence Citations ({st.citation_count}):
                  </span>

                  {st.citations && st.citations.length === 0 ? (
                    <p className="text-xs text-[var(--ui-secondary)]">
                      {st.source_reference ? `Contextual source/authority: ${st.source_reference}.` : "No reviewed source passage is linked to this item."}
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {st.citations?.map((ev) => (
                        <div
                          key={ev.evidence_id}
                          className="rounded-xl border border-[var(--ui-border)] bg-[var(--ui-bg)] p-3.5 space-y-1.5"
                        >
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[11px] font-bold text-[var(--ui-text)]">
                              {ev.authority}
                            </span>
                            <span className="text-[var(--ui-border-strong)]">·</span>
                            <span className="font-mono text-[11px] text-[var(--ui-text)] font-semibold">
                              {ev.locator}
                            </span>
                            <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-mono text-[var(--ui-secondary)] border border-[var(--ui-border)]">
                              {ev.verification_status}
                            </span>
                          </div>
                          <p className="text-xs text-[var(--ui-secondary)] italic leading-relaxed">
                            &ldquo;{ev.excerpt}&rdquo;
                          </p>
                          <div className="flex items-center gap-2 text-[11px] pt-1">
                            <span className="text-[var(--ui-secondary)]">{ev.source_title}</span>
                            {sanitizeExternalUrl(ev.canonical_url) && (
                              <a
                                href={sanitizeExternalUrl(ev.canonical_url)!}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-semibold text-[var(--ui-info)] hover:underline inline-flex items-center gap-1"
                              >
                                <span>View source</span>
                                <span>↗</span>
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Disclosure>
              </div>
            ))}
          </div>
        )}

        {!loading && catalogueNote && (
          <div className="bg-white rounded-[16px] border border-[var(--ui-border)] p-5 shadow-2xs space-y-1.5">
            <h2 className="text-xs font-semibold text-[var(--ui-text)] uppercase tracking-wider">
              About these suggestions
            </h2>
            <p className="text-xs text-[var(--ui-secondary)]">{catalogueNote}</p>
          </div>
        )}
      </div>
    </AppShell>
  );
}

export default function StandardsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[var(--ui-bg)] flex items-center justify-center text-xs text-[var(--ui-secondary)]">
          Loading standards catalogue...
        </div>
      }
    >
      <StandardsContent />
    </Suspense>
  );
}
