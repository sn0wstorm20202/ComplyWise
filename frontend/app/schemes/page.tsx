"use client";

import React, { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import AppShell from "@/components/AppShell";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import ErrorState from "@/components/ErrorState";
import { api } from "@/lib/api";
import CapabilityUnavailableNotice from "@/components/CapabilityUnavailableNotice";
import { DEMO_SCHEMES } from "@/data/demo/schemes";
import type { SchemesListResponse } from "@/lib/api/schemes";

function SchemesContent() {
  const searchParams = useSearchParams();
  const paramBusinessId = searchParams.get("business_id");

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
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
            loadSchemes("demo-biz");
          }
        } catch {
          loadSchemes("demo-biz");
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
      } catch {
        // Backend offline fallback: provide rich DEMO_SCHEMES
        setResponse({
          available: true,
          capability: "GOVERNMENT_SCHEMES",
          schemes: DEMO_SCHEMES.map((s) => ({
            id: s.id,
            title: s.name,
            authority: s.authority,
            benefit_summary: s.description,
            benefit_type: s.subsidyType,
            eligibility_status: s.status,
            action_url: s.applicationUrl,
          })),
        } as any);
        setBusinessId(bizId || "demo-biz");
      } finally {
        setLoading(false);
      }
    }

    init();
  }, [paramBusinessId]);

  return (
    <AppShell activeView="schemes">
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-[#040406] rounded-[10px] border border-[#1c1d22] p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-32 bg-radial from-[#cc9166]/10 to-transparent blur-2xl pointer-events-none" />
          
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full border border-[#cc9166]/30 bg-[#cc9166]/10 text-[#cc9166] text-[11px] font-semibold tracking-wider uppercase mb-2">
              Screen 13 · Government Incentives
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl text-[#ffffff] tracking-tight">
              Government Schemes & Subsidies
            </h1>
            <p className="text-xs text-[#9194a1] mt-1.5 max-w-2xl leading-relaxed">
              Incentives, testing fee waivers, and capital subsidies mapped directly from your Udyam classification and industrial standard filings.
            </p>
          </div>

          <div className="flex items-center gap-3 relative z-10 shrink-0">
            <Link
              href={`/dashboard?business_id=${businessId}`}
              className="rounded-full border border-[#2e3038] bg-[#121317] px-4 py-2 text-xs font-medium text-[#e2e3e9] hover:text-[#ffffff] hover:border-[#5e616e] transition-colors"
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
            <LoadingSkeleton count={3} className="h-36 w-full rounded-[10px]" />
          </div>
        ) : response === null ? null : !response.available ? (
          <CapabilityUnavailableNotice
            capability={response.capability}
            reason={response.reason}
            requires={response.requires}
            icon="💰"
          />
        ) : response.schemes.length === 0 ? (
          <div className="bg-[#040406] rounded-[10px] border border-[#1c1d22] p-12 text-center shadow-2xl">
            <div className="text-3xl mb-3">💰</div>
            <h3 className="font-serif text-lg text-[#ffffff]">
              No published scheme rule satisfied by enterprise profile
            </h3>
            <p className="text-xs text-[#9194a1] mt-2 max-w-md mx-auto leading-relaxed">
              Scheme rules were verified against enterprise turnover and category records. None currently meet the published threshold for active subsidies.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {response.schemes.map((sc) => (
              <div
                key={sc.id}
                className="bg-[#040406] rounded-[10px] border border-[#1c1d22] p-6 shadow-2xl hover:border-[#2e3038] hover:shadow-[0_4px_24px_rgba(0,0,0,0.5)] transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-mono text-[11px] font-semibold text-[#e2e3e9] bg-[#121317] border border-[#2e3038] px-2.5 py-0.5 rounded-full">
                      {sc.id}
                    </span>
                    <span className="inline-flex items-center rounded-full bg-emerald-950/40 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-300 border border-emerald-800/50 uppercase tracking-wider">
                      {sc.eligibility_status.replace(/_/g, " ")}
                    </span>
                  </div>

                  <h3 className="font-serif text-base text-[#ffffff] font-normal leading-snug">
                    {sc.title}
                  </h3>

                  <div className="text-xs text-[#cc9166] font-medium">
                    {sc.authority}
                  </div>

                  <p className="text-xs text-[#9194a1] leading-relaxed pt-1">
                    {sc.benefit_summary}
                  </p>
                </div>

                <div className="pt-4 border-t border-[#1c1d22] flex items-center justify-between">
                  <span className="text-[11px] font-medium text-[#777a88] uppercase tracking-wider">
                    {sc.benefit_type.replace(/_/g, " ")}
                  </span>

                  {sc.action_url && (
                    <a
                      href={sc.action_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#ffffff] hover:text-[#cc9166] transition-colors"
                    >
                      <span>Official Portal</span>
                      <span className="text-sm">↗</span>
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
        <div className="min-h-screen bg-[#08080a] flex items-center justify-center text-xs text-[#9194a1]">
          Loading government schemes...
        </div>
      }
    >
      <SchemesContent />
    </Suspense>
  );
}
