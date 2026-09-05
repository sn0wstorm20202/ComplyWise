"use client";

import React, { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import ErrorState from "@/components/ErrorState";
import { api } from "@/lib/api";
import { StandardItem } from "@/types";

export default function StandardsPage() {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [standards, setStandards] = useState<StandardItem[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");

  async function handleSearch(q: string = "") {
    setLoading(true);
    setError(null);
    try {
      const resp = await api.standards.search(q);
      setStandards(resp.standards);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to search standards repository.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    handleSearch("");
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-semibold text-indigo-600 tracking-wide uppercase">
              Screen 14 · Quality Mandates
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-slate-950 mt-1">
              BIS & Industrial Standards Directory
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Bureau of Indian Standards (BIS) Compulsory Registration Schemes and quality test parameters.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
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
              placeholder="Search by product name, standard code (e.g. IS 13252, Food, Equipment)..."
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
            <LoadingSkeleton count={4} className="h-32 w-full" />
          </div>
        ) : standards.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-xs">
            <div className="text-2xl">🔍</div>
            <h3 className="text-sm font-bold text-slate-900 mt-2">
              No Standards Matched Your Search
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Try searching for general terms such as &quot;Equipment&quot;, &quot;Food&quot;, or &quot;Safety&quot;.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {standards.map((st) => (
              <div
                key={st.standard_code}
                className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs hover:border-indigo-300 transition-all space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                        {st.standard_code}
                      </span>
                      <span className="text-xs font-semibold text-slate-600">
                        {st.authority}
                      </span>
                      <span className="text-slate-300">·</span>
                      <span className="text-xs text-slate-500">
                        Scheme: {st.scheme}
                      </span>
                    </div>

                    <h2 className="text-sm font-bold text-slate-900">{st.title}</h2>
                  </div>

                  <span
                    className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold border ${
                      st.category === "MANDATORY"
                        ? "bg-rose-50 text-rose-700 border-rose-200"
                        : "bg-indigo-50 text-indigo-700 border-indigo-200"
                    }`}
                  >
                    {st.category}
                  </span>
                </div>

                {/* Applicable Products */}
                <div>
                  <span className="text-[11px] font-semibold text-slate-500 block mb-1">
                    Applicable Product Categories:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {st.applicable_products.map((prod) => (
                      <span
                        key={prod}
                        className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700"
                      >
                        {prod}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Testing Parameters */}
                <div>
                  <span className="text-[11px] font-semibold text-slate-500 block mb-1">
                    Prescribed Testing Parameters:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {st.testing_parameters.map((tp) => (
                      <span
                        key={tp}
                        className="rounded-md bg-indigo-50/70 border border-indigo-100 px-2 py-0.5 text-[11px] font-medium text-indigo-800"
                      >
                        {tp}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
