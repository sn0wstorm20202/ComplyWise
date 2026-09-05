"use client";

import React, { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import ErrorState from "@/components/ErrorState";
import { api } from "@/lib/api";
import { CalendarEvent } from "@/types";

function CalendarContent() {
  const searchParams = useSearchParams();
  const paramBusinessId = searchParams.get("business_id");

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
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
        setBusinessId(bizId);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load compliance calendar.");
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
              Screen 12 · Statutory Calendar
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-slate-950 mt-1">
              Statutory Deadlines & Filing Schedule
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Automated tracking of annual returns, environmental statements, and renewal cutoff dates.
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
              No Upcoming Statutory Deadlines Found
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Statutory deadlines are populated automatically after compliance matrix evaluation.
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

                  <p className="text-xs text-rose-600 font-medium">
                    Statutory Penalty Risk: {evt.penalty_risk}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center rounded-md bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 border border-amber-200">
                    {evt.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
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
