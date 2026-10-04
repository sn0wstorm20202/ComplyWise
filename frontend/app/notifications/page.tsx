"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import ErrorState from "@/components/ErrorState";
import {
  Bell,
  Calendar,
  AlertTriangle,
  FileText,
  RotateCw,
  Sparkles,
  CheckCircle2,
  Filter,
  Mail,
  ShieldAlert,
  Clock,
  Check,
  Settings,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { useBusinessContext } from "@/context/BusinessContext";
import { useLanguage } from "@/context/LanguageContext";
import { api } from "@/lib/api";
import {
  DeadlineNotificationRecord,
  NotificationSummaryResponse,
  NotificationPreferenceResponse,
} from "@/lib/api/calendar";

interface UnifiedNotification {
  id: string;
  source: "API" | "DEMO";
  type: "DEADLINE" | "RENEWAL" | "DOCUMENT_ISSUE" | "WORKFLOW_EVENT" | "REGULATORY_UPDATE";
  title: string;
  message: string;
  timestamp: string;
  urgency: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  channel: "GOOGLE_CALENDAR" | "EMAIL" | "IN_APP";
  status: "DELIVERED" | "SIMULATED" | "FAILED" | "PENDING" | "RETRYING";
  eventType: "UPCOMING" | "OVERDUE" | "ESCALATION";
  deadlineDate?: string;
  offsetDays?: number;
  actionLabel: string;
  actionUrl: string;
  isRead: boolean;
  attemptCount?: number;
  failureReason?: string;
}

const DEMO_FALLBACK_NOTIFICATIONS: UnifiedNotification[] = [
  {
    id: "demo-1",
    source: "DEMO",
    type: "DEADLINE",
    title: "Annual Boiler Inspection Filing Due in 7 Days",
    message: "Indian Boilers Act certificate calibration and hydrostatic pressure test logs must be uploaded.",
    timestamp: "T-7 Advance Reminder",
    urgency: "HIGH",
    channel: "GOOGLE_CALENDAR",
    status: "DELIVERED",
    eventType: "UPCOMING",
    deadlineDate: "2026-09-20",
    offsetDays: 7,
    actionLabel: "View Calendar",
    actionUrl: "/calendar",
    isRead: false,
  },
  {
    id: "demo-2",
    source: "DEMO",
    type: "DEADLINE",
    title: "KSPCB Consent to Operate (CTO) Quadrennial Renewal Due Tomorrow",
    message: "Karnataka State Pollution Control Board online portal mandatory annual consent renewal.",
    timestamp: "T-1 Urgent Alert",
    urgency: "CRITICAL",
    channel: "EMAIL",
    status: "DELIVERED",
    eventType: "UPCOMING",
    deadlineDate: "2026-09-14",
    offsetDays: 1,
    actionLabel: "Open Documents",
    actionUrl: "/documents",
    isRead: false,
  },
  {
    id: "demo-3",
    source: "DEMO",
    type: "REGULATORY_UPDATE",
    title: "New QCO Mandate Published: Smart Meters (IS 16444)",
    message: "Ministry of Power gazette notification amends transition timeline for micro-enterprises by 90 days.",
    timestamp: "1 day ago",
    urgency: "MEDIUM",
    channel: "IN_APP",
    status: "DELIVERED",
    eventType: "UPCOMING",
    actionLabel: "Read Gazette Update",
    actionUrl: "/regulatory-updates",
    isRead: true,
  },
  {
    id: "demo-4",
    source: "DEMO",
    type: "DOCUMENT_ISSUE",
    title: "Overdue Statutory Compliance: Factory Electrical Safety Audit",
    message: "Filing deadline was 7 days ago. Penalty escalation risk under Karnataka Factories Rules §12.",
    timestamp: "Overdue (+7d)",
    urgency: "CRITICAL",
    channel: "IN_APP",
    status: "DELIVERED",
    eventType: "OVERDUE",
    deadlineDate: "2026-09-06",
    offsetDays: -7,
    actionLabel: "Resolve Overdue",
    actionUrl: "/compliance",
    isRead: false,
  },
];

function NotificationsContent() {
  const { profile, activeBusinessId, isDemoMode } = useBusinessContext();
  const { t } = useLanguage();

  const [filter, setFilter] = useState<string>("ALL");
  const [notifications, setNotifications] = useState<UnifiedNotification[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<NotificationSummaryResponse | null>(null);
  const [preferences, setPreferences] = useState<NotificationPreferenceResponse | null>(null);
  const [showPreferences, setShowPreferences] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdatingPrefs, setIsUpdatingPrefs] = useState(false);
  const [isLiveBackend, setIsLiveBackend] = useState(false);

  // Fetch live notifications and summary
  const loadNotificationsData = useCallback(async () => {
    if (!activeBusinessId) {
      setNotifications(isDemoMode ? DEMO_FALLBACK_NOTIFICATIONS : []);
      setIsLiveBackend(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const [notifRes, summaryRes, prefRes] = await Promise.allSettled([
        api.calendar.listNotifications(activeBusinessId),
        api.calendar.getSummary(activeBusinessId),
        api.calendar.getPreferences(activeBusinessId),
      ]);

      if (notifRes.status === "fulfilled" && notifRes.value.notifications) {
        const liveItems: UnifiedNotification[] = notifRes.value.notifications.map(
          (r: DeadlineNotificationRecord) => {
            let itemType: UnifiedNotification["type"] = "DEADLINE";
            if (r.event_type === "OVERDUE") itemType = "DOCUMENT_ISSUE";

            return {
              id: r.id,
              source: "API",
              type: itemType,
              title: r.subject_or_title || `Statutory Compliance Alert: ${r.requirement_id}`,
              message:
                r.event_type === "OVERDUE"
                  ? `Statutory deadline ${r.deadline_date} is overdue. Penalty escalation risk.`
                  : `Requirement ${r.requirement_id} has a statutory deadline on ${r.deadline_date} (T-${r.offset_days} notice).`,
              timestamp: new Date(r.created_at).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              }),
              urgency: r.priority || "MEDIUM",
              channel: r.channel,
              status: r.status,
              eventType: r.event_type || "UPCOMING",
              deadlineDate: r.deadline_date,
              offsetDays: r.offset_days,
              actionLabel: r.event_type === "OVERDUE" ? "View Overdue" : "View Details",
              actionUrl: "/calendar",
              isRead: r.is_read,
              attemptCount: r.attempt_count,
              failureReason: r.failure_reason,
            };
          }
        );

        if (liveItems.length > 0) {
          setNotifications(liveItems);
        } else {
          setNotifications([]);
        }
        setIsLiveBackend(true);
      } else {
        setNotifications(isDemoMode ? DEMO_FALLBACK_NOTIFICATIONS : []);
        if (!isDemoMode) setError("We couldn't load your alerts. Please try again.");
        setIsLiveBackend(false);
      }

      if (summaryRes.status === "fulfilled") {
        setSummary(summaryRes.value);
      }

      if (prefRes.status === "fulfilled") {
        setPreferences(prefRes.value);
      }
    } catch {
      setNotifications(isDemoMode ? DEMO_FALLBACK_NOTIFICATIONS : []);
      if (!isDemoMode) setError("We couldn't load your alerts. Please try again.");
      setIsLiveBackend(false);
    } finally {
      setIsLoading(false);
    }
  }, [activeBusinessId, isDemoMode]);

  useEffect(() => {
    loadNotificationsData();
  }, [loadNotificationsData]);

  // Mark an individual notification as read
  const handleMarkRead = async (item: UnifiedNotification) => {
    if (item.isRead) return;

    // Optimistic UI update
    setNotifications((prev) =>
      prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n))
    );
    if (summary) {
      setSummary((s) => (s ? { ...s, unread_count: Math.max(0, s.unread_count - 1) } : null));
    }

    if (item.source === "API" && activeBusinessId) {
      try {
        await api.calendar.markRead(activeBusinessId, item.id);
      } catch (err) {
        console.error("Failed to mark notification as read on server:", err);
        setNotifications(prev => prev.map(n => n.id === item.id ? { ...n, isRead: false } : n));
        setSummary(s => s ? { ...s, unread_count: s.unread_count + 1 } : null);
        setError("This alert wasn't marked as read. Please try again.");
      }
    }
  };

  // Mark all notifications as read
  const handleMarkAllRead = async () => {
    const previousNotifications = notifications;
    const previousSummary = summary;
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    if (summary) {
      setSummary((s) => (s ? { ...s, unread_count: 0 } : null));
    }

    if (activeBusinessId && isLiveBackend) {
      try {
        await api.calendar.markAllRead(activeBusinessId);
      } catch (err) {
        console.error("Failed to mark all notifications as read:", err);
        setNotifications(previousNotifications);
        setSummary(previousSummary);
        setError("Your alerts weren't marked as read. Please try again.");
      }
    }
  };

  // Save preference updates
  const handleTogglePreference = async (key: keyof NotificationPreferenceResponse) => {
    if (!preferences || !activeBusinessId) return;

    const updated = {
      ...preferences,
      [key]: !preferences[key],
    };

    setPreferences(updated);
    setIsUpdatingPrefs(true);
    try {
      const res = await api.calendar.updatePreferences(activeBusinessId, {
        [key]: updated[key],
      });
      setPreferences(res);
    } catch (err) {
      console.error("Failed to update notification preferences:", err);
      // Revert
      setPreferences(preferences);
    } finally {
      setIsUpdatingPrefs(false);
    }
  };

  const handleLanguageChange = async (newLang: "en" | "hi" | "bn") => {
    if (!preferences || !activeBusinessId) return;
    const updated = { ...preferences, language: newLang };
    setPreferences(updated);
    setIsUpdatingPrefs(true);
    try {
      const res = await api.calendar.updatePreferences(activeBusinessId, { language: newLang });
      setPreferences(res);
    } catch (err) {
      console.error("Failed to update language preference:", err);
      setPreferences(preferences);
    } finally {
      setIsUpdatingPrefs(false);
    }
  };

  const unreadCount = summary?.unread_count ?? notifications.filter((n) => !n.isRead).length;
  const overdueCount = summary?.overdue_count ?? notifications.filter((n) => n.eventType === "OVERDUE").length;
  const urgentCount =
    summary?.urgent_count ??
    notifications.filter((n) => n.urgency === "CRITICAL" || n.urgency === "HIGH").length;
  const totalCount = summary?.total ?? notifications.length;

  // Filter application
  const filtered = notifications.filter((n) => {
    if (filter === "ALL") return true;
    if (filter === "UNREAD") return !n.isRead;
    if (filter === "OVERDUE") return n.eventType === "OVERDUE";
    if (filter === "URGENT") return n.urgency === "CRITICAL" || n.urgency === "HIGH";
    if (filter === "IN_APP") return n.channel === "IN_APP";
    if (filter === "EMAIL") return n.channel === "EMAIL";
    if (filter === "GOOGLE_CALENDAR") return n.channel === "GOOGLE_CALENDAR";
    return n.type === filter;
  });

  const getUrgencyBadge = (urgency: UnifiedNotification["urgency"]) => {
    switch (urgency) {
      case "CRITICAL":
        return "bg-rose-50 text-rose-700 border-rose-200";
      case "HIGH":
        return "bg-amber-50 text-amber-800 border-amber-200";
      case "MEDIUM":
        return "bg-amber-50/50 text-amber-700 border-amber-200/60";
      case "LOW":
        return "bg-[var(--ui-bg)] text-[var(--ui-secondary)] border-[var(--ui-border)]";
    }
  };

  const getChannelBadge = (channel: UnifiedNotification["channel"]) => {
    switch (channel) {
      case "GOOGLE_CALENDAR":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[var(--ui-info)] bg-[var(--ui-info-soft)] px-2 py-0.5 rounded-md border border-[var(--ui-sage-soft)]">
            <Calendar className="h-3 w-3 text-[var(--ui-info)]" /> Calendar
          </span>
        );
      case "EMAIL":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[var(--ui-sage)] bg-[var(--ui-sage-faint)] px-2 py-0.5 rounded-md border border-[var(--ui-sage-soft)]">
            <Mail className="h-3 w-3 text-[var(--ui-sage)]" /> Email
          </span>
        );
      case "IN_APP":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[var(--ui-sage)] bg-[var(--ui-sage-faint)] px-2 py-0.5 rounded-md border border-[var(--ui-sage-soft)]">
            <Bell className="h-3 w-3 text-[var(--ui-sage)]" /> In-App
          </span>
        );
    }
  };

  const getIcon = (item: UnifiedNotification) => {
    if (item.eventType === "OVERDUE") {
      return <AlertTriangle className="h-4 w-4 text-rose-500" />;
    }
    if (item.urgency === "CRITICAL") {
      return <ShieldAlert className="h-4 w-4 text-rose-500" />;
    }
    if (item.channel === "GOOGLE_CALENDAR") {
      return <Calendar className="h-4 w-4 text-[var(--ui-info)]" />;
    }
    if (item.channel === "EMAIL") {
      return <Mail className="h-4 w-4 text-[var(--ui-sage)]" />;
    }
    return <Bell className="h-4 w-4 text-amber-600" />;
  };

  const [isSyncing, setIsSyncing] = useState(false);

  const handleSyncDeadlines = async () => {
    if (!activeBusinessId) return;
    setIsSyncing(true);
    try {
      await api.calendar.sync(activeBusinessId, { check_overdue: true, include_in_app: true });
      await loadNotificationsData();
    } catch (err) {
      console.error("Failed to sync deadlines:", err);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <AppShell activeView="notifications">
      <div className="space-y-6 max-w-7xl mx-auto">
        {error && <ErrorState title={error} message="Your alerts remain available for review." onRetry={loadNotificationsData} />}
        {/* Header */}
        <div className="bg-white rounded-[12px] border border-[var(--ui-border)] p-6 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-amber-800 tracking-wide uppercase">
                {profile.businessName || "ComplyWise Enterprise"}
              </span>
              <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-xs text-amber-800 border border-amber-200 font-medium">
                {unreadCount} Unread
              </span>
              {isLiveBackend && (
                <span className="inline-flex items-center gap-1 rounded-full bg-[var(--ui-sage-faint)] px-2 py-0.5 text-[11px] text-[var(--ui-sage)] border border-[var(--ui-sage-soft)] font-medium">
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--ui-sage)] animate-pulse" /> Live System
                </span>
              )}
            </div>
            <h1 className="text-2xl font-sans font-bold tracking-tight text-[var(--ui-text)] mt-1">
              Compliance Alerts & Notifications
            </h1>
            <p className="text-xs text-[var(--ui-secondary)] mt-0.5">
              Statutory deadline notices, non-spam overdue alerts, and multi-channel delivery audit log.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSyncDeadlines}
              disabled={isSyncing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--ui-text)] hover:bg-[var(--ui-text)] text-xs font-semibold text-white transition-colors shadow-2xs cursor-pointer disabled:opacity-60"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? "animate-spin" : ""}`} />
              {isSyncing ? "Syncing..." : "Sync Deadlines"}
            </button>
            <button
              type="button"
              onClick={() => setShowPreferences(!showPreferences)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-[var(--ui-border)] hover:bg-[var(--ui-bg)] text-xs font-semibold text-[var(--ui-text)] transition-colors shadow-2xs cursor-pointer"
            >
              <Settings className="h-3.5 w-3.5 text-[var(--ui-secondary)]" />
              Preferences
            </button>
            <button
              type="button"
              onClick={loadNotificationsData}
              disabled={isLoading}
              className="p-1.5 rounded-lg bg-white border border-[var(--ui-border)] hover:bg-[var(--ui-bg)] text-[var(--ui-secondary)] transition-colors shadow-2xs cursor-pointer"
              title="Refresh notifications"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin text-amber-600" : ""}`} />
            </button>
            <button
              type="button"
              onClick={handleMarkAllRead}
              className="px-3.5 py-1.5 rounded-lg bg-white border border-[var(--ui-border)] hover:bg-[var(--ui-bg)] text-xs font-semibold text-[var(--ui-text)] transition-colors cursor-pointer shadow-2xs"
            >
              Mark all as read
            </button>
          </div>
        </div>

        {/* Channel Preferences Accordion */}
        {showPreferences && (
          <div className="bg-white rounded-[12px] border border-[var(--ui-border)] p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--ui-border)]">
              <div>
                <h2 className="text-sm font-bold text-[var(--ui-text)]">Delivery Channel & Notification Preferences</h2>
                <p className="text-xs text-[var(--ui-secondary)]">Configure your recipient channels and statutory alert language.</p>
              </div>
              <span className="text-[11px] text-[var(--ui-muted)]">
                {isUpdatingPrefs ? "Saving changes..." : "Auto-saved"}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
              <label className="flex items-center justify-between p-3 rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg)]/50 cursor-pointer hover:bg-[var(--ui-bg)]">
                <span className="font-semibold text-[var(--ui-text)] flex items-center gap-2">
                  <Mail className="h-4 w-4 text-[var(--ui-sage)]" /> Email Alerts
                </span>
                <input
                  type="checkbox"
                  checked={preferences?.email_enabled ?? true}
                  onChange={() => handleTogglePreference("email_enabled")}
                  className="rounded border-[var(--ui-border-strong)] text-amber-600 focus:ring-amber-500 h-4 w-4 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg)]/50 cursor-pointer hover:bg-[var(--ui-bg)]">
                <span className="font-semibold text-[var(--ui-text)] flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-[var(--ui-info)]" /> Google Calendar
                </span>
                <input
                  type="checkbox"
                  checked={preferences?.calendar_enabled ?? true}
                  onChange={() => handleTogglePreference("calendar_enabled")}
                  className="rounded border-[var(--ui-border-strong)] text-amber-600 focus:ring-amber-500 h-4 w-4 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg)]/50 cursor-pointer hover:bg-[var(--ui-bg)]">
                <span className="font-semibold text-[var(--ui-text)] flex items-center gap-2">
                  <Bell className="h-4 w-4 text-[var(--ui-sage)]" /> In-App Center
                </span>
                <input
                  type="checkbox"
                  checked={preferences?.in_app_enabled ?? true}
                  onChange={() => handleTogglePreference("in_app_enabled")}
                  className="rounded border-[var(--ui-border-strong)] text-amber-600 focus:ring-amber-500 h-4 w-4 cursor-pointer"
                />
              </label>

              <div className="p-3 rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg)]/50 flex items-center justify-between">
                <span className="font-semibold text-[var(--ui-text)]">Alert Language</span>
                <select
                  value={preferences?.language ?? "en"}
                  onChange={(e) => handleLanguageChange(e.target.value as "en" | "hi" | "bn")}
                  className="rounded-md border border-[var(--ui-border-strong)] text-xs px-2 py-1 bg-white text-[var(--ui-secondary)] cursor-pointer font-medium"
                >
                  <option value="en">English (EN)</option>
                  <option value="hi">हिंदी (HI)</option>
                  <option value="bn">বাংলা (BN)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Notification Metrics Overview */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-[10px] border border-[var(--ui-border)] p-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[var(--ui-secondary)] uppercase tracking-wide">Total Logged</span>
              <Bell className="h-4 w-4 text-[var(--ui-muted)]" />
            </div>
            <div className="text-2xl font-bold text-[var(--ui-text)] mt-2">{totalCount}</div>
            <p className="text-[11px] text-[var(--ui-muted)] mt-0.5">Audited delivery events</p>
          </div>

          <div className="bg-white rounded-[10px] border border-[var(--ui-border)] p-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-amber-700 uppercase tracking-wide">Unread</span>
              <span className="h-2 w-2 rounded-full bg-amber-500" />
            </div>
            <div className="text-2xl font-bold text-amber-900 mt-2">{unreadCount}</div>
            <p className="text-[11px] text-[var(--ui-muted)] mt-0.5">Requires acknowledgment</p>
          </div>

          <div className="bg-white rounded-[10px] border border-[var(--ui-border)] p-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-rose-700 uppercase tracking-wide">Overdue</span>
              <AlertTriangle className="h-4 w-4 text-rose-500" />
            </div>
            <div className="text-2xl font-bold text-rose-600 mt-2">{overdueCount}</div>
            <p className="text-[11px] text-[var(--ui-muted)] mt-0.5">Past statutory deadline</p>
          </div>

          <div className="bg-white rounded-[10px] border border-[var(--ui-border)] p-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[var(--ui-secondary)] uppercase tracking-wide">Urgent / Critical</span>
              <ShieldAlert className="h-4 w-4 text-amber-600" />
            </div>
            <div className="text-2xl font-bold text-[var(--ui-text)] mt-2">{urgentCount}</div>
            <p className="text-[11px] text-[var(--ui-muted)] mt-0.5">T-1 or high risk mandates</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          {[
            { key: "ALL", label: "All Alerts" },
            { key: "UNREAD", label: `Unread (${unreadCount})` },
            { key: "OVERDUE", label: "Overdue" },
            { key: "URGENT", label: "High / Critical" },
            { key: "IN_APP", label: "In-App" },
            { key: "EMAIL", label: "Email" },
            { key: "GOOGLE_CALENDAR", label: "Google Calendar" },
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => setFilter(item.key)}
              className={`px-3.5 py-1.5 rounded-full font-semibold transition-colors shrink-0 cursor-pointer ${
                filter === item.key
                  ? "bg-[var(--ui-text)] text-white shadow-2xs"
                  : "bg-white text-[var(--ui-secondary)] border border-[var(--ui-border)] hover:border-[var(--ui-border-strong)] hover:text-[var(--ui-text)]"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Notifications List */}
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <div className="bg-white rounded-[12px] border border-dashed border-[var(--ui-border-strong)] p-12 text-center">
              <CheckCircle2 className="h-8 w-8 text-[var(--ui-sage)] mx-auto mb-2" />
              <h3 className="text-2xl font-serif font-normal text-[var(--ui-text)]">You're up to date.</h3>
              <p className="text-xs text-[var(--ui-secondary)] max-w-sm mx-auto mt-1">
                {filter === "ALL" ? "We'll surface important compliance reminders here." : "No alerts match this filter."}
              </p>
            </div>
          ) : (
            filtered.map((item) => (
              <div
                key={item.id}
                role="group"
                tabIndex={item.isRead ? -1 : 0}
                aria-label={`${item.title}${item.isRead ? ", read" : ", unread. Press Enter to mark read"}`}
                onKeyDown={(event) => { if (event.target === event.currentTarget && (event.key === "Enter" || event.key === " ")) { event.preventDefault(); void handleMarkRead(item); } }}
                onClick={() => handleMarkRead(item)}
                className={`rounded-[12px] border p-4.5 shadow-2xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer ${
                  !item.isRead
                    ? "border-amber-300 bg-amber-50/25 hover:bg-amber-50/40"
                    : "border-[var(--ui-border)] bg-white hover:border-[var(--ui-border-strong)]"
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div className="p-2.5 rounded-lg bg-[var(--ui-inset)] border border-[var(--ui-border)] shrink-0 mt-0.5">
                    {getIcon(item)}
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-sans font-bold text-[var(--ui-text)]">
                        {item.title}
                      </h3>

                      {!item.isRead && (
                        <span className="h-2 w-2 rounded-full bg-amber-600 shrink-0" title="Unread" />
                      )}

                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${getUrgencyBadge(
                          item.urgency
                        )}`}
                      >
                        {item.urgency}
                      </span>

                      {item.eventType === "OVERDUE" && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded border bg-rose-50 text-rose-700 border-rose-200">
                          OVERDUE
                        </span>
                      )}

                      {getChannelBadge(item.channel)}

                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                          item.status === "DELIVERED"
                            ? "text-[var(--ui-sage)] bg-[var(--ui-sage-faint)]"
                            : item.status === "SIMULATED"
                            ? "text-[var(--ui-info)] bg-[var(--ui-info-soft)]"
                            : "text-rose-700 bg-rose-50"
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>

                    <p className="text-xs text-[var(--ui-secondary)] leading-relaxed max-w-2xl">
                      {item.message}
                    </p>

                    <div className="flex items-center gap-3 text-[11px] text-[var(--ui-muted)]">
                      <span>{item.timestamp}</span>
                      {item.deadlineDate && (
                        <>
                          <span>•</span>
                          <span>Deadline: {item.deadlineDate}</span>
                        </>
                      )}
                      {item.offsetDays !== undefined && (
                        <>
                          <span>•</span>
                          <span>
                            {item.offsetDays < 0
                              ? `Overdue by ${Math.abs(item.offsetDays)} days`
                              : `T-${item.offsetDays} offset`}
                          </span>
                        </>
                      )}
                      {item.attemptCount && item.attemptCount > 1 ? (
                        <>
                          <span>•</span>
                          <span className="text-amber-600">Attempts: {item.attemptCount}</span>
                        </>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                  <Link
                    href={item.actionUrl}
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1 px-4 py-1.5 rounded-lg bg-white hover:bg-[var(--ui-bg)] border border-[var(--ui-border)] text-xs font-semibold text-amber-800 hover:text-amber-900 transition-colors shadow-2xs"
                  >
                    {item.actionLabel}
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </AppShell>
  );
}

export default function NotificationsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--ui-bg)]" />}>
      <NotificationsContent />
    </Suspense>
  );
}

