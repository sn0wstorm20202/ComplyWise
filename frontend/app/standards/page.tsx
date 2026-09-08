"use client";

import React, { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
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
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-indigo-600 tracking-wide uppercase">
                Screen 14 · Quality Mandates
              </span>
              {businessId && (
                <span className="inline-flex items-center rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700 border border-indigo-200">
                  Business-Matched Standards
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-950 mt-1">
              Published Standards Requirements
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Search requirements published in the STANDARD category, with the statutory
              citation recorded for each one.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={businessId ? `/dashboard?business_id=${businessId}` : "/dashboard"}
              className="rounded-lg border border-slate-300 px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              ← Dashboard
            </Link>
          </div>
        </div>

        {/* Search Input Bar */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSearch(searchQuery);
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by requirement name, authority, domain or standard code..."
              className="flex-1 rounded-lg border border-slate-300 px-3.5 py-2 text-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
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
                className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
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
            <LoadingSkeleton count={3} className="h-40 w-full" />
          </div>
        ) : standards.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-xs">
            <div className="text-2xl">🔍</div>
            <h3 className="text-sm font-bold text-slate-900 mt-2">
              No standards requirements found
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-lg mx-auto">
              No published requirements in the STANDARD category matched your query.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {standards.map((st) => (
              <div
                key={st.requirement_id}
                className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs hover:border-indigo-300 transition-all space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                        {st.requirement_id}
                      </span>
                      <span className="text-xs font-semibold text-slate-600">
                        {st.authority}
                      </span>
                      <span className="text-slate-300">·</span>
                      <span className="text-xs text-slate-500">{st.jurisdiction}</span>
                      <span className="text-slate-300">·</span>
                      <span className="text-xs text-slate-500">{st.domain}</span>
                    </div>

                    <h2 className="text-sm font-bold text-slate-900">{st.title}</h2>

                    {st.description && (
                      <p className="text-xs text-slate-600">{st.description}</p>
                    )}
                  </div>

                  <span className="inline-flex items-center rounded-md bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 border border-indigo-200">
                    {st.category}
                  </span>
                </div>

                {/* Statutory citations */}
                <div className="border-t border-slate-100 pt-3">
                  <span className="text-[11px] font-semibold text-slate-500 block mb-2">
                    Statutory citations ({st.citation_count}):
                  </span>

                  {st.citations && st.citations.length === 0 ? (
                    <p className="text-xs text-slate-500">
                      No active source is linked to this requirement, so it cannot be cited here.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {st.citations?.map((ev) => (
                        <div
                          key={ev.evidence_id}
                          className="rounded-lg border border-slate-200 bg-slate-50/70 p-3 space-y-1"
                        >
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[11px] font-semibold text-slate-700">
                              {ev.authority}
                            </span>
                            <span className="text-slate-300">·</span>
                            <span className="font-mono text-[11px] text-slate-600">
                              {ev.locator}
                            </span>
                            <span className="rounded bg-white px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 border border-slate-200">
                              {ev.verification_status}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 italic">
                            &ldquo;{ev.excerpt}&rdquo;
                          </p>
                          <div className="flex items-center gap-2 text-[11px]">
                            <span className="text-slate-500">{ev.source_title}</span>
                            {ev.canonical_url && (
                              <a
                                href={ev.canonical_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-semibold text-indigo-600 hover:text-indigo-700 hover:underline"
                              >
                                Open source ↗
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
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-1.5">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
              Coverage limit
            </h2>
            <p className="text-xs text-slate-500">{catalogueNote}</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default function StandardsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center text-sm text-slate-500">
          Loading standards...
        </div>
      }
    >
      <StandardsContent />
    </Suspense>
  );
}
