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
    <div className="rounded-2xl border border-[var(--ui-border)]/70 bg-white hover:border-[var(--ui-border-strong)] hover:shadow-xs transition-all p-5 space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
        <div className="space-y-1.5 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs font-bold text-[var(--ui-info)] bg-[var(--ui-info-soft)] px-2.5 py-0.5 rounded-full border border-[var(--ui-sage-soft)]">
              {standard.code}
            </span>
            <span className="text-xs text-[var(--ui-secondary)] font-medium">
              {standard.authority}
            </span>
            <span className="text-[var(--ui-muted)]">·</span>
            <span className="text-[11px] font-medium text-[var(--ui-secondary)]">
              {standard.scheme}
            </span>
          </div>

          <h3 className="text-sm font-bold text-[var(--ui-text)] leading-snug">
            {standard.title}
          </h3>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold border ${
              standard.is_mandatory
                ? "bg-rose-50 text-rose-800 border-rose-200"
                : "bg-[var(--ui-inset)] text-[var(--ui-secondary)] border-[var(--ui-border)]"
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
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowParameters(!showParameters);
            }}
            className="text-[var(--ui-muted)] hover:text-[var(--ui-secondary)] p-1 rounded-full hover:bg-[var(--ui-inset)] transition-colors"
          >
            {showParameters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {standard.qco_order && (
        <div className="text-[11px] text-[var(--ui-secondary)] bg-[var(--ui-bg)] p-2.5 rounded-xl border border-[var(--ui-border)]/60 flex items-center justify-between">
          <span className="font-semibold text-[var(--ui-secondary)]">Enforcing Order:</span>
          <span className="font-mono text-[var(--ui-text)] truncate max-w-md">{standard.qco_order}</span>
        </div>
      )}

      {/* Clauses Metric Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-[var(--ui-secondary)] pt-2 border-t border-[var(--ui-border)]">
        <div className="flex items-center gap-1.5 font-medium">
          <Layers className="h-3.5 w-3.5 text-[var(--ui-info)]" />
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
              className="text-xs font-semibold text-[var(--ui-info)] hover:underline"
            >
              Explore Clauses →
            </button>
          )}
        </div>
      </div>

      {/* Collapsible Key Testing Parameters */}
      {showParameters && (
        <div className="pt-2 border-t border-[var(--ui-border)] space-y-2">
          <div className="text-[10px] font-semibold text-[var(--ui-muted)] uppercase tracking-wider">
            Mandatory Testing Parameters
          </div>
          <div className="flex flex-wrap gap-1.5">
            {standard.testing_parameters.map((param, i) => (
              <span
                key={i}
                className="text-[11px] bg-[var(--ui-inset)] text-[var(--ui-secondary)] px-2.5 py-1 rounded-full border border-[var(--ui-border)]/60 font-medium"
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
