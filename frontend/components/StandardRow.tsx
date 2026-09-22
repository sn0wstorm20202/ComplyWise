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
    <div className="rounded-2xl border border-[#E2E8F0] dark:border-white/10 bg-white dark:bg-[#0D1117] hover:border-[#CBD5E1] dark:hover:border-white/20 hover:shadow-sm dark:hover:shadow-none transition-all p-5 space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
        <div className="space-y-1.5 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs font-bold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/15 px-2.5 py-0.5 rounded-full border border-blue-200 dark:border-blue-500/30">
              {standard.code}
            </span>
            <span className="text-xs text-[#64748B] dark:text-[#94A3B8] font-medium">
              {standard.authority}
            </span>
            <span className="text-[#CBD5E1] dark:text-white/20">·</span>
            <span className="text-[11px] font-medium text-[#64748B] dark:text-[#94A3B8]">
              {standard.scheme}
            </span>
          </div>

          <h3 className="text-sm font-bold text-[#0F172A] dark:text-[#F8FAFC] leading-snug">
            {standard.title}
          </h3>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold border ${
              standard.is_mandatory
                ? "bg-rose-50 dark:bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/30"
                : "bg-[#F8FAFC] dark:bg-white/5 text-[#475569] dark:text-[#94A3B8] border-[#E2E8F0] dark:border-white/10"
            }`}
          >
            {standard.is_mandatory ? (
              <>
                <ShieldAlert className="h-3 w-3 text-rose-600 dark:text-rose-400" />
                <span>Mandatory QCO</span>
              </>
            ) : (
              <span>Voluntary Standard</span>
            )}
          </span>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowParameters(!showParameters);
            }}
            className="text-[#94A3B8] dark:text-[#64748B] hover:text-[#475569] dark:hover:text-[#94A3B8] p-1 rounded-full hover:bg-[#F8FAFC] dark:hover:bg-white/5 transition-colors"
          >
            {showParameters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {standard.qco_order && (
        <div className="text-[11px] text-[#64748B] dark:text-[#94A3B8] bg-[#F8FAFC] dark:bg-white/5 p-2.5 rounded-xl border border-[#E2E8F0] dark:border-white/10 flex items-center justify-between">
          <span className="font-semibold text-[#475569] dark:text-[#CBD5E1]">Enforcing Order:</span>
          <span className="font-mono text-[#0F172A] dark:text-[#F8FAFC] truncate max-w-md">{standard.qco_order}</span>
        </div>
      )}

      {/* Clauses Metric Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#64748B] dark:text-[#94A3B8] pt-2 border-t border-[#F1F5F9] dark:border-white/5">
        <div className="flex items-center gap-1.5 font-medium">
          <Layers className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
          <span>
            {standard.applicable_clauses} of {standard.total_clauses} clauses applicable to your profile
          </span>
        </div>

        <div className="flex items-center gap-2">
          {onExploreClauses && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onExploreClauses(standard);
              }}
              className="text-xs font-semibold text-blue-700 dark:text-blue-400 hover:underline"
            >
              Explore Clauses →
            </button>
          )}
        </div>
      </div>

      {/* Collapsible Key Testing Parameters */}
      {showParameters && (
        <div className="pt-2 border-t border-[#F1F5F9] dark:border-white/5 space-y-2">
          <div className="text-[10px] font-semibold text-[#94A3B8] dark:text-[#64748B] uppercase tracking-wider">
            Mandatory Testing Parameters
          </div>
          <div className="flex flex-wrap gap-1.5">
            {standard.testing_parameters.map((param, i) => (
              <span
                key={i}
                className="text-[11px] bg-[#F1F5F9] dark:bg-white/5 text-[#475569] dark:text-[#CBD5E1] px-2.5 py-1 rounded-full border border-[#E2E8F0] dark:border-white/10 font-medium"
              >
                {param}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default StandardRow;
