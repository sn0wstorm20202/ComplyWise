"use client";

import React from "react";
import Link from "next/link";
import { Sparkles, ArrowRight, CornerDownLeft } from "lucide-react";

export interface BISAgentEntryProps {
  onOpenQuery?: (initialQuery?: string) => void;
  className?: string;
}

const SUGGESTED_QUERIES = [
  "What testing clauses apply under IS 1293:2019?",
  "Calculate MSME testing fee subsidy under Scheme-I",
  "Check mandatory QCO deadline for Electrical Switchgear",
];

export function BISAgentEntry({ onOpenQuery, className = "" }: BISAgentEntryProps) {
  return (
    <div className={`bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-950 text-white rounded-[28px] p-6 shadow-md relative overflow-hidden ${className}`}>
      {/* Ambient background decoration */}
      <div className="absolute -right-8 -bottom-8 w-44 h-44 rounded-full bg-indigo-500/10 blur-2xl pointer-events-none" />

      <div className="relative z-10 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-bold tracking-tight text-white">
                BIS Compliance Copilot
              </h3>
              <p className="text-xs text-slate-300">
                Grounded statutory intelligence & QCO guidance
              </p>
            </div>
          </div>

          <Link
            href="/ai-assistant"
            className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-300 hover:text-white transition-colors"
          >
            <span>Open Assistant</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {/* Input Bar */}
        <div
          onClick={() => onOpenQuery && onOpenQuery()}
          className="bg-white/10 hover:bg-white/15 border border-white/10 hover:border-white/20 rounded-2xl p-3 flex items-center justify-between gap-3 cursor-pointer transition-all"
        >
          <span className="text-xs text-slate-300 font-normal truncate">
            Ask any question on BIS mandates, standards, or audit forms...
          </span>
          <div className="flex items-center gap-1 text-[10px] font-mono text-slate-400 bg-white/10 px-2 py-0.5 rounded-md shrink-0">
            <span>Enter</span>
            <CornerDownLeft className="h-2.5 w-2.5" />
          </div>
        </div>

        {/* Suggested Prompts */}
        <div className="space-y-1.5 pt-1">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Suggested Inquiries
          </div>
          <div className="flex flex-wrap gap-2">
            {SUGGESTED_QUERIES.map((q, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => onOpenQuery && onOpenQuery(q)}
                className="text-left text-xs bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1.5 rounded-full text-slate-200 hover:text-white transition-colors cursor-pointer line-clamp-1"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default BISAgentEntry;
