"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  FileText,
  CheckCircle2,
  Calendar,
  Download,
  UserPlus,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { DashboardData } from "@/data/demo";
import { DEMO_REQUIREMENTS } from "@/data/demo/compliance";
import { DEMO_DOCUMENTS } from "@/data/demo/documents";
import StatusBadge from "@/components/StatusBadge";
import { useBusinessContext } from "@/context/BusinessContext";
import { api } from "@/lib/api";
import { DeadlineNotificationRecord, DeadlineNotificationsResponse } from "@/lib/api/calendar";

/* -------------------------------------------------------------------------
   1. Activity Timeline Drawer
   ------------------------------------------------------------------------- */
export function ActivityTimelineDrawer({
  isOpen,
  onClose,
  data,
}: {
  isOpen: boolean;
  onClose: () => void;
  data: DashboardData;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white border-l border-[#E2E8F0] h-full shadow-2xl p-6 flex flex-col justify-between overflow-y-auto">
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-4">
            <div>
              <h2 className="text-base font-semibold text-[#0F172A]">Compliance Activity</h2>
              <p className="text-xs text-[#64748B]">
                Weekly audit log: {data.activity.weeklyTasks} tasks tracked ({data.activity.growthPercentage} vs prev week)
              </p>
            </div>
            <button
              onClick={onClose}
              className="h-7 w-7 rounded-[8px] bg-[#F1F5F9] hover:bg-[#E2E8F0] flex items-center justify-center text-[#64748B] hover:text-[#0F172A] transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Daily Breakdown */}
          <div className="space-y-2.5">
            {data.activity.daily.map((d) => (
              <div
                key={d.day}
                className={`p-3.5 rounded-[12px] border transition-all ${
                  d.isHighlight
                    ? "bg-[#E5F77D]/25 border-[#BEF264]"
                    : "bg-[#F8FAFC] border-[#E2E8F0]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs text-[#0F172A]">{d.day}</span>
                    <span className="text-[11px] text-[#64748B]">({d.dateStr})</span>
                    {d.isHighlight && (
                      <span className="px-2 py-0.5 rounded-full bg-[#18181B] text-white font-semibold text-[10px]">
                        Peak Day
                      </span>
                    )}
                  </div>
                  <span className="font-semibold text-[#0F172A] text-xs">{d.tasks} tasks</span>
                </div>
                <div className="mt-2 text-xs text-[#475569] leading-relaxed">
                  {d.day === "Fri"
                    ? "Batch testing certificates validated & laboratory calibration logs uploaded."
                    : d.day === "Thu"
                    ? "Statutory periodic inspection checklist completed by Quality Officer."
                    : "Routine machine logbook reconciliation and safety interlock inspections."}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-4 border-t border-[#E2E8F0]">
          <Link
            href="/compliance"
            onClick={onClose}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-[10px] bg-[#18181B] hover:bg-[#27272A] text-white text-xs font-medium transition-colors"
          >
            <span>Open Full Compliance Register</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------
   2. Actions List Drawer
   ------------------------------------------------------------------------- */
export function ActionsListDrawer({
  isOpen,
  onClose,
  data,
}: {
  isOpen: boolean;
  onClose: () => void;
  data: DashboardData;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white border-l border-[#E2E8F0] h-full shadow-2xl p-6 flex flex-col justify-between overflow-y-auto">
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-[#0F172A]">Open Compliance Actions</h2>
                <span className="px-2.5 py-0.5 rounded-full bg-rose-50 border border-rose-200 text-rose-600 font-semibold text-xs">
                  {data.actions.openCount} Active
                </span>
              </div>
              <p className="text-xs text-[#64748B]">
                {data.actions.changeFromLastWeek} · {data.actions.highPriorityCount} High Priority items
              </p>
            </div>
            <button
              onClick={onClose}
              className="h-7 w-7 rounded-[8px] bg-[#F1F5F9] hover:bg-[#E2E8F0] flex items-center justify-center text-[#64748B] hover:text-[#0F172A] transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-3">
            {data.actions.items.map((act) => (
              <div
                key={act.id}
                className="p-4 rounded-[12px] border border-[#E2E8F0] bg-[#F8FAFC] hover:border-[#CBD5E1] transition-all space-y-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-mono text-[11px] font-medium text-[#18181B] bg-white border border-[#E2E8F0] px-2 py-0.5 rounded-[6px]">
                      {act.standardCode}
                    </span>
                    <h3 className="font-semibold text-[#0F172A] text-sm mt-1">{act.title}</h3>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-rose-50 border border-rose-200 text-rose-600 font-medium text-[11px] shrink-0">
                    {act.daysRemaining}d remaining
                  </span>
                </div>

                <p className="text-xs text-[#475569] leading-relaxed">{act.summary}</p>

                <div className="text-[11px] text-[#64748B] font-mono">
                  Citation: {act.clauseRef}
                </div>

                <div className="pt-2 border-t border-[#E2E8F0] flex items-center justify-between">
                  <span className="text-[11px] text-[#64748B]">
                    Deadline: <strong className="text-[#0F172A]">{act.deadline}</strong>
                  </span>
                  <Link
                    href={`/${act.targetView}`}
                    onClick={onClose}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-[#18181B] hover:bg-[#27272A] text-white text-xs font-medium transition-colors"
                  >
                    <span>{act.actionCta}</span>
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-4 border-t border-[#E2E8F0]">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-[10px] border border-[#E2E8F0] text-xs font-medium text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] transition-colors"
          >
            Close Actions Panel
          </button>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------
   3. Requirements List Drawer
   ------------------------------------------------------------------------- */
export function RequirementsListDrawer({
  isOpen,
  onClose,
  data,
}: {
  isOpen: boolean;
  onClose: () => void;
  data: DashboardData;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white border-l border-[#E2E8F0] h-full shadow-2xl p-6 flex flex-col justify-between overflow-y-auto">
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-[#0F172A]">Applicable Requirements</h2>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-semibold text-xs">
                  {data.requirements.applicableCount} Total
                </span>
              </div>
              <p className="text-xs text-[#64748B]">
                Bureau of Indian Standards · {data.requirements.isStandardsRatio} active IS standards
              </p>
            </div>
            <button
              onClick={onClose}
              className="h-7 w-7 rounded-[8px] bg-[#F1F5F9] hover:bg-[#E2E8F0] flex items-center justify-center text-[#64748B] hover:text-[#0F172A] transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-3">
            {DEMO_REQUIREMENTS.map((req) => (
              <div
                key={req.id}
                className="p-4 rounded-[12px] border border-[#E2E8F0] bg-[#F8FAFC] hover:border-[#CBD5E1] transition-all space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-mono text-[11px] font-medium text-[#18181B] bg-white border border-[#E2E8F0] px-2 py-0.5 rounded-[6px]">
                      {req.code}
                    </span>
                    <h3 className="font-semibold text-[#0F172A] text-xs mt-1">{req.title}</h3>
                  </div>
                  <StatusBadge status={req.status} size="sm" />
                </div>
                <p className="text-[11px] text-[#475569] line-clamp-2 leading-relaxed">{req.explanation}</p>
                <div className="pt-2 border-t border-[#E2E8F0] flex items-center justify-between text-xs">
                  <span className="text-[11px] text-[#64748B]">
                    Clauses: <strong className="text-[#0F172A]">{req.compliantClauses}/{req.totalClauses}</strong>
                  </span>
                  <Link
                    href={`/compliance/${req.id}`}
                    onClick={onClose}
                    className="font-medium text-[#0F172A] hover:underline text-xs"
                  >
                    View Statutory Proof →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-4 border-t border-[#E2E8F0]">
          <Link
            href="/compliance"
            onClick={onClose}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-[10px] bg-[#18181B] hover:bg-[#27272A] text-white text-xs font-medium transition-colors"
          >
            <span>Open Statutory Compliance Matrix</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------
   4. Documents Preview Drawer
   ------------------------------------------------------------------------- */
export function DocumentsPreviewDrawer({
  isOpen,
  onClose,
  data,
}: {
  isOpen: boolean;
  onClose: () => void;
  data: DashboardData;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white border-l border-[#E2E8F0] h-full shadow-2xl p-6 flex flex-col justify-between overflow-y-auto">
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-[#0F172A]">Statutory Documents</h2>
                <span className="px-2.5 py-0.5 rounded-full bg-[#18181B] text-white font-semibold text-xs">
                  {data.documents.totalCount} Total
                </span>
              </div>
              <p className="text-xs text-[#64748B]">
                {data.documents.verifiedPercentage}% Verified · {data.documents.underReviewPercentage}% Under Review
              </p>
            </div>
            <button
              onClick={onClose}
              className="h-7 w-7 rounded-[8px] bg-[#F1F5F9] hover:bg-[#E2E8F0] flex items-center justify-center text-[#64748B] hover:text-[#0F172A] transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-3">
            {DEMO_DOCUMENTS.map((doc) => (
              <div
                key={doc.id}
                className="p-3.5 rounded-[12px] border border-[#E2E8F0] bg-[#F8FAFC] hover:border-[#CBD5E1] transition-all space-y-1.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-[#64748B]" />
                    <div>
                      <h4 className="font-semibold text-[#0F172A] text-xs">{doc.name}</h4>
                      <span className="text-[10px] text-[#64748B] font-mono">{doc.code}</span>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                      doc.status === "VERIFIED"
                        ? "bg-emerald-50 border border-emerald-200 text-emerald-700"
                        : "bg-amber-50 border border-amber-200 text-amber-700"
                    }`}
                  >
                    {doc.status}
                  </span>
                </div>
                <div className="text-[11px] text-[#64748B] flex items-center justify-between pt-1">
                  <span>Format: <strong className="text-[#0F172A]">{doc.fileFormat} ({doc.fileSize})</strong></span>
                  <Link
                    href={`/documents/${doc.id}`}
                    onClick={onClose}
                    className="text-xs font-medium text-[#0F172A] hover:underline"
                  >
                    Inspect Document →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-4 border-t border-[#E2E8F0] flex items-center gap-3">
          <Link
            href="/documents"
            onClick={onClose}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-[10px] bg-[#18181B] hover:bg-[#27272A] text-white text-xs font-medium transition-colors"
          >
            <span>View All Documents</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------
   5. Date Range Selector Popover Modal
   ------------------------------------------------------------------------- */
export function DateRangeModal({
  isOpen,
  onClose,
  selectedRange,
  onSelectRange,
}: {
  isOpen: boolean;
  onClose: () => void;
  selectedRange: string;
  onSelectRange: (range: string) => void;
}) {
  if (!isOpen) return null;

  const ranges = [
    { label: "20-27 Jan 2025 (Active Week)", value: "20-27 Jan 2025" },
    { label: "Month of January 2025", value: "01-31 Jan 2025" },
    { label: "Q4 FY 2024-25 (Jan - Mar)", value: "Q4 FY25" },
    { label: "Annual Surveillance Cycle", value: "FY 2024-25" },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-[16px] p-6 max-w-sm w-full shadow-2xl border border-[#E2E8F0] space-y-4">
        <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
          <div className="flex items-center gap-2 text-[#0F172A] font-semibold text-sm">
            <Calendar className="h-4 w-4 text-[#0F172A]" />
            <span>Select Audit Period</span>
          </div>
          <button onClick={onClose} className="text-[#64748B] hover:text-[#0F172A]">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-2">
          {ranges.map((r) => (
            <button
              key={r.value}
              onClick={() => {
                onSelectRange(r.value);
                onClose();
              }}
              className={`w-full text-left px-4 py-2.5 rounded-[10px] text-xs font-medium transition-colors flex items-center justify-between ${
                selectedRange === r.value
                  ? "bg-[#18181B] text-white border border-[#18181B]"
                  : "bg-[#F8FAFC] hover:bg-[#F1F5F9] text-[#0F172A] border border-[#E2E8F0]"
              }`}
            >
              <span>{r.label}</span>
              {selectedRange === r.value && <CheckCircle2 className="h-4 w-4 text-[#A3E635]" />}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------
   6. Add Widget Modal
   ------------------------------------------------------------------------- */
export function AddWidgetModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [widgets, setWidgets] = useState([
    { id: "activity", name: "Weekly Compliance Activity Log", enabled: true },
    { id: "actions", name: "Priority Open Actions Spline", enabled: true },
    { id: "documents", name: "Statutory Evidence Progress", enabled: true },
    { id: "requirements", name: "BIS Applicable Requirements", enabled: true },
    { id: "status", name: "Conformity Health Bubble Cluster", enabled: true },
    { id: "deadlines", name: "Statutory Calendar Deadlines", enabled: false },
    { id: "gazette", name: "Gazette Notification Radar", enabled: false },
  ]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-[16px] p-6 max-w-md w-full shadow-2xl border border-[#E2E8F0] space-y-4">
        <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
          <div>
            <h3 className="text-base font-semibold text-[#0F172A]">Customize Dashboard Widgets</h3>
            <p className="text-xs text-[#64748B]">Toggle or rearrange visible intelligence cards</p>
          </div>
          <button onClick={onClose} className="text-[#64748B] hover:text-[#0F172A]">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
          {widgets.map((w) => (
            <div
              key={w.id}
              className="flex items-center justify-between p-3 rounded-[10px] border border-[#E2E8F0] bg-[#F8FAFC] text-xs"
            >
              <span className="font-medium text-[#0F172A]">{w.name}</span>
              <button
                type="button"
                onClick={() =>
                  setWidgets((prev) =>
                    prev.map((item) =>
                      item.id === w.id ? { ...item, enabled: !item.enabled } : item
                    )
                  )
                }
                className={`px-3 py-1 rounded-full font-medium text-[11px] transition-colors ${
                  w.enabled
                    ? "bg-[#18181B] text-white"
                    : "bg-[#E2E8F0] text-[#64748B]"
                }`}
              >
                {w.enabled ? "Active" : "Hidden"}
              </button>
            </div>
          ))}
        </div>

        <div className="pt-2 border-t border-[#E2E8F0] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-[10px] bg-[#18181B] hover:bg-[#27272A] text-white text-xs font-medium"
          >
            Save Dashboard Layout
          </button>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------
   7. Create Report Modal
   ------------------------------------------------------------------------- */
export function CreateReportModal({
  isOpen,
  onClose,
  data,
}: {
  isOpen: boolean;
  onClose: () => void;
  data: DashboardData;
}) {
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  if (!isOpen) return null;

  function handleDownload() {
    setDownloading(true);
    setTimeout(() => {
      setDownloading(false);
      setDownloaded(true);
      setTimeout(() => {
        setDownloaded(false);
        onClose();
      }, 1500);
    }, 1200);
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-[16px] p-6 max-w-md w-full shadow-2xl border border-[#E2E8F0] space-y-4">
        <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
          <div>
            <h3 className="text-base font-semibold text-[#0F172A]">Generate Statutory Report</h3>
            <p className="text-xs text-[#64748B]">Export compliance dossier for auditors & directors</p>
          </div>
          <button onClick={onClose} className="text-[#64748B] hover:text-[#0F172A]">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-4 rounded-[12px] bg-[#F8FAFC] border border-[#E2E8F0] text-xs space-y-2">
          <div className="font-semibold text-[#0F172A]">Report Contents:</div>
          <ul className="list-disc pl-4 text-[#475569] space-y-1">
            <li>Compliance Health Score: {data.complianceHealth.percentage}%</li>
            <li>Mandatory QCO Applicability Schedule ({data.requirements.applicableCount} Requirements)</li>
            <li>NABL Laboratory Testing & Calibration Status</li>
            <li>Upcoming Statutory Deadlines & Risk Mitigation Plan</li>
          </ul>
        </div>

        <div className="flex items-center justify-between pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-[10px] border border-[#E2E8F0] text-xs font-medium text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9]"
          >
            Cancel
          </button>
          <button
            onClick={handleDownload}
            disabled={downloading || downloaded}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-[10px] bg-[#18181B] hover:bg-[#27272A] text-white text-xs font-medium transition-all disabled:opacity-50"
          >
            <Download className="h-3.5 w-3.5" />
            <span>
              {downloading ? "Compiling Dossier..." : downloaded ? "Downloaded ✓" : "Export Audit PDF"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------
   8. Team Management Modal
   ------------------------------------------------------------------------- */
export function TeamInviteModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("Quality Officer");
  const [members, setMembers] = useState([
    { name: "Dr. Vikramaditya Sharma", role: "Head of QA & Regulatory", email: "v.sharma@apex-industrial.in" },
    { name: "Priya Sundaram", role: "Laboratory Test Engineer", email: "p.sundaram@apex-industrial.in" },
    { name: "Arun Mehra", role: "Plant Safety Officer", email: "a.mehra@apex-industrial.in" },
  ]);
  const [invited, setInvited] = useState(false);

  if (!isOpen) return null;

  function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setMembers((prev) => [...prev, { name: email.split("@")[0], role, email }]);
    setEmail("");
    setInvited(true);
    setTimeout(() => setInvited(false), 2000);
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-[16px] p-6 max-w-md w-full shadow-2xl border border-[#E2E8F0] space-y-4">
        <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
          <div>
            <h3 className="text-base font-semibold text-[#0F172A]">Compliance Team Members</h3>
            <p className="text-xs text-[#64748B]">Collaborate on filings, audits, and test reports</p>
          </div>
          <button onClick={onClose} className="text-[#64748B] hover:text-[#0F172A]">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Existing team */}
        <div className="space-y-2">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
            Active Members ({members.length})
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {members.map((m, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2.5 rounded-[10px] border border-[#E2E8F0] bg-[#F8FAFC] text-xs"
              >
                <div>
                  <div className="font-medium text-[#0F172A]">{m.name}</div>
                  <div className="text-[10px] text-[#64748B]">{m.email}</div>
                </div>
                <span className="text-[11px] text-[#475569] bg-white px-2 py-0.5 rounded-[6px] border border-[#E2E8F0]">
                  {m.role}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Invite new */}
        <form onSubmit={handleInvite} className="pt-3 border-t border-[#E2E8F0] space-y-3">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
            Invite New Member
          </div>
          <div className="flex gap-2">
            <input
              type="email"
              placeholder="name@company.in"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 px-3 py-2 rounded-[10px] bg-[#F8FAFC] border border-[#E2E8F0] text-xs text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-hidden focus:border-[#0F172A]"
            />
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="px-2.5 py-2 rounded-[10px] bg-[#F8FAFC] border border-[#E2E8F0] text-xs text-[#0F172A]"
            >
              <option>Quality Officer</option>
              <option>Laboratory Analyst</option>
              <option>Legal Counsel</option>
              <option>Auditor (View Only)</option>
            </select>
          </div>

          <div className="flex items-center justify-between">
            {invited ? (
              <span className="text-xs text-emerald-600 font-medium">Invitation sent!</span>
            ) : <span />}
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[10px] bg-[#18181B] hover:bg-[#27272A] text-white text-xs font-medium"
            >
              <UserPlus className="h-3.5 w-3.5" />
              <span>Send Invite</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------
   9. Notifications Popover
   ------------------------------------------------------------------------- */
export function NotificationsPopover({
  isOpen,
  onClose,
  onNotificationsRead,
}: {
  isOpen: boolean;
  onClose: () => void;
  onNotificationsRead?: () => void;
}) {
  const { activeBusinessId } = useBusinessContext();
  const [alerts, setAlerts] = useState<
    Array<{
      id: string;
      title: string;
      desc: string;
      time: string;
      urgent: boolean;
      channel: string;
      isRead: boolean;
    }>
  >([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  useEffect(() => {
    if (!isOpen || !activeBusinessId) return;

    let mounted = true;
    api.calendar
      .listNotifications(activeBusinessId, { limit: 5 })
      .then((res: DeadlineNotificationsResponse) => {
        if (!mounted) return;
        if (res.notifications && res.notifications.length > 0) {
          const mapped = res.notifications.map((n: DeadlineNotificationRecord) => ({
            id: n.id,
            title: n.subject_or_title || `Requirement: ${n.requirement_id}`,
            desc:
              n.event_type === "OVERDUE"
                ? `Statutory deadline ${n.deadline_date} is overdue. Penalty escalation risk.`
                : `Deadline: ${n.deadline_date} (T-${n.offset_days} alert)`,
            time: new Date(n.created_at).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            }),
            urgent: n.priority === "HIGH" || n.priority === "CRITICAL" || n.event_type === "OVERDUE",
            channel: n.channel,
            isRead: n.is_read,
          }));
          setAlerts(mapped);
          setUnreadCount(mapped.filter((m: { isRead: boolean }) => !m.isRead).length);
        } else {
          setAlerts([
            {
              id: "demo-fallback-1",
              title: "Statutory Deadline Reminder Active",
              desc: "Periodic boiler inspection and BIS lab renewals monitored automatically.",
              time: "Today",
              urgent: false,
              channel: "GOOGLE_CALENDAR",
              isRead: true,
            },
          ]);
          setUnreadCount(0);
        }
      })
      .catch(() => {
        // Fallback gracefully
      });

    return () => {
      mounted = false;
    };
  }, [isOpen, activeBusinessId]);

  if (!isOpen) return null;

  const handleMarkAllRead = async () => {
    if (activeBusinessId) {
      try {
        await api.calendar.markAllRead(activeBusinessId);
        setAlerts((prev) => prev.map((a) => ({ ...a, isRead: true })));
        setUnreadCount(0);
        if (onNotificationsRead) onNotificationsRead();
      } catch (err) {
        console.error("Failed to mark all read:", err);
      }
    }
  };

  return (
    <div className="absolute right-0 top-10 z-50 w-80 sm:w-96 bg-white rounded-[14px] shadow-2xl border border-[#E2E8F0] p-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-150 select-none">
      <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2.5">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-[#0F172A] text-sm">Regulatory & Deadline Alerts</span>
          {unreadCount > 0 ? (
            <span className="px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 font-semibold text-[10px]">
              {unreadCount} New
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium text-[10px]">
              All Read
            </span>
          )}
        </div>
        <button onClick={onClose} className="text-[#64748B] hover:text-[#0F172A] cursor-pointer">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-2 max-h-72 overflow-y-auto">
        {alerts.length === 0 ? (
          <div className="py-6 text-center text-xs text-[#64748B]">No recent compliance alerts.</div>
        ) : (
          alerts.map((a) => (
            <div
              key={a.id}
              className={`p-3 rounded-[10px] border text-xs transition-colors ${
                !a.isRead
                  ? "bg-amber-50/40 border-amber-200"
                  : a.urgent
                  ? "bg-rose-50/40 border-rose-200"
                  : "bg-[#F8FAFC] border-[#E2E8F0]"
              }`}
            >
              <div className="flex items-start justify-between gap-1.5">
                <div className="flex items-center gap-1.5">
                  {!a.isRead && <span className="h-1.5 w-1.5 rounded-full bg-amber-600 shrink-0" />}
                  <span className="font-semibold text-[#0F172A]">{a.title}</span>
                </div>
                <span className="text-[10px] text-[#64748B] shrink-0">{a.time}</span>
              </div>
              <p className="text-[#475569] mt-1 leading-relaxed">{a.desc}</p>
            </div>
          ))
        )}
      </div>

      <div className="pt-2 border-t border-[#E2E8F0] flex items-center justify-between text-xs">
        <Link
          href="/notifications"
          onClick={onClose}
          className="font-semibold text-amber-800 hover:text-amber-900"
        >
          View Full Alert Center →
        </Link>
        <button
          type="button"
          onClick={handleMarkAllRead}
          className="text-[#64748B] hover:text-[#0F172A] text-xs cursor-pointer font-medium"
        >
          Mark all read
        </button>
      </div>
    </div>
  );
}
