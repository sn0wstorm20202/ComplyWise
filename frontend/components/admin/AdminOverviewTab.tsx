"use client";

import React from "react";
import type { AdminScrutinyData } from "@/types";
import {
  AlertCircle,
  AlertTriangle,
  Building2,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileCheck,
  FileText,
  Fingerprint,
  HelpCircle,
  Layers,
  Lock,
  MapPin,
  Scale,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  User,
  Zap,
} from "lucide-react";

interface AdminOverviewTabProps {
  data: AdminScrutinyData;
  onNavigateTab: (tab: string) => void;
  onRefresh?: () => void;
}

export function AdminOverviewTab({ data, onNavigateTab, onRefresh }: AdminOverviewTabProps) {
  const b = data.business;
  const p = data.profile;
  const ass = data.selected_assessment;
  const run = data.decision_run;
  const cir = data.cir;
  const automated = data.metrics?.automated || {
    applicable_count: 0,
    not_applicable_count: 0,
    needs_info_count: 0,
    unverified_count: 0,
    conflict_review_count: 0,
    total_evaluated: 0,
  };
  const workflow = data.metrics?.workflow || {
    pending_review_count: 0,
    submitted_count: 0,
    query_raised_count: 0,
    approved_count: 0,
    rejected_count: 0,
    total_cases: 0,
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Banner & Scrutiny Context */}
      <div className="bg-white rounded-[20px] border border-[#E2E8F0] p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-[14px] bg-[#18181B] text-white flex items-center justify-center shrink-0 shadow-sm">
            <Building2 className="h-6 w-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold tracking-tight text-[#0F172A]">{b.name}</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-[#F1F5F9] text-[#475569] border border-[#E2E8F0]">
                {b.incorporation_type || "ENTERPRISE"}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                {b.primary_state || "CENTRAL JURISDICTION"}
              </span>
            </div>
            <div className="text-xs text-[#64748B] mt-1 flex items-center gap-3 flex-wrap">
              <span>Owner: {b.owner_name || b.owner_email || "System Owner"}</span>
              <span>&bull;</span>
              <span>UUID: <span className="font-mono text-[11px] text-[#334155]">{b.id}</span></span>
              {b.created_at && (
                <>
                  <span>&bull;</span>
                  <span>Registered: {new Date(b.created_at).toLocaleDateString()}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Selected Assessment Badge */}
        <div className="flex items-center gap-3 border-t md:border-t-0 md:border-l border-[#F1F5F9] pt-3 md:pt-0 md:pl-6">
          <div className="text-right">
            <div className="text-[10px] uppercase font-bold tracking-wider text-[#64748B]">Active Assessment</div>
            <div className="font-bold text-sm text-[#0F172A]">
              {ass ? `#${ass.assessment_number} — ${ass.title}` : "Baseline Assessment"}
            </div>
            <div className="text-[11px] text-emerald-600 font-semibold flex items-center justify-end gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Profile Snapshot v{p.version_number}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. AUTOMATED COMPLIANCE INTELLIGENCE (ENGINE 2 TRUTH) vs OPERATIONAL WORKFLOW */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Column: Engine 2 Automated Intelligence (§7) */}
        <div className="bg-white rounded-[20px] border border-[#E2E8F0] p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9]">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-[8px] bg-blue-50 text-blue-700 border border-blue-200">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#0F172A]">Automated Compliance Intelligence</h3>
                <p className="text-[11px] text-[#64748B]">
                  Deterministic determinations produced by Engine 2 (DecisionRun {run ? run.id.slice(0, 8) : "N/A"})
                </p>
              </div>
            </div>
            <button
              onClick={() => onNavigateTab("compliance")}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span>Inspect All</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {/* Applicable */}
            <div className="p-3.5 rounded-[14px] bg-rose-50/60 border border-rose-200">
              <div className="text-[10px] font-bold uppercase tracking-wider text-rose-700">Applicable</div>
              <div className="text-2xl font-bold text-rose-900 mt-1">{automated.applicable_count}</div>
              <div className="text-[10px] text-rose-600 mt-0.5">Mandatory Obligations</div>
            </div>

            {/* Needs Information */}
            <div className="p-3.5 rounded-[14px] bg-amber-50/60 border border-amber-200">
              <div className="text-[10px] font-bold uppercase tracking-wider text-amber-700">Needs Info</div>
              <div className="text-2xl font-bold text-amber-900 mt-1">{automated.needs_info_count}</div>
              <div className="text-[10px] text-amber-600 mt-0.5">Missing Profile Facts</div>
            </div>

            {/* Not Applicable */}
            <div className="p-3.5 rounded-[14px] bg-emerald-50/60 border border-emerald-200">
              <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Not Applicable</div>
              <div className="text-2xl font-bold text-emerald-900 mt-1">{automated.not_applicable_count}</div>
              <div className="text-[10px] text-emerald-600 mt-0.5">Exempt or Out of Scope</div>
            </div>

            {/* Unverified */}
            <div className="p-3.5 rounded-[14px] bg-slate-50 border border-slate-200">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-700">Unverified</div>
              <div className="text-2xl font-bold text-slate-900 mt-1">{automated.unverified_count}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Evidence Pending Review</div>
            </div>

            {/* Conflict Review */}
            <div className="p-3.5 rounded-[14px] bg-purple-50/60 border border-purple-200">
              <div className="text-[10px] font-bold uppercase tracking-wider text-purple-700">Conflict Review</div>
              <div className="text-2xl font-bold text-purple-900 mt-1">{automated.conflict_review_count}</div>
              <div className="text-[10px] text-purple-600 mt-0.5">Opposing Rule Results</div>
            </div>

            {/* Total Evaluated */}
            <div className="p-3.5 rounded-[14px] bg-[#F8FAFC] border border-[#E2E8F0]">
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">Evaluated Scope</div>
              <div className="text-2xl font-bold text-[#0F172A] mt-1">{automated.total_evaluated}</div>
              <div className="text-[10px] text-[#64748B] mt-0.5">Total Requirements</div>
            </div>
          </div>
        </div>

        {/* Right Column: Operational Workflow State (§15) */}
        <div className="bg-white rounded-[20px] border border-[#E2E8F0] p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9]">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-[8px] bg-amber-50 text-amber-700 border border-amber-200">
                <FileCheck className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#0F172A]">Operational Workflow State</h3>
                <p className="text-[11px] text-[#64748B]">
                  Administrative review queue & officer dispositions (Strictly separate from Engine 2)
                </p>
              </div>
            </div>
            <button
              onClick={() => onNavigateTab("workflows")}
              className="text-xs font-semibold text-amber-600 hover:text-amber-800 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span>Manage Queue</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {/* Pending Review */}
            <div className="p-3.5 rounded-[14px] bg-amber-50/60 border border-amber-200">
              <div className="text-[10px] font-bold uppercase tracking-wider text-amber-700">Pending Review</div>
              <div className="text-2xl font-bold text-amber-900 mt-1">{workflow.pending_review_count}</div>
              <div className="text-[10px] text-amber-600 mt-0.5">Awaiting Officer Action</div>
            </div>

            {/* Query Raised */}
            <div className="p-3.5 rounded-[14px] bg-blue-50/60 border border-blue-200">
              <div className="text-[10px] font-bold uppercase tracking-wider text-blue-700">Query Raised</div>
              <div className="text-2xl font-bold text-blue-900 mt-1">{workflow.query_raised_count}</div>
              <div className="text-[10px] text-blue-600 mt-0.5">Clarification Sent to User</div>
            </div>

            {/* Approved */}
            <div className="p-3.5 rounded-[14px] bg-emerald-50/60 border border-emerald-200">
              <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Approved</div>
              <div className="text-2xl font-bold text-emerald-900 mt-1">{workflow.approved_count}</div>
              <div className="text-[10px] text-emerald-600 mt-0.5">Verified by Officer</div>
            </div>

            {/* Submitted */}
            <div className="p-3.5 rounded-[14px] bg-slate-50 border border-slate-200">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-700">Submitted</div>
              <div className="text-2xl font-bold text-slate-900 mt-1">{workflow.submitted_count}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">External Filing Processing</div>
            </div>

            {/* Rejected */}
            <div className="p-3.5 rounded-[14px] bg-rose-50/60 border border-rose-200">
              <div className="text-[10px] font-bold uppercase tracking-wider text-rose-700">Rejected</div>
              <div className="text-2xl font-bold text-rose-900 mt-1">{workflow.rejected_count}</div>
              <div className="text-[10px] text-rose-600 mt-0.5">Deficient Submissions</div>
            </div>

            {/* Total Cases */}
            <div className="p-3.5 rounded-[14px] bg-[#F8FAFC] border border-[#E2E8F0]">
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">Active Cases</div>
              <div className="text-2xl font-bold text-[#0F172A] mt-1">{workflow.total_cases}</div>
              <div className="text-[10px] text-[#64748B] mt-0.5">Workflow Trackers</div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. SIGNED CIR & CRYPTOGRAPHIC PROVENANCE (§7, §9, §10) */}
      <div className="bg-white rounded-[20px] border border-[#E2E8F0] p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9]">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-[8px] bg-emerald-50 text-emerald-700 border border-emerald-200">
              <Fingerprint className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#0F172A]">
                Compliance Intelligence Record (CIR) Digest
              </h3>
              <p className="text-[11px] text-[#64748B]">
                Cryptographically signed determination record certifying Engine 2 evaluation integrity
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {data.cir_is_valid ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>HMAC Signature Valid</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Unsigned / In Progress</span>
              </span>
            )}
          </div>
        </div>

        {cir ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
            <div className="p-3 rounded-[12px] bg-[#F8FAFC] border border-[#E2E8F0] space-y-1">
              <span className="text-[10px] text-[#64748B] uppercase tracking-wider block font-sans font-semibold">
                CIR Identifier & Decision Run
              </span>
              <div className="font-bold text-[#0F172A] truncate">{cir.cir_id}</div>
              <div className="text-[11px] text-[#475569]">
                Run ID: {cir.decision_run_id}
              </div>
              <div className="text-[10px] text-[#94A3B8] font-sans">
                Timestamp: {new Date(cir.created_at).toLocaleString()}
              </div>
            </div>

            <div className="p-3 rounded-[12px] bg-[#F8FAFC] border border-[#E2E8F0] space-y-1">
              <span className="text-[10px] text-[#64748B] uppercase tracking-wider block font-sans font-semibold">
                Cryptographic Content Digest (SHA-256)
              </span>
              <div className="font-bold text-[#0F172A] truncate" title={cir.content_hash}>
                {cir.content_hash}
              </div>
              <div className="text-[10px] text-emerald-700 truncate" title={cir.authority_signature}>
                {cir.authority_signature}
              </div>
              <div className="text-[10px] text-[#64748B] font-sans">
                Enforces TRD_v2.0 §14, §17 immutable evaluation tamper-proofing
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-[12px] bg-slate-50 border border-slate-200 text-center text-xs text-[#64748B]">
            No completed DecisionRun for this assessment yet. Run regulatory analysis to generate signed CIR digest.
          </div>
        )}
      </div>

      {/* 4. FAST JUMP NAVIGATION TILES */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        <button
          onClick={() => onNavigateTab("compliance")}
          className="p-3.5 rounded-[16px] bg-white border border-[#E2E8F0] hover:border-[#18181B] text-left transition-all shadow-2xs hover:shadow-sm cursor-pointer group"
        >
          <Scale className="w-5 h-5 text-[#18181B] group-hover:scale-110 transition-transform" />
          <div className="font-semibold text-xs text-[#0F172A] mt-2">Compliance Scrutiny</div>
          <div className="text-[10px] text-[#64748B] mt-0.5">{data.engine2_results?.length || 0} Requirements</div>
        </button>

        <button
          onClick={() => onNavigateTab("schemes")}
          className="p-3.5 rounded-[16px] bg-white border border-[#E2E8F0] hover:border-[#18181B] text-left transition-all shadow-2xs hover:shadow-sm cursor-pointer group"
        >
          <Sparkles className="w-5 h-5 text-amber-600 group-hover:scale-110 transition-transform" />
          <div className="font-semibold text-xs text-[#0F172A] mt-2">Schemes & Incentives</div>
          <div className="text-[10px] text-[#64748B] mt-0.5">{data.schemes?.length || 0} Matched Schemes</div>
        </button>

        <button
          onClick={() => onNavigateTab("standards")}
          className="p-3.5 rounded-[16px] bg-white border border-[#E2E8F0] hover:border-[#18181B] text-left transition-all shadow-2xs hover:shadow-sm cursor-pointer group"
        >
          <Shield className="w-5 h-5 text-blue-600 group-hover:scale-110 transition-transform" />
          <div className="font-semibold text-xs text-[#0F172A] mt-2">BIS Standards</div>
          <div className="text-[10px] text-[#64748B] mt-0.5">{data.standards?.length || 0} Evaluated</div>
        </button>

        <button
          onClick={() => onNavigateTab("documents")}
          className="p-3.5 rounded-[16px] bg-white border border-[#E2E8F0] hover:border-[#18181B] text-left transition-all shadow-2xs hover:shadow-sm cursor-pointer group"
        >
          <FileText className="w-5 h-5 text-purple-600 group-hover:scale-110 transition-transform" />
          <div className="font-semibold text-xs text-[#0F172A] mt-2">Document Review</div>
          <div className="text-[10px] text-[#64748B] mt-0.5">{data.uploaded_documents?.length || 0} Submissions</div>
        </button>

        <button
          onClick={() => onNavigateTab("calendar")}
          className="p-3.5 rounded-[16px] bg-white border border-[#E2E8F0] hover:border-[#18181B] text-left transition-all shadow-2xs hover:shadow-sm cursor-pointer group"
        >
          <Clock className="w-5 h-5 text-rose-600 group-hover:scale-110 transition-transform" />
          <div className="font-semibold text-xs text-[#0F172A] mt-2">Statutory Deadlines</div>
          <div className="text-[10px] text-[#64748B] mt-0.5">
            {(data.calendar?.statutory_events?.length || 0) + (data.calendar?.admin_deadlines?.length || 0)} Events
          </div>
        </button>

        <button
          onClick={() => onNavigateTab("provenance")}
          className="p-3.5 rounded-[16px] bg-white border border-[#E2E8F0] hover:border-[#18181B] text-left transition-all shadow-2xs hover:shadow-sm cursor-pointer group"
        >
          <Layers className="w-5 h-5 text-emerald-600 group-hover:scale-110 transition-transform" />
          <div className="font-semibold text-xs text-[#0F172A] mt-2">Fact Provenance</div>
          <div className="text-[10px] text-[#64748B] mt-0.5">{p.answered_variables?.length || 0} Variables</div>
        </button>
      </div>
    </div>
  );
}

export default AdminOverviewTab;
