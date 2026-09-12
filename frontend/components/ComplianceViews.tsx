"use client";

import React, { useState } from "react";
import {
  Folder,
  ChevronRight,
  ShieldCheck,
  FileText,
  GitFork,
  Calendar as CalendarIcon,
  BookOpen,
  Coins,
  BellRing,
  Sparkles,
  Filter,
  CheckCircle2,
  AlertCircle,
  Clock,
  ExternalLink,
  Search,
  Upload,
  Layers,
  ArrowUpRight,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
  HelpCircle,
  FileCode,
  X,
  Plus,
} from "lucide-react";
import {
  standards,
  documents,
  workflows,
  upcomingDeadlines,
  regulatoryChanges,
  companyInfo,
  priorityActions,
  dashboardMetrics,
  StandardItem,
} from "@/lib/mockData";
import StatusBadge from "@/components/StatusBadge";
import StandardRow from "@/components/StandardRow";
import DocumentRow from "@/components/DocumentRow";
import WorkflowRow from "@/components/WorkflowRow";
import DeadlineRow from "@/components/DeadlineRow";
import RegulationRow from "@/components/RegulationRow";
import BISAgent from "@/components/BISAgent";

/* =========================================================================
   1. Compliance View
   ========================================================================= */
export function ComplianceView() {
  const [filter, setFilter] = useState<"ALL" | "ACTION_NEEDED" | "COMPLIANT">("ALL");
  const [selectedStandard, setSelectedStandard] = useState<StandardItem | null>(null);

  const filteredStandards = standards.filter((std) => {
    if (filter === "ACTION_NEEDED") return std.status === "RENEWAL_DUE";
    if (filter === "COMPLIANT") return std.status === "COMPLIANT";
    return true;
  });

  return (
    <div className="space-y-6 pb-6 select-none">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pt-1">
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
            <Folder className="h-3.5 w-3.5 text-slate-400" />
            <span>Home Page</span>
            <ChevronRight className="h-3 w-3 text-slate-300" />
            <Folder className="h-3.5 w-3.5 text-slate-400" />
            <span className="text-slate-600 font-semibold">Compliance Matrix</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-950">
            Statutory Compliance Matrix
          </h1>
          <p className="text-xs text-slate-500">
            Active mandates, mandatory Quality Control Orders (QCOs), and testing standards.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 p-1 rounded-full bg-slate-200/50">
            <button
              onClick={() => setFilter("ALL")}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                filter === "ALL"
                  ? "bg-[#0f172a] text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              All (18)
            </button>
            <button
              onClick={() => setFilter("ACTION_NEEDED")}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                filter === "ACTION_NEEDED"
                  ? "bg-[#0f172a] text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Action Required (3)
            </button>
            <button
              onClick={() => setFilter("COMPLIANT")}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                filter === "COMPLIANT"
                  ? "bg-[#0f172a] text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Conforming (15)
            </button>
          </div>
        </div>
      </div>

      {/* Priority Action Highlight Alert Card */}
      <div className="p-5 rounded-[24px] border border-amber-200/70 bg-amber-50/60 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-start gap-3.5">
          <div className="h-9 w-9 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 shrink-0">
            <AlertCircle className="h-5 w-5" />
          </div>
          <div className="text-xs space-y-1">
            <div className="font-bold text-amber-950 text-sm">
              3 Statutory Actions Require Resolution Before Surveillance Audit
            </div>
            <p className="text-amber-800/90 leading-relaxed">
              Clause 13.2 Endurance Test renewal, Calibration log upload, and Form VI production return.
            </p>
          </div>
        </div>
        <span className="font-mono text-xs font-bold bg-amber-200/80 text-amber-900 px-3.5 py-1.5 rounded-full shrink-0 shadow-2xs">
          Target: 14 May 2026
        </span>
      </div>

      {/* Standards Cards List */}
      <div className="space-y-4">
        {filteredStandards.map((std) => (
          <div
            key={std.id}
            onClick={() => setSelectedStandard(std)}
            className="cursor-pointer"
          >
            <StandardRow
              standard={std}
              onExploreClauses={(s) => setSelectedStandard(s)}
            />
          </div>
        ))}
      </div>

      {/* Requirement Detail Modal */}
      {selectedStandard && (
        <RequirementDetailModal
          standard={selectedStandard}
          onClose={() => setSelectedStandard(null)}
        />
      )}
    </div>
  );
}

/* =========================================================================
   Requirement Detail Modal (Answers 4 Canonical Questions per PRD)
   ========================================================================= */
function RequirementDetailModal({
  standard,
  onClose,
}: {
  standard: StandardItem;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-[32px] max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200/80 space-y-6 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold bg-[#0f172a] text-white px-2.5 py-0.5 rounded-full">
                {standard.code}
              </span>
              <span className="text-xs font-semibold text-slate-500">
                {standard.authority}
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-950 mt-1">
              {standard.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="h-8 w-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* The 4 Canonical Pillars */}
        <div className="space-y-4 text-xs">
          {/* 1. Why does this apply? */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/60 space-y-1.5">
            <div className="font-bold text-slate-900 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-blue-600" />
              <span>1. Why does this apply to your business?</span>
            </div>
            <p className="text-slate-600 leading-relaxed pl-3.5">
              Evaluated by ComplyWise deterministic AST rule engine against your enterprise profile (Sector: Domestic Electrical Appliances, Turnover: ₹48.5 Cr, Manufacturing premises in Haryana). Rule ID: <code className="font-mono font-bold text-blue-900">RULE-BIS-ELEC-302</code>.
            </p>
          </div>

          {/* 2. What do you need? */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/60 space-y-1.5">
            <div className="font-bold text-slate-900 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              <span>2. What documentation and evidence is required?</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-slate-600 pl-3.5">
              <li>NABL Accredited Laboratory Test Certificate for Clause 13.2 Endurance</li>
              <li>Calibrated test equipment calibration records (Traceable to NPL)</li>
              <li>Quarterly Quality Production Return (Form VI) with BIS Officer endorsement</li>
            </ul>
          </div>

          {/* 3. What to do next? */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/60 space-y-1.5">
            <div className="font-bold text-slate-900 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span>3. What is the immediate next step?</span>
            </div>
            <p className="text-slate-600 leading-relaxed pl-3.5">
              Upload the sample dispatch slip to an empanelled NABL test facility before the statutory surveillance cycle deadline on <span className="font-bold text-slate-900">14 May 2026</span>.
            </p>
          </div>

          {/* 4. Statutory Evidence Grounding */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/60 space-y-1.5">
            <div className="font-bold text-slate-900 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-purple-600" />
              <span>4. Where did this requirement originate? (Statutory Citations)</span>
            </div>
            <div className="pl-3.5 space-y-1 text-slate-600">
              <div className="font-semibold text-slate-800">
                Official Gazette Notification: S.O. 1421(E) dated 14 November 2024
              </div>
              <div className="text-[11px] text-slate-500">
                Ministry of Consumer Affairs, Food & Public Distribution · Bureau of Indian Standards Act, 2016 (Section 16).
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-full bg-[#0f172a] hover:bg-slate-800 text-white text-xs font-semibold transition-colors"
          >
            Close Requirement
          </button>
        </div>
      </div>
    </div>
  );
}

/* =========================================================================
   2. Documents View
   ========================================================================= */
export function DocumentsView() {
  const [docFilter, setDocFilter] = useState<"ALL" | "VERIFIED" | "NEEDS_REVIEW" | "ISSUE">("ALL");

  const filteredDocs = documents.filter((doc) => {
    if (docFilter === "VERIFIED") return doc.status === "VERIFIED";
    if (docFilter === "NEEDS_REVIEW") return doc.status === "NEEDS_REVIEW";
    if (docFilter === "ISSUE") return doc.status === "ISSUE";
    return true;
  });

  return (
    <div className="space-y-6 pb-6 select-none">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pt-1">
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
            <Folder className="h-3.5 w-3.5 text-slate-400" />
            <span>Home Page</span>
            <ChevronRight className="h-3 w-3 text-slate-300" />
            <Folder className="h-3.5 w-3.5 text-slate-400" />
            <span className="text-slate-600 font-semibold">Documents & Evidence</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-950">
            Statutory Documents & Evidence
          </h1>
          <p className="text-xs text-slate-500">
            11 entity proofs, laboratory test reports, and technical dossiers required for BIS clearance.
          </p>
        </div>

        <div className="flex items-center gap-1.5 p-1 rounded-full bg-slate-200/50">
          <button
            onClick={() => setDocFilter("ALL")}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
              docFilter === "ALL"
                ? "bg-[#0f172a] text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            All (11)
          </button>
          <button
            onClick={() => setDocFilter("VERIFIED")}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
              docFilter === "VERIFIED"
                ? "bg-[#0f172a] text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Verified (8)
          </button>
          <button
            onClick={() => setDocFilter("NEEDS_REVIEW")}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
              docFilter === "NEEDS_REVIEW"
                ? "bg-[#0f172a] text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Review (2)
          </button>
          <button
            onClick={() => setDocFilter("ISSUE")}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
              docFilter === "ISSUE"
                ? "bg-[#0f172a] text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Issue (1)
          </button>
        </div>
      </div>

      {/* Document Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredDocs.map((doc) => (
          <DocumentRow key={doc.id} document={doc} />
        ))}
      </div>
    </div>
  );
}

/* =========================================================================
   3. Workflows View
   ========================================================================= */
export function WorkflowsView() {
  return (
    <div className="space-y-6 pb-6 select-none">
      <div className="space-y-1.5 pt-1">
        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
          <Folder className="h-3.5 w-3.5 text-slate-400" />
          <span>Home Page</span>
          <ChevronRight className="h-3 w-3 text-slate-300" />
          <Folder className="h-3.5 w-3.5 text-slate-400" />
          <span className="text-slate-600 font-semibold">Statutory Workflows</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-950">
          Statutory Approval Workflows
        </h1>
        <p className="text-xs text-slate-500">
          Multi-stage clearance progression, departmental scrutiny, and audit milestones.
        </p>
      </div>

      <div className="space-y-4">
        {workflows.map((wf) => (
          <WorkflowRow key={wf.id} workflow={wf} />
        ))}
      </div>
    </div>
  );
}

/* =========================================================================
   4. Calendar View
   ========================================================================= */
export function CalendarView() {
  return (
    <div className="space-y-6 pb-6 select-none">
      <div className="space-y-1.5 pt-1">
        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
          <Folder className="h-3.5 w-3.5 text-slate-400" />
          <span>Home Page</span>
          <ChevronRight className="h-3 w-3 text-slate-300" />
          <Folder className="h-3.5 w-3.5 text-slate-400" />
          <span className="text-slate-600 font-semibold">Compliance Calendar</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-950">
          Statutory Filing Calendar
        </h1>
        <p className="text-xs text-slate-500">
          Statutory deadlines, periodic renewal cycles, and mandatory return filings.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {upcomingDeadlines.map((dl) => (
          <DeadlineRow key={dl.id} deadline={dl} />
        ))}
      </div>
    </div>
  );
}

/* =========================================================================
   5. Standards View
   ========================================================================= */
export function StandardsView() {
  return (
    <div className="space-y-6 pb-6 select-none">
      <div className="space-y-1.5 pt-1">
        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
          <Folder className="h-3.5 w-3.5 text-slate-400" />
          <span>Home Page</span>
          <ChevronRight className="h-3 w-3 text-slate-300" />
          <Folder className="h-3.5 w-3.5 text-slate-400" />
          <span className="text-slate-600 font-semibold">Standards Catalogue</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-950">
          BIS & Indian Standards Repository
        </h1>
        <p className="text-xs text-slate-500">
          Catalogue of Indian Standards, mandatory testing clauses, and Scheme of Testing and Inspection (STI).
        </p>
      </div>

      <div className="space-y-4">
        {standards.map((std) => (
          <StandardRow key={std.id} standard={std} />
        ))}
      </div>
    </div>
  );
}

/* =========================================================================
   6. Schemes & Benefits View
   ========================================================================= */
export function SchemesView() {
  return (
    <div className="space-y-6 pb-6 select-none">
      <div className="space-y-1.5 pt-1">
        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
          <Folder className="h-3.5 w-3.5 text-slate-400" />
          <span>Home Page</span>
          <ChevronRight className="h-3 w-3 text-slate-300" />
          <Folder className="h-3.5 w-3.5 text-slate-400" />
          <span className="text-slate-600 font-semibold">Schemes & Benefits</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-950">
          Matched Government Schemes & Subsidies
        </h1>
        <p className="text-xs text-slate-500">
          Central & State MSME concessions, testing fee rebates, and capital investment subsidies.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-6 rounded-[28px] border border-emerald-200/80 bg-emerald-50/40 space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-950 text-sm">
              Ministry of MSME 80% Marking Fee Concession
            </span>
            <span className="text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full">
              Active Subsidy
            </span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Registered Medium Enterprises with valid Udyam certificate (UDYAM-HR-05-0029182) are entitled to 80% rebate on annual BIS marking fees.
          </p>
          <div className="pt-2 text-xs text-slate-500 flex items-center justify-between border-t border-emerald-100">
            <span>Estimated Savings: <span className="font-bold text-slate-900">₹94,400 / yr</span></span>
            <span className="text-emerald-700 font-semibold">Eligible & Applied</span>
          </div>
        </div>

        <div className="p-6 rounded-[28px] border border-slate-200/70 bg-white space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-950 text-sm">
              Scheme IV Simplified Certification for Green Units
            </span>
            <span className="text-[10px] font-bold uppercase bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full">
              Expedited Approval
            </span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Expedited 30-day factory inspection and license issuance for manufacturing units with ISO 14001 or state green consent.
          </p>
          <div className="pt-2 text-xs text-slate-500 flex items-center justify-between border-t border-slate-100">
            <span>Turnaround: <span className="font-bold text-slate-900">30 Days</span></span>
            <span className="text-blue-700 font-semibold">Pre-Requisites Met</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================================
   7. Regulatory Updates View
   ========================================================================= */
export function UpdatesView() {
  return (
    <div className="space-y-6 pb-6 select-none">
      <div className="space-y-1.5 pt-1">
        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
          <Folder className="h-3.5 w-3.5 text-slate-400" />
          <span>Home Page</span>
          <ChevronRight className="h-3 w-3 text-slate-300" />
          <Folder className="h-3.5 w-3.5 text-slate-400" />
          <span className="text-slate-600 font-semibold">Regulatory Updates</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-950">
          Regulatory Updates & Gazette Monitor
        </h1>
        <p className="text-xs text-slate-500">
          Official Gazette of India notifications, Quality Control Orders, and BIS Technical Circulars.
        </p>
      </div>

      <div className="space-y-3">
        {regulatoryChanges.map((change) => (
          <RegulationRow key={change.id} change={change} />
        ))}
      </div>
    </div>
  );
}

/* =========================================================================
   8. AI Assistant View
   ========================================================================= */
export function AssistantView() {
  return (
    <div className="space-y-6 pb-6 select-none">
      <div className="space-y-1.5 pt-1">
        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
          <Folder className="h-3.5 w-3.5 text-slate-400" />
          <span>Home Page</span>
          <ChevronRight className="h-3 w-3 text-slate-300" />
          <Folder className="h-3.5 w-3.5 text-slate-400" />
          <span className="text-slate-600 font-semibold">AI Assistant</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-950">
          BIS Compliance Copilot
        </h1>
        <p className="text-xs text-slate-500">
          Intelligent retrieval engine grounded in Indian Standards clauses, DPIIT orders, and statutory gazettes.
        </p>
      </div>

      <BISAgent />
    </div>
  );
}

/* =========================================================================
   9. Business Profile View
   ========================================================================= */
export function ProfileView() {
  return (
    <div className="space-y-6 pb-6 select-none">
      <div className="space-y-1.5 pt-1">
        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
          <Folder className="h-3.5 w-3.5 text-slate-400" />
          <span>Home Page</span>
          <ChevronRight className="h-3 w-3 text-slate-300" />
          <Folder className="h-3.5 w-3.5 text-slate-400" />
          <span className="text-slate-600 font-semibold">Business Profile</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-950">
          Enterprise Regulatory Profile
        </h1>
        <p className="text-xs text-slate-500">
          Statutory profile variables, manufacturing scale, and factory license credentials.
        </p>
      </div>

      <div className="bg-white rounded-[28px] border border-slate-200/70 p-6 sm:p-8 space-y-6 shadow-xs">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          <div className="space-y-1">
            <span className="font-semibold text-slate-400 text-[11px] uppercase tracking-wider">
              Legal Business Name
            </span>
            <div className="font-bold text-slate-900 text-base">
              {companyInfo.name}
            </div>
          </div>

          <div className="space-y-1">
            <span className="font-semibold text-slate-400 text-[11px] uppercase tracking-wider">
              BIS License Number (CM/L)
            </span>
            <div className="font-mono font-bold text-blue-900 text-base">
              {companyInfo.bisRegistration}
            </div>
          </div>

          <div className="space-y-1">
            <span className="font-semibold text-slate-400 text-[11px] uppercase tracking-wider">
              Industrial Sector
            </span>
            <div className="text-slate-800 font-medium text-sm">
              {companyInfo.sector}
            </div>
          </div>

          <div className="space-y-1">
            <span className="font-semibold text-slate-400 text-[11px] uppercase tracking-wider">
              MSME Classification
            </span>
            <div className="text-slate-800 font-medium text-sm">
              {companyInfo.scale}
            </div>
          </div>

          <div className="md:col-span-2 space-y-1 pt-3 border-t border-slate-100">
            <span className="font-semibold text-slate-400 text-[11px] uppercase tracking-wider">
              Manufacturing Premises Address
            </span>
            <div className="text-slate-800 font-medium text-sm">
              {companyInfo.location}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================================
   10. Settings View
   ========================================================================= */
export function SettingsView() {
  return (
    <div className="space-y-6 pb-6 select-none">
      <div className="space-y-1.5 pt-1">
        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
          <Folder className="h-3.5 w-3.5 text-slate-400" />
          <span>Home Page</span>
          <ChevronRight className="h-3 w-3 text-slate-300" />
          <Folder className="h-3.5 w-3.5 text-slate-400" />
          <span className="text-slate-600 font-semibold">Settings</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-950">
          System Configuration
        </h1>
        <p className="text-xs text-slate-500">
          Compliance evaluation frequencies, notification hooks, and tenant integration parameters.
        </p>
      </div>

      <div className="bg-white rounded-[28px] border border-slate-200/70 p-6 sm:p-8 space-y-4 text-xs shadow-xs">
        <div className="space-y-2">
          <div className="font-bold text-slate-900 text-sm">Deterministic Engine Mode</div>
          <p className="text-slate-500 text-xs leading-relaxed">
            Statutory applicability evaluates via 3-valued logic (TRUE · FALSE · UNKNOWN). AI never makes final legal determination.
          </p>
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-50 border border-slate-200 font-mono text-[11px] text-slate-700">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span>AST Rule Engine: Active & Enforcing</span>
          </div>
        </div>
      </div>
    </div>
  );
}
