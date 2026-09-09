"use client";

import React, { useState } from "react";
import {
  ShieldCheck,
  FileText,
  GitFork,
  Calendar as CalendarIcon,
  BookOpen,
  Coins,
  BellRing,
  Sparkles,
  Building2,
  Settings,
  Filter,
  CheckCircle2,
  AlertCircle,
  Clock,
  ExternalLink,
  Search,
  Upload,
  Layers,
  ArrowUpRight,
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

  const filteredStandards = standards.filter((std) => {
    if (filter === "ACTION_NEEDED") return std.status === "RENEWAL_DUE";
    if (filter === "COMPLIANT") return std.status === "COMPLIANT";
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-950">Statutory Compliance Matrix</h1>
          <p className="text-xs text-slate-500">
            Active mandates, mandatory Quality Control Orders (QCOs), and testing standards.
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg text-xs">
          <button
            onClick={() => setFilter("ALL")}
            className={`px-3 py-1 rounded-md font-medium transition-all ${
              filter === "ALL" ? "bg-white text-slate-900 shadow-2xs font-semibold" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            All (18)
          </button>
          <button
            onClick={() => setFilter("ACTION_NEEDED")}
            className={`px-3 py-1 rounded-md font-medium transition-all ${
              filter === "ACTION_NEEDED" ? "bg-white text-amber-900 shadow-2xs font-semibold" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Action Required (3)
          </button>
          <button
            onClick={() => setFilter("COMPLIANT")}
            className={`px-3 py-1 rounded-md font-medium transition-all ${
              filter === "COMPLIANT" ? "bg-white text-emerald-900 shadow-2xs font-semibold" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Conforming (15)
          </button>
        </div>
      </div>

      {/* Priority Action Highlight Alert */}
      <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/50 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
          <div className="text-xs space-y-0.5">
            <div className="font-bold text-amber-950">
              3 Statutory Actions Require Resolution Before Surveillance Audit
            </div>
            <p className="text-amber-800/90">
              Clause 13.2 Endurance Test renewal, Calibration log upload, and Form VI production return.
            </p>
          </div>
        </div>
        <span className="font-mono text-xs font-semibold bg-amber-200/70 text-amber-900 px-2.5 py-1 rounded shrink-0">
          Target: 14 May 2026
        </span>
      </div>

      {/* Standards List */}
      <div className="space-y-3">
        {filteredStandards.map((std) => (
          <StandardRow key={std.id} standard={std} />
        ))}
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-950">Statutory Documents & Evidence</h1>
          <p className="text-xs text-slate-500">
            11 entity proofs, laboratory test reports, and technical dossiers required for BIS clearance.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs">
            <button
              onClick={() => setDocFilter("ALL")}
              className={`px-2.5 py-1 rounded-md font-medium ${
                docFilter === "ALL" ? "bg-white text-slate-900 shadow-2xs font-semibold" : "text-slate-600"
              }`}
            >
              All (11)
            </button>
            <button
              onClick={() => setDocFilter("VERIFIED")}
              className={`px-2.5 py-1 rounded-md font-medium ${
                docFilter === "VERIFIED" ? "bg-white text-emerald-800 shadow-2xs font-semibold" : "text-slate-600"
              }`}
            >
              Verified (8)
            </button>
            <button
              onClick={() => setDocFilter("NEEDS_REVIEW")}
              className={`px-2.5 py-1 rounded-md font-medium ${
                docFilter === "NEEDS_REVIEW" ? "bg-white text-amber-800 shadow-2xs font-semibold" : "text-slate-600"
              }`}
            >
              Review (2)
            </button>
            <button
              onClick={() => setDocFilter("ISSUE")}
              className={`px-2.5 py-1 rounded-md font-medium ${
                docFilter === "ISSUE" ? "bg-white text-rose-800 shadow-2xs font-semibold" : "text-slate-600"
              }`}
            >
              Issue (1)
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-xl font-bold text-slate-950">Statutory Approval Workflows</h1>
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
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-xl font-bold text-slate-950">Statutory Filing Calendar</h1>
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
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-xl font-bold text-slate-950">BIS & Indian Standards Repository</h1>
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
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-xl font-bold text-slate-950">Matched Government Schemes & Subsidies</h1>
        <p className="text-xs text-slate-500">
          Central & State MSME concessions, testing fee rebates, and capital investment subsidies.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/30 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-950 text-xs">
              Ministry of MSME 80% Marking Fee Concession
            </span>
            <span className="text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
              Active Subsidy
            </span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Registered Medium Enterprises with valid Udyam certificate (UDYAM-HR-05-0029182) are entitled to 80% rebate on annual BIS marking fees.
          </p>
          <div className="pt-1 text-[11px] text-slate-500 flex items-center justify-between border-t border-emerald-100">
            <span>Estimated Savings: ₹94,400 / yr</span>
            <span className="text-emerald-700 font-semibold">Eligible & Applied</span>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-950 text-xs">
              Scheme IV Simplified Certification for Green Units
            </span>
            <span className="text-[10px] font-bold uppercase bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
              Expedited Approval
            </span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Expedited 30-day factory inspection and license issuance for manufacturing units with ISO 14001 or state green consent.
          </p>
          <div className="pt-1 text-[11px] text-slate-500 flex items-center justify-between border-t border-slate-100">
            <span>Turnaround: 30 Days</span>
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
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-xl font-bold text-slate-950">Regulatory Updates & Gazette Monitor</h1>
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
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-xl font-bold text-slate-950">BIS Compliance Copilot</h1>
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
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-xl font-bold text-slate-950">Enterprise Regulatory Profile</h1>
        <p className="text-xs text-slate-500">
          Statutory profile variables, manufacturing scale, and factory license credentials.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200/90 p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="space-y-1">
            <span className="font-semibold text-slate-500 text-[11px] uppercase tracking-wider">
              Legal Business Name
            </span>
            <div className="font-bold text-slate-900 text-sm">
              {companyInfo.name}
            </div>
          </div>

          <div className="space-y-1">
            <span className="font-semibold text-slate-500 text-[11px] uppercase tracking-wider">
              BIS License Number (CM/L)
            </span>
            <div className="font-mono font-bold text-blue-900 text-sm">
              {companyInfo.bisRegistration}
            </div>
          </div>

          <div className="space-y-1">
            <span className="font-semibold text-slate-500 text-[11px] uppercase tracking-wider">
              Industrial Sector
            </span>
            <div className="text-slate-800">
              {companyInfo.sector}
            </div>
          </div>

          <div className="space-y-1">
            <span className="font-semibold text-slate-500 text-[11px] uppercase tracking-wider">
              MSME Classification
            </span>
            <div className="text-slate-800">
              {companyInfo.scale}
            </div>
          </div>

          <div className="md:col-span-2 space-y-1 pt-2 border-t border-slate-100">
            <span className="font-semibold text-slate-500 text-[11px] uppercase tracking-wider">
              Manufacturing Premises Address
            </span>
            <div className="text-slate-800">
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
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-xl font-bold text-slate-950">System Configuration</h1>
        <p className="text-xs text-slate-500">
          Compliance evaluation frequencies, notification hooks, and tenant integration parameters.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200/90 p-5 space-y-4 text-xs">
        <div className="space-y-2">
          <div className="font-semibold text-slate-900">Deterministic Engine Mode</div>
          <p className="text-slate-500 text-[11px]">
            Statutory applicability evaluates via 3-valued logic (TRUE · FALSE · UNKNOWN). AI never makes final legal determination.
          </p>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 font-mono text-[11px] text-slate-700">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span>AST Rule Engine: Active & Enforcing</span>
          </div>
        </div>
      </div>
    </div>
  );
}
