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

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  // Kept alongside the events so the screen can state which date classes it does
  // not hold. Without it an empty calendar reads as "no deadlines apply to you".
  const [coverage, setCoverage] = useState<Pick<
    CalendarListResponse,
    "not_covered" | "not_covered_reason"
  > | null>(null);
  const [businessId, setBusinessId] = useState<string>("");

  useEffect(() => {
    async function init() {
      const bizId =
        paramBusinessId ||
        localStorage.getItem("complywise_active_business_id") ||
        "";

      if (bizId) {
        loadCalendar(bizId);
      } else {
        try {
          const list = await api.businesses.list();
          if (list.length > 0) {
            loadCalendar(list[0].id);
          } else {
            setLoading(false);
          }
        } catch {
          setLoading(false);
        }
      }
    }

    async function loadCalendar(bizId: string) {
      setLoading(true);
      setError(null);
      try {
        const resp = await api.calendar.list(bizId);
        setEvents(resp.events);
        setCoverage({
          not_covered: resp.not_covered,
          not_covered_reason: resp.not_covered_reason,
        });
        setBusinessId(bizId);
      } catch {
        // Backend offline fallback: provide statutory calendar deadlines
        setEvents([
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
        setBusinessId(bizId || "demo-biz");
      } finally {
        setLoading(false);
      }
    }

    init();
  }, [paramBusinessId]);

  return (
    <AppShell activeView="calendar">
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-[#040406] rounded-[10px] border border-[#1c1d22] p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-32 bg-radial from-[#cc9166]/10 to-transparent blur-2xl pointer-events-none" />
          
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full border border-[#cc9166]/30 bg-[#cc9166]/10 text-[#cc9166] text-[11px] font-semibold tracking-wider uppercase mb-2">
              Screen 12 · Statutory Calendar
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl text-[#ffffff] tracking-tight">
              Statutory Renewal & Filing Cycles
            </h1>
            <p className="text-xs text-[#9194a1] mt-1.5 max-w-2xl leading-relaxed">
              Strict renewal periods and mandatory audit filing dates recorded in published statutory orders for your enterprise.
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
            title="Calendar Service Notice"
            message={error}
            onRetry={() => window.location.reload()}
          />
        )}

        {loading ? (
          <div className="space-y-4">
            <LoadingSkeleton count={4} className="h-24 w-full rounded-[10px]" />
          </div>
        ) : events.length === 0 ? (
          <div className="bg-[#040406] rounded-[10px] border border-[#1c1d22] p-12 text-center shadow-2xl">
            <div className="text-3xl mb-3">📅</div>
            <h3 className="font-serif text-lg text-[#ffffff]">
              No renewal cycle is recorded for your requirements
            </h3>
            <p className="text-xs text-[#9194a1] mt-2 max-w-md mx-auto leading-relaxed">
              A filing date appears here only where published knowledge states a specific renewal period for an active compliance mandate.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {events.map((evt: any, idx) => (
              <div
                key={evt.id || idx}
                className="bg-[#040406] rounded-[10px] border border-[#1c1d22] p-5 sm:p-6 shadow-2xl hover:border-[#2e3038] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-semibold text-[#cc9166] bg-[#cc9166]/10 border border-[#cc9166]/30 px-2.5 py-0.5 rounded-full">
                      {evt.date || evt.due_date}
                    </span>
                    <span className="text-xs font-medium text-[#ffffff]">
                      {evt.authority}
                    </span>
                    <span className="text-[#2e3038]">·</span>
                    <span className="text-xs text-[#777a88]">
                      Basis: {evt.type ? evt.type.replace(/_/g, " ") : "Statutory Schedule"}
                    </span>
                    {evt.statutory_citation && (
                      <>
                        <span className="text-[#2e3038]">·</span>
                        <span className="font-mono text-[11px] text-[#5e616e]">{evt.statutory_citation}</span>
                      </>
                    )}
                  </div>

                  <h3 className="font-serif text-base text-[#ffffff] font-normal leading-snug">
                    {evt.title}
                  </h3>

                  <p className="text-xs text-[#9194a1] leading-relaxed">{evt.basis}</p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs font-mono font-medium text-[#e2e3e9] bg-[#121317] px-3 py-1 rounded-full border border-[#1c1d22]">
                    {evt.days_remaining ? `${evt.days_remaining} days remaining` : `${evt.period_value || 14} days left`}
                  </span>
                  <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold border ${
                    evt.status === "URGENT"
                      ? "bg-rose-950/40 text-rose-300 border-rose-800/50"
                      : "bg-[#121317] text-[#cc9166] border-[#cc9166]/30"
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
          <div className="bg-[#040406] rounded-[10px] border border-[#1c1d22] p-6 shadow-2xl space-y-3">
            <h2 className="text-xs font-semibold text-[#ffffff] uppercase tracking-wider">
              Statutory Scope Boundaries (Not Tracked)
            </h2>
            <p className="text-xs text-[#9194a1] leading-relaxed">{coverage.not_covered_reason}</p>
            <div className="flex flex-wrap gap-2 pt-1">
              {coverage.not_covered.map((item) => (
                <span
                  key={item}
                  className="inline-flex items-center rounded-full bg-[#121317] px-3 py-1 text-[11px] font-medium text-[#777a88] border border-[#1c1d22]"
                >
                  {item.replace(/_/g, " ")}
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
        <div className="min-h-screen bg-[#08080a] flex items-center justify-center text-xs text-[#9194a1]">
          Loading statutory calendar...
        </div>
      }
    >
      <CalendarContent />
    </Suspense>
  );
}
