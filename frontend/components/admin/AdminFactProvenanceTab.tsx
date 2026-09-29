"use client";

import React, { useState, useMemo } from "react";
import {
  Database,
  Search,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Sparkles,
  User,
  Cpu,
  History,
  ShieldCheck,
  FileText,
  Clock,
  ArrowRight,
} from "lucide-react";
import type { AdminScrutinyData, AdminScrutinyFactProvenanceItem } from "@/types";

interface AdminFactProvenanceTabProps {
  data: AdminScrutinyData;
}

export function AdminFactProvenanceTab({ data }: AdminFactProvenanceTabProps) {
  const [search, setSearch] = useState("");
  const [originFilter, setOriginFilter] = useState<string>("ALL");

  const facts: AdminScrutinyFactProvenanceItem[] = data.profile.answered_variables || [];
  const history = data.profile_history || [];

  const filteredFacts = useMemo(() => {
    return facts.filter((f) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !search ||
        f.key.toLowerCase().includes(q) ||
        f.label.toLowerCase().includes(q) ||
        String(f.value).toLowerCase().includes(q) ||
        (f.source_excerpt && f.source_excerpt.toLowerCase().includes(q));

      if (!matchesSearch) return false;

      if (originFilter !== "ALL") {
        return f.origin.toUpperCase() === originFilter;
      }
      return true;
    });
  }, [facts, search, originFilter]);

  const userTypedCount = facts.filter((f) => f.origin === "USER_TYPED").length;
  const llmExtractedCount = facts.filter((f) => f.origin === "LLM_EXTRACTED").length;
  const derivedCount = facts.filter((f) => f.origin === "DERIVED").length;
  const overrideCount = facts.filter((f) => f.origin === "ADMIN_OVERRIDE").length;

  return (
    <div className="space-y-6">
      {/* Top Banner / Summary */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                <Database className="w-3 h-3 mr-1" />
                Deterministic Fact Provenance
              </span>
              <span className="text-xs text-slate-500 font-mono">
                Profile v{data.profile.version_number} • {facts.length} Canonical Variables
              </span>
            </div>
            <h2 className="text-xl font-bold text-[#0F172A]">
              Input Variables &amp; Source Attribution Audit
            </h2>
            <p className="text-sm text-slate-600 mt-1 max-w-3xl">
              Inspect origin attribution, LLM confidence scores, and source excerpts for every fact
              consumed by the Engine 2 rules evaluation engine.
            </p>
          </div>

          <div className="flex items-center gap-2.5 overflow-x-auto">
            <div className="px-3.5 py-2 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
              <div className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">
                User Typed
              </div>
              <div className="text-lg font-bold text-emerald-700">{userTypedCount}</div>
            </div>
            <div className="px-3.5 py-2 bg-indigo-50 border border-indigo-200 rounded-xl text-center">
              <div className="text-[11px] font-semibold text-indigo-700 uppercase tracking-wider">
                LLM Extracted
              </div>
              <div className="text-lg font-bold text-indigo-700">{llmExtractedCount}</div>
            </div>
            <div className="px-3.5 py-2 bg-purple-50 border border-purple-200 rounded-xl text-center">
              <div className="text-[11px] font-semibold text-purple-700 uppercase tracking-wider">
                Derived
              </div>
              <div className="text-lg font-bold text-purple-700">{derivedCount}</div>
            </div>
            {overrideCount > 0 && (
              <div className="px-3.5 py-2 bg-amber-50 border border-amber-200 rounded-xl text-center">
                <div className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider">
                  Admin Overridden
                </div>
                <div className="text-lg font-bold text-amber-700">{overrideCount}</div>
              </div>
            )}
          </div>
        </div>

        {/* Filter Controls */}
        <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by variable key, label, value..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-[#18181B] rounded-xl text-sm transition-all focus:outline-none focus:ring-1 focus:ring-[#18181B]"
            />
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
            <button
              onClick={() => setOriginFilter("ALL")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                originFilter === "ALL"
                  ? "bg-[#18181B] text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              All Origins ({facts.length})
            </button>
            <button
              onClick={() => setOriginFilter("USER_TYPED")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                originFilter === "USER_TYPED"
                  ? "bg-[#18181B] text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              User Typed ({userTypedCount})
            </button>
            <button
              onClick={() => setOriginFilter("LLM_EXTRACTED")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                originFilter === "LLM_EXTRACTED"
                  ? "bg-[#18181B] text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              LLM Extracted ({llmExtractedCount})
            </button>
            <button
              onClick={() => setOriginFilter("DERIVED")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                originFilter === "DERIVED"
                  ? "bg-[#18181B] text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Derived ({derivedCount})
            </button>
          </div>
        </div>
      </div>

      {/* Facts Table */}
      {filteredFacts.length === 0 ? (
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-12 text-center shadow-sm">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
            <Database className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-[#0F172A]">No Variables Found</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
            {search
              ? "No variable attributes match your search filter."
              : "No business profile variables recorded in this version."}
          </p>
        </div>
      ) : (
        <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/75 border-b border-[#E2E8F0] text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Variable Key / Label</th>
                  <th className="py-3.5 px-4">Evaluated Value</th>
                  <th className="py-3.5 px-4">Origin Attribution</th>
                  <th className="py-3.5 px-4">Confidence</th>
                  <th className="py-3.5 px-4">Verbatim Extraction Excerpt</th>
                  <th className="py-3.5 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0] text-xs">
                {filteredFacts.map((fact) => {
                  const isUser = fact.origin === "USER_TYPED";
                  const isLLM = fact.origin === "LLM_EXTRACTED";
                  const isDerived = fact.origin === "DERIVED";
                  const isOverride = fact.origin === "ADMIN_OVERRIDE";

                  const confPct =
                    fact.confidence !== null && fact.confidence !== undefined
                      ? Math.round(fact.confidence * 100)
                      : null;

                  return (
                    <tr key={fact.key} className="hover:bg-slate-50/50 transition-colors">
                      {/* Key & Label */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-[#0F172A]">{fact.label}</div>
                        <div className="font-mono text-[11px] text-slate-500 mt-0.5">
                          {fact.key}
                        </div>
                      </td>

                      {/* Evaluated Value */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                            {typeof fact.value === "boolean"
                              ? fact.value
                                ? "TRUE"
                                : "FALSE"
                              : Array.isArray(fact.value)
                              ? fact.value.join(", ")
                              : String(fact.value ?? "null")}
                          </span>
                          {fact.unit && (
                            <span className="text-[11px] text-slate-500">{fact.unit}</span>
                          )}
                        </div>
                      </td>

                      {/* Origin Attribution */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {isUser && (
                          <span className="inline-flex items-center text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            <User className="w-3 h-3 mr-1" />
                            User Direct Input
                          </span>
                        )}
                        {isLLM && (
                          <span className="inline-flex items-center text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                            <Sparkles className="w-3 h-3 mr-1" />
                            LLM Extracted
                          </span>
                        )}
                        {isDerived && (
                          <span className="inline-flex items-center text-[11px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                            <Cpu className="w-3 h-3 mr-1" />
                            Deterministic Rule
                          </span>
                        )}
                        {isOverride && (
                          <span className="inline-flex items-center text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                            <ShieldCheck className="w-3 h-3 mr-1" />
                            Officer Override
                          </span>
                        )}
                        {!isUser && !isLLM && !isDerived && !isOverride && (
                          <span className="text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                            {fact.origin}
                          </span>
                        )}
                      </td>

                      {/* Confidence */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {confPct !== null ? (
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  confPct >= 90
                                    ? "bg-emerald-500"
                                    : confPct >= 70
                                    ? "bg-blue-500"
                                    : "bg-amber-500"
                                }`}
                                style={{ width: `${confPct}%` }}
                              />
                            </div>
                            <span className="font-mono text-xs font-semibold text-slate-700">
                              {confPct}%
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 font-mono text-[11px]">100% (Rule)</span>
                        )}
                      </td>

                      {/* Source Excerpt */}
                      <td className="py-3.5 px-4 max-w-sm">
                        {fact.source_excerpt ? (
                          <p className="text-[11px] text-slate-600 italic line-clamp-2 bg-slate-50 p-1.5 rounded border border-slate-100">
                            &quot;{fact.source_excerpt}&quot;
                          </p>
                        ) : (
                          <span className="text-slate-400 text-[11px]">—</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        {fact.is_confirmed ? (
                          <span className="inline-flex items-center text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                            Unconfirmed
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Snapshot Version History */}
      {history.length > 0 && (
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-slate-500" />
            <h3 className="text-sm font-bold text-[#0F172A] uppercase tracking-wider">
              Profile Version Audit Snapshots
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {history.map((hist) => {
              const isCurrent = hist.version === data.profile.version_number;

              return (
                <div
                  key={hist.id}
                  className={`p-4 rounded-xl border text-xs space-y-1.5 transition-all ${
                    isCurrent
                      ? "bg-slate-50 border-[#18181B] ring-1 ring-[#18181B]"
                      : "bg-white border-[#E2E8F0]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">Version {hist.version}</span>
                    {isCurrent && (
                      <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200">
                        Active Evaluation
                      </span>
                    )}
                  </div>
                  <p className="text-slate-600 line-clamp-1">{hist.change_note}</p>
                  <div className="flex items-center justify-between text-slate-400 pt-1 border-t border-slate-100 text-[11px]">
                    <span>{hist.variables_count} variables</span>
                    <span>
                      {hist.created_at ? new Date(hist.created_at).toLocaleDateString() : ""}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
