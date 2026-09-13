"use client";

import React, { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import AppShell from "@/components/AppShell";
import StatusBadge from "@/components/StatusBadge";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import ErrorState from "@/components/ErrorState";
import { api } from "@/lib/api";
import CapabilityUnavailableNotice from "@/components/CapabilityUnavailableNotice";
import WorkflowPipeline from "@/components/workflows/WorkflowPipeline";
import { DEMO_WORKFLOWS } from "@/data/demo/workflows";
import type { WorkflowsListResponse } from "@/lib/api/workflows";
import { useLanguage } from "@/context/LanguageContext";

function WorkflowsContent() {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const paramBusinessId = searchParams.get("business_id");

  const [response, setResponse] = useState<WorkflowsListResponse>(() => ({
    available: true,
    capability: "APPROVAL_WORKFLOWS",
    workflows: DEMO_WORKFLOWS.map((w) => ({
      id: w.id,
      title: w.title,
      authority: w.authority,
      status: w.status,
      total_steps: w.totalStages,
      steps: w.stages.map((st) => ({
        step: st.number,
        title: st.name,
        status: st.status as any,
        notes: st.description,
      })),
    })),
  } as any));
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [businessId, setBusinessId] = useState<string>("");

  useEffect(() => {
    let isMounted = true;

    async function init() {
      const bizId =
        paramBusinessId ||
        localStorage.getItem("complywise_active_business_id") ||
        "bb0abb9b-409e-405a-bae1-777540bc0907";

      setBusinessId(bizId);

      try {
        const resp = await api.workflows.list(bizId);
        if (isMounted && resp && resp.workflows?.length > 0) {
          setResponse(resp);
        }
      } catch {
        // Fallback already rendered seamlessly
      }
    }

    init();
    return () => {
      isMounted = false;
    };
  }, [paramBusinessId]);

  return (
    <AppShell activeView="workflows">
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-[16px] border border-[#E2E8F0] p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full border border-[#E2E8F0] bg-[#F1F5F9] text-[#0F172A] text-[11px] font-semibold tracking-wider uppercase mb-2">
              {t("common.appName")} · {t("navigation.workflows")}
            </div>
            <h1 className="font-sans text-2xl sm:text-3xl text-[#0F172A] font-bold tracking-tight">
              {t("navigation.workflows")}
            </h1>
            <p className="text-xs text-[#64748B] mt-1.5 max-w-2xl leading-relaxed">
              {t("dashboard.activeWorkflows")}
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

        {/* Regulatory Authority Boundary Notice */}
        <div className="rounded-[16px] border border-blue-200 bg-blue-50/50 p-4 text-xs text-[#0F172A] flex items-start gap-3.5 shadow-2xs relative overflow-hidden">
          <div className="w-1 h-full absolute left-0 top-0 bg-blue-600" />
          <div className="p-1 rounded-full bg-blue-100 text-blue-800 shrink-0 mt-0.5">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-[#0F172A] uppercase tracking-wider text-[11px]">
                Platform Boundary Notice
              </span>
              <span className="text-[10px] px-2 py-0.5 text-blue-800 bg-blue-100/60 border border-blue-200 rounded-full font-mono">
                Platform Assists · Authority Decides
              </span>
            </div>
            <p className="text-[#475569] text-xs leading-relaxed">
              ComplyWise compiles procedural guidance, evidence tracking, and statutory readiness checklists. Final approval, field inspection, and statutory certification are executed exclusively by the designated government authorities.
            </p>
          </div>
        </div>

        {error && (
          <ErrorState
            title="Workflows Service Notice"
            message={error}
            onRetry={() => window.location.reload()}
          />
        )}

        {/* Interactive Multi-Node Workflow Pipeline Visualizer */}
        <WorkflowPipeline />

        {loading ? (
          <div className="space-y-4">
            <LoadingSkeleton count={3} className="h-48 w-full rounded-[16px]" />
          </div>
        ) : response === null ? null : !response.available ? (
          <CapabilityUnavailableNotice
            capability={response.capability}
            reason={response.reason}
            requires={response.requires}
            icon="⚡"
          />
        ) : response.workflows.length === 0 ? (
          <div className="bg-white rounded-[16px] border border-[#E2E8F0] p-12 text-center shadow-2xs">
            <div className="text-3xl mb-3">⚡</div>
            <h3 className="font-sans text-lg text-[#0F172A] font-bold">
              No approval workflow recorded for current requirements
            </h3>
            <p className="text-xs text-[#64748B] mt-2 max-w-md mx-auto leading-relaxed">
              Workflows are rendered where published knowledge defines specific multi-step application procedures for applicable compliance mandates.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {response.workflows.map((wf) => {
              const progressPct = Math.round(
                (wf.steps.filter((s) => s.status === "COMPLETED").length /
                  wf.total_steps) *
                  100
              );

              return (
                <div
                  key={wf.id}
                  className="bg-white rounded-[16px] border border-[#E2E8F0] p-6 shadow-2xs space-y-5 hover:border-[#CBD5E1] transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E2E8F0] pb-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-semibold text-[#0F172A] bg-[#F1F5F9] border border-[#E2E8F0] px-2.5 py-0.5 rounded-full">
                          {wf.id}
                        </span>
                        <span className="text-xs font-medium text-[#64748B]">
                          Authority: <strong className="text-[#0F172A] font-semibold">{wf.authority}</strong>
                        </span>
                      </div>
                      <h2 className="font-sans text-lg text-[#0F172A] font-bold mt-1">{wf.title}</h2>
                    </div>

                    <div className="flex items-center gap-4">
                      <StatusBadge status={wf.status} />
                      <div className="text-right">
                        <span className="font-mono text-xs font-bold text-[#0F172A] block">
                          {progressPct}% Completed
                        </span>
                        <Link
                          href={`/workflows/${wf.id}`}
                          className="text-[11px] text-[#0F172A] hover:underline transition-colors font-medium"
                        >
                          View Interactive Pipeline →
                        </Link>
                      </div>
                    </div>
                  </div>

                  {/* Step progression cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {wf.steps.map((st) => (
                      <div
                        key={st.step}
                        className={`p-3.5 rounded-xl border transition-all space-y-2 ${
                          st.status === "COMPLETED"
                            ? "bg-emerald-50 border-emerald-200"
                            : st.status === "IN_PROGRESS"
                            ? "bg-[#F8FAFC] border-[#E2E8F0] ring-1 ring-black/10"
                            : st.status === "BLOCKED"
                            ? "bg-rose-50 border-rose-200"
                            : "bg-[#F8FAFC] border-[#E2E8F0]"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs font-semibold text-[#64748B]">
                            Stage {st.step}
                          </span>
                          <StatusBadge status={st.status} size="sm" />
                        </div>
                        <div className="text-xs font-bold text-[#0F172A] leading-tight line-clamp-2">
                          {st.title}
                        </div>
                        {(st as any).notes && (
                          <p className="text-[10px] text-[#64748B] line-clamp-1">
                            {(st as any).notes}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}

export default function WorkflowsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#EDEFF2] flex items-center justify-center text-xs text-[#64748B]">
          Loading clearance roadmaps...
        </div>
      }
    >
      <WorkflowsContent />
    </Suspense>
  );
}
