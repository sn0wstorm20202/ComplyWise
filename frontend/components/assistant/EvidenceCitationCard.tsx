"use client";

import React, { useState } from "react";
import { BookOpen, ExternalLink, ShieldCheck, AlertCircle, ChevronDown, ChevronUp, FileText } from "lucide-react";
import { BisCitation } from "@/types";

interface EvidenceCitationCardProps {
  citations: BisCitation[];
  className?: string;
}

export function EvidenceCitationCard({ citations, className = "" }: EvidenceCitationCardProps) {
  const [expanded, setExpanded] = useState(true);

  if (!citations || citations.length === 0) {
    return null;
  }

  return (
    <div className={`rounded-lg border border-slate-200 bg-white shadow-xs overflow-hidden ${className}`}>
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 bg-slate-50/80 hover:bg-slate-100/80 border-b border-slate-200 transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-blue-900" />
          <span className="text-xs font-bold text-slate-900 tracking-wide uppercase">
            Regulatory Citations & Evidence ({citations.length})
          </span>
        </div>
        <div className="text-slate-400">
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
      </button>

      {expanded && (
        <div className="divide-y divide-slate-100 p-2 space-y-2">
          {citations.map((cit, idx) => (
            <div key={idx} className="p-3 rounded-md bg-slate-50/50 border border-slate-150 space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-blue-950 font-mono">
                    {cit.standard_number}
                    {cit.standard_year ? `:${cit.standard_year}` : ""}
                  </span>
                  {cit.clause_id && (
                    <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-900 text-[10px] font-mono font-semibold">
                      {cit.clause_id}
                    </span>
                  )}
                  {cit.table_id && (
                    <span className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-800 text-[10px] font-mono">
                      {cit.table_id}
                    </span>
                  )}
                  {cit.page_number && (
                    <span className="text-[10px] text-slate-500">
                      p. {cit.page_number}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {cit.verifiable ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                      <ShieldCheck className="h-3 w-3 text-emerald-600" />
                      <span>Verifiable</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                      <AlertCircle className="h-3 w-3 text-amber-600" />
                      <span>Unverified Citation</span>
                    </span>
                  )}
                  {cit.canonical_url && (
                    <a
                      href={cit.canonical_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-800 hover:text-blue-950 hover:underline"
                    >
                      <span>Official Source</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </div>

              {cit.excerpt && (
                <div className="p-2.5 rounded bg-white border border-slate-200/80 text-xs text-slate-700 font-sans italic leading-relaxed">
                  &ldquo;{cit.excerpt}&rdquo;
                </div>
              )}

              <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
                <span>Authority: {cit.authority || "Bureau of Indian Standards"}</span>
                {cit.source_hash && (
                  <span className="font-mono text-[9px] text-slate-400">
                    Hash: {cit.source_hash.slice(0, 8)}...
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default EvidenceCitationCard;
