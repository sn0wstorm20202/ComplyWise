"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import StatusBadge from "@/components/StatusBadge";
import MetricCard from "@/components/MetricCard";
import ErrorState from "@/components/ErrorState";
import { healthApi } from "@/lib/api/health";
import { businessesApi } from "@/lib/api/businesses";
import { HealthData, ReadinessData } from "@/types";

export default function HomePage() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [readiness, setReadiness] = useState<ReadinessData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [variableCount, setVariableCount] = useState<number | null>(null);

  async function checkBackend() {
    setLoading(true);
    setError(null);
    try {
      const [healthData, readyData] = await Promise.all([
        healthApi.get(),
        healthApi.ready().catch(() => null),
      ]);
      setHealth(healthData);
      setReadiness(readyData);

      // Verify businesses boundary definitions endpoint
      try {
        const vars = await businessesApi.getVariableDefinitions();
        setVariableCount(Array.isArray(vars) ? vars.length : Object.keys(vars || {}).length);
      } catch {
        setVariableCount(null);
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to connect to backend service.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    checkBackend();
  }, []);

  const flowSteps = [
    { num: "01", title: "Welcome", desc: "Value proposition & initial entry" },
    { num: "02", title: "Business Profile", desc: "Canonical profile variables" },
    { num: "03", title: "Products & Activities", desc: "Natural-language description" },
    { num: "04", title: "Smart Questions", desc: "Dynamic questions for missing info" },
    { num: "05", title: "Regulatory Analysis", desc: "Deterministic rule evaluation" },
    { num: "06", title: "Initial Results", desc: "Core metrics & executive summary" },
    { num: "07", title: "Dashboard", desc: "Actionable compliance workspace" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Top Hero Banner */}
        <section className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-xs">
          <div className="max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-indigo-50 border border-indigo-200/60 text-xs font-semibold text-indigo-700">
              <span>Problem Statement ID: 26130</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-950">
              Industrial Compliance & Standards Intelligence Platform
            </h1>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              Efficiency in streamlining industrial approvals, compliance processes, and access to government support services.
              Built with deterministic rule evaluation, provenance-backed regulatory evidence, and three-valued logic.
            </p>
          </div>

          {/* Backend Connection Live Card */}
          <div className="mt-6 pt-6 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div
                className={`h-3 w-3 rounded-full ${
                  loading
                    ? "bg-amber-400 animate-ping"
                    : health?.status === "ok"
                    ? "bg-emerald-500"
                    : "bg-rose-500"
                }`}
              />
              <div>
                <div className="text-xs font-semibold text-slate-900">
                  {loading
                    ? "Checking Backend Connection..."
                    : health?.status === "ok"
                    ? `Backend Connected (${health.service} v${health.version})`
                    : "Backend Disconnected"}
                </div>
                <div className="text-[11px] text-slate-500">
                  Target: Django 6.0 REST API at /api/v1/ · Database: {readiness?.checks?.database?.engine || "PostgreSQL / SQLite"}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={checkBackend}
                disabled={loading}
                className="inline-flex items-center justify-center rounded-lg border border-slate-300 px-3.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors"
              >
                {loading ? "Probing..." : "Test API"}
              </button>
              <Link
                href="/auth/signin"
                className="inline-flex items-center justify-center rounded-lg border border-indigo-200 bg-indigo-50/60 px-3.5 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100/70 transition-colors"
              >
                Sign In / Demo
              </Link>
              <Link
                href="/onboarding"
                className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 shadow-xs transition-colors"
              >
                Start Journey →
              </Link>
            </div>
          </div>
        </section>

        {error && (
          <ErrorState
            title="Backend Connectivity Error"
            message={`Unable to reach backend API at ${process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000/api/v1"}. Ensure Django is running.`}
            onRetry={checkBackend}
          />
        )}

        {/* Foundation Metric Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            label="API Status"
            value={health?.status === "ok" ? "HEALTHY" : "OFFLINE"}
            subtext="Liveness & Readiness probe active"
            badge={{
              text: health?.api_version ? `API ${health.api_version}` : "v1",
              variant: health?.status === "ok" ? "success" : "warning",
            }}
          />
          <MetricCard
            label="Profile Variables"
            value={variableCount !== null ? variableCount : "Unavailable"}
            subtext={
              variableCount !== null
                ? `Canonical V01-V${variableCount} schema loaded`
                : "Backend schema unavailable"
            }
            badge={{
              text: variableCount !== null ? "Canonical" : "Unavailable",
              variant: variableCount !== null ? "info" : "warning",
            }}
          />
          <MetricCard
            label="Knowledge Engine"
            value={health?.status === "ok" ? "Dynamic" : "Unavailable"}
            subtext="Data-driven knowledge packs"
            badge={{ text: "Dynamic", variant: "neutral" }}
          />
          <MetricCard
            label="Logic Engine"
            value="3-Valued"
            subtext="TRUE · FALSE · UNKNOWN"
            badge={{ text: "AST Engine", variant: "success" }}
          />
        </section>

        {/* Canonical Status Badges Showcase */}
        <section className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Canonical Uncertainty & Decision States
            </h2>
            <p className="text-xs text-slate-500">
              Uncertainty is represented explicitly per PRD_v2.0 P4 and FRONTEND_INSTRUCTIONS.md §8.
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5 pt-2">
            <StatusBadge status="APPLICABLE" />
            <StatusBadge status="NOT_APPLICABLE" />
            <StatusBadge status="NEEDS_INFORMATION" />
            <StatusBadge status="CONFLICT_REVIEW" />
            <StatusBadge status="UNVERIFIED" />
          </div>

          <div className="pt-2">
            <span className="text-xs font-medium text-slate-500">Workflow States:</span>
            <div className="flex flex-wrap gap-2 pt-2">
              <StatusBadge status="NOT_STARTED" size="sm" />
              <StatusBadge status="IN_PROGRESS" size="sm" />
              <StatusBadge status="WAITING_FOR_USER" size="sm" />
              <StatusBadge status="READY" size="sm" />
              <StatusBadge status="SUBMITTED" size="sm" />
              <StatusBadge status="COMPLETED" size="sm" />
            </div>
          </div>
        </section>

        {/* User Journey Roadmap */}
        <section className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-5">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              End-to-End User Experience Pipeline
            </h2>
            <p className="text-xs text-slate-500">
              The foundational flow connecting user input to deterministic regulatory output.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {flowSteps.map((step) => (
              <Link
                key={step.num}
                href={step.num === "07" ? "/dashboard" : "/onboarding"}
                className="p-4 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-indigo-50/40 hover:border-indigo-200 transition-all block group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-indigo-600">
                    {step.num}
                  </span>
                  <span className="text-[11px] text-slate-400 group-hover:text-indigo-600 transition-colors">
                    Launch →
                  </span>
                </div>
                <div className="mt-1 text-sm font-semibold text-slate-900">
                  {step.title}
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  {step.desc}
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200/80 bg-white py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div>ComplyWise · Problem Statement ID: 26130</div>
          <div>Modular Monolith · Django REST Framework + Next.js + PostgreSQL</div>
        </div>
      </footer>
    </div>
  );
}
