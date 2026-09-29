"use client";

import React, { useState, useMemo } from "react";
import {
  Award,
  Search,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  FileText,
  Building,
  CheckCircle2,
  Clock,
  FlaskConical,
  HelpCircle,
  ArrowUpRight,
} from "lucide-react";
import type { AdminScrutinyData } from "@/types";

interface AdminStandardsTabProps {
  data: AdminScrutinyData;
}

export function AdminStandardsTab({ data }: AdminStandardsTabProps) {
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<"ALL" | "MANDATORY" | "VOLUNTARY">("ALL");

  const standards = data.standards || [];

  const filteredStandards = useMemo(() => {
    return standards.filter((std) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !search ||
        (std.standard_code && std.standard_code.toLowerCase().includes(q)) ||
        (std.title && std.title.toLowerCase().includes(q)) ||
        (std.authority && std.authority.toLowerCase().includes(q)) ||
        (std.nature && std.nature.toLowerCase().includes(q));

      if (!matchesSearch) return false;

      const isMandatory = std.is_mandatory || std.mandatory_status === "MANDATORY";
      if (filterType === "MANDATORY") return isMandatory;
      if (filterType === "VOLUNTARY") return !isMandatory;
      return true;
    });
  }, [standards, search, filterType]);

  const mandatoryCount = standards.filter(
    (s) => s.is_mandatory || s.mandatory_status === "MANDATORY"
  ).length;
  const voluntaryCount = standards.length - mandatoryCount;

  return (
    <div className="space-y-6">
      {/* Top Banner / Summary */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                <Award className="w-3 h-3 mr-1" />
                Standards &amp; Quality Control Orders
              </span>
              <span className="text-xs text-slate-500 font-mono">
                {standards.length} Discovered Specifications
              </span>
            </div>
            <h2 className="text-xl font-bold text-[#0F172A]">
              Indian Standards (IS) &amp; Technical Mandates
            </h2>
            <p className="text-sm text-slate-600 mt-1 max-w-3xl">
              Applicable product specifications, BIS Quality Control Orders (QCOs), and testing
              protocols derived from product activities and manufacturing classifications.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-center">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Total Found
              </div>
              <div className="text-lg font-bold text-[#0F172A]">{standards.length}</div>
            </div>
            <div className="px-4 py-2.5 bg-rose-50 border border-rose-200 rounded-xl text-center">
              <div className="text-xs font-semibold text-rose-700 uppercase tracking-wider">
                Mandatory QCOs
              </div>
              <div className="text-lg font-bold text-rose-700">{mandatoryCount}</div>
            </div>
            <div className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-center">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Voluntary / Tech
              </div>
              <div className="text-lg font-bold text-[#0F172A]">{voluntaryCount}</div>
            </div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by IS code, title, ministry..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-[#18181B] rounded-xl text-sm transition-all focus:outline-none focus:ring-1 focus:ring-[#18181B]"
            />
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <button
              onClick={() => setFilterType("ALL")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                filterType === "ALL"
                  ? "bg-[#18181B] text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              All Specifications ({standards.length})
            </button>
            <button
              onClick={() => setFilterType("MANDATORY")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                filterType === "MANDATORY"
                  ? "bg-rose-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Mandatory QCOs ({mandatoryCount})
            </button>
            <button
              onClick={() => setFilterType("VOLUNTARY")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                filterType === "VOLUNTARY"
                  ? "bg-[#18181B] text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Voluntary ({voluntaryCount})
            </button>
          </div>
        </div>
      </div>

      {/* Standards List */}
      {filteredStandards.length === 0 ? (
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-12 text-center shadow-sm">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
            <Award className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-[#0F172A]">No Standards Discovered</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
            {search
              ? "No standard matches your search query. Try modifying your search term."
              : "No mandatory Quality Control Orders or specific Indian Standards are currently indexed for this product activity."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredStandards.map((std, idx) => {
            const isMandatory = std.is_mandatory || std.mandatory_status === "MANDATORY";
            const isNeedsVerification =
              std.verification_status === "NEEDS_VERIFICATION" ||
              std.mandatory_status === "NEEDS_VERIFICATION";

            return (
              <div
                key={std.standard_code || idx}
                className="bg-white border border-[#E2E8F0] hover:border-slate-300 rounded-2xl p-5 shadow-sm transition-all"
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  {/* Left Column: Standard Details */}
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold px-2.5 py-1 rounded bg-[#0F172A] text-white">
                        {std.standard_code}
                      </span>

                      {isMandatory ? (
                        <span className="inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          Mandatory QCO
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Voluntary / Technical
                        </span>
                      )}

                      {isNeedsVerification && (
                        <span className="inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                          <Clock className="w-3 h-3 mr-1" />
                          Notification Verification Required
                        </span>
                      )}

                      {std.nature && (
                        <span className="text-xs text-slate-500 font-medium px-2 py-0.5 rounded bg-slate-100">
                          {std.nature}
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-bold text-[#0F172A] leading-snug">
                      {std.title}
                    </h3>

                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Building className="w-3.5 h-3.5" />
                      <span>Authority: {std.authority || "Bureau of Indian Standards (BIS)"}</span>
                    </div>

                    {/* Why It Matters */}
                    {std.why_it_matters && (
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-700">
                        <span className="font-semibold text-slate-900">Applicability Basis: </span>
                        {std.why_it_matters}
                      </div>
                    )}

                    {/* Testing Requirements */}
                    {std.testing_requirements && (
                      <div className="text-xs text-slate-600 flex items-start gap-2 pt-1">
                        <FlaskConical className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-semibold text-slate-800">Testing &amp; Compliance: </span>
                          {std.testing_requirements}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Actions / Link */}
                  <div className="flex md:flex-col items-center md:items-end justify-between md:justify-center gap-2 shrink-0 md:min-w-[160px] pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
                    {std.source_url ? (
                      <a
                        href={std.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#18181B] text-white hover:bg-[#27272A] transition-colors shadow-sm"
                      >
                        <span>BIS Official Portal</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </a>
                    ) : (
                      <span className="text-xs text-slate-400">National Standard</span>
                    )}

                    {std.next_step && (
                      <p className="text-[11px] text-slate-500 text-right max-w-[200px] line-clamp-2">
                        {std.next_step}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
