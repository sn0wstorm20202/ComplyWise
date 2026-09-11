"use client";

import React, { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import AppShell from "@/components/AppShell";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import ErrorState from "@/components/ErrorState";
import { api } from "@/lib/api";
import { StandardItem } from "@/types";

function StandardsContent() {
  const searchParams = useSearchParams();
  const paramBusinessId = searchParams.get("business_id");

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [standards, setStandards] = useState<StandardItem[]>([]);
  const [catalogueNote, setCatalogueNote] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [businessId, setBusinessId] = useState<string>("");

  async function handleSearch(q: string = "", bid?: string) {
    setLoading(true);
    setError(null);
    try {
      const activeBid = bid ?? businessId;
      const resp = await api.standards.search(q, activeBid || undefined);
      setStandards(resp.standards);
      setCatalogueNote(resp.catalogue_available ? "" : resp.catalogue_note);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to search standards repository.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const bid = paramBusinessId || localStorage.getItem("complywise_active_business_id") || "";
    setBusinessId(bid);
    handleSearch("", bid);
  }, [paramBusinessId]);

  return (
    <AppShell activeView="standards">
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-[#040406] rounded-[10px] border border-[#1c1d22] p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-32 bg-radial from-[#cc9166]/10 to-transparent blur-2xl pointer-events-none" />
          
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full border border-[#cc9166]/30 bg-[#cc9166]/10 text-[#cc9166] text-[11px] font-semibold tracking-wider uppercase">
                Screen 14 · Quality Mandates
              </span>
              {businessId && (
                <span className="inline-flex items-center rounded-full bg-[#121317] px-2.5 py-0.5 text-[11px] font-mono text-[#e2e3e9] border border-[#2e3038]">
                  Enterprise Profile Synced
                </span>
              )}
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl text-[#ffffff] tracking-tight">
              Published Standards & Technical Specifications
            </h1>
            <p className="text-xs text-[#9194a1] mt-1.5 max-w-2xl leading-relaxed">
              Search Indian Standards (IS), mandatory Quality Control Orders (QCOs), and test methods linked with statutory evidence citations.
            </p>
          </div>

          <div className="flex items-center gap-3 relative z-10 shrink-0">
            <Link
              href={businessId ? `/dashboard?business_id=${businessId}` : "/dashboard"}
              className="rounded-full border border-[#2e3038] bg-[#121317] px-4 py-2 text-xs font-medium text-[#e2e3e9] hover:text-[#ffffff] hover:border-[#5e616e] transition-colors"
            >
              ← Dashboard
            </Link>
          </div>
        </div>

        {/* Search Input Bar */}
        <div className="bg-[#040406] rounded-[10px] border border-[#1c1d22] p-4 shadow-2xl">
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
              placeholder="Search by requirement name, authority, standard code (e.g., IS 1293, QCO)..."
              className="flex-1 rounded-full border border-[#1c1d22] bg-[#121317] px-4 py-2.5 text-xs text-[#ffffff] placeholder-[#5e616e] focus:border-[#cc9166] focus:outline-none"
            />
            <button
              type="submit"
              disabled={loading}
              className="rounded-full bg-[#cc9166] px-5 py-2.5 text-xs font-semibold text-black hover:bg-[#d99f75] disabled:opacity-50 transition-all shadow-[0_0_15px_rgba(204,145,102,0.25)]"
            >
              Search
            </button>
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  handleSearch("");
                }}
                className="rounded-full border border-[#2e3038] px-4 py-2.5 text-xs font-medium text-[#9194a1] hover:text-[#ffffff] hover:bg-[#121317] transition-colors"
              >
                Clear
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
            <LoadingSkeleton count={3} className="h-40 w-full rounded-[10px]" />
          </div>
        ) : standards.length === 0 ? (
          <div className="bg-[#040406] rounded-[10px] border border-[#1c1d22] p-12 text-center shadow-2xl">
            <div className="text-3xl mb-3">🔍</div>
            <h3 className="font-serif text-lg text-[#ffffff]">
              No standards requirements found
            </h3>
            <p className="text-xs text-[#9194a1] mt-2 max-w-md mx-auto leading-relaxed">
              No published requirements in the STANDARD category matched your query.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {standards.map((st) => (
              <div
                key={st.requirement_id}
                className="bg-[#040406] rounded-[10px] border border-[#1c1d22] p-6 shadow-2xl hover:border-[#2e3038] transition-all space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-semibold text-[#e2e3e9] bg-[#121317] border border-[#2e3038] px-2.5 py-0.5 rounded-full">
                        {st.requirement_id}
                      </span>
                      <span className="text-xs font-medium text-[#ffffff]">
                        {st.authority}
                      </span>
                      <span className="text-[#2e3038]">·</span>
                      <span className="text-xs text-[#777a88]">{st.jurisdiction}</span>
                      <span className="text-[#2e3038]">·</span>
                      <span className="text-xs text-[#777a88]">{st.domain}</span>
                    </div>

                    <h2 className="font-serif text-lg text-[#ffffff] font-normal leading-snug pt-1">
                      {st.title}
                    </h2>

                    {st.description && (
                      <p className="text-xs text-[#9194a1] leading-relaxed max-w-3xl">{st.description}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="inline-flex items-center rounded-full bg-[#121317] px-3 py-1 text-xs font-semibold text-[#cc9166] border border-[#cc9166]/30">
                      {st.category}
                    </span>
                    <Link
                      href={`/standards/${st.requirement_id}`}
                      className="rounded-full border border-[#2e3038] bg-[#121317] px-3.5 py-1 text-xs font-medium text-[#e2e3e9] hover:text-[#ffffff] hover:border-[#5e616e] transition-colors"
                    >
                      View Clauses →
                    </Link>
                  </div>
                </div>

                {/* Statutory citations */}
                <div className="border-t border-[#1c1d22] pt-3">
                  <span className="text-[11px] font-semibold text-[#777a88] block mb-2 uppercase tracking-wider">
                    Statutory Evidence Citations ({st.citation_count}):
                  </span>

                  {st.citations && st.citations.length === 0 ? (
                    <p className="text-xs text-[#5e616e]">
                      No active gazetted source record linked to this requirement.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {st.citations?.map((ev) => (
                        <div
                          key={ev.evidence_id}
                          className="rounded-[8px] border border-[#1c1d22] bg-[#121317] p-3.5 space-y-1.5"
                        >
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[11px] font-semibold text-[#ffffff]">
                              {ev.authority}
                            </span>
                            <span className="text-[#2e3038]">·</span>
                            <span className="font-mono text-[11px] text-[#cc9166]">
                              {ev.locator}
                            </span>
                            <span className="rounded-full bg-[#040406] px-2 py-0.5 text-[10px] font-mono text-[#777a88] border border-[#1c1d22]">
                              {ev.verification_status}
                            </span>
                          </div>
                          <p className="text-xs text-[#e2e3e9] italic leading-relaxed">
                            &ldquo;{ev.excerpt}&rdquo;
                          </p>
                          <div className="flex items-center gap-2 text-[11px] pt-1">
                            <span className="text-[#777a88]">{ev.source_title}</span>
                            {ev.canonical_url && (
                              <a
                                href={ev.canonical_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-semibold text-[#cc9166] hover:underline inline-flex items-center gap-1"
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
          <div className="bg-[#040406] rounded-[10px] border border-[#1c1d22] p-5 shadow-2xl space-y-1.5">
            <h2 className="text-xs font-semibold text-[#ffffff] uppercase tracking-wider">
              Coverage Limit Notice
            </h2>
            <p className="text-xs text-[#9194a1]">{catalogueNote}</p>
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
        <div className="min-h-screen bg-[#08080a] flex items-center justify-center text-xs text-[#9194a1]">
          Loading standards catalogue...
        </div>
      }
    >
      <StandardsContent />
    </Suspense>
  );
}
