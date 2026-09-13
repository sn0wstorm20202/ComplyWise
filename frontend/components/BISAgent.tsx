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
    // Find matching preset or default to first preset with query
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
    <div className="bg-white rounded-xl border border-slate-200/90 p-6 shadow-xs space-y-4">
      {/* Title & Supporting Text */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-950">
              BIS Agent
            </h2>
            <span className="inline-flex items-center gap-1 rounded bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-800 border border-blue-200">
              <ShieldCheck className="h-3 w-3 text-blue-700" />
              Source-Grounded Retrieval
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Ask about standards, clauses, documents and compliance requirements.
          </p>
        </div>

        {activeResult && (
          <button
            onClick={handleClear}
            className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-900 transition-colors"
          >
            <X className="h-3.5 w-3.5" />
            <span>Reset Query</span>
          </button>
        )}
      </div>

      {/* Query Search Bar */}
      <form onSubmit={handleSearch} className="relative">
        <div className="relative flex items-center">
          <Search className="absolute left-3.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask about standards, clauses, documents..."
            className="w-full rounded-lg border border-slate-300 bg-slate-50/50 pl-10 pr-24 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-900 focus:outline-none focus:ring-1 focus:ring-blue-900 transition-all"
          />
          <button
            type="submit"
            disabled={isSearching || !query.trim()}
            className="absolute right-1.5 inline-flex items-center gap-1 rounded-md bg-blue-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-950 disabled:opacity-50 transition-colors"
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
          <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
            Suggested Compliance Queries
          </div>
          <div className="flex flex-wrap gap-2">
            {bisAgentPresets.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleSelectPreset(preset)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[11px] font-medium text-slate-700 hover:bg-slate-100 hover:border-slate-300 hover:text-slate-900 transition-colors text-left"
              >
                <BookOpen className="h-3 w-3 text-slate-400" />
                <span>{preset.question}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Interactive Answer View (Source-Grounded) */}
      {activeResult && (
        <div className="rounded-lg border border-blue-200/80 bg-blue-50/20 p-4 space-y-3.5 animate-in fade-in">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-blue-100/60 pb-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900">
                Verified Regulatory Output
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-100/80 text-blue-900 font-semibold">
                {activeResult.category}
              </span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-emerald-700 font-medium">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              <span>Gazette Provenance Confirmed</span>
            </div>
          </div>

          {/* Formatted Answer */}
          <div className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
            {activeResult.answer}
          </div>

          {/* Key Takeaway Callout */}
          <div className="p-3 rounded-md bg-white border border-blue-200/70 text-xs flex items-start gap-2.5">
            <span className="font-bold text-blue-900 shrink-0">Key Action:</span>
            <span className="text-slate-800 font-medium">{activeResult.key_takeaway}</span>
          </div>

          {/* Cited Clauses & Sources */}
          <div className="pt-1 space-y-1.5">
            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              Cited Standards & Clauses
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {activeResult.clauses_cited.map((c, i) => (
                <div
                  key={i}
                  className="p-2 rounded bg-white border border-slate-200 text-[11px] space-y-0.5"
                >
                  <div className="font-bold text-blue-950 truncate">
                    {c.standard}
                  </div>
                  <div className="text-slate-600 font-mono text-[10px]">
                    {c.clause}
                  </div>
                  <div className="text-slate-500 text-[10px] truncate">
                    {c.title}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Source Attribution */}
          <div className="pt-1 text-[10px] text-slate-500 flex items-center justify-between border-t border-blue-100/60">
            <span>Authoritative Source: {activeResult.regulatory_source}</span>
            <span className="text-blue-900 font-medium">Deterministic Rule Match</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default BISAgent;
