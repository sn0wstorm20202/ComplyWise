"use client";

import React, { useState } from "react";
import { BookOpen, ShieldAlert, ShieldCheck, ChevronDown, ChevronUp, Layers, ExternalLink } from "lucide-react";
import { StandardItem } from "@/lib/mockData";

interface StandardRowProps {
  standard: StandardItem;
  onExploreClauses?: (std: StandardItem) => void;
}

export function StandardRow({ standard, onExploreClauses }: StandardRowProps) {
  const [showParameters, setShowParameters] = useState(false);

  return (
    <div className="rounded-lg border border-slate-200/80 bg-slate-50/40 hover:bg-white hover:border-slate-300 hover:shadow-xs transition-all p-4 space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
        <div className="space-y-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
              {standard.code}
            </span>
            <span className="text-xs text-slate-500 font-medium">
              {standard.authority}
            </span>
            <span className="text-slate-300">·</span>
            <span className="text-[11px] font-medium text-slate-600">
              {standard.scheme}
            </span>
          </div>

          <h3 className="text-xs font-bold text-slate-950 leading-snug">
            {standard.title}
          </h3>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span
            className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${
              standard.is_mandatory
                ? "bg-rose-50 text-rose-800 border-rose-200"
                : "bg-slate-100 text-slate-700 border-slate-200"
            }`}
          >
            {standard.is_mandatory ? (
              <>
                <ShieldAlert className="h-3 w-3 text-rose-600" />
                <span>Mandatory QCO</span>
              </>
            ) : (
              <span>Voluntary Standard</span>
            )}
          </span>

          <button
            onClick={() => setShowParameters(!showParameters)}
            className="text-slate-400 hover:text-slate-700 p-1"
          >
            {showParameters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {standard.qco_order && (
        <div className="text-[11px] text-slate-600 bg-white p-2 rounded border border-slate-200/70 flex items-center justify-between">
          <span className="font-semibold text-slate-700">Enforcing Order:</span>
          <span className="font-mono text-slate-900 truncate max-w-md">{standard.qco_order}</span>
        </div>
      )}

      {/* Clauses Metric Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 pt-1 border-t border-slate-100">
        <div className="flex items-center gap-1.5 font-medium">
          <Layers className="h-3.5 w-3.5 text-blue-700" />
          <span>
            {standard.applicable_clauses} of {standard.total_clauses} clauses applicable to your profile
          </span>
        </div>

        <div className="flex items-center gap-2">
          {onExploreClauses && (
            <button
              onClick={() => onExploreClauses(standard)}
              className="text-xs font-semibold text-blue-900 hover:underline"
            >
              Explore Clauses →
            </button>
          )}
        </div>
      </div>

      {/* Collapsible Key Testing Parameters */}
      {showParameters && (
        <div className="pt-2 border-t border-slate-100 space-y-2">
          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            Mandatory Testing Parameters
          </div>
          <div className="flex flex-wrap gap-1.5">
            {standard.testing_parameters.map((param, i) => (
              <span
                key={i}
                className="text-[11px] bg-white border border-slate-200 text-slate-700 px-2 py-1 rounded"
              >
                {param}
              </span>
            ))}
          </div>
          <div className="text-[10px] text-slate-400">
            Latest Revision / Status: {standard.last_amendment}
          </div>
        </div>
      )}
    </div>
  );
}

export default StandardRow;
