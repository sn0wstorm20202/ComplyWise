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
   Shared Page Header Component
   ========================================================================= */
function PageHeader({
  breadcrumb,
  title,
  description,
}: {
  breadcrumb: string;
  title: string;
  description: string;
}) {
  return (
    <div className="space-y-2 pt-1">
      <div className="flex items-center gap-1.5 text-xs text-[#94A3B8] dark:text-[#64748B] font-medium">
        <Folder className="h-3.5 w-3.5" />
        <span>Home</span>
        <ChevronRight className="h-3 w-3" />
        <Folder className="h-3.5 w-3.5" />
        <span className="text-[#475569] dark:text-[#94A3B8] font-semibold">{breadcrumb}</span>
      </div>
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0F172A] dark:text-[#F8FAFC]">
        {title}
      </h1>
      <p className="text-sm text-[#64748B] dark:text-[#94A3B8] leading-relaxed">
        {description}
      </p>
    </div>
  );
}

/* =========================================================================
   Shared Filter Pills Component
   ========================================================================= */
function FilterPills<T extends string>({
  options,
  active,
  onChange,
}: {
  options: { value: T; label: string }[];
  active: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex items-center gap-1 p-1 rounded-full bg-[#F1F5F9] dark:bg-white/5 border border-[#E2E8F0] dark:border-white/10">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
            active === opt.value
              ? "bg-[#18181B] dark:bg-white text-white dark:text-[#0A0D10] shadow-sm"
              : "text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-white hover:bg-white/60 dark:hover:bg-white/5"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

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
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <PageHeader
          breadcrumb="Compliance Matrix"
          title="Statutory Compliance Matrix"
          description="Active mandates, mandatory Quality Control Orders (QCOs), and testing standards."
        />

        <FilterPills
          options={[
            { value: "ALL", label: "All (18)" },
            { value: "ACTION_NEEDED", label: "Action Required (3)" },
            { value: "COMPLIANT", label: "Conforming (15)" },
          ]}
          active={filter}
          onChange={setFilter}
        />
      </div>

      {/* Priority Action Highlight Alert Card */}
      <div className="p-5 rounded-2xl border border-amber-200/70 dark:border-amber-500/30 bg-amber-50/60 dark:bg-amber-500/8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="h-9 w-9 rounded-xl bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center text-amber-700 dark:text-amber-400 shrink-0">
            <AlertCircle className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <div className="font-bold text-amber-950 dark:text-amber-300 text-sm">
              3 Statutory Actions Require Resolution Before Surveillance Audit
            </div>
            <p className="text-xs text-amber-800/90 dark:text-amber-400/80 leading-relaxed">
              Clause 13.2 Endurance Test renewal, Calibration log upload, and Form VI production return.
            </p>
          </div>
        </div>
        <span className="font-mono text-xs font-bold bg-amber-200/80 dark:bg-amber-500/25 text-amber-900 dark:text-amber-300 px-3.5 py-1.5 rounded-full shrink-0">
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
    <div className="fixed inset-0 z-50 bg-[#0F172A]/60 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#0D1117] rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-[#E2E8F0] dark:border-white/10 space-y-6 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[#F1F5F9] dark:border-white/5 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold bg-[#18181B] dark:bg-blue-600 text-white px-2.5 py-0.5 rounded-full">
                {standard.code}
              </span>
              <span className="text-xs font-semibold text-[#64748B] dark:text-[#94A3B8]">
                {standard.authority}
              </span>
            </div>
            <h2 className="text-lg font-bold text-[#0F172A] dark:text-[#F8FAFC] mt-1">
              {standard.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="h-8 w-8 rounded-full bg-[#F1F5F9] dark:bg-white/10 hover:bg-[#E2E8F0] dark:hover:bg-white/15 flex items-center justify-center text-[#64748B] dark:text-[#94A3B8] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* The 4 Canonical Pillars */}
        <div className="space-y-4 text-xs">
          {/* 1. Why does this apply? */}
          <div className="p-4 rounded-2xl bg-[#F8FAFC] dark:bg-white/5 border border-[#E2E8F0] dark:border-white/10 space-y-1.5">
            <div className="font-bold text-[#0F172A] dark:text-[#F8FAFC] flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-blue-600 dark:bg-blue-400" />
              <span>1. Why does this apply to your business?</span>
            </div>
            <p className="text-[#475569] dark:text-[#94A3B8] leading-relaxed pl-3.5">
              Evaluated by ComplyWise deterministic AST rule engine against your enterprise profile (Sector: Domestic Electrical Appliances, Turnover: ₹48.5 Cr, Manufacturing premises in Haryana). Rule ID: <code className="font-mono font-bold text-blue-700 dark:text-blue-400">RULE-BIS-ELEC-302</code>.
            </p>
          </div>

          {/* 2. What do you need? */}
          <div className="p-4 rounded-2xl bg-[#F8FAFC] dark:bg-white/5 border border-[#E2E8F0] dark:border-white/10 space-y-1.5">
            <div className="font-bold text-[#0F172A] dark:text-[#F8FAFC] flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              <span>2. What documentation and evidence is required?</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-[#475569] dark:text-[#94A3B8] pl-3.5">
              <li>NABL Accredited Laboratory Test Certificate for Clause 13.2 Endurance</li>
              <li>Calibrated test equipment calibration records (Traceable to NPL)</li>
              <li>Quarterly Quality Production Return (Form VI) with BIS Officer endorsement</li>
            </ul>
          </div>

          {/* 3. What to do next? */}
          <div className="p-4 rounded-2xl bg-[#F8FAFC] dark:bg-white/5 border border-[#E2E8F0] dark:border-white/10 space-y-1.5">
            <div className="font-bold text-[#0F172A] dark:text-[#F8FAFC] flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span>3. What is the immediate next step?</span>
            </div>
            <p className="text-[#475569] dark:text-[#94A3B8] leading-relaxed pl-3.5">
              Upload the sample dispatch slip to an empanelled NABL test facility before the statutory surveillance cycle deadline on <span className="font-bold text-[#0F172A] dark:text-[#F8FAFC]">14 May 2026</span>.
            </p>
          </div>

          {/* 4. Statutory Evidence Grounding */}
          <div className="p-4 rounded-2xl bg-[#F8FAFC] dark:bg-white/5 border border-[#E2E8F0] dark:border-white/10 space-y-1.5">
            <div className="font-bold text-[#0F172A] dark:text-[#F8FAFC] flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-purple-600 dark:bg-purple-400" />
              <span>4. Where did this requirement originate? (Statutory Citations)</span>
            </div>
            <div className="pl-3.5 space-y-1 text-[#475569] dark:text-[#94A3B8]">
              <div className="font-semibold text-[#334155] dark:text-[#CBD5E1]">
                Official Gazette Notification: S.O. 1421(E) dated 14 November 2024
              </div>
              <div className="text-[11px] text-[#64748B] dark:text-[#94A3B8]">
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
            className="px-5 py-2 rounded-full bg-[#18181B] dark:bg-blue-600 hover:bg-[#27272A] dark:hover:bg-blue-700 text-white text-xs font-semibold transition-colors cursor-pointer"
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
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <PageHeader
          breadcrumb="Documents & Evidence"
          title="Statutory Documents & Evidence"
          description="11 entity proofs, laboratory test reports, and technical dossiers required for BIS clearance."
        />

        <FilterPills
          options={[
            { value: "ALL", label: "All (11)" },
            { value: "VERIFIED", label: "Verified (8)" },
            { value: "NEEDS_REVIEW", label: "Review (2)" },
            { value: "ISSUE", label: "Issue (1)" },
          ]}
          active={docFilter}
          onChange={setDocFilter}
        />
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
      <PageHeader
        breadcrumb="Statutory Workflows"
        title="Statutory Approval Workflows"
        description="Multi-stage clearance progression, departmental scrutiny, and audit milestones."
      />

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
      <PageHeader
        breadcrumb="Compliance Calendar"
        title="Statutory Filing Calendar"
        description="Statutory deadlines, periodic renewal cycles, and mandatory return filings."
      />

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
      <PageHeader
        breadcrumb="Standards Catalogue"
        title="BIS & Indian Standards Repository"
        description="Catalogue of Indian Standards, mandatory testing clauses, and Scheme of Testing and Inspection (STI)."
      />

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
      <PageHeader
        breadcrumb="Schemes & Benefits"
        title="Matched Government Schemes & Subsidies"
        description="Central & State MSME concessions, testing fee rebates, and capital investment subsidies."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-6 rounded-2xl border border-emerald-200/80 dark:border-emerald-500/25 bg-emerald-50/40 dark:bg-emerald-500/8 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-bold text-[#0F172A] dark:text-[#F8FAFC] text-sm">
              Ministry of MSME 80% Marking Fee Concession
            </span>
            <span className="text-[10px] font-bold uppercase bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-400 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-500/30">
              Active Subsidy
            </span>
          </div>
          <p className="text-xs text-[#475569] dark:text-[#94A3B8] leading-relaxed">
            Registered Medium Enterprises with valid Udyam certificate (UDYAM-HR-05-0029182) are entitled to 80% rebate on annual BIS marking fees.
          </p>
          <div className="pt-2 text-xs text-[#64748B] dark:text-[#94A3B8] flex items-center justify-between border-t border-emerald-100 dark:border-emerald-500/15">
            <span>Estimated Savings: <span className="font-bold text-[#0F172A] dark:text-[#F8FAFC]">₹94,400 / yr</span></span>
            <span className="text-emerald-700 dark:text-emerald-400 font-semibold">Eligible & Applied</span>
          </div>
        </div>

        <div className="p-6 rounded-2xl border border-[#E2E8F0] dark:border-white/10 bg-white dark:bg-[#0D1117] space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-bold text-[#0F172A] dark:text-[#F8FAFC] text-sm">
              Scheme IV Simplified Certification for Green Units
            </span>
            <span className="text-[10px] font-bold uppercase bg-blue-100 dark:bg-blue-500/15 text-blue-800 dark:text-blue-400 px-2.5 py-0.5 rounded-full border border-blue-200 dark:border-blue-500/30">
              Expedited Approval
            </span>
          </div>
          <p className="text-xs text-[#475569] dark:text-[#94A3B8] leading-relaxed">
            Expedited 30-day factory inspection and license issuance for manufacturing units with ISO 14001 or state green consent.
          </p>
          <div className="pt-2 text-xs text-[#64748B] dark:text-[#94A3B8] flex items-center justify-between border-t border-[#F1F5F9] dark:border-white/5">
            <span>Turnaround: <span className="font-bold text-[#0F172A] dark:text-[#F8FAFC]">30 Days</span></span>
            <span className="text-blue-700 dark:text-blue-400 font-semibold">Pre-Requisites Met</span>
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
      <PageHeader
        breadcrumb="Regulatory Updates"
        title="Regulatory Updates & Gazette Monitor"
        description="Official Gazette of India notifications, Quality Control Orders, and BIS Technical Circulars."
      />

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
      <PageHeader
        breadcrumb="AI Assistant"
        title="BIS Compliance Copilot"
        description="Intelligent retrieval engine grounded in Indian Standards clauses, DPIIT orders, and statutory gazettes."
      />

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
      <PageHeader
        breadcrumb="Business Profile"
        title="Enterprise Regulatory Profile"
        description="Statutory profile variables, manufacturing scale, and factory license credentials."
      />

      <div className="bg-white dark:bg-[#0D1117] rounded-2xl border border-[#E2E8F0] dark:border-white/10 p-6 sm:p-8 space-y-6 shadow-sm dark:shadow-none">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          <div className="space-y-1">
            <span className="font-semibold text-[#94A3B8] dark:text-[#64748B] text-[11px] uppercase tracking-wider">
              Legal Business Name
            </span>
            <div className="font-bold text-[#0F172A] dark:text-[#F8FAFC] text-base">
              {companyInfo.name}
            </div>
          </div>

          <div className="space-y-1">
            <span className="font-semibold text-[#94A3B8] dark:text-[#64748B] text-[11px] uppercase tracking-wider">
              BIS License Number (CM/L)
            </span>
            <div className="font-mono font-bold text-blue-700 dark:text-blue-400 text-base">
              {companyInfo.bisRegistration}
            </div>
          </div>

          <div className="space-y-1">
            <span className="font-semibold text-[#94A3B8] dark:text-[#64748B] text-[11px] uppercase tracking-wider">
              Industrial Sector
            </span>
            <div className="text-[#334155] dark:text-[#CBD5E1] font-medium text-sm">
              {companyInfo.sector}
            </div>
          </div>

          <div className="space-y-1">
            <span className="font-semibold text-[#94A3B8] dark:text-[#64748B] text-[11px] uppercase tracking-wider">
              MSME Classification
            </span>
            <div className="text-[#334155] dark:text-[#CBD5E1] font-medium text-sm">
              {companyInfo.scale}
            </div>
          </div>

          <div className="md:col-span-2 space-y-1 pt-3 border-t border-[#F1F5F9] dark:border-white/5">
            <span className="font-semibold text-[#94A3B8] dark:text-[#64748B] text-[11px] uppercase tracking-wider">
              Manufacturing Premises Address
            </span>
            <div className="text-[#334155] dark:text-[#CBD5E1] font-medium text-sm">
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
      <PageHeader
        breadcrumb="Settings"
        title="System Configuration"
        description="Compliance evaluation frequencies, notification hooks, and tenant integration parameters."
      />

      <div className="bg-white dark:bg-[#0D1117] rounded-2xl border border-[#E2E8F0] dark:border-white/10 p-6 sm:p-8 space-y-4 text-xs shadow-sm dark:shadow-none">
        <div className="space-y-2">
          <div className="font-bold text-[#0F172A] dark:text-[#F8FAFC] text-base">Deterministic Engine Mode</div>
          <p className="text-[#475569] dark:text-[#94A3B8] text-sm leading-relaxed">
            Statutory applicability evaluates via 3-valued logic (TRUE · FALSE · UNKNOWN). AI never makes final legal determination.
          </p>
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#F8FAFC] dark:bg-white/5 border border-[#E2E8F0] dark:border-white/10 font-mono text-[11px] text-[#475569] dark:text-[#CBD5E1]">
            <span className="h-2 w-2 rounded-full bg-emerald-500 dark:bg-emerald-400" />
            <span>AST Rule Engine: Active & Enforcing</span>
          </div>
        </div>

        <div className="pt-4 border-t border-[#F1F5F9] dark:border-white/5 space-y-2">
          <div className="font-bold text-[#0F172A] dark:text-[#F8FAFC] text-base">Notification Preferences</div>
          <p className="text-[#475569] dark:text-[#94A3B8] text-sm leading-relaxed">
            Configure deadline alerts, regulatory update notifications, and surveillance audit reminders via SMS, email, or webhook.
          </p>
          <div className="flex flex-wrap gap-2">
            {["Email Alerts", "SMS Reminders", "Webhook Integrations", "Calendar Sync"].map((item) => (
              <div
                key={item}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#F8FAFC] dark:bg-white/5 border border-[#E2E8F0] dark:border-white/10 text-[11px] text-[#475569] dark:text-[#94A3B8]"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-blue-500 dark:bg-blue-400" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
