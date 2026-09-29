"use client";

import React, { useState } from "react";
import type { AdminScrutinyData, AdminScrutinyEngine2Item, ApplicabilityStatus } from "@/types";
import { AdminScrutinyDrawer } from "./AdminScrutinyDrawer";
import {
  AlertCircle,
  AlertTriangle,
  Building2,
  CheckCircle2,
  Clock,
  Code2,
  ExternalLink,
  Eye,
  Filter,
  HelpCircle,
  Layers,
  Scale,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  X,
  Zap,
} from "lucide-react";

interface AdminComplianceScrutinyTabProps {
  data: AdminScrutinyData;
  onRefresh: () => void;
}

export function AdminComplianceScrutinyTab({ data, onRefresh }: AdminComplianceScrutinyTabProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [domainFilter, setDomainFilter] = useState<string>("ALL");
  const [selectedRequirement, setSelectedRequirement] = useState<AdminScrutinyEngine2Item | null>(null);

  const results = data.engine2_results || [];

  // Extract unique domains
  const uniqueDomains = Array.from(new Set(results.map((r) => r.domain).filter(Boolean)));

  // Filter results
  const filteredResults = results.filter((r) => {
    // Status filter
    if (statusFilter !== "ALL" && r.status !== statusFilter) {
      return false;
    }
    // Domain filter
    if (domainFilter !== "ALL" && r.domain !== domainFilter) {
      return false;
    }
    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matches =
        r.requirement_name.toLowerCase().includes(q) ||
        r.requirement_id.toLowerCase().includes(q) ||
        r.authority.toLowerCase().includes(q) ||
        (r.domain && r.domain.toLowerCase().includes(q));
      if (!matches) return false;
    }
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Table Header & Controls Bar */}
      <div className="bg-white rounded-[20px] border border-[#E2E8F0] p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#94A3B8]" />
          <input
            type="text"
            placeholder="Search requirement name, ID, or authority..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-[10px] bg-[#F8FAFC] border border-[#E2E8F0] focus:bg-white focus:outline-hidden focus:border-[#18181B]"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-[#64748B]" />
            <span className="text-[#64748B] font-semibold text-[11px]">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1 rounded-[8px] bg-[#F8FAFC] border border-[#E2E8F0] text-xs font-semibold text-[#0F172A] focus:outline-hidden"
            >
              <option value="ALL">All Outcomes ({results.length})</option>
              <option value="APPLICABLE">Applicable</option>
              <option value="NOT_APPLICABLE">Not Applicable</option>
              <option value="NEEDS_INFORMATION">Needs Information</option>
              <option value="UNVERIFIED">Unverified</option>
              <option value="CONFLICT_REVIEW">Conflict Review</option>
            </select>
          </div>

          {uniqueDomains.length > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="text-[#64748B] font-semibold text-[11px]">Domain:</span>
              <select
                value={domainFilter}
                onChange={(e) => setDomainFilter(e.target.value)}
                className="px-2.5 py-1 rounded-[8px] bg-[#F8FAFC] border border-[#E2E8F0] text-xs font-semibold text-[#0F172A] focus:outline-hidden"
              >
                <option value="ALL">All Domains</option>
                {uniqueDomains.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          )}

          {(statusFilter !== "ALL" || domainFilter !== "ALL" || searchQuery) && (
            <button
              onClick={() => {
                setStatusFilter("ALL");
                setDomainFilter("ALL");
                setSearchQuery("");
              }}
              className="text-[11px] font-semibold text-rose-600 hover:text-rose-800 transition-colors cursor-pointer px-1.5 py-0.5"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Scrutiny Table */}
      <div className="bg-white rounded-[20px] border border-[#E2E8F0] overflow-hidden shadow-sm">
        {filteredResults.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <Scale className="w-8 h-8 text-[#94A3B8] mx-auto" />
            <div className="font-semibold text-xs text-[#0F172A]">No Matching Requirements Found</div>
            <p className="text-xs text-[#64748B] max-w-sm mx-auto">
              {results.length === 0
                ? "This assessment has not produced Engine 2 determinations yet. Please run an assessment evaluation."
                : "No compliance determinations match your active search or filters."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[11px] text-[#64748B] font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Requirement & Authority</th>
                  <th className="py-3 px-3">Statutory Domain</th>
                  <th className="py-3 px-3">System Result</th>
                  <th className="py-3 px-3">Human Disposition</th>
                  <th className="py-3 px-3">Official Action Link</th>
                  <th className="py-3 px-3">Evidence</th>
                  <th className="py-3 px-4 text-right">Scrutiny</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {filteredResults.map((r) => {
                  const isApplicable = r.status === "APPLICABLE";
                  const isNotApplicable = r.status === "NOT_APPLICABLE";
                  const isNeedsInfo = r.status === "NEEDS_INFORMATION";

                  return (
                    <tr
                      key={r.id || r.requirement_id}
                      onClick={() => setSelectedRequirement(r)}
                      className="hover:bg-[#F8FAFC]/80 transition-colors cursor-pointer group"
                    >
                      {/* Name & Authority */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="font-bold text-[#0F172A] group-hover:text-blue-600 transition-colors line-clamp-1">
                          {r.requirement_name}
                        </div>
                        <div className="text-[11px] text-[#64748B] flex items-center gap-1.5 mt-0.5">
                          <span className="font-mono text-[#475569]">{r.requirement_id}</span>
                          <span>&bull;</span>
                          <span className="truncate">{r.authority}</span>
                          {r.rule_version && (
                            <>
                              <span>&bull;</span>
                              <span className="font-mono text-[10px] text-[#94A3B8]">
                                {r.rule_version.rule_id} v{r.rule_version.version}
                              </span>
                            </>
                          )}
                        </div>
                      </td>

                      {/* Domain */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-[#F1F5F9] text-[#475569] border border-[#E2E8F0]">
                          {r.domain || "GENERAL"}
                        </span>
                      </td>

                      {/* System Result (Engine 2 Status) */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            isApplicable
                              ? "bg-rose-50 text-rose-800 border border-rose-200"
                              : isNotApplicable
                              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                              : isNeedsInfo
                              ? "bg-amber-50 text-amber-800 border border-amber-200"
                              : "bg-slate-100 text-slate-800 border border-slate-200"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isApplicable
                                ? "bg-rose-500"
                                : isNotApplicable
                                ? "bg-emerald-500"
                                : isNeedsInfo
                                ? "bg-amber-500"
                                : "bg-slate-400"
                            }`}
                          />
                          <span>{r.status}</span>
                        </span>
                      </td>

                      {/* Human Disposition */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        {r.human_disposition ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#18181B] text-white">
                            <span>{r.human_disposition.admin_disposition}</span>
                          </span>
                        ) : (
                          <span className="text-[11px] text-[#94A3B8] italic">Unreviewed</span>
                        )}
                      </td>

                      {/* Action Destination */}
                      <td className="py-3.5 px-3 max-w-[180px]">
                        {r.action_destination ? (
                          <div className="flex items-center gap-1.5 truncate">
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 border border-blue-200 uppercase">
                              {r.action_destination.action_type || "APPLY"}
                            </span>
                            <span className="font-semibold text-[#0F172A] truncate" title={r.action_destination.portal_name}>
                              {r.action_destination.portal_name}
                            </span>
                          </div>
                        ) : r.portal_url ? (
                          <span className="text-[11px] text-[#64748B] truncate block" title={r.portal_url}>
                            Authority Portal
                          </span>
                        ) : (
                          <span className="text-[11px] text-[#94A3B8]">—</span>
                        )}
                      </td>

                      {/* Evidence Count */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        {r.evidence_count > 0 ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>{r.evidence_count} source{r.evidence_count > 1 ? "s" : ""}</span>
                          </span>
                        ) : (
                          <span className="text-[11px] text-[#94A3B8]">0 records</span>
                        )}
                      </td>

                      {/* Scrutiny Detail Trigger */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedRequirement(r);
                          }}
                          className="px-2.5 py-1 rounded-[8px] border border-[#E2E8F0] hover:border-[#18181B] bg-white text-xs font-semibold text-[#0F172A] shadow-2xs group-hover:bg-[#18181B] group-hover:text-white transition-all cursor-pointer inline-flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Scrutiny</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Scrutiny Detail Drawer */}
      {selectedRequirement && (
        <AdminScrutinyDrawer
          item={selectedRequirement}
          businessId={data.business.id}
          onClose={() => setSelectedRequirement(null)}
          onDispositionUpdated={() => {
            onRefresh();
          }}
        />
      )}
    </div>
  );
}

export default AdminComplianceScrutinyTab;
