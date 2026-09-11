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

function WorkflowsContent() {
  const searchParams = useSearchParams();
  const paramBusinessId = searchParams.get("business_id");

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<WorkflowsListResponse | null>(null);
  const [businessId, setBusinessId] = useState<string>("");

  useEffect(() => {
    async function init() {
      const bizId =
        paramBusinessId ||
        localStorage.getItem("complywise_active_business_id") ||
        "";

      if (bizId) {
        loadWorkflows(bizId);
      } else {
        try {
          const list = await api.businesses.list();
          if (list.length > 0) {
            loadWorkflows(list[0].id);
          } else {
            loadWorkflows("demo-biz");
          }
        } catch {
          loadWorkflows("demo-biz");
        }
      }
    }

    async function loadWorkflows(bizId: string) {
      setLoading(true);
      setError(null);
      try {
        const resp = await api.workflows.list(bizId);
        setResponse(resp);
        setBusinessId(bizId);
      } catch {
        // Backend offline fallback: provide DEMO_WORKFLOWS
        setResponse({
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
        } as any);
      } finally {
        setLoading(false);
      }
    }

    init();
  }, [paramBusinessId]);

  return (
    <AppShell activeView="workflows">
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-[#040406] rounded-[10px] border border-[#1c1d22] p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-32 bg-radial from-[#cc9166]/10 to-transparent blur-2xl pointer-events-none" />
          
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full border border-[#cc9166]/30 bg-[#cc9166]/10 text-[#cc9166] text-[11px] font-semibold tracking-wider uppercase mb-2">
              Screen 11 · Statutory Roadmaps
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl text-[#ffffff] tracking-tight">
              Industrial Clearance Workflows
            </h1>
            <p className="text-xs text-[#9194a1] mt-1.5 max-w-2xl leading-relaxed">
              Step-by-step statutory application procedures mapped to official regulatory authorities. Steps and prerequisites are verified against published gazette rules.
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

        {/* Regulatory Authority Boundary Notice (Image B Requirement) */}
        <div className="rounded-[10px] border border-[#cc9166]/40 bg-[#040406] p-4 text-xs text-[#e2e3e9] flex items-start gap-3.5 shadow-lg relative overflow-hidden">
          <div className="w-1 h-full absolute left-0 top-0 bg-[#cc9166]" />
          <div className="p-1 rounded-full bg-[#cc9166]/10 text-[#cc9166] shrink-0 mt-0.5">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-[#ffffff] uppercase tracking-wider text-[11px]">
                Platform Boundary Notice
              </span>
              <span className="text-[10px] px-2 py-0.2 text-[#cc9166] border border-[#cc9166]/40 rounded-full font-mono">
                Platform Assists · Authority Decides
              </span>
            </div>
            <p className="text-[#9194a1] text-xs leading-relaxed">
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
            <LoadingSkeleton count={3} className="h-48 w-full rounded-[10px]" />
          </div>
        ) : response === null ? null : !response.available ? (
          <CapabilityUnavailableNotice
            capability={response.capability}
            reason={response.reason}
            requires={response.requires}
            icon="⚡"
          />
        ) : response.workflows.length === 0 ? (
          <div className="bg-[#040406] rounded-[10px] border border-[#1c1d22] p-12 text-center shadow-2xl">
            <div className="text-3xl mb-3">⚡</div>
            <h3 className="font-serif text-lg text-[#ffffff]">
              No approval workflow recorded for current requirements
            </h3>
            <p className="text-xs text-[#9194a1] mt-2 max-w-md mx-auto leading-relaxed">
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
                  className="bg-[#040406] rounded-[10px] border border-[#1c1d22] p-6 shadow-2xl space-y-5 hover:border-[#2e3038] transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1c1d22] pb-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-semibold text-[#e2e3e9] bg-[#121317] border border-[#2e3038] px-2.5 py-0.5 rounded-full">
                          {wf.id}
                        </span>
                        <span className="text-xs font-medium text-[#777a88]">
                          Authority: <strong className="text-[#ffffff] font-medium">{wf.authority}</strong>
                        </span>
                      </div>
                      <h2 className="font-serif text-lg text-[#ffffff] font-normal mt-1">{wf.title}</h2>
                    </div>

                    <div className="flex items-center gap-4">
                      <StatusBadge status={wf.status} />
                      <div className="text-right">
                        <span className="font-mono text-xs font-semibold text-[#cc9166] block">
                          {progressPct}% Completed
                        </span>
                        <Link
                          href={`/workflows/${wf.id}`}
                          className="text-[11px] text-[#9194a1] hover:text-[#ffffff] transition-colors"
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
                        className={`p-3.5 rounded-[8px] border transition-all space-y-2 ${
                          st.status === "COMPLETED"
                            ? "bg-emerald-950/20 border-emerald-800/40"
                            : st.status === "IN_PROGRESS"
                            ? "bg-[#cc9166]/10 border-[#cc9166]/30"
                            : st.status === "BLOCKED"
                            ? "bg-rose-950/20 border-rose-800/40"
                            : "bg-[#121317] border-[#1c1d22]"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs font-semibold text-[#777a88]">
                            Stage {st.step}
                          </span>
                          <StatusBadge status={st.status} size="sm" />
                        </div>
                        <div className="text-xs font-medium text-[#ffffff] leading-tight line-clamp-2">
                          {st.title}
                        </div>
                        {(st as any).notes && (
                          <p className="text-[10px] text-[#777a88] line-clamp-1">
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
        <div className="min-h-screen bg-[#08080a] flex items-center justify-center text-xs text-[#9194a1]">
          Loading clearance roadmaps...
        </div>
      }
    >
      <WorkflowsContent />
    </Suspense>
  );
}
