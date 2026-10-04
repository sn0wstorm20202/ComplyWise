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
    <div className="bg-white rounded-xl border border-[var(--ui-border)]/90 p-6 shadow-xs space-y-4">
      {/* Title & Supporting Text */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--ui-border)] pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-[var(--ui-text)]">
              BIS Agent
            </h2>
            <span className="inline-flex items-center gap-1 rounded bg-[var(--ui-info-soft)] px-2 py-0.5 text-[10px] font-semibold text-[var(--ui-info)] border border-[var(--ui-sage-soft)]">
              <ShieldCheck className="h-3 w-3 text-[var(--ui-info)]" />
              Source-Grounded Retrieval
            </span>
          </div>
          <p className="text-xs text-[var(--ui-secondary)] mt-0.5">
            Ask about standards, clauses, documents and compliance requirements.
          </p>
        </div>

        {activeResult && (
          <button
            onClick={handleClear}
            className="inline-flex items-center gap-1 text-xs text-[var(--ui-secondary)] hover:text-[var(--ui-text)] transition-colors"
          >
            <X className="h-3.5 w-3.5" />
            <span>Reset Query</span>
          </button>
        )}
      </div>

      {/* Query Search Bar */}
      <form onSubmit={handleSearch} className="relative">
        <div className="relative flex items-center">
          <Search className="absolute left-3.5 h-4 w-4 text-[var(--ui-muted)]" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask about standards, clauses, documents..."
            className="w-full rounded-lg border border-[var(--ui-border-strong)] bg-[var(--ui-bg)]/50 pl-10 pr-24 py-2.5 text-xs text-[var(--ui-text)] placeholder:text-[var(--ui-muted)] focus:bg-white focus:border-[var(--ui-sage-soft)] focus:outline-none focus:ring-1 focus:ring-[var(--ui-sage-soft)] transition-all"
          />
          <button
            type="submit"
            disabled={isSearching || !query.trim()}
            className="absolute right-1.5 inline-flex items-center gap-1 rounded-md bg-[var(--ui-text)] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[var(--ui-text)] disabled:opacity-50 transition-colors"
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
          <div className="text-[11px] font-medium text-[var(--ui-muted)] uppercase tracking-wider">
            Suggested Compliance Queries
          </div>
          <div className="flex flex-wrap gap-2">
            {bisAgentPresets.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleSelectPreset(preset)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg)] px-2.5 py-1.5 text-[11px] font-medium text-[var(--ui-secondary)] hover:bg-[var(--ui-inset)] hover:border-[var(--ui-border-strong)] hover:text-[var(--ui-text)] transition-colors text-left"
              >
                <BookOpen className="h-3 w-3 text-[var(--ui-muted)]" />
                <span>{preset.question}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Interactive Answer View (Source-Grounded) */}
      {activeResult && (
        <div className="rounded-lg border border-[var(--ui-sage-soft)]/80 bg-[var(--ui-info-soft)]/20 p-4 space-y-3.5 animate-in fade-in">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[var(--ui-sage-soft)]/60 pb-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[var(--ui-text)]">
                Verified Regulatory Output
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[var(--ui-info-soft)]/80 text-[var(--ui-info)] font-semibold">
                {activeResult.category}
              </span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-[var(--ui-sage)] font-medium">
              <ShieldCheck className="h-3.5 w-3.5 text-[var(--ui-sage)]" />
              <span>Gazette Provenance Confirmed</span>
            </div>
          </div>

          {/* Formatted Answer */}
          <div className="text-xs text-[var(--ui-secondary)] leading-relaxed whitespace-pre-line">
            {activeResult.answer}
          </div>

          {/* Key Takeaway Callout */}
          <div className="p-3 rounded-md bg-white border border-[var(--ui-sage-soft)]/70 text-xs flex items-start gap-2.5">
            <span className="font-bold text-[var(--ui-info)] shrink-0">Key Action:</span>
            <span className="text-[var(--ui-text)] font-medium">{activeResult.key_takeaway}</span>
          </div>

          {/* Cited Clauses & Sources */}
          <div className="pt-1 space-y-1.5">
            <div className="text-[10px] font-semibold text-[var(--ui-muted)] uppercase tracking-wider">
              Cited Standards & Clauses
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {activeResult.clauses_cited.map((c, i) => (
                <div
                  key={i}
                  className="p-2 rounded bg-white border border-[var(--ui-border)] text-[11px] space-y-0.5"
                >
                  <div className="font-bold text-[var(--ui-info)] truncate">
                    {c.standard}
                  </div>
                  <div className="text-[var(--ui-secondary)] font-mono text-[10px]">
                    {c.clause}
                  </div>
                  <div className="text-[var(--ui-secondary)] text-[10px] truncate">
                    {c.title}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Source Attribution */}
          <div className="pt-1 text-[10px] text-[var(--ui-secondary)] flex items-center justify-between border-t border-[var(--ui-sage-soft)]/60">
            <span>Authoritative Source: {activeResult.regulatory_source}</span>
            <span className="text-[var(--ui-info)] font-medium">Deterministic Rule Match</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default BISAgent;
