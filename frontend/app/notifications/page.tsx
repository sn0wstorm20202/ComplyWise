"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import {
  Bell,
  Calendar,
  AlertTriangle,
  FileText,
  RotateCw,
  Sparkles,
  CheckCircle2,
  Filter,
} from "lucide-react";
import { useBusinessContext } from "@/context/BusinessContext";

interface NotificationItem {
  id: string;
  type: "DEADLINE" | "RENEWAL" | "DOCUMENT_ISSUE" | "WORKFLOW_EVENT" | "REGULATORY_UPDATE";
  title: string;
  message: string;
  timestamp: string;
  urgency: "HIGH" | "MEDIUM" | "LOW";
  actionLabel: string;
  actionUrl: string;
  isRead: boolean;
}

const DEMO_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "notif-1",
    type: "DEADLINE",
    title: "Annual Boiler Inspection Filing Due in 18 Days",
    message: "Indian Boilers Act certificate calibration and hydrostatic pressure test logs must be uploaded.",
    timestamp: "2 hours ago",
    urgency: "HIGH",
    actionLabel: "View Calendar",
    actionUrl: "/calendar",
    isRead: false,
  },
  {
    id: "notif-2",
    type: "DOCUMENT_ISSUE",
    title: "NABL Test Report Expiring Soon for IS 1293 Plugs",
    message: "Electrical safety test report from ERDA expires on 15 Oct 2026. Schedule lab re-testing to prevent BIS CRS license suspension.",
    timestamp: "5 hours ago",
    urgency: "HIGH",
    actionLabel: "Open Documents",
    actionUrl: "/documents",
    isRead: false,
  },
  {
    id: "notif-3",
    type: "REGULATORY_UPDATE",
    title: "New QCO Mandate Published: Smart Meters (IS 16444)",
    message: "Ministry of Power gazette notification amends transition timeline for micro-enterprises by 90 days.",
    timestamp: "1 day ago",
    urgency: "MEDIUM",
    actionLabel: "Read Gazette Update",
    actionUrl: "/regulatory-updates",
    isRead: false,
  },
  {
    id: "notif-4",
    type: "WORKFLOW_EVENT",
    title: "WPC ETA Pre-validation Completed (Zero Gaps)",
    message: "Dossier pre-validated against Wireless Planning and Coordination requirements. Ready for Saral Sanchar handoff.",
    timestamp: "2 days ago",
    urgency: "LOW",
    actionLabel: "View Applications",
    actionUrl: "/applications",
    isRead: true,
  },
  {
    id: "notif-5",
    type: "RENEWAL",
    title: "KSPCB Consent to Operate (CTO) 60-Day Renewal Window Open",
    message: "Karnataka State Pollution Control Board online portal is now open for your quadrennial consent renewal.",
    timestamp: "3 days ago",
    urgency: "MEDIUM",
    actionLabel: "View Renewal Pipeline",
    actionUrl: "/workflows",
    isRead: true,
  },
];

function NotificationsContent() {
  const { profile } = useBusinessContext();
  const [filter, setFilter] = useState<string>("ALL");
  const [notifications, setNotifications] = useState<NotificationItem[]>(DEMO_NOTIFICATIONS);

  const filtered = notifications.filter((n) => {
    if (filter === "ALL") return true;
    if (filter === "UNREAD") return !n.isRead;
    return n.type === filter;
  });

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const getIcon = (type: NotificationItem["type"]) => {
    switch (type) {
      case "DEADLINE":
        return <Calendar className="h-4 w-4 text-rose-400" />;
      case "DOCUMENT_ISSUE":
        return <AlertTriangle className="h-4 w-4 text-amber-400" />;
      case "REGULATORY_UPDATE":
        return <Sparkles className="h-4 w-4 text-[#cc9166]" />;
      case "WORKFLOW_EVENT":
        return <CheckCircle2 className="h-4 w-4 text-emerald-400" />;
      case "RENEWAL":
        return <RotateCw className="h-4 w-4 text-sky-400" />;
    }
  };

  return (
    <AppShell activeView="updates">
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-[#040406] rounded-[10px] border border-[#1c1d22] p-6 shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[#cc9166] tracking-wide uppercase">
                Activity Center · {profile.businessName}
              </span>
              <span className="inline-flex items-center rounded-full bg-[#121317] px-2.5 py-0.5 text-xs text-[#9194a1] border border-[#2e3038]">
                {notifications.filter((n) => !n.isRead).length} Unread Alerts
              </span>
            </div>
            <h1 className="text-2xl font-serif font-medium tracking-tight text-[#ffffff] mt-1">
              Compliance Notifications &amp; Alerts
            </h1>
            <p className="text-xs text-[#777a88] mt-0.5">
              Statutory renewal reminders, document expiry notices, and regulatory updates.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={markAllRead}
              className="px-3.5 py-1.5 rounded-full bg-[#121317] border border-[#2e3038] hover:border-[#cc9166] text-xs font-medium text-[#e2e3e9] hover:text-[#ffffff] transition-colors cursor-pointer"
            >
              Mark All as Read
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          {[
            { key: "ALL", label: "All Notifications" },
            { key: "UNREAD", label: "Unread" },
            { key: "DEADLINE", label: "Deadlines" },
            { key: "DOCUMENT_ISSUE", label: "Document Gaps" },
            { key: "REGULATORY_UPDATE", label: "Gazette Updates" },
            { key: "RENEWAL", label: "Renewals" },
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => setFilter(item.key)}
              className={`px-3 py-1.5 rounded-full font-medium transition-colors shrink-0 cursor-pointer ${
                filter === item.key
                  ? "bg-[#ffffff] text-[#08080a] shadow-xs"
                  : "bg-[#121317] text-[#9194a1] border border-[#1c1d22] hover:border-[#2e3038] hover:text-[#ffffff]"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Notifications List */}
        <div className="space-y-3">
          {filtered.map((item) => (
            <div
              key={item.id}
              className={`bg-[#040406] rounded-[10px] border p-4.5 shadow-2xl transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                !item.isRead
                  ? "border-[#cc9166]/40 bg-gradient-to-r from-[#1c140d]/30 to-[#040406]"
                  : "border-[#1c1d22] hover:border-[#2e3038]"
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div className="p-2 rounded-lg bg-[#121317] border border-[#1c1d22] shrink-0 mt-0.5">
                  {getIcon(item.type)}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-[#ffffff]">{item.title}</h3>
                    {!item.isRead && (
                      <span className="h-1.5 w-1.5 rounded-full bg-[#cc9166]" />
                    )}
                  </div>
                  <p className="text-xs text-[#9194a1] leading-relaxed max-w-2xl">
                    {item.message}
                  </p>
                  <span className="text-[11px] text-[#5e616e] block">{item.timestamp}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                <Link
                  href={item.actionUrl}
                  className="px-4 py-1.5 rounded-full bg-[#121317] hover:bg-[#1c1d22] border border-[#2e3038] text-xs font-semibold text-[#cc9166] hover:text-[#ffffff] transition-colors"
                >
                  {item.actionLabel} ?
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}

export default function NotificationsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#08080a]" />}>
      <NotificationsContent />
    </Suspense>
  );
}
