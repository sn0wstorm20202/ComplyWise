"use client";

import React, { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import StatusBadge from "@/components/StatusBadge";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import ErrorState from "@/components/ErrorState";
import { api } from "@/lib/api";
import { WorkflowItem } from "@/types";

function WorkflowsContent() {
  const searchParams = useSearchParams();
  const paramBusinessId = searchParams.get("business_id");

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [workflows, setWorkflows] = useState<WorkflowItem[]>([]);
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
            setLoading(false);
          }
        } catch {
          setLoading(false);
        }
      }
    }

    async function loadWorkflows(bizId: string) {
      setLoading(true);
      setError(null);
      try {
        const resp = await api.workflows.list(bizId);
        setWorkflows(resp.workflows);
        setBusinessId(bizId);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load approval workflows.");
      } finally {
        setLoading(false);
      }
    }

    init();
  }, [paramBusinessId]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
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
              Step-by-step guidance, statutory submissions, portal logins, and inspection milestones.
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

        {loading ? (
          <div className="space-y-4">
            <LoadingSkeleton count={3} className="h-48 w-full" />
          </div>
        ) : workflows.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-xs">
            <div className="text-2xl">⚡</div>
            <h3 className="text-sm font-bold text-slate-900 mt-2">
              No Active Approval Workflows
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Complete onboarding evaluation to generate actionable workflows for statutory licenses.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {workflows.map((wf) => {
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
      </main>
    </div>
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
