"use client";

import React, { useState } from "react";
import type { AdminScrutinyEngine2Item } from "@/types";
import { api } from "@/lib/api";
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle2,
  Clock,
  Code2,
  Copy,
  ExternalLink,
  FileCheck,
  FileText,
  Fingerprint,
  HelpCircle,
  Layers,
  Lock,
  Scale,
  Shield,
  ShieldAlert,
  ShieldCheck,
  User,
  X,
  Zap,
} from "lucide-react";

interface AdminScrutinyDrawerProps {
  item: AdminScrutinyEngine2Item | null;
  businessId: string;
  onClose: () => void;
  onDispositionUpdated: () => void;
}

export function AdminScrutinyDrawer({
  item,
  businessId,
  onClose,
  onDispositionUpdated,
}: AdminScrutinyDrawerProps) {
  const [activeTab, setActiveTab] = useState<"trace" | "evidence" | "action" | "disposition">("trace");
  const [actionType, setActionType] = useState<"CONFIRM" | "NOT_REQUIRED">("CONFIRM");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  if (!item) return null;

  const trace = item.explanation_trace || {};
  const evRecords = item.evidence_records || [];
  const actionDest = item.action_destination;
  const disp = item.human_disposition;

  // Extract variables used from trace
  const rawVariablesUsed =
    trace.variables_used ||
    (Array.isArray(trace.evaluations) && trace.evaluations[0]?.trace?.variables_used) ||
    {};

  // Extract evaluations array
  const evaluationsList: any[] = Array.isArray(trace.evaluations) ? trace.evaluations : [];

  function copyText(text: string, id: string) {
    navigator.clipboard.writeText(text);
    setCopiedHash(id);
    setTimeout(() => setCopiedHash(null), 2000);
  }

  async function handleRecordDisposition(e: React.FormEvent) {
    e.preventDefault();
    if (!item) return;
    if (actionType === "NOT_REQUIRED" && !reason.trim()) {
      setErrorMsg("A clear, substantive reason is mandatory when marking a requirement as NOT_REQUIRED.");
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);
    try {
      await api.businesses.recordRequirementDisposition(
        businessId,
        item.requirement_id,
        actionType,
        reason
      );
      setSuccessMsg(`Operational disposition successfully recorded: ${actionType}`);
      onDispositionUpdated();
      setTimeout(() => {
        setSuccessMsg(null);
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err?.message || "Failed to record disposition.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end animate-in fade-in duration-200">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity" onClick={onClose} />

      {/* Slide-over Drawer Panel */}
      <div className="relative w-full max-w-2xl bg-white shadow-2xl flex flex-col h-full z-10 border-l border-[#E2E8F0]">
        
        {/* Drawer Header */}
        <div className="p-6 border-b border-[#F0F2F5] bg-[#FAFAFA]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="font-mono text-xs font-bold text-[#64748B]">
                  {item.requirement_id}
                </span>
                <span className="text-slate-300">&bull;</span>
                <span className="text-xs font-semibold text-[#0F172A]">
                  {item.authority}
                </span>
                <span className="text-slate-300">&bull;</span>
                <span className="text-[11px] font-mono text-[#64748B]">
                  {item.jurisdiction}
                </span>
              </div>
              <h2 className="text-lg font-bold text-[#0F172A] tracking-tight">
                {item.requirement_name}
              </h2>
            </div>

            <button
              onClick={onClose}
              className="h-8 w-8 rounded-full bg-white border border-[#E2E8F0] hover:bg-[#F1F5F9] text-[#64748B] hover:text-[#0F172A] flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Status Badges & Evaluated Timestamp */}
          <div className="mt-4 flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] uppercase font-bold text-[#64748B]">System Result:</span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  item.status === "APPLICABLE"
                    ? "bg-rose-100 text-rose-800 border border-rose-200"
                    : item.status === "NOT_APPLICABLE"
                    ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                    : item.status === "NEEDS_INFORMATION"
                    ? "bg-amber-100 text-amber-800 border border-amber-200"
                    : "bg-slate-100 text-slate-800 border border-slate-200"
                }`}
              >
                {item.status}
              </span>
            </div>

            {disp && (
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] uppercase font-bold text-[#64748B]">Officer Disposition:</span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#18181B] text-white">
                  {disp.admin_disposition}
                </span>
              </div>
            )}

            {item.evaluated_at && (
              <div className="text-[11px] text-[#64748B] ml-auto">
                Evaluated: {new Date(item.evaluated_at).toLocaleDateString()}
              </div>
            )}
          </div>

          {/* Segmented Subtab Navigation */}
          <div className="flex items-center gap-1 mt-6 border-b border-[#E2E8F0]">
            <button
              onClick={() => setActiveTab("trace")}
              className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
                activeTab === "trace"
                  ? "border-[#18181B] text-[#18181B]"
                  : "border-transparent text-[#64748B] hover:text-[#0F172A]"
              }`}
            >
              <div className="flex items-center gap-1.5">
                <Code2 className="w-3.5 h-3.5" />
                <span>AST / Engine 2 Trace</span>
              </div>
            </button>

            <button
              onClick={() => setActiveTab("evidence")}
              className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
                activeTab === "evidence"
                  ? "border-[#18181B] text-[#18181B]"
                  : "border-transparent text-[#64748B] hover:text-[#0F172A]"
              }`}
            >
              <div className="flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5" />
                <span>Statutory Evidence ({evRecords.length})</span>
              </div>
            </button>

            <button
              onClick={() => setActiveTab("action")}
              className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
                activeTab === "action"
                  ? "border-[#18181B] text-[#18181B]"
                  : "border-transparent text-[#64748B] hover:text-[#0F172A]"
              }`}
            >
              <div className="flex items-center gap-1.5">
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Official Action URL</span>
              </div>
            </button>

            <button
              onClick={() => setActiveTab("disposition")}
              className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
                activeTab === "disposition"
                  ? "border-[#18181B] text-[#18181B]"
                  : "border-transparent text-[#64748B] hover:text-[#0F172A]"
              }`}
            >
              <div className="flex items-center gap-1.5">
                <FileCheck className="w-3.5 h-3.5" />
                <span>Officer Disposition</span>
              </div>
            </button>
          </div>
        </div>

        {/* Drawer Body Scroll Area */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6">
          
          {/* TAB 1: AST / ENGINE 2 TRACE VIEWER (§9) */}
          {activeTab === "trace" && (
            <div className="space-y-5">
              <div className="p-4 rounded-[14px] bg-[#F8FAFC] border border-[#E2E8F0] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#0F172A]">Engine 2 Rule Version & Precedence</span>
                  {item.rule_version ? (
                    <span className="text-xs font-mono font-semibold bg-white border border-[#E2E8F0] px-2 py-0.5 rounded">
                      {item.rule_version.rule_id} v{item.rule_version.version} &bull; {item.rule_version.rule_type}
                    </span>
                  ) : (
                    <span className="text-xs text-[#64748B]">Jurisdiction / Default Evaluation</span>
                  )}
                </div>

                {trace.reason && (
                  <div className="text-xs">
                    <span className="font-semibold text-[#475569]">Trace Determination Reason: </span>
                    <span className="font-mono text-[#0F172A] bg-white px-1.5 py-0.5 rounded border border-[#E2E8F0]">
                      {trace.reason}
                    </span>
                  </div>
                )}

                {trace.note && (
                  <p className="text-xs text-[#475569] leading-relaxed">
                    {trace.note}
                  </p>
                )}
              </div>

              {/* Input Variables Evaluated */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#64748B] mb-2.5">
                  Input Variables & Evaluated Profile Values
                </h4>

                {Object.keys(rawVariablesUsed).length > 0 ? (
                  <div className="rounded-[12px] border border-[#E2E8F0] overflow-hidden">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[11px] text-[#64748B] font-semibold">
                        <tr>
                          <th className="py-2.5 px-3">Variable Key</th>
                          <th className="py-2.5 px-3">Evaluated Value</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#F1F5F9]">
                        {Object.entries(rawVariablesUsed).map(([k, v]) => (
                          <tr key={k} className="hover:bg-[#FAFAFA]">
                            <td className="py-2 px-3 font-mono font-semibold text-[#0F172A]">{k}</td>
                            <td className="py-2 px-3 font-mono text-[#334155]">{String(v)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-[12px] bg-[#F8FAFC] border border-[#E2E8F0] text-xs text-[#64748B]">
                    No specific AST variables accessed (evaluated at jurisdiction or statutory level).
                  </div>
                )}
              </div>

              {/* Multi-Rule AST Evaluation Hierarchy */}
              {evaluationsList.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#64748B] mb-2.5">
                    Evaluated Rule Hierarchy (Kleene 3-Valued Logic)
                  </h4>
                  <div className="space-y-2">
                    {evaluationsList.map((ev, idx) => (
                      <div key={idx} className="p-3.5 rounded-[12px] bg-[#F8FAFC] border border-[#E2E8F0] space-y-1.5 text-xs">
                        <div className="flex items-center justify-between font-mono">
                          <span className="font-bold text-[#0F172A]">{ev.rule_id} v{ev.version}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            ev.truth_value === "TRUE" ? "bg-emerald-100 text-emerald-800" :
                            ev.truth_value === "FALSE" ? "bg-rose-100 text-rose-800" : "bg-amber-100 text-amber-800"
                          }`}>
                            Truth: {ev.truth_value} &rarr; {ev.configured_result}
                          </span>
                        </div>
                        {ev.trace?.op && (
                          <div className="text-[11px] font-mono text-[#475569]">
                            Operator: <span className="font-bold text-[#18181B]">{ev.trace.op}</span> &bull; Result: {ev.trace.result}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Raw JSON Trace Debug View */}
              <div className="pt-2">
                <details className="text-xs group">
                  <summary className="font-semibold text-[#64748B] hover:text-[#0F172A] cursor-pointer">
                    View Full Canonical Explanation Trace (JSON)
                  </summary>
                  <pre className="mt-2 p-3 rounded-[12px] bg-[#18181B] text-slate-200 text-[11px] font-mono overflow-x-auto max-h-60 leading-relaxed">
                    {JSON.stringify(trace, null, 2)}
                  </pre>
                </details>
              </div>
            </div>
          )}

          {/* TAB 2: STATUTORY EVIDENCE INSPECTION (§10) */}
          {activeTab === "evidence" && (
            <div className="space-y-4">
              {evRecords.length === 0 ? (
                <div className="p-8 text-center bg-[#F8FAFC] rounded-[16px] border border-[#E2E8F0] space-y-2">
                  <AlertCircle className="w-8 h-8 text-[#94A3B8] mx-auto" />
                  <div className="font-semibold text-xs text-[#0F172A]">No Evidence Records Linked</div>
                  <p className="text-xs text-[#64748B] max-w-sm mx-auto">
                    This requirement does not carry a direct statutory evidence chunk in the knowledge registry.
                  </p>
                </div>
              ) : (
                evRecords.map((ev) => (
                  <div key={ev.evidence_id} className="p-4 rounded-[16px] border border-[#E2E8F0] bg-white shadow-2xs space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-[11px] font-mono font-bold text-[#64748B]">{ev.evidence_id}</div>
                        <h4 className="font-bold text-sm text-[#0F172A] mt-0.5">{ev.source_title}</h4>
                        <div className="text-xs text-[#475569] flex items-center gap-2 mt-0.5">
                          <span className="font-semibold text-[#18181B]">{ev.authority}</span>
                          <span>&bull;</span>
                          <span>{ev.locator || "Official Statutory Gazette"}</span>
                        </div>
                      </div>

                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>{ev.verification_status || "VERIFIED"}</span>
                      </span>
                    </div>

                    {/* Verbatim Excerpt */}
                    <div className="p-3 rounded-[10px] bg-[#F8FAFC] border-l-3 border-[#18181B] text-xs text-[#334155] leading-relaxed italic">
                      &ldquo;{ev.excerpt}&rdquo;
                    </div>

                    {/* Metadata & Content Hash */}
                    <div className="pt-2 border-t border-[#F1F5F9] flex flex-wrap items-center justify-between gap-3 text-[11px] font-mono text-[#64748B]">
                      {ev.content_hash && (
                        <div className="flex items-center gap-1.5 truncate max-w-xs">
                          <span>SHA-256:</span>
                          <span className="truncate">{ev.content_hash}</span>
                          <button
                            onClick={() => copyText(ev.content_hash, ev.evidence_id)}
                            className="p-0.5 hover:text-[#0F172A] cursor-pointer"
                            title="Copy SHA-256 hash"
                          >
                            {copiedHash === ev.evidence_id ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </div>
                      )}

                      {ev.canonical_url && (
                        <a
                          href={ev.canonical_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-sans font-semibold cursor-pointer"
                        >
                          <span>Official Source Link</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 3: EXACT OFFICIAL ACTION URL (§11) */}
          {activeTab === "action" && (
            <div className="space-y-5">
              {actionDest ? (
                <div className="p-5 rounded-[16px] border border-[#E2E8F0] bg-white shadow-2xs space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#18181B] text-white">
                      {actionDest.action_type || "REGISTER"}
                    </span>
                    {actionDest.is_verified_destination && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Verified Official Portal</span>
                      </span>
                    )}
                  </div>

                  <div>
                    <h4 className="font-bold text-base text-[#0F172A]">{actionDest.action_label}</h4>
                    <p className="text-xs text-[#64748B] mt-1">
                      {actionDest.notes || "Official government portal for filing, registration, or regulatory submission."}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-[12px] bg-[#F8FAFC] border border-[#E2E8F0] space-y-1">
                    <span className="text-[10px] uppercase font-bold text-[#64748B]">Destination Portal</span>
                    <div className="font-semibold text-xs text-[#0F172A]">{actionDest.portal_name || "Official Authority Gateway"}</div>
                    <div className="font-mono text-xs text-blue-600 break-all">{actionDest.destination_url}</div>
                  </div>

                  <div className="pt-2 flex items-center gap-3">
                    <a
                      href={actionDest.destination_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-[10px] bg-[#18181B] hover:bg-black text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                    >
                      <span>Proceed to Official Destination</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>

                    {actionDest.authoritative_source_url && (
                      <a
                        href={actionDest.authoritative_source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[10px] border border-[#E2E8F0] hover:bg-[#F8FAFC] text-xs font-semibold text-[#64748B] hover:text-[#0F172A] transition-colors"
                      >
                        <span>Citing Law Source</span>
                      </a>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center bg-[#F8FAFC] rounded-[16px] border border-[#E2E8F0] space-y-2">
                  <ExternalLink className="w-8 h-8 text-[#94A3B8] mx-auto" />
                  <div className="font-semibold text-xs text-[#0F172A]">No Operational Action Required</div>
                  <p className="text-xs text-[#64748B] max-w-sm mx-auto">
                    This requirement is evaluated as {item.status}. Operational filing destinations are resolved for APPLICABLE obligations.
                  </p>
                  {item.portal_url && (
                    <div className="pt-2">
                      <a
                        href={item.portal_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-semibold text-blue-600 hover:underline"
                      >
                        Visit Authority Reference Gateway &rarr;
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: OFFICER DISPOSITION & REVIEW CONTROLS (§15) */}
          {activeTab === "disposition" && (
            <form onSubmit={handleRecordDisposition} className="space-y-5">
              <div className="p-4 rounded-[14px] bg-blue-50/60 border border-blue-200 text-xs text-blue-900 leading-relaxed">
                <span className="font-bold">Architectural Principle: </span>
                Administrative dispositions reflect human operational review (e.g. confirming audit requirements or exempting with legal rationale). They are recorded in the audit trail and <strong>never alter Engine 2 legal truth</strong>.
              </div>

              {disp && (
                <div className="p-4 rounded-[14px] bg-[#F8FAFC] border border-[#E2E8F0] space-y-2 text-xs">
                  <span className="text-[10px] uppercase font-bold text-[#64748B] block">Current Disposition</span>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#0F172A]">{disp.admin_disposition}</span>
                    <span className="text-[11px] text-[#64748B]">Case #{disp.case_number}</span>
                  </div>
                  {disp.reason && <p className="text-xs text-[#475569] italic">&ldquo;{disp.reason}&rdquo;</p>}
                  <div className="text-[10px] text-[#94A3B8]">
                    Recorded by {disp.reviewer_name || disp.reviewer_email || "Officer"}
                  </div>
                </div>
              )}

              {/* Action Selector */}
              <div>
                <label className="block text-xs font-bold text-[#0F172A] mb-2">Select Operational Action</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setActionType("CONFIRM")}
                    className={`p-3 rounded-[12px] border text-left transition-all cursor-pointer ${
                      actionType === "CONFIRM"
                        ? "bg-[#18181B] text-white border-[#18181B]"
                        : "bg-white text-[#0F172A] border-[#E2E8F0] hover:bg-[#F8FAFC]"
                    }`}
                  >
                    <div className="font-bold text-xs">Confirm Required</div>
                    <div className={`text-[10px] mt-0.5 ${actionType === "CONFIRM" ? "text-slate-300" : "text-[#64748B]"}`}>
                      Approve and mandate for operational case
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActionType("NOT_REQUIRED")}
                    className={`p-3 rounded-[12px] border text-left transition-all cursor-pointer ${
                      actionType === "NOT_REQUIRED"
                        ? "bg-rose-600 text-white border-rose-600"
                        : "bg-white text-[#0F172A] border-[#E2E8F0] hover:bg-[#F8FAFC]"
                    }`}
                  >
                    <div className="font-bold text-xs">Mark Not Required</div>
                    <div className={`text-[10px] mt-0.5 ${actionType === "NOT_REQUIRED" ? "text-rose-100" : "text-[#64748B]"}`}>
                      Exempt with mandatory legal rationale
                    </div>
                  </button>
                </div>
              </div>

              {/* Reason / Remarks */}
              <div>
                <label className="block text-xs font-bold text-[#0F172A] mb-1">
                  Officer Review Rationale {actionType === "NOT_REQUIRED" && <span className="text-rose-500">*</span>}
                </label>
                <textarea
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder={
                    actionType === "NOT_REQUIRED"
                      ? "Mandatory legal/factual justification for waiving this obligation..."
                      : "Optional comments for this determination..."
                  }
                  className="w-full p-3 text-xs rounded-[10px] border border-[#E2E8F0] bg-[#F8FAFC] focus:bg-white focus:outline-hidden focus:border-[#18181B]"
                />
              </div>

              {errorMsg && (
                <div className="p-3 rounded-[10px] bg-rose-50 border border-rose-200 text-xs text-rose-800">
                  {errorMsg}
                </div>
              )}

              {successMsg && (
                <div className="p-3 rounded-[10px] bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
                  {successMsg}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 px-4 rounded-[10px] bg-[#18181B] hover:bg-black text-white text-xs font-bold transition-all disabled:opacity-50 cursor-pointer shadow-xs"
              >
                {submitting ? "Recording Disposition..." : "Submit Review Action"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminScrutinyDrawer;
