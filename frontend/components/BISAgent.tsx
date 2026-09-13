"use client";

import React, { useState } from "react";
import { Search, CornerDownLeft, BookOpen, X, Clock, ShieldAlert, Sparkles } from "lucide-react";
import { api } from "@/lib/api";
import { BisQueryResponse, AnswerabilityState } from "@/types";
import { AnswerabilityBadge } from "@/components/assistant/AnswerabilityBadge";
import { ClaimDecompositionCard } from "@/components/assistant/ClaimDecompositionCard";
import { EvidenceCitationCard } from "@/components/assistant/EvidenceCitationCard";
import { ServiceDegradedAlert } from "@/components/assistant/ServiceDegradedAlert";

interface BISAgentProps {
  businessId?: string | null;
  className?: string;
}

const SUGGESTED_QUERIES = [
  "What is the applicable standard for smart electric meters?",
  "What are the mandatory testing requirements under IS 1293?",
  "Is ISI mark mandatory for solar PV modules?",
  "What are the factory inspection prerequisites for Scheme-I certification?",
];

export function BISAgent({ businessId, className = "" }: BISAgentProps) {
  const [query, setQuery] = useState("");
  const [activeResult, setActiveResult] = useState<BisQueryResponse | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  async function executeSearch(searchQuery: string) {
    const trimmed = searchQuery.trim();
    if (!trimmed) return;

    setIsSearching(true);
    setErrorNotice(null);

    try {
      // Fetch real BIS regulatory intelligence from ComplyWise backend
      const resolvedBizId = businessId || (typeof window !== "undefined" ? localStorage.getItem("complywise_active_business_id") : null);
      const res = await api.standards.bisQuery(trimmed, resolvedBizId);
      setActiveResult(res);
    } catch (err: any) {
      // Never synthesize fake standards or verified marks on failure
      const degradedResp: BisQueryResponse = {
        version: "2.0",
        query: trimmed,
        answerability: "SERVICE_UNAVAILABLE" as AnswerabilityState,
        decision: "BIS intelligence engine unreachable. Zero unverified claims emitted.",
        verification_required: true,
        verification_reason: "Service disconnected or circuit breaker open.",
        answer: "The specialized BIS regulatory intelligence engine is temporarily offline or unreachable. No unverified compliance claims can be displayed.",
        claims: [],
        citations: [],
        candidate_standards: [],
      };
      setActiveResult(degradedResp);
      setErrorNotice(err?.message || "Failed to reach BIS intelligence service.");
    } finally {
      setIsSearching(false);
    }
  }

  function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    executeSearch(query);
  }

  function handleSelectPreset(presetQuery: string) {
    setQuery(presetQuery);
    executeSearch(presetQuery);
  }

  function handleClear() {
    setQuery("");
    setActiveResult(null);
    setErrorNotice(null);
  }

  return (
    <div className={`bg-white rounded-xl border border-slate-200/90 p-6 shadow-xs space-y-4 ${className}`}>
      {/* Title & Supporting Text */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-950">
              BIS Intelligence Engine
            </h2>
            <span className="inline-flex items-center gap-1 rounded bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-800 border border-blue-200">
              <Sparkles className="h-3 w-3 text-blue-700" />
              Evidence-Grounded Retrieval
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Query verified Indian Standards (IS), compulsory schemes, testing parameters, and gazette orders.
          </p>
        </div>

        {activeResult && (
          <button
            type="button"
            onClick={handleClear}
            className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-900 transition-colors"
          >
            <X className="h-3.5 w-3.5" />
            <span>Reset Query</span>
          </button>
        )}
      </div>

      {/* Query Search Bar */}
      <form onSubmit={handleFormSubmit} className="relative">
        <div className="relative flex items-center">
          <Search className="absolute left-3.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask about standards (e.g., IS 16444), clauses, or product conformity..."
            className="w-full rounded-lg border border-slate-300 bg-slate-50/50 pl-10 pr-28 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-900 focus:outline-none focus:ring-1 focus:ring-blue-900 transition-all"
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
                <span>Query BIS</span>
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
            Authoritative Standards Queries
          </div>
          <div className="flex flex-wrap gap-2">
            {SUGGESTED_QUERIES.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectPreset(preset)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[11px] font-medium text-slate-700 hover:bg-slate-100 hover:border-slate-300 hover:text-slate-900 transition-colors text-left"
              >
                <BookOpen className="h-3 w-3 text-slate-400" />
                <span>{preset}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Service Degraded State */}
      {activeResult &&
        (activeResult.answerability === "SERVICE_UNAVAILABLE" ||
          activeResult.answerability === "SYSTEM_FAILURE") && (
          <ServiceDegradedAlert
            message={activeResult.answer}
            correlationId={activeResult.correlation_id}
            onRetry={() => executeSearch(query)}
          />
        )}

      {/* Verified Regulatory Output */}
      {activeResult &&
        activeResult.answerability !== "SERVICE_UNAVAILABLE" &&
        activeResult.answerability !== "SYSTEM_FAILURE" && (
          <div className="rounded-xl border border-slate-200 bg-slate-50/40 p-4 space-y-4 animate-in fade-in">
            {/* Header: Answerability State & Decision */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-3">
              <div className="flex items-center gap-2">
                <AnswerabilityBadge
                  state={activeResult.answerability}
                  decision={activeResult.decision}
                />
                {activeResult.verification_required && (
                  <span className="inline-flex items-center gap-1 rounded bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-900">
                    <ShieldAlert className="h-3 w-3 text-amber-700" />
                    Portal Verification Advised
                  </span>
                )}
              </div>

              {activeResult.temporal && (
                <div className="flex items-center gap-1 text-[11px] text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                  <Clock className="h-3 w-3 text-slate-400" />
                  <span className="font-medium">
                    Status: {activeResult.temporal.status || "CURRENT"}
                  </span>
                </div>
              )}
            </div>

            {/* Answer Content */}
            <div className="bg-white rounded-lg border border-slate-200/90 p-4 text-xs text-slate-800 leading-relaxed whitespace-pre-line shadow-2xs">
              {activeResult.answer}
            </div>

            {/* Verification Reason Callout if applicable */}
            {activeResult.verification_reason && (
              <div className="p-3 rounded-md bg-amber-50 border border-amber-200 text-xs flex items-start gap-2.5">
                <ShieldAlert className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
                <div className="text-amber-900 space-y-0.5">
                  <span className="font-bold">Verification Note: </span>
                  <span>{activeResult.verification_reason}</span>
                </div>
              </div>
            )}

            {/* Atomic Claims Decomposition */}
            {activeResult.claims && activeResult.claims.length > 0 && (
              <ClaimDecompositionCard claims={activeResult.claims} />
            )}

            {/* Regulatory Citations & Excerpts */}
            {activeResult.citations && activeResult.citations.length > 0 && (
              <EvidenceCitationCard citations={activeResult.citations} />
            )}

            {/* Metadata Footer */}
            <div className="pt-2 text-[10px] text-slate-400 flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-t border-slate-200/60">
              <span>
                Engine Contract: v{activeResult.version || "2.0"} &bull; Grounded Retrieval
              </span>
              {activeResult.correlation_id && (
                <span className="font-mono">Trace ID: {activeResult.correlation_id}</span>
              )}
            </div>
          </div>
        )}
    </div>
  );
}

export default BISAgent;
