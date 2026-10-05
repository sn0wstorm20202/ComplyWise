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
import { useLanguage } from "@/context/LanguageContext";
import { useBusinessContext } from "@/context/BusinessContext";
import {
  Bell,
  Mail,
  Calendar as CalendarIcon,
  RefreshCw,
  CheckCircle2,
  ExternalLink,
  ShieldAlert,
} from "lucide-react";

function CalendarContent() {
  const { t } = useLanguage();
  const { activeBusinessId, profile, isDemoMode } = useBusinessContext();
  const searchParams = useSearchParams();
  const paramBusinessId = searchParams.get("business_id");

  const [loading, setLoading] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncFeedback, setSyncFeedback] = useState<{
    dispatched: number;
    skipped: number;
    time: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [coverage, setCoverage] = useState<Pick<
    CalendarListResponse,
    "not_covered" | "not_covered_reason"
  > | null>(null);
  const [businessId, setBusinessId] = useState<string>("");

  const [googleConnected, setGoogleConnected] = useState<boolean>(false);
  const [googleEmail, setGoogleEmail] = useState<string>("");
  const [googleLoading, setGoogleLoading] = useState<boolean>(false);
  const [googleMessage, setGoogleMessage] = useState<string | null>(null);

  useEffect(() => {
    async function checkGoogleStatus() {
      try {
        const status = await api.calendar.getGoogleStatus();
        if (status?.connected) {
          setGoogleConnected(true);
          setGoogleEmail(status.google_email || "");
        }
      } catch {
        // Not connected or unauthenticated
      }
    }
    checkGoogleStatus();
  }, []);

  useEffect(() => {
    const code = searchParams.get("code");
    if (!code) return;
    const safeCode = code; // narrowed: string (null already excluded above)
    async function completeAuth() {
      setGoogleLoading(true);
      try {
        const redirectUri = window.location.origin + "/calendar";
        const res = await api.calendar.handleGoogleCallback(safeCode, redirectUri);
        if (res?.connected) {
          setGoogleConnected(true);
          setGoogleEmail(res.google_email || "");
          setGoogleMessage("Google Calendar connected successfully!");
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to connect Google Calendar.";
        setGoogleMessage(`Connection notice: ${msg}`);
      } finally {
        setGoogleLoading(false);
      }
    }
    completeAuth();
  }, [searchParams]);

  useEffect(() => {
    const bizId =
      paramBusinessId ||
      activeBusinessId ||
      (typeof window !== "undefined" ? localStorage.getItem("complywise_active_business_id") : null);

    if (!bizId) { setLoading(false); return; }
    setBusinessId(bizId);

    if (!isDemoMode) {
      setEvents([]);
      setCoverage(null);
    }

    async function loadCalendar(id: string) {
      setError(null);
      setLoading(true);
      try {
        const resp = await api.calendar.list(id);
        if (resp && resp.events) {
          setEvents(resp.events);
          setCoverage({
            not_covered: resp.not_covered,
            not_covered_reason: resp.not_covered_reason,
          });
        }
      } catch {
        if (!isDemoMode) {
          setEvents([]);
        }
      } finally {
        setLoading(false);
      }
    }

    loadCalendar(bizId);
  }, [paramBusinessId, activeBusinessId, isDemoMode]);

  const handleConnectGoogle = async () => {
    setGoogleLoading(true);
    setGoogleMessage(null);
    try {
      const redirectUri = window.location.origin + "/calendar";
      const res = await api.calendar.getGoogleAuthUrl(redirectUri);
      if (res?.auth_url) {
        window.location.href = res.auth_url;
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Could not initialize Google authentication.";
      setGoogleMessage(msg);
      setGoogleLoading(false);
    }
  };

  const handleDisconnectGoogle = async () => {
    setGoogleLoading(true);
    try {
      await api.calendar.disconnectGoogle();
      setGoogleConnected(false);
      setGoogleEmail("");
      setGoogleMessage("Google Calendar disconnected.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Disconnect failed.";
      setGoogleMessage(msg);
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleTriggerSync = async () => {
    if (!businessId) return;
    setIsSyncing(true);
    try {
      const res = await api.calendar.sync(businessId, { check_overdue: true, include_in_app: true });
      setSyncFeedback({
        dispatched: res.dispatched_count,
        skipped: res.skipped_idempotent_count,
        time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
      });
      // Refresh event list
      const resp = await api.calendar.list(businessId);
      if (resp && resp.events && resp.events.length > 0) {
        setEvents(resp.events);
      }
    } catch (err) {
      console.error("Sync failed:", err);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <AppShell activeView="calendar">
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-[16px] border border-[var(--ui-border)] p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full border border-[var(--ui-border)] bg-[var(--ui-inset)] text-[var(--ui-text)] text-[11px] font-semibold tracking-wider uppercase mb-2">
              {t("navigation.calendar")}
            </div>
            <h1 className="font-sans text-2xl sm:text-3xl text-[var(--ui-text)] font-bold tracking-tight">
              {t("calendar.title")}
            </h1>
            <p className="text-xs text-[var(--ui-secondary)] mt-1.5 max-w-2xl leading-relaxed">
              {t("calendar.subtitle")}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/notifications"
              className="inline-flex items-center gap-1.5 rounded-full border border-[var(--ui-border)] bg-[var(--ui-bg)] px-4 py-2 text-xs font-semibold text-[var(--ui-text)] hover:bg-[var(--ui-inset)] transition-colors"
            >
              <Bell className="h-3.5 w-3.5 text-amber-700" />
              Notification Audit Center
            </Link>
            <Link
              href={`/dashboard?business_id=${businessId}`}
              className="rounded-full border border-[var(--ui-border)] bg-[var(--ui-bg)] px-4 py-2 text-xs font-semibold text-[var(--ui-text)] hover:bg-[var(--ui-inset)] transition-colors"
            >
              ← {t("navigation.dashboard")}
            </Link>
          </div>
        </div>

        {/* Live Notification & Calendar Sync Control Bar */}
        <div className="bg-white rounded-[16px] border border-[var(--ui-border)] p-5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[var(--ui-text)] uppercase tracking-wider">
                Automated Notification Engine
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--ui-sage-faint)] border border-[var(--ui-sage-soft)] text-[var(--ui-sage)] font-semibold text-[10px]">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--ui-sage)] animate-pulse" />
                Active
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--ui-secondary)]">
              <span className="inline-flex items-center gap-1">
                <Mail className="h-3.5 w-3.5 text-[var(--ui-sage)]" /> Email (T-7 Advance + T-1 Urgent)
              </span>
              <span>•</span>
              <span className="inline-flex items-center gap-1">
                <CalendarIcon className="h-3.5 w-3.5 text-[var(--ui-info)]" /> Google Calendar (T-1 Only)
              </span>
              <span>•</span>
              <span className="inline-flex items-center gap-1">
                <Bell className="h-3.5 w-3.5 text-[var(--ui-sage)]" /> In-App Read Tracking
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {syncFeedback && (
              <span className="text-xs text-[var(--ui-sage)] font-medium bg-[var(--ui-sage-faint)] px-3 py-1.5 rounded-lg border border-[var(--ui-sage-soft)]">
                Synced at {syncFeedback.time}: {syncFeedback.dispatched} dispatched, {syncFeedback.skipped} skipped
              </span>
            )}
            <button
              type="button"
              onClick={handleTriggerSync}
              disabled={isSyncing}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--ui-text)] hover:bg-[var(--ui-text)] text-xs font-semibold text-white shadow-2xs transition-colors cursor-pointer disabled:opacity-60"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? "animate-spin" : ""}`} />
              {isSyncing ? "Evaluating Deadlines..." : "Sync Deadlines Now"}
            </button>
          </div>
        </div>



        {/* Google Calendar Connection Card */}
        <div className={`bg-white rounded-[16px] border shadow-2xs p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
          googleConnected ? "border-[var(--ui-sage-soft)] bg-[var(--ui-info-soft)]/30" : "border-[var(--ui-border)]"
        }`}>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <CalendarIcon className={`h-4 w-4 ${googleConnected ? "text-[var(--ui-info)]" : "text-[var(--ui-muted)]"}`} />
              <span className="text-xs font-bold text-[var(--ui-text)] uppercase tracking-wider">
                {googleConnected ? t("calendar.googleConnected") || "Google Calendar Connected" : t("calendar.connectGoogleCalendar") || "Connect Google Calendar"}
              </span>
              {googleConnected && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--ui-info-soft)] border border-[var(--ui-sage-soft)] text-[var(--ui-info)] font-semibold text-[10px]">
                  <CheckCircle2 className="h-2.5 w-2.5" />
                  Authorized
                </span>
              )}
            </div>
            <p className="text-xs text-[var(--ui-secondary)]">
              {googleConnected
                ? <>{t("calendar.googleConnectedAs") || "Connected as"} <span className="font-semibold text-[var(--ui-text)]">{googleEmail}</span> · T-1 deadlines will create Calendar events in your personal account.</>
                : t("calendar.googleAuthPrompt") || "Connect your personal Google account to receive T-1 statutory deadline reminders directly in your calendar."}
            </p>
            {googleMessage && (
              <p className="text-xs text-amber-700 font-medium mt-1">{googleMessage}</p>
            )}
          </div>
          <div className="shrink-0">
            {googleConnected ? (
              <button
                type="button"
                onClick={handleDisconnectGoogle}
                disabled={googleLoading}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100 text-xs font-semibold transition-colors disabled:opacity-60 cursor-pointer"
              >
                {googleLoading ? "Disconnecting..." : t("calendar.disconnectGoogleCalendar") || "Disconnect"}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleConnectGoogle}
                disabled={googleLoading}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--ui-text)] hover:bg-[var(--ui-text)] text-xs font-semibold text-white shadow-2xs transition-colors cursor-pointer disabled:opacity-60"
              >
                <CalendarIcon className="h-3.5 w-3.5" />
                {googleLoading ? "Redirecting..." : t("calendar.connectGoogleCalendar") || "Connect Google Calendar"}
              </button>
            )}
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
          <div className="bg-white rounded-[16px] border border-[var(--ui-border)] p-12 text-center shadow-2xs">
            <div className="text-3xl mb-3">📅</div>
            <h3 className="font-sans font-bold text-lg text-[var(--ui-text)]">
              No renewal cycle is recorded for your requirements
            </h3>
            <p className="text-xs text-[var(--ui-secondary)] mt-2 max-w-md mx-auto leading-relaxed">
              A filing date appears here only where published knowledge states a specific renewal period for an active compliance mandate.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {[...events].sort((a: any,b: any) => new Date(a.date || a.due_date).getTime() - new Date(b.date || b.due_date).getTime()).map((evt: any, idx) => (
              <div
                key={evt.id || idx}
                className="bg-white rounded-[16px] border border-[var(--ui-border)] p-5 sm:p-6 shadow-2xs hover:border-[var(--ui-border-strong)] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-[var(--ui-text)] bg-[var(--ui-inset)] border border-[var(--ui-border)] px-2.5 py-0.5 rounded-full">
                      {evt.date || evt.due_date}
                    </span>
                    <span className="text-xs font-semibold text-[var(--ui-text)]">
                      {evt.authority}
                    </span>
                    <span className="text-[var(--ui-border-strong)]">·</span>
                    <span className="text-xs text-[var(--ui-secondary)]">
                      Basis: {evt.type ? evt.type.replace(/_/g, " ") : "Statutory Schedule"}
                    </span>
                    {evt.statutory_citation && (
                      <>
                        <span className="text-[var(--ui-border-strong)]">·</span>
                        <span className="font-mono text-[11px] text-[var(--ui-secondary)]">{evt.statutory_citation}</span>
                      </>
                    )}
                  </div>

                  <h3 className="font-sans text-base text-[var(--ui-text)] font-bold leading-snug">
                    {evt.title}
                  </h3>

                  <p className="text-xs text-[var(--ui-secondary)] leading-relaxed">{evt.basis}</p>

                  <div className="flex flex-wrap items-center gap-2 pt-1.5">
                    <span className="inline-flex items-center gap-1 text-[10px] text-[var(--ui-sage)] bg-[var(--ui-sage-faint)] px-2 py-0.5 rounded-md border border-[var(--ui-sage-soft)]/60 font-medium">
                      <Mail className="h-2.5 w-2.5" /> Email: T-7 + T-1
                    </span>
                    <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md border font-medium ${
                      googleConnected
                        ? "text-[var(--ui-info)] bg-[var(--ui-info-soft)] border-[var(--ui-sage-soft)]/60"
                        : "text-[var(--ui-muted)] bg-[var(--ui-bg)] border-[var(--ui-border)]"
                    }`}>
                      <CalendarIcon className="h-2.5 w-2.5" /> Calendar: T-1 {!googleConnected && "(Not Connected)"}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] text-[var(--ui-sage)] bg-[var(--ui-sage-faint)] px-2 py-0.5 rounded-md border border-[var(--ui-sage-soft)]/60 font-medium">
                      <Bell className="h-2.5 w-2.5" /> In-App Center
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <Link className="ui-button" href={`/workflows?business_id=${encodeURIComponent(businessId || "")}`}>Open action →</Link>
                  <span className="text-xs font-mono font-medium text-[var(--ui-text)] bg-[var(--ui-bg)] px-3 py-1 rounded-full border border-[var(--ui-border)]">
                    {evt.days_remaining !== undefined
                      ? evt.days_remaining < 0 ? `${Math.abs(evt.days_remaining)} days overdue` : evt.days_remaining === 0 ? "Due today" : `${evt.days_remaining} days remaining`
                      : "Date to be confirmed"}
                  </span>
                  <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold border ${
                    evt.status === "URGENT"
                      ? "bg-rose-50 text-rose-700 border-rose-200"
                      : "bg-[var(--ui-inset)] text-[var(--ui-text)] border-[var(--ui-border)]"
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
          <div className="bg-white rounded-[16px] border border-[var(--ui-border)] p-6 shadow-2xs space-y-3">
            <h2 className="text-xs font-semibold text-[var(--ui-text)] uppercase tracking-wider">
              Statutory Scope Boundaries (Not Tracked)
            </h2>
            <p className="text-xs text-[var(--ui-secondary)] leading-relaxed">{coverage.not_covered_reason}</p>
            <div className="flex flex-wrap gap-2 pt-1">
              {coverage.not_covered.map((item, idx) => (
                <span
                  key={typeof item === "string" ? item : idx}
                  className="inline-flex items-center rounded-full bg-[var(--ui-bg)] px-3 py-1 text-[11px] font-medium text-[var(--ui-secondary)] border border-[var(--ui-border)]"
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
        <div className="min-h-screen bg-[var(--ui-bg)] flex items-center justify-center text-xs text-[var(--ui-secondary)]">
          Loading statutory calendar...
        </div>
      }
    >
      <CalendarContent />
    </Suspense>
  );
}
