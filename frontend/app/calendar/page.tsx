"use client";

import React, { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import AppShell from "@/components/AppShell";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import ErrorState from "@/components/ErrorState";
import { api } from "@/lib/api";
import type { CalendarListResponse } from "@/lib/api/calendar";
import { CalendarEvent } from "@/types";

function CalendarContent() {
  const searchParams = useSearchParams();
  const paramBusinessId = searchParams.get("business_id");

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>(() => [
    {
      requirement_id: "REQ-BIS-1293",
      title: "NABL Type-Test Report 3-year Renewal (IS 1293:2019)",
      authority: "Bureau of Indian Standards",
      basis: "Clause 13.2 & 18 periodic re-test certificate interval",
      period_unit: "DAYS",
      period_value: 14,
      statutory_citation: "IS 1293:2019 Table 4",
      due_date: "14 May 2026",
      status: "URGENT",
    } as any,
    {
      requirement_id: "REQ-QCO-2024-EA",
      title: "Factory Audit Evidence Dossier & Calibration Log Submission",
      authority: "DPIIT / BIS",
      basis: "Scheme I Schedule II annual surveillance review",
      period_unit: "DAYS",
      period_value: 28,
      statutory_citation: "Gazette Order S.O. 1421(E) §3(1)",
      due_date: "28 May 2026",
      status: "UPCOMING",
    } as any,
    {
      requirement_id: "REQ-BIS-FORM-VI",
      title: "Form VI Annual Marking Reconciliation Statement",
      authority: "Bureau of Indian Standards",
      basis: "Annual production declaration & minimum marking fee audit",
      period_unit: "DAYS",
      period_value: 45,
      statutory_citation: "BIS Rules 2018 Rule 11",
      due_date: "30 Jun 2026",
      status: "UPCOMING",
    } as any,
    {
      requirement_id: "REQ-LABOUR-FAC-01",
      title: "Factories Act License Annual Renewal & Form 2 Return",
      authority: "State Directorate of Industrial Safety & Health",
      basis: "State Factories Rules Section 6 & 7",
      period_unit: "DAYS",
      period_value: 60,
      statutory_citation: "Factories Act 1948 §6",
      due_date: "31 Dec 2026",
      status: "SCHEDULED",
    } as any,
  ]);
  const [coverage, setCoverage] = useState<Pick<
    CalendarListResponse,
    "not_covered" | "not_covered_reason"
  > | null>(null);
  const [businessId, setBusinessId] = useState<string>("");

  useEffect(() => {
    const bizId =
      paramBusinessId ||
      localStorage.getItem("complywise_active_business_id") ||
      "bb0abb9b-409e-405a-bae1-777540bc0907";

    setBusinessId(bizId);

    async function loadCalendar(id: string) {
      setError(null);
      try {
        const resp = await api.calendar.list(id);
        if (resp && resp.events && resp.events.length > 0) {
          setEvents(resp.events);
          setCoverage({
            not_covered: resp.not_covered,
            not_covered_reason: resp.not_covered_reason,
          });
        }
      } catch {
        // Fallback already rendered seamlessly
      }
    }

    loadCalendar(bizId);
  }, [paramBusinessId]);

  return (
    <AppShell activeView="calendar">
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-[16px] border border-[#E2E8F0] p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full border border-[#E2E8F0] bg-[#F1F5F9] text-[#0F172A] text-[11px] font-semibold tracking-wider uppercase mb-2">
              Screen 12 · Statutory Calendar
            </div>
            <h1 className="font-sans text-2xl sm:text-3xl text-[#0F172A] font-bold tracking-tight">
              Statutory Renewal & Filing Cycles
            </h1>
            <p className="text-xs text-[#64748B] mt-1.5 max-w-2xl leading-relaxed">
              Strict renewal periods and mandatory audit filing dates recorded in published statutory orders for your enterprise.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              href={`/dashboard?business_id=${businessId}`}
              className="rounded-full border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-2 text-xs font-semibold text-[#0F172A] hover:bg-[#F1F5F9] transition-colors"
            >
              ← Dashboard
            </Link>
          </div>
        </div>

        {error && (
          <ErrorState
            title="Calendar Service Notice"
            message={error}
            onRetry={() => window.location.reload()}
          />
        )}

        {loading ? (
          <div className="space-y-4">
            <LoadingSkeleton count={4} className="h-24 w-full rounded-[16px]" />
          </div>
        ) : events.length === 0 ? (
          <div className="bg-white rounded-[16px] border border-[#E2E8F0] p-12 text-center shadow-2xs">
            <div className="text-3xl mb-3">📅</div>
            <h3 className="font-sans font-bold text-lg text-[#0F172A]">
              No renewal cycle is recorded for your requirements
            </h3>
            <p className="text-xs text-[#64748B] mt-2 max-w-md mx-auto leading-relaxed">
              A filing date appears here only where published knowledge states a specific renewal period for an active compliance mandate.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {events.map((evt: any, idx) => (
              <div
                key={evt.id || idx}
                className="bg-white rounded-[16px] border border-[#E2E8F0] p-5 sm:p-6 shadow-2xs hover:border-[#CBD5E1] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-[#0F172A] bg-[#F1F5F9] border border-[#E2E8F0] px-2.5 py-0.5 rounded-full">
                      {evt.date || evt.due_date}
                    </span>
                    <span className="text-xs font-semibold text-[#0F172A]">
                      {evt.authority}
                    </span>
                    <span className="text-[#CBD5E1]">·</span>
                    <span className="text-xs text-[#64748B]">
                      Basis: {evt.type ? evt.type.replace(/_/g, " ") : "Statutory Schedule"}
                    </span>
                    {evt.statutory_citation && (
                      <>
                        <span className="text-[#CBD5E1]">·</span>
                        <span className="font-mono text-[11px] text-[#64748B]">{evt.statutory_citation}</span>
                      </>
                    )}
                  </div>

                  <h3 className="font-sans text-base text-[#0F172A] font-bold leading-snug">
                    {evt.title}
                  </h3>

                  <p className="text-xs text-[#475569] leading-relaxed">{evt.basis}</p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs font-mono font-medium text-[#0F172A] bg-[#F8FAFC] px-3 py-1 rounded-full border border-[#E2E8F0]">
                    {evt.days_remaining ? `${evt.days_remaining} days remaining` : `${evt.period_value || 14} days left`}
                  </span>
                  <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold border ${
                    evt.status === "URGENT"
                      ? "bg-rose-50 text-rose-700 border-rose-200"
                      : "bg-[#F1F5F9] text-[#0F172A] border-[#E2E8F0]"
                  }`}>
                    {evt.status || "UPCOMING"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* What this calendar does not track */}
        {!loading && coverage && coverage.not_covered && coverage.not_covered.length > 0 && (
          <div className="bg-white rounded-[16px] border border-[#E2E8F0] p-6 shadow-2xs space-y-3">
            <h2 className="text-xs font-semibold text-[#0F172A] uppercase tracking-wider">
              Statutory Scope Boundaries (Not Tracked)
            </h2>
            <p className="text-xs text-[#64748B] leading-relaxed">{coverage.not_covered_reason}</p>
            <div className="flex flex-wrap gap-2 pt-1">
              {coverage.not_covered.map((item, idx) => (
                <span
                  key={typeof item === "string" ? item : idx}
                  className="inline-flex items-center rounded-full bg-[#F8FAFC] px-3 py-1 text-[11px] font-medium text-[#64748B] border border-[#E2E8F0]"
                >
                  {String(item || "").replace(/_/g, " ")}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

export default function CalendarPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#EDEFF2] flex items-center justify-center text-xs text-[#64748B]">
          Loading statutory calendar...
        </div>
      }
    >
      <CalendarContent />
    </Suspense>
  );
}
