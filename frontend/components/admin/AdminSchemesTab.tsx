"use client";

import React, { useState, useMemo } from "react";
import {
  Gift,
  Search,
  ExternalLink,
  ShieldCheck,
  Building,
  Info,
  MapPin,
  CheckCircle2,
  FileCheck,
  Tag,
  ArrowUpRight,
} from "lucide-react";
import type { AdminScrutinyData } from "@/types";

interface AdminSchemesTabProps {
  data: AdminScrutinyData;
}

export function AdminSchemesTab({ data }: AdminSchemesTabProps) {
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<"ALL" | "UNIVERSAL" | "SECTOR" | "STATE">("ALL");

  const schemes = data.schemes || [];

  const filteredSchemes = useMemo(() => {
    return schemes.filter((s) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !search ||
        (s.scheme_code && s.scheme_code.toLowerCase().includes(q)) ||
        (s.title && s.title.toLowerCase().includes(q)) ||
        (s.authority && s.authority.toLowerCase().includes(q)) ||
        (s.benefit_type && s.benefit_type.toLowerCase().includes(q));

      if (!matchesSearch) return false;

      if (filterType === "UNIVERSAL") return s.is_universal;
      if (filterType === "SECTOR") return !s.is_universal;
      if (filterType === "STATE") return s.is_state_specific;
      return true;
    });
  }, [schemes, search, filterType]);

  const universalCount = schemes.filter((s) => s.is_universal).length;
  const sectorCount = schemes.filter((s) => !s.is_universal).length;
  const stateCount = schemes.filter((s) => s.is_state_specific).length;

  return (
    <div className="space-y-6">
      {/* Top Banner / Summary */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <ShieldCheck className="w-3 h-3 mr-1" />
                Context-Matched Incentives
              </span>
              <span className="text-xs text-slate-500 font-mono">
                {schemes.length} Eligible Programs
              </span>
            </div>
            <h2 className="text-xl font-bold text-[#0F172A]">
              Subsidies, Grants & Statutory Schemes
            </h2>
            <p className="text-sm text-slate-600 mt-1 max-w-3xl">
              Incentives and institutional support programs matched to this business’s sector,
              operating scale, and location ({data.business.primary_state || "Central"}).
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-center">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Universal
              </div>
              <div className="text-lg font-bold text-[#0F172A]">{universalCount}</div>
            </div>
            <div className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-center">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Sector Specific
              </div>
              <div className="text-lg font-bold text-[#0F172A]">{sectorCount}</div>
            </div>
            <div className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-center">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                State Specific
              </div>
              <div className="text-lg font-bold text-[#0F172A]">{stateCount}</div>
            </div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by scheme, code, authority..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-[#18181B] rounded-xl text-sm transition-all focus:outline-none focus:ring-1 focus:ring-[#18181B]"
            />
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
            <button
              onClick={() => setFilterType("ALL")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                filterType === "ALL"
                  ? "bg-[#18181B] text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              All ({schemes.length})
            </button>
            <button
              onClick={() => setFilterType("UNIVERSAL")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                filterType === "UNIVERSAL"
                  ? "bg-[#18181B] text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Universal ({universalCount})
            </button>
            <button
              onClick={() => setFilterType("SECTOR")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                filterType === "SECTOR"
                  ? "bg-[#18181B] text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Sector Specific ({sectorCount})
            </button>
            <button
              onClick={() => setFilterType("STATE")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                filterType === "STATE"
                  ? "bg-[#18181B] text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              State Programs ({stateCount})
            </button>
          </div>
        </div>
      </div>

      {/* Schemes Grid */}
      {filteredSchemes.length === 0 ? (
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-12 text-center shadow-sm">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
            <Gift className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-[#0F172A]">No Matched Schemes Found</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
            {search
              ? "No scheme matches your current search criteria. Try a different term or clear the filter."
              : "No institutional incentive schemes are currently matched for this business profile."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredSchemes.map((scheme, idx) => {
            const isUniversal = scheme.is_universal;
            const isState = scheme.is_state_specific;
            const actionUrl = scheme.action_url || scheme.portal_url || scheme.source_url;

            return (
              <div
                key={scheme.scheme_code || idx}
                className="bg-white border border-[#E2E8F0] hover:border-slate-300 rounded-2xl p-5 shadow-sm transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                        {scheme.scheme_code}
                      </span>
                      {isUniversal ? (
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                          Universal Support
                        </span>
                      ) : (
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                          {scheme.sector_category || "Sector Specific"}
                        </span>
                      )}
                      {isState && (
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                          <MapPin className="w-2.5 h-2.5" />
                          State Level
                        </span>
                      )}
                    </div>
                    <span className="inline-flex items-center text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Eligible
                    </span>
                  </div>

                  {/* Title & Authority */}
                  <h3 className="text-base font-bold text-[#0F172A] leading-snug mb-1">
                    {scheme.title}
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-3">
                    <Building className="w-3.5 h-3.5" />
                    <span>{scheme.authority || "Government Agency"}</span>
                  </div>

                  {/* Benefit / Subsidy Details */}
                  {scheme.benefit_type && (
                    <div className="mb-3 p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                      <div className="font-semibold text-slate-700 mb-0.5 flex items-center gap-1">
                        <Tag className="w-3.5 h-3.5 text-slate-500" />
                        Benefit Structure: {scheme.benefit_type}
                      </div>
                      {scheme.subsidy_details && (
                        <div className="text-slate-600 line-clamp-2 mt-0.5">
                          {scheme.subsidy_details}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Relevance Rationale */}
                  {scheme.relevance_rationale && (
                    <div className="text-xs text-slate-600 mb-3 bg-amber-50/50 p-2.5 rounded-lg border border-amber-100 flex items-start gap-2">
                      <Info className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-slate-800">Match Basis: </span>
                        {scheme.relevance_rationale}
                      </div>
                    </div>
                  )}

                  {/* Evidence Snippet */}
                  {scheme.evidence_snippet && (
                    <div className="text-xs text-slate-500 italic mb-4 line-clamp-2 border-l-2 border-slate-300 pl-2">
                      &quot;{scheme.evidence_snippet}&quot;
                    </div>
                  )}
                </div>

                {/* Footer Action Links */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  {scheme.source_url ? (
                    <a
                      href={scheme.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-600 hover:text-[#0F172A] font-medium flex items-center gap-1"
                    >
                      <FileCheck className="w-3.5 h-3.5" />
                      Source Authority
                    </a>
                  ) : (
                    <span className="text-slate-400">Official Source</span>
                  )}

                  {actionUrl && (
                    <a
                      href={actionUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-semibold text-white bg-[#18181B] hover:bg-[#27272A] px-3 py-1.5 rounded-lg shadow-sm transition-colors"
                    >
                      <span>Apply on Portal</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
