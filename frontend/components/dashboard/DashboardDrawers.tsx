"use client";

import React, { useState } from "react";
import {
  X,
  Clock,
  AlertTriangle,
  FileText,
  CheckCircle2,
  Calendar,
  Download,
  Share2,
  Plus,
  Send,
  UserPlus,
  ShieldCheck,
  ExternalLink,
  ArrowRight,
  Filter,
} from "lucide-react";
import Link from "next/link";
import { DashboardData } from "@/data/demo";
import { DEMO_REQUIREMENTS } from "@/data/demo/compliance";
import { DEMO_DOCUMENTS } from "@/data/demo/documents";
import StatusBadge from "@/components/StatusBadge";

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
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white h-full shadow-2xl p-6 flex flex-col justify-between overflow-y-auto">
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Compliance Activity</h2>
              <p className="text-xs text-slate-500">
                Weekly audit log: {data.activity.weeklyTasks} tasks tracked ({data.activity.growthPercentage} vs prev week)
              </p>
            </div>
            <button
              onClick={onClose}
              className="h-8 w-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Daily Breakdown */}
          <div className="space-y-3">
            {data.activity.daily.map((d) => (
              <div
                key={d.day}
                className={`p-3.5 rounded-2xl border transition-all ${
                  d.isHighlight
                    ? "bg-[#fbfde8] border-[#ecfa98]"
                    : "bg-slate-50 border-slate-200/70"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-800">{d.day}</span>
                    <span className="text-[11px] text-slate-400">({d.dateStr})</span>
                    {d.isHighlight && (
                      <span className="px-2 py-0.5 rounded-full bg-[#ecfa98] text-[#1c2e0b] font-bold text-[10px]">
                        Peak Day
                      </span>
                    )}
                  </div>
                  <span className="font-bold text-slate-900 text-sm">{d.tasks} tasks</span>
                </div>
                <div className="mt-2 text-xs text-slate-600">
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

        <div className="pt-4 border-t border-slate-100">
          <Link
            href="/compliance"
            onClick={onClose}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-[#0f172a] text-white text-xs font-bold hover:bg-slate-800 transition-colors"
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
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white h-full shadow-2xl p-6 flex flex-col justify-between overflow-y-auto">
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">Open Compliance Actions</h2>
                <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold text-xs">
                  {data.actions.openCount} Active
                </span>
              </div>
              <p className="text-xs text-slate-500">
                {data.actions.changeFromLastWeek} · {data.actions.highPriorityCount} High Priority items
              </p>
            </div>
            <button
              onClick={onClose}
              className="h-8 w-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-3.5">
            {data.actions.items.map((act) => (
              <div
                key={act.id}
                className="p-4 rounded-2xl border border-slate-200/80 bg-white hover:border-slate-300 transition-all shadow-2xs space-y-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-mono text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
                      {act.standardCode}
                    </span>
                    <h3 className="font-bold text-slate-900 text-sm mt-1">{act.title}</h3>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 font-bold text-[11px] shrink-0">
                    {act.daysRemaining}d remaining
                  </span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">{act.summary}</p>

                <div className="text-[11px] text-slate-400 font-mono">
                  Citation: {act.clauseRef}
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500">
                    Deadline: <strong>{act.deadline}</strong>
                  </span>
                  <Link
                    href={`/${act.targetView}`}
                    onClick={onClose}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors"
                  >
                    <span>{act.actionCta}</span>
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-full border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
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
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white h-full shadow-2xl p-6 flex flex-col justify-between overflow-y-auto">
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">Applicable Requirements</h2>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs">
                  {data.requirements.applicableCount} Total
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Bureau of Indian Standards · {data.requirements.isStandardsRatio} active IS standards
              </p>
            </div>
            <button
              onClick={onClose}
              className="h-8 w-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-3">
            {DEMO_REQUIREMENTS.map((req) => (
              <div
                key={req.id}
                className="p-4 rounded-2xl border border-slate-200/80 bg-white hover:border-slate-300 transition-all shadow-2xs space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-mono text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
                      {req.code}
                    </span>
                    <h3 className="font-bold text-slate-900 text-xs mt-1">{req.title}</h3>
                  </div>
                  <StatusBadge status={req.status} size="sm" />
                </div>
                <p className="text-[11px] text-slate-500 line-clamp-2">{req.explanation}</p>
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-500">
                    Clauses: <strong>{req.compliantClauses}/{req.totalClauses}</strong>
                  </span>
                  <Link
                    href={`/compliance/${req.id}`}
                    onClick={onClose}
                    className="font-bold text-indigo-600 hover:text-indigo-800 text-xs"
                  >
                    View Statutory Proof →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100">
          <Link
            href="/compliance"
            onClick={onClose}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-[#0f172a] text-white text-xs font-bold hover:bg-slate-800"
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
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white h-full shadow-2xl p-6 flex flex-col justify-between overflow-y-auto">
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">Statutory Documents</h2>
                <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold text-xs">
                  {data.documents.totalCount} Total
                </span>
              </div>
              <p className="text-xs text-slate-500">
                {data.documents.verifiedPercentage}% Verified · {data.documents.underReviewPercentage}% Under Review
              </p>
            </div>
            <button
              onClick={onClose}
              className="h-8 w-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-3">
            {DEMO_DOCUMENTS.map((doc) => (
              <div
                key={doc.id}
                className="p-3.5 rounded-2xl border border-slate-200/80 bg-white hover:border-slate-300 transition-all shadow-2xs space-y-1.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-slate-400" />
                    <div>
                      <h4 className="font-bold text-slate-900 text-xs">{doc.name}</h4>
                      <span className="text-[10px] text-slate-400 font-mono">{doc.code}</span>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      doc.status === "VERIFIED"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    {doc.status}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1">
                  <span>Format: <strong>{doc.fileFormat} ({doc.fileSize})</strong></span>
                  <Link
                    href={`/documents/${doc.id}`}
                    onClick={onClose}
                    className="text-xs font-semibold text-indigo-600 hover:underline"
                  >
                    Inspect Document →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
          <Link
            href="/documents"
            onClick={onClose}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-[#0f172a] text-white text-xs font-bold hover:bg-slate-800"
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
    <div className="fixed inset-0 z-50 bg-slate-900/30 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
            <Calendar className="h-4 w-4 text-indigo-600" />
            <span>Select Audit Period</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
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
              className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-semibold transition-colors flex items-center justify-between ${
                selectedRange === r.value
                  ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                  : "bg-slate-50 hover:bg-slate-100 text-slate-700"
              }`}
            >
              <span>{r.label}</span>
              {selectedRange === r.value && <CheckCircle2 className="h-4 w-4 text-indigo-600" />}
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
    { id: "tall-feature", name: "Featured IS Standard Spotlight", enabled: true },
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
    <div className="fixed inset-0 z-50 bg-slate-900/30 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">Customize Dashboard Widgets</h3>
            <p className="text-xs text-slate-500">Toggle or rearrange visible intelligence cards</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
          {widgets.map((w) => (
            <div
              key={w.id}
              className="flex items-center justify-between p-3 rounded-xl border border-slate-200/80 bg-slate-50/50 text-xs"
            >
              <span className="font-semibold text-slate-800">{w.name}</span>
              <button
                type="button"
                onClick={() =>
                  setWidgets((prev) =>
                    prev.map((item) =>
                      item.id === w.id ? { ...item, enabled: !item.enabled } : item
                    )
                  )
                }
                className={`px-3 py-1 rounded-full font-bold text-[11px] transition-colors ${
                  w.enabled
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-slate-200 text-slate-600"
                }`}
              >
                {w.enabled ? "Active" : "Hidden"}
              </button>
            </div>
          ))}
        </div>

        <div className="pt-2 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-full bg-[#0f172a] text-white text-xs font-bold hover:bg-slate-800"
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
    <div className="fixed inset-0 z-50 bg-slate-900/30 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">Generate Statutory Report</h3>
            <p className="text-xs text-slate-500">Export compliance dossier for auditors & directors</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 text-xs space-y-2">
          <div className="font-bold text-indigo-950">Report Contents:</div>
          <ul className="list-disc pl-4 text-indigo-900/80 space-y-1">
            <li>Compliance Health Score: {data.complianceHealth.percentage}%</li>
            <li>Mandatory QCO Applicability Schedule ({data.requirements.applicableCount} Requirements)</li>
            <li>NABL Laboratory Testing & Calibration Status</li>
            <li>Upcoming Statutory Deadlines & Risk Mitigation Plan</li>
          </ul>
        </div>

        <div className="flex items-center justify-between pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-full border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            onClick={handleDownload}
            disabled={downloading || downloaded}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-[#0f172a] text-white text-xs font-bold hover:bg-slate-800 transition-all disabled:opacity-50"
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
    <div className="fixed inset-0 z-50 bg-slate-900/30 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">Compliance Team Members</h3>
            <p className="text-xs text-slate-500">Collaborate on filings, audits, and test reports</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Existing team */}
        <div className="space-y-2">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Active Members ({members.length})
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {members.map((m, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200/70 bg-slate-50/50 text-xs"
              >
                <div>
                  <div className="font-bold text-slate-900">{m.name}</div>
                  <div className="text-[10px] text-slate-400">{m.email}</div>
                </div>
                <span className="text-[11px] font-semibold text-slate-600 bg-white px-2 py-0.5 rounded-full border border-slate-200">
                  {m.role}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Invite new */}
        <form onSubmit={handleInvite} className="pt-3 border-t border-slate-100 space-y-3">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Invite New Member
          </div>
          <div className="flex gap-2">
            <input
              type="email"
              placeholder="name@company.in"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:ring-2 focus:ring-slate-900"
            />
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="px-2.5 py-2 rounded-xl border border-slate-200 text-xs bg-white text-slate-700"
            >
              <option>Quality Officer</option>
              <option>Laboratory Analyst</option>
              <option>Legal Counsel</option>
              <option>Auditor (View Only)</option>
            </select>
          </div>

          <div className="flex items-center justify-between">
            {invited ? (
              <span className="text-xs text-emerald-600 font-bold">Invitation sent!</span>
            ) : <span />}
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#0f172a] text-white text-xs font-bold hover:bg-slate-800"
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
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  if (!isOpen) return null;

  const alerts = [
    {
      id: "nt-1",
      title: "NABL Type-Test Report Expiring Soon",
      desc: "IS 1293:2019 test certificate has 14 days remaining before 3-year mandatory interval.",
      time: "10 mins ago",
      urgent: true,
    },
    {
      id: "nt-2",
      title: "New Gazette Notification Published",
      desc: "DPIIT Electrical Accessories Amendment Order 2025 issued.",
      time: "2 hours ago",
      urgent: false,
    },
    {
      id: "nt-3",
      title: "Surveillance Audit Scheduled",
      desc: "BIS Regional Office inspection planned for 14 Jun 2026.",
      time: "1 day ago",
      urgent: false,
    },
  ];

  return (
    <div className="absolute right-0 top-12 z-50 w-80 sm:w-96 bg-white rounded-3xl shadow-2xl border border-slate-200/80 p-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-150">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-900 text-sm">Regulatory Notifications</span>
          <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold text-[10px]">
            3 New
          </span>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-2">
        {alerts.map((a) => (
          <div
            key={a.id}
            className={`p-3 rounded-2xl border text-xs transition-colors ${
              a.urgent
                ? "bg-rose-50/50 border-rose-200/80"
                : "bg-slate-50/60 border-slate-200/70"
            }`}
          >
            <div className="flex items-start justify-between gap-1.5">
              <span className="font-bold text-slate-900">{a.title}</span>
              <span className="text-[10px] text-slate-400 shrink-0">{a.time}</span>
            </div>
            <p className="text-slate-600 mt-1 leading-relaxed">{a.desc}</p>
          </div>
        ))}
      </div>

      <div className="pt-2 border-t border-slate-100 flex justify-between text-xs">
        <Link
          href="/calendar"
          onClick={onClose}
          className="font-bold text-indigo-600 hover:text-indigo-800"
        >
          View Statutory Calendar →
        </Link>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 text-xs"
        >
          Mark all read
        </button>
      </div>
    </div>
  );
}
