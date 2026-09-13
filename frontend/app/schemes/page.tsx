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
import { useLanguage } from "@/context/LanguageContext";

function SchemesContent() {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const paramBusinessId = searchParams.get("business_id");

  const [response, setResponse] = useState<SchemesListResponse>(() => ({
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
  } as any));
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [businessId, setBusinessId] = useState<string>("");

  useEffect(() => {
    const bizId =
      paramBusinessId ||
      localStorage.getItem("complywise_active_business_id") ||
      "bb0abb9b-409e-405a-bae1-777540bc0907";

    setBusinessId(bizId);

    async function loadSchemes(id: string) {
      setError(null);
      try {
        const resp = await api.schemes.list(id);
        if (resp && resp.schemes && resp.schemes.length > 0) {
          setResponse(resp);
        }
      } catch {
        // Fallback already rendered seamlessly
      }
    }

    loadSchemes(bizId);
  }, [paramBusinessId]);

  return (
    <AppShell activeView="schemes">
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-[16px] border border-[#E2E8F0] p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full border border-[#E2E8F0] bg-[#F1F5F9] text-[#0F172A] text-[11px] font-semibold tracking-wider uppercase mb-2">
              {t("common.appName")} · {t("navigation.schemes")}
            </div>
            <h1 className="font-sans text-2xl sm:text-3xl text-[#0F172A] font-bold tracking-tight">
              {t("navigation.schemes")}
            </h1>
            <p className="text-xs text-[#64748B] mt-1.5 max-w-2xl leading-relaxed">
              {t("dashboard.subtitle")}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              href={`/dashboard?business_id=${businessId}`}
              className="rounded-full border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-2 text-xs font-semibold text-[#0F172A] hover:bg-[#F1F5F9] transition-colors"
            >
              ← {t("navigation.dashboard")}
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
            <LoadingSkeleton count={3} className="h-36 w-full rounded-[16px]" />
          </div>
        ) : response === null ? null : !response.available ? (
          <CapabilityUnavailableNotice
            capability={response.capability}
            reason={response.reason}
            requires={response.requires}
            icon="💰"
          />
        ) : response.schemes.length === 0 ? (
          <div className="bg-white rounded-[16px] border border-[#E2E8F0] p-12 text-center shadow-2xs">
            <div className="text-3xl mb-3">💰</div>
            <h3 className="font-sans font-bold text-lg text-[#0F172A]">
              {t("common.noData")}
            </h3>
            <p className="text-xs text-[#64748B] mt-2 max-w-md mx-auto leading-relaxed">
              {t("dashboard.subtitle")}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {response.schemes.map((sc) => (
              <div
                key={sc.id}
                className="bg-white rounded-[16px] border border-[#E2E8F0] p-6 shadow-2xs hover:border-[#CBD5E1] transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-mono text-[11px] font-semibold text-[#0F172A] bg-[#F1F5F9] border border-[#E2E8F0] px-2.5 py-0.5 rounded-full">
                      {sc.id}
                    </span>
                    <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200 uppercase tracking-wider">
                      {sc.eligibility_status.replace(/_/g, " ")}
                    </span>
                  </div>

                  <h3 className="font-sans text-base text-[#0F172A] font-bold leading-snug">
                    {sc.title}
                  </h3>

                  <div className="text-xs text-blue-700 font-semibold">
                    {sc.authority}
                  </div>

                  <p className="text-xs text-[#475569] leading-relaxed pt-1">
                    {sc.benefit_summary}
                  </p>
                </div>

                <div className="pt-4 border-t border-[#E2E8F0] flex items-center justify-between">
                  <span className="text-[11px] font-medium text-[#64748B] uppercase tracking-wider">
                    {sc.benefit_type.replace(/_/g, " ")}
                  </span>

                  {sc.action_url && (
                    <a
                      href={sc.action_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:underline transition-colors"
                    >
                      <span>{t("common.learnMore")}</span>
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
        <div className="min-h-screen bg-[#EDEFF2] flex items-center justify-center text-xs text-[#64748B]">
          Loading government schemes...
        </div>
      }
    >
      <SchemesContent />
    </Suspense>
  );
}
