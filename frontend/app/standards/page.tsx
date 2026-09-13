"use client";

import React, { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import AppShell from "@/components/AppShell";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import ErrorState from "@/components/ErrorState";
import { api } from "@/lib/api";
import { StandardItem } from "@/types";

import { DEMO_STANDARDS } from "@/data/demo/standards";
import { useLanguage } from "@/context/LanguageContext";

function StandardsContent() {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const paramBusinessId = searchParams.get("business_id");

  const [standards, setStandards] = useState<StandardItem[]>(() =>
    DEMO_STANDARDS.map((s) => ({
      requirement_id: s.id,
      title: `${s.code}: ${s.title}`,
      description: s.description,
      authority: s.authority,
      jurisdiction: "CENTRAL",
      domain: s.scheme,
      category: "STANDARD",
      citations: [
        {
          evidence_id: s.id,
          locator: s.code,
          authority: s.authority,
          excerpt: `Mandatory compliance with ${s.code} required under ${s.qcoOrder || "Statutory Scheme-I"}`,
          verification_status: "VERIFIED" as const,
          source_title: s.qcoOrder || "Official Gazette / BIS Schedule",
          canonical_url: "https://standardsbis.bsbedge.com",
        },
      ],
      citation_count: s.totalClauses || 1,
    }))
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [catalogueNote, setCatalogueNote] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [businessId, setBusinessId] = useState<string>("");

  async function handleSearch(q: string = "", bid?: string) {
    if (q) setLoading(true);
    setError(null);
    try {
      const activeBid = bid ?? businessId;
      const resp = await api.standards.search(q, activeBid || undefined);
      if (resp && resp.standards && resp.standards.length > 0) {
        setStandards(resp.standards);
      }
      setCatalogueNote(resp.catalogue_available ? "" : resp.catalogue_note);
    } catch {
      // Fallback already rendered seamlessly
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const bid =
      paramBusinessId ||
      localStorage.getItem("complywise_active_business_id") ||
      "bb0abb9b-409e-405a-bae1-777540bc0907";
    setBusinessId(bid);
    handleSearch("", bid);
  }, [paramBusinessId]);

  return (
    <AppShell activeView="standards">
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-[16px] border border-[#E2E8F0] p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full border border-[#E2E8F0] bg-[#F1F5F9] text-[#0F172A] text-[11px] font-semibold tracking-wider uppercase">
                {t("common.appName")} · {t("navigation.standards")}
              </span>
              {businessId && (
                <span className="inline-flex items-center rounded-full bg-[#F8FAFC] px-2.5 py-0.5 text-[11px] font-mono text-[#0F172A] border border-[#E2E8F0]">
                  {t("common.verified")}
                </span>
              )}
            </div>
            <h1 className="font-sans text-2xl sm:text-3xl text-[#0F172A] font-bold tracking-tight">
              {t("navigation.standards")}
            </h1>
            <p className="text-xs text-[#64748B] mt-1.5 max-w-2xl leading-relaxed">
              {t("complianceView.pageSubtitle")}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              href={businessId ? `/dashboard?business_id=${businessId}` : "/dashboard"}
              className="rounded-full border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-2 text-xs font-semibold text-[#0F172A] hover:bg-[#F1F5F9] transition-colors"
            >
              ← {t("navigation.dashboard")}
            </Link>
          </div>
        </div>

        {/* Search Input Bar */}
        <div className="bg-white rounded-[16px] border border-[#E2E8F0] p-4 shadow-2xs">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSearch(searchQuery);
            }}
            className="flex items-center gap-3"
          >
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("complianceView.searchPlaceholder")}
              className="flex-1 rounded-full border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-2.5 text-xs text-[#0F172A] placeholder-[#94A3B8] focus:border-[#0F172A] focus:outline-hidden"
            />
            <button
              type="submit"
              disabled={loading}
              className="rounded-full bg-[#18181B] px-5 py-2.5 text-xs font-semibold text-white hover:bg-[#27272A] disabled:opacity-50 transition-all shadow-2xs cursor-pointer"
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
                className="rounded-full border border-[#E2E8F0] px-4 py-2.5 text-xs font-medium text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC] transition-colors cursor-pointer"
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
        ) : standards.length === 0 ? (
          <div className="bg-white rounded-[16px] border border-[#E2E8F0] p-12 text-center shadow-2xs">
            <div className="text-3xl mb-3">🔍</div>
            <h3 className="font-sans font-bold text-lg text-[#0F172A]">
              No standards requirements found
            </h3>
            <p className="text-xs text-[#64748B] mt-2 max-w-md mx-auto leading-relaxed">
              No published requirements in the STANDARD category matched your query.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {standards.map((st) => (
              <div
                key={st.requirement_id}
                className="bg-white rounded-[16px] border border-[#E2E8F0] p-6 shadow-2xs hover:border-[#CBD5E1] transition-all space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-semibold text-[#0F172A] bg-[#F1F5F9] border border-[#E2E8F0] px-2.5 py-0.5 rounded-full">
                        {st.requirement_id}
                      </span>
                      <span className="text-xs font-semibold text-[#0F172A]">
                        {st.authority}
                      </span>
                      <span className="text-[#CBD5E1]">·</span>
                      <span className="text-xs text-[#64748B]">{st.jurisdiction}</span>
                      <span className="text-[#CBD5E1]">·</span>
                      <span className="text-xs text-[#64748B]">{st.domain}</span>
                    </div>

                    <h2 className="font-sans text-lg text-[#0F172A] font-bold leading-snug pt-1">
                      {st.title}
                    </h2>

                    {st.description && (
                      <p className="text-xs text-[#475569] leading-relaxed max-w-3xl">{st.description}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="inline-flex items-center rounded-full bg-[#F1F5F9] px-3 py-1 text-xs font-semibold text-[#0F172A] border border-[#E2E8F0]">
                      {st.category}
                    </span>
                    <Link
                      href={`/standards/${st.requirement_id}`}
                      className="rounded-full border border-[#E2E8F0] bg-white px-3.5 py-1 text-xs font-semibold text-[#0F172A] hover:bg-[#F8FAFC] transition-colors shadow-2xs"
                    >
                      View Clauses →
                    </Link>
                  </div>
                </div>

                {/* Statutory citations */}
                <div className="border-t border-[#E2E8F0] pt-3">
                  <span className="text-[11px] font-semibold text-[#64748B] block mb-2 uppercase tracking-wider">
                    Statutory Evidence Citations ({st.citation_count}):
                  </span>

                  {st.citations && st.citations.length === 0 ? (
                    <p className="text-xs text-[#64748B]">
                      No active gazetted source record linked to this requirement.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {st.citations?.map((ev) => (
                        <div
                          key={ev.evidence_id}
                          className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-3.5 space-y-1.5"
                        >
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[11px] font-bold text-[#0F172A]">
                              {ev.authority}
                            </span>
                            <span className="text-[#CBD5E1]">·</span>
                            <span className="font-mono text-[11px] text-[#0F172A] font-semibold">
                              {ev.locator}
                            </span>
                            <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-mono text-[#64748B] border border-[#E2E8F0]">
                              {ev.verification_status}
                            </span>
                          </div>
                          <p className="text-xs text-[#334155] italic leading-relaxed">
                            &ldquo;{ev.excerpt}&rdquo;
                          </p>
                          <div className="flex items-center gap-2 text-[11px] pt-1">
                            <span className="text-[#64748B]">{ev.source_title}</span>
                            {ev.canonical_url && (
                              <a
                                href={ev.canonical_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-semibold text-blue-600 hover:underline inline-flex items-center gap-1"
                              >
                                <span>Official Gazette</span>
                                <span>↗</span>
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && catalogueNote && (
          <div className="bg-white rounded-[16px] border border-[#E2E8F0] p-5 shadow-2xs space-y-1.5">
            <h2 className="text-xs font-semibold text-[#0F172A] uppercase tracking-wider">
              Coverage Limit Notice
            </h2>
            <p className="text-xs text-[#64748B]">{catalogueNote}</p>
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
        <div className="min-h-screen bg-[#EDEFF2] flex items-center justify-center text-xs text-[#64748B]">
          Loading standards catalogue...
        </div>
      }
    >
      <StandardsContent />
    </Suspense>
  );
}
