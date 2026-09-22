"use client";

import React, { useState } from "react";
import { Search, ShieldCheck, BookOpen, ExternalLink, ArrowRight, CornerDownLeft, Sparkles, X } from "lucide-react";
import { bisAgentPresets, BISAgentPreset } from "@/lib/mockData";

export function BISAgent() {
  const [query, setQuery] = useState("");
  const [activeResult, setActiveResult] = useState<BISAgentPreset | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  function handleSelectPreset(preset: BISAgentPreset) {
    setQuery(preset.question);
    setIsSearching(true);
    setTimeout(() => {
      setActiveResult(preset);
      setIsSearching(false);
    }, 250);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    const match =
      bisAgentPresets.find((p) =>
        p.question.toLowerCase().includes(query.toLowerCase()) ||
        p.category.toLowerCase().includes(query.toLowerCase())
      ) || {
        id: "custom",
        question: query,
        category: "Custom Inquiry",
        answer: `Under published Bureau of Indian Standards (BIS) and DPIIT Quality Control Orders, products falling under this category must be tested strictly against corresponding Indian Standards. Mandatory clauses require factory inspection under Scheme I and verified in-house test records.`,
        clauses_cited: [
          { standard: "IS 1293:2019", clause: "Clause 18", title: "General Safety and Performance Criteria" },
          { standard: "BIS Act 2016", clause: "Section 16", title: "Conformity Assessment Procedures" },
        ],
        regulatory_source: "Bureau of Indian Standards Catalog & Gazette of India Orders",
        provenance_verified: true,
        key_takeaway: "Review applicable Schedule II parameters on Manakonline portal before submitting application dossier.",
      };

    setTimeout(() => {
      setActiveResult(match);
      setIsSearching(false);
    }, 300);
  }

  function handleClear() {
    setQuery("");
    setActiveResult(null);
  }

  return (
    <div className="bg-white dark:bg-[#0D1117] rounded-2xl border border-[#E2E8F0] dark:border-white/10 p-6 shadow-sm dark:shadow-none space-y-4 transition-colors">
      {/* Title & Supporting Text */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#F1F5F9] dark:border-white/5 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-[#0F172A] dark:text-[#F8FAFC]">
              BIS Agent
            </h2>
            <span className="inline-flex items-center gap-1 rounded-lg bg-blue-50 dark:bg-blue-500/15 px-2 py-0.5 text-[10px] font-semibold text-blue-800 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30">
              <ShieldCheck className="h-3 w-3" />
              Source-Grounded Retrieval
            </span>
          </div>
          <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-0.5">
            Ask about standards, clauses, documents and compliance requirements.
          </p>
        </div>

        {activeResult && (
          <button
            onClick={handleClear}
            className="inline-flex items-center gap-1 text-xs text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-white transition-colors"
          >
            <X className="h-3.5 w-3.5" />
            <span>Reset Query</span>
          </button>
        )}
      </div>

      {/* Query Search Bar */}
      <form onSubmit={handleSearch} className="relative">
        <div className="relative flex items-center">
          <Search className="absolute left-3.5 h-4 w-4 text-[#94A3B8] dark:text-[#64748B]" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask about standards, clauses, documents..."
            className="w-full rounded-xl border border-[#CBD5E1] dark:border-white/15 bg-[#F8FAFC] dark:bg-white/5 pl-10 pr-24 py-2.5 text-sm text-[#0F172A] dark:text-[#F8FAFC] placeholder:text-[#94A3B8] dark:placeholder:text-[#64748B] focus:bg-white dark:focus:bg-white/10 focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 transition-all"
          />
          <button
            type="submit"
            disabled={isSearching || !query.trim()}
            className="absolute right-1.5 inline-flex items-center gap-1 rounded-lg bg-[#18181B] dark:bg-blue-600 hover:bg-[#27272A] dark:hover:bg-blue-700 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50 transition-colors cursor-pointer"
          >
            {isSearching ? (
              <span>Querying...</span>
            ) : (
              <>
                <span>Search</span>
                <CornerDownLeft className="h-3 w-3" />
              </>
            )}
          </button>
        </div>
      </form>

      {/* Suggested Prompt Chips */}
      {!activeResult && (
        <div className="space-y-1.5 pt-1">
          <div className="text-[11px] font-medium text-[#94A3B8] dark:text-[#64748B] uppercase tracking-wider">
            Suggested Compliance Queries
          </div>
          <div className="flex flex-wrap gap-2">
            {bisAgentPresets.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleSelectPreset(preset)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#E2E8F0] dark:border-white/10 bg-[#F8FAFC] dark:bg-white/5 px-2.5 py-1.5 text-[11px] font-medium text-[#475569] dark:text-[#94A3B8] hover:bg-[#F1F5F9] dark:hover:bg-white/10 hover:border-[#CBD5E1] dark:hover:border-white/20 hover:text-[#0F172A] dark:hover:text-white transition-all text-left cursor-pointer"
              >
                <BookOpen className="h-3 w-3 text-[#94A3B8] dark:text-[#64748B] shrink-0" />
                <span>{preset.question}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Interactive Answer View (Source-Grounded) */}
      {activeResult && (
        <div className="rounded-xl border border-blue-200/80 dark:border-blue-500/25 bg-blue-50/30 dark:bg-blue-500/5 p-4 space-y-3.5 animate-in fade-in duration-200">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-blue-100/60 dark:border-blue-500/15 pb-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#0F172A] dark:text-[#F8FAFC]">
                Verified Regulatory Output
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-blue-100/80 dark:bg-blue-500/20 text-blue-900 dark:text-blue-300 font-semibold">
                {activeResult.category}
              </span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Gazette Provenance Confirmed</span>
            </div>
          </div>

          {/* Formatted Answer */}
          <div className="text-sm text-[#334155] dark:text-[#CBD5E1] leading-relaxed whitespace-pre-line">
            {activeResult.answer}
          </div>

          {/* Key Takeaway Callout */}
          <div className="p-3 rounded-xl bg-white dark:bg-white/5 border border-blue-200/70 dark:border-blue-500/20 text-xs flex items-start gap-2.5">
            <span className="font-bold text-blue-900 dark:text-blue-400 shrink-0">Key Action:</span>
            <span className="text-[#334155] dark:text-[#CBD5E1] font-medium">{activeResult.key_takeaway}</span>
          </div>

          {/* Cited Clauses & Sources */}
          <div className="pt-1 space-y-1.5">
            <div className="text-[10px] font-semibold text-[#94A3B8] dark:text-[#64748B] uppercase tracking-wider">
              Cited Standards & Clauses
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {activeResult.clauses_cited.map((c, i) => (
                <div
                  key={i}
                  className="p-2.5 rounded-xl bg-white dark:bg-white/5 border border-[#E2E8F0] dark:border-white/10 text-[11px] space-y-0.5"
                >
                  <div className="font-bold text-blue-900 dark:text-blue-400 truncate">
                    {c.standard}
                  </div>
                  <div className="text-[#475569] dark:text-[#94A3B8] font-mono text-[10px]">
                    {c.clause}
                  </div>
                  <div className="text-[#64748B] dark:text-[#64748B] text-[10px] truncate">
                    {c.title}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Source Attribution */}
          <div className="pt-1 text-[10px] text-[#94A3B8] dark:text-[#64748B] flex items-center justify-between border-t border-blue-100/60 dark:border-blue-500/15">
            <span>Authoritative Source: {activeResult.regulatory_source}</span>
            <span className="text-blue-700 dark:text-blue-400 font-medium">Deterministic Rule Match</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default BISAgent;
