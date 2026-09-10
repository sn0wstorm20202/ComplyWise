"use client";

import React, { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import AppShell from "@/components/AppShell";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import ErrorState from "@/components/ErrorState";
import { api } from "@/lib/api";
import CapabilityUnavailableNotice from "@/components/CapabilityUnavailableNotice";
import type { SchemesListResponse } from "@/lib/api/schemes";

function SchemesContent() {
  const searchParams = useSearchParams();
  const paramBusinessId = searchParams.get("business_id");

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  // The whole response is held, not just the list: `available` decides whether a
  // list can be read at all, and the reason has to be rendered when it cannot.
  const [response, setResponse] = useState<SchemesListResponse | null>(null);
  const [businessId, setBusinessId] = useState<string>("");

  useEffect(() => {
    async function init() {
      const bizId =
        paramBusinessId ||
        localStorage.getItem("complywise_active_business_id") ||
        "";

      if (bizId) {
        loadSchemes(bizId);
      } else {
        try {
          const list = await api.businesses.list();
          if (list.length > 0) {
            loadSchemes(list[0].id);
          } else {
            setLoading(false);
          }
        } catch {
          setLoading(false);
        }
      }
    }

    async function loadSchemes(bizId: string) {
      setLoading(true);
      setError(null);
      try {
        const resp = await api.schemes.list(bizId);
        setResponse(resp);
        setBusinessId(bizId);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load government schemes.");
      } finally {
        setLoading(false);
      }
    }

    init();
  }, [paramBusinessId]);

  return (
    <AppShell activeView="schemes">
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-semibold text-indigo-600 tracking-wide uppercase">
              Screen 13 · Government Incentives
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-slate-950 mt-1">
              Government Schemes & Subsidies
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Scheme eligibility is a rule evaluation like any other requirement, decided
              against published knowledge rather than suggested.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={`/dashboard?business_id=${businessId}`}
              className="rounded-lg border border-slate-300 px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              ← Dashboard
            </Link>
          </div>
        </div>

        {error && (
          <ErrorState
            title="Schemes Service Notice"
            message={error}
            onRetry={() => window.location.reload()}
          />
        )}

        {loading ? (
          <div className="space-y-4">
            <LoadingSkeleton count={3} className="h-36 w-full" />
          </div>
        ) : response === null ? null : !response.available ? (
          <CapabilityUnavailableNotice
            capability={response.capability}
            reason={response.reason}
            requires={response.requires}
            icon="💰"
          />
        ) : response.schemes.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-xs">
            <div className="text-2xl">💰</div>
            <h3 className="text-sm font-bold text-slate-900 mt-2">
              No published scheme rule was satisfied by this business profile
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-lg mx-auto">
              Scheme rules were evaluated and none returned an eligible result. This is a
              decision, not an absence of data.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {response.schemes.map((sc) => (
              <div
                key={sc.id}
                className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs hover:border-indigo-300 transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-mono text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                      {sc.id}
                    </span>
                    <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-200">
                      {sc.eligibility_status.replace(/_/g, " ")}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 leading-snug">
                    {sc.title}
                  </h3>

                  <div className="text-[11px] text-slate-500 font-medium">
                    {sc.authority}
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed pt-1">
                    {sc.benefit_summary}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-500">
                    {sc.benefit_type.replace(/_/g, " ")}
                  </span>

                  {sc.action_url && (
                    <a
                      href={sc.action_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                    >
                      <span>Official Portal</span>
                      <span>↗</span>
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}

export default function SchemesPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center text-sm text-slate-500">
          Loading government schemes...
        </div>
      }
    >
      <SchemesContent />
    </Suspense>
  );
}
