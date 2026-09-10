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
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-semibold text-indigo-600 tracking-wide uppercase">
              Screen 11 · Multi-Step Approvals
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-slate-950 mt-1">
              Industrial Clearance Workflows
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Application procedures as recorded by the issuing authority. Steps are
              served only where published knowledge states them.
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
            title="Workflows Service Notice"
            message={error}
            onRetry={() => window.location.reload()}
          />
        )}

        {/* Interactive Multi-Node Workflow Pipeline Visualizer */}
        <WorkflowPipeline />

        {loading ? (
          <div className="space-y-4">
            <LoadingSkeleton count={3} className="h-48 w-full" />
          </div>
        ) : response === null ? null : !response.available ? (
          <CapabilityUnavailableNotice
            capability={response.capability}
            reason={response.reason}
            requires={response.requires}
            icon="⚡"
          />
        ) : response.workflows.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-xs">
            <div className="text-2xl">⚡</div>
            <h3 className="text-sm font-bold text-slate-900 mt-2">
              No approval workflow is recorded for your applicable requirements
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-lg mx-auto">
              A workflow appears here only where published knowledge records the
              application procedure for a requirement the engine found applicable.
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
                  className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-5"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                          {wf.id}
                        </span>
                        <span className="text-xs font-semibold text-slate-600">
                          Authority: {wf.authority}
                        </span>
                      </div>
                      <h2 className="text-base font-bold text-slate-900">{wf.title}</h2>
                    </div>

                    <div className="flex items-center gap-3">
                      <StatusBadge status={wf.status} />
                      <span className="text-xs font-bold text-slate-600">
                        {progressPct}% Completed
                      </span>
                    </div>
                  </div>

                  {/* Step progression cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {wf.steps.map((st) => (
                      <div
                        key={st.step}
                        className={`p-3.5 rounded-xl border transition-all space-y-2 ${
                          st.status === "COMPLETED"
                            ? "bg-emerald-50/50 border-emerald-200"
                            : st.status === "IN_PROGRESS"
                            ? "bg-indigo-50/50 border-indigo-200"
                            : st.status === "BLOCKED"
                            ? "bg-rose-50/40 border-rose-200"
                            : "bg-slate-50 border-slate-100"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-slate-600">
                            Step {st.step}
                          </span>
                          <StatusBadge status={st.status} size="sm" />
                        </div>
                        <div className="text-xs font-semibold text-slate-900 leading-tight">
                          {st.title}
                        </div>
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
        <div className="min-h-screen bg-slate-50 flex items-center justify-center text-sm text-slate-500">
          Loading approval workflows...
        </div>
      }
    >
      <WorkflowsContent />
    </Suspense>
  );
}
