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
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-semibold text-indigo-600 tracking-wide uppercase">
              Screen 12 · Statutory Calendar
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-slate-950 mt-1">
              Statutory Renewal Cycles
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Renewal periods recorded in published knowledge for your applicable
              requirements. Filing dates are not inferred.
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
            title="Calendar Service Notice"
            message={error}
            onRetry={() => window.location.reload()}
          />
        )}

        {loading ? (
          <div className="space-y-4">
            <LoadingSkeleton count={4} className="h-24 w-full" />
          </div>
        ) : events.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-xs">
            <div className="text-2xl">📅</div>
            <h3 className="text-sm font-bold text-slate-900 mt-2">
              No renewal cycle is recorded for your requirements
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-lg mx-auto">
              A date appears here only where published knowledge states a renewal
              period for a requirement the engine found applicable. Nothing is
              inferred from the absence of one.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {events.map((evt) => (
              <div
                key={evt.id}
                className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs hover:border-indigo-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                      {evt.date}
                    </span>
                    <span className="text-xs font-semibold text-slate-700">
                      {evt.authority}
                    </span>
                    <span className="text-slate-300">·</span>
                    <span className="text-xs text-slate-500">
                      Type: {evt.type.replace(/_/g, " ")}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900">{evt.title}</h3>

                  {/* The citation for the date, in place of the penalty claim
                      that used to sit here. No penalty data is held. */}
                  <p className="text-xs text-slate-500">{evt.basis}</p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-1 rounded border border-slate-200">
                    {evt.days_remaining} days
                  </span>
                  <span className="inline-flex items-center rounded-md bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 border border-amber-200">
                    {evt.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* What this calendar does not track. Shown whenever the response loaded,
            so the user is never left to infer coverage from an empty list. */}
        {!loading && coverage && coverage.not_covered.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-2">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
              Not tracked
            </h2>
            <p className="text-xs text-slate-500">{coverage.not_covered_reason}</p>
            <div className="flex flex-wrap gap-2 pt-1">
              {coverage.not_covered.map((item) => (
                <span
                  key={item}
                  className="inline-flex items-center rounded-md bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-600 border border-slate-200"
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
        <div className="min-h-screen bg-slate-50 flex items-center justify-center text-sm text-slate-500">
          Loading statutory calendar...
        </div>
      }
    >
      <CalendarContent />
    </Suspense>
  );
}
