"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  GitPullRequest,
  Search,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  ArrowRight,
  ShieldAlert,
  Building,
  User,
  FileCheck,
  Send,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import type { AdminScrutinyData } from "@/types";
import { casesApi } from "@/lib/api/cases";

interface AdminWorkflowsTabProps {
  data: AdminScrutinyData;
  onRefresh?: () => void;
}

export function AdminWorkflowsTab({ data, onRefresh }: AdminWorkflowsTabProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Quick Action Modal state
  const [activeCaseModal, setActiveCaseModal] = useState<any | null>(null);
  const [modalAction, setModalAction] = useState<"APPROVE" | "QUERY" | "REJECT">("APPROVE");
  const [modalRemarks, setModalRemarks] = useState("");
  const [modalRequiredAction, setModalRequiredAction] = useState("");
  const [modalSubmitting, setModalSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [modalSuccess, setModalSuccess] = useState<string | null>(null);

  const cases = data.compliance_cases || [];
  const metrics = data.metrics.workflow;

  const filteredCases = cases.filter((c) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !search ||
      c.case_number.toLowerCase().includes(q) ||
      c.requirement_name.toLowerCase().includes(q) ||
      (c.authority && c.authority.toLowerCase().includes(q)) ||
      (c.requirement_id_code && c.requirement_id_code.toLowerCase().includes(q));

    if (!matchesSearch) return false;

    const s = c.status_code.toUpperCase();
    if (statusFilter === "PENDING") {
      return s === "HUMAN_REVIEW" || s === "PENDING_REVIEW";
    }
    if (statusFilter === "SUBMITTED") {
      return s === "SUBMITTED" || s === "IN_REVIEW";
    }
    if (statusFilter === "QUERY") {
      return s === "QUERY_RAISED" || s === "QUERY";
    }
    if (statusFilter === "APPROVED") {
      return s === "APPROVED";
    }
    if (statusFilter === "REJECTED") {
      return s === "REJECTED";
    }
    return true;
  });

  const handleOpenActionModal = (
    c: any,
    action: "APPROVE" | "QUERY" | "REJECT"
  ) => {
    setActiveCaseModal(c);
    setModalAction(action);
    setModalRemarks("");
    setModalRequiredAction("");
    setModalError(null);
    setModalSuccess(null);
  };

  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCaseModal) return;

    setModalSubmitting(true);
    setModalError(null);
    setModalSuccess(null);

    try {
      if (modalAction === "APPROVE") {
        await casesApi.adminApprove(
          activeCaseModal.id,
          modalRemarks || "Compliance requirements satisfied upon officer scrutiny."
        );
        setModalSuccess("Case successfully approved.");
      } else if (modalAction === "QUERY") {
        if (!modalRemarks || !modalRequiredAction) {
          throw new Error("Both reason and required action are mandatory to raise a query.");
        }
        await casesApi.adminQuery(
          activeCaseModal.id,
          modalRemarks,
          modalRequiredAction
        );
        setModalSuccess("Query raised and dispatched to business owner.");
      } else if (modalAction === "REJECT") {
        if (!modalRemarks) {
          throw new Error("Mandatory reason is required to reject a case.");
        }
        await casesApi.adminReject(activeCaseModal.id, modalRemarks);
        setModalSuccess("Case rejected.");
      }

      setTimeout(() => {
        setActiveCaseModal(null);
        if (onRefresh) onRefresh();
      }, 900);
    } catch (err: any) {
      setModalError(err.message || "Failed to execute workflow action.");
    } finally {
      setModalSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Summary */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                <GitPullRequest className="w-3 h-3 mr-1" />
                Operational Workflow Governance
              </span>
              <span className="text-xs text-slate-500 font-mono">
                {cases.length} Open Filing Cases
              </span>
            </div>
            <h2 className="text-xl font-bold text-[#0F172A]">
              Compliance Cases &amp; Filing Review Queue
            </h2>
            <p className="text-sm text-slate-600 mt-1 max-w-3xl">
              Track multi-step compliance workflows, verify submitted filings against mandatory
              checklists, and transition state across official review stages.
            </p>
          </div>

          <div className="flex items-center gap-2.5 overflow-x-auto">
            <div className="px-3.5 py-2 bg-amber-50 border border-amber-200 rounded-xl text-center">
              <div className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider">
                Pending Review
              </div>
              <div className="text-lg font-bold text-amber-700">
                {metrics.pending_review_count}
              </div>
            </div>
            <div className="px-3.5 py-2 bg-blue-50 border border-blue-200 rounded-xl text-center">
              <div className="text-[11px] font-semibold text-blue-700 uppercase tracking-wider">
                Submitted
              </div>
              <div className="text-lg font-bold text-blue-700">{metrics.submitted_count}</div>
            </div>
            <div className="px-3.5 py-2 bg-purple-50 border border-purple-200 rounded-xl text-center">
              <div className="text-[11px] font-semibold text-purple-700 uppercase tracking-wider">
                Query Raised
              </div>
              <div className="text-lg font-bold text-purple-700">
                {metrics.query_raised_count}
              </div>
            </div>
            <div className="px-3.5 py-2 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
              <div className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">
                Approved
              </div>
              <div className="text-lg font-bold text-emerald-700">{metrics.approved_count}</div>
            </div>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by case #, requirement, authority..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-[#18181B] rounded-xl text-sm transition-all focus:outline-none focus:ring-1 focus:ring-[#18181B]"
            />
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
            <button
              onClick={() => setStatusFilter("ALL")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                statusFilter === "ALL"
                  ? "bg-[#18181B] text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              All Cases ({cases.length})
            </button>
            <button
              onClick={() => setStatusFilter("PENDING")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                statusFilter === "PENDING"
                  ? "bg-[#18181B] text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Pending Review ({metrics.pending_review_count})
            </button>
            <button
              onClick={() => setStatusFilter("SUBMITTED")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                statusFilter === "SUBMITTED"
                  ? "bg-[#18181B] text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Submitted ({metrics.submitted_count})
            </button>
            <button
              onClick={() => setStatusFilter("QUERY")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                statusFilter === "QUERY"
                  ? "bg-amber-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Queries ({metrics.query_raised_count})
            </button>
            <button
              onClick={() => setStatusFilter("APPROVED")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                statusFilter === "APPROVED"
                  ? "bg-emerald-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Approved ({metrics.approved_count})
            </button>
          </div>
        </div>
      </div>

      {/* Cases Table */}
      {filteredCases.length === 0 ? (
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-12 text-center shadow-sm">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
            <GitPullRequest className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-[#0F172A]">No Workflow Cases Found</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
            {search
              ? "No compliance cases match your current search terms."
              : "No compliance cases are actively initialized for this business. As applicable requirements are generated, corresponding cases appear here."}
          </p>
        </div>
      ) : (
        <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/75 border-b border-[#E2E8F0] text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Case #</th>
                  <th className="py-3.5 px-4">Requirement / Authority</th>
                  <th className="py-3.5 px-4">Current Step</th>
                  <th className="py-3.5 px-4">Document Progress</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0] text-xs">
                {filteredCases.map((c) => {
                  const s = c.status_code.toUpperCase();
                  const isApproved = s === "APPROVED";
                  const isQuery = s === "QUERY_RAISED" || s === "QUERY";
                  const isRejected = s === "REJECTED";
                  const isPending = s === "HUMAN_REVIEW" || s === "PENDING_REVIEW";

                  return (
                    <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                      {/* Case Number */}
                      <td className="py-4 px-4 font-mono font-semibold text-[#0F172A] whitespace-nowrap">
                        <Link
                          href={`/admin/cases/${c.id}`}
                          className="hover:underline flex items-center gap-1 text-[#0F172A]"
                        >
                          <span>{c.case_number}</span>
                          <ExternalLink className="w-3 h-3 text-slate-400" />
                        </Link>
                      </td>

                      {/* Requirement & Authority */}
                      <td className="py-4 px-4 max-w-xs">
                        <div className="font-bold text-[#0F172A] leading-snug line-clamp-1">
                          {c.requirement_name}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <Building className="w-3 h-3" />
                          <span>{c.authority}</span>
                        </div>
                        {c.mandate_basis && (
                          <div className="text-[11px] text-slate-500 italic mt-0.5 line-clamp-1">
                            {c.mandate_basis}
                          </div>
                        )}
                      </td>

                      {/* Current Step */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <span className="font-medium text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
                          {c.current_step_name || "Document Upload"}
                        </span>
                      </td>

                      {/* Document Progress */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <FileCheck className="w-3.5 h-3.5 text-slate-400" />
                          <span className="font-semibold text-slate-800">
                            {c.documents_uploaded_count} / {c.documents_required_count}
                          </span>
                          <span className="text-[11px] text-slate-400">files</span>
                          {c.documents_approved_count > 0 && (
                            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                              {c.documents_approved_count} approved
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        {isApproved && (
                          <span className="inline-flex items-center text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Approved
                          </span>
                        )}
                        {isQuery && (
                          <span className="inline-flex items-center text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            Query Dispatched
                          </span>
                        )}
                        {isRejected && (
                          <span className="inline-flex items-center text-xs font-semibold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
                            <XCircle className="w-3 h-3 mr-1" />
                            Rejected
                          </span>
                        )}
                        {isPending && (
                          <span className="inline-flex items-center text-xs font-semibold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                            <Clock className="w-3 h-3 mr-1" />
                            Pending Scrutiny
                          </span>
                        )}
                        {!isApproved && !isQuery && !isRejected && !isPending && (
                          <span className="inline-flex items-center text-xs font-semibold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
                            {c.status_code}
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenActionModal(c, "APPROVE")}
                            className="px-2 py-1 rounded-lg text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleOpenActionModal(c, "QUERY")}
                            className="px-2 py-1 rounded-lg text-[11px] font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-colors"
                          >
                            Query
                          </button>
                          <Link
                            href={`/admin/cases/${c.id}`}
                            className="px-2.5 py-1 rounded-lg text-[11px] font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 transition-colors"
                          >
                            Full Packet
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Action Modal */}
      {activeCaseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="font-mono text-xs font-bold text-slate-500">
                  {activeCaseModal.case_number}
                </span>
                <h3 className="text-base font-bold text-[#0F172A] mt-0.5">
                  {modalAction === "APPROVE"
                    ? "Approve Compliance Case"
                    : modalAction === "QUERY"
                    ? "Raise Scrutiny Query"
                    : "Reject Filing"}
                </h3>
              </div>
              <button
                onClick={() => setActiveCaseModal(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1">
              <div className="font-semibold text-slate-800">
                {activeCaseModal.requirement_name}
              </div>
              <div className="text-slate-500">{activeCaseModal.authority}</div>
            </div>

            <form onSubmit={handleModalSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {modalAction === "APPROVE"
                    ? "Approval Remarks (Optional)"
                    : modalAction === "QUERY"
                    ? "Deficiency Reason (Mandatory)"
                    : "Rejection Rationale (Mandatory)"}
                </label>
                <textarea
                  rows={3}
                  value={modalRemarks}
                  onChange={(e) => setModalRemarks(e.target.value)}
                  placeholder="Record officer rationale..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-[#18181B]"
                />
              </div>

              {modalAction === "QUERY" && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Specific Corrective Action
                  </label>
                  <input
                    type="text"
                    value={modalRequiredAction}
                    onChange={(e) => setModalRequiredAction(e.target.value)}
                    placeholder="e.g. Provide renewed pollution consent letter"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-[#18181B]"
                  />
                </div>
              )}

              {modalSuccess && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{modalSuccess}</span>
                </div>
              )}
              {modalError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveCaseModal(null)}
                  className="px-3 py-2 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalSubmitting}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold text-white shadow-sm transition-colors ${
                    modalAction === "APPROVE"
                      ? "bg-emerald-600 hover:bg-emerald-700"
                      : modalAction === "QUERY"
                      ? "bg-amber-600 hover:bg-amber-700"
                      : "bg-rose-600 hover:bg-rose-700"
                  }`}
                >
                  {modalSubmitting ? "Executing..." : `Confirm ${modalAction}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
