"use client";
import Overlay from "@/components/product/Overlay";

import React from "react";
import StatusBadge from "./StatusBadge";
import { sanitizeExternalUrl } from "@/lib/url";
import { ComplianceRequirementItem } from "@/types";

interface WhyThisAppliesModalProps {
  isOpen: boolean;
  onClose: () => void;
  requirement: ComplianceRequirementItem | null;
  businessName?: string;
  businessState?: string;
}

export default function WhyThisAppliesModal({
  isOpen,
  onClose,
  requirement,
  businessName,
  businessState,
}: WhyThisAppliesModalProps) {
  if (!isOpen || !requirement) return null;

  const citations = requirement.citations || [];
  const primaryCitation = citations.length > 0 ? citations[0] : null;
  const contextual = requirement.result_origin === "LLM_FALLBACK_RESULT";

  return (
    <Overlay open onClose={() => onClose()} title="Details">
      <div
        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-[var(--ui-border)] overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-6 border-b border-[var(--ui-border)] flex items-start justify-between bg-[var(--ui-bg)]/50">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-bold text-[var(--ui-sage)] uppercase tracking-wide">
                Regulatory Provenance & Rationale
              </span>
              <StatusBadge status={requirement.status} size="sm" />
            </div>
            <h2 className="text-lg font-bold text-[var(--ui-text)] leading-snug">
              {requirement.name}
            </h2>
            <p className="text-xs text-[var(--ui-secondary)] mt-0.5">
              Authority: <span className="font-semibold text-[var(--ui-secondary)]">{requirement.authority}</span> · Domain: <span className="font-semibold text-[var(--ui-secondary)]">{requirement.domain}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-[var(--ui-muted)] hover:text-[var(--ui-secondary)] hover:bg-[var(--ui-inset)] transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-[var(--ui-secondary)] leading-relaxed">
          {/* 1. Trace Step A: Matched Business Factors */}
          <div className="rounded-xl border border-[var(--ui-sage-soft)] bg-[var(--ui-sage-faint)]/50 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-[var(--ui-sage)] flex items-center gap-2 text-xs">
                <span>🏢</span> 1. Evaluated Business Facts
              </h3>
              <span className="text-[10px] font-semibold uppercase tracking-wider bg-[var(--ui-sage-soft)]/80 text-[var(--ui-sage)] px-2 py-0.5 rounded-full">
                Grounding Input
              </span>
            </div>
            <p className="text-[var(--ui-sage)]/80 text-[11px]">
              {contextual ? "Contextual planning for" : "Recorded assessment for"} <strong className="text-[var(--ui-sage)]">{businessName || "your enterprise"}</strong> operating in <strong className="text-[var(--ui-sage)]">{businessState || "registered jurisdiction"}</strong>:
            </p>
            {(() => {
              const reqAny = requirement as any;
              const facts: string[] = Array.isArray(reqAny.applicable_facts) && reqAny.applicable_facts.length > 0
                ? reqAny.applicable_facts
                : Array.isArray(reqAny.reasons) && reqAny.reasons.length > 0
                ? reqAny.reasons
                : [];

              return (
                <ul className="list-disc list-inside space-y-1 text-[var(--ui-sage)] font-medium pl-1 text-xs">
                  {facts.length === 0 && <li>No business-fact trace is attached to this record.</li>}
                  {facts.map((fact, idx) => (
                    <li key={idx} className="leading-snug">{fact}</li>
                  ))}
                </ul>
              );
            })()}
          </div>

          {/* Missing facts notification if status is NEEDS_INFORMATION */}
          {(() => {
            const reqAny = requirement as any;
            const missing: string[] = Array.isArray(reqAny.missing_facts) ? reqAny.missing_facts : [];
            if (missing.length === 0 && requirement.status !== "NEEDS_INFORMATION") return null;

            return (
              <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-3.5 space-y-1.5">
                <h4 className="font-bold text-amber-950 flex items-center gap-1.5 text-xs">
                  <span>⚠️</span> Additional Verification Needed
                </h4>
                <p className="text-amber-900 text-[11px]">
                  Applicability cannot be decisively determined without resolving the following business parameters:
                </p>
                <ul className="list-disc list-inside space-y-0.5 text-amber-950 text-[11px] font-medium pl-1">
                  {missing.length > 0
                    ? missing.map((m, idx) => <li key={idx}>{m}</li>)
                    : <li>Review the saved assessment for the details needed to resolve this item.</li>}
                </ul>
              </div>
            );
          })()}

          {/* 2. Trace Step B: Statutory Requirement Overview */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-[var(--ui-text)] uppercase text-[11px] tracking-wide flex items-center gap-1.5">
                <span>📋</span> 2. {contextual ? "Planning guidance" : "Recorded requirement"}
              </h4>
              <span className="text-[10px] text-[var(--ui-secondary)] font-mono">
                {requirement.authority || "Regulatory Body"}
              </span>
            </div>
            <div className="bg-[var(--ui-bg)] p-3.5 rounded-xl border border-[var(--ui-border)] text-[var(--ui-text)] space-y-2">
              <p className="font-medium text-xs">
                {requirement.name}
              </p>
              <p className="text-[var(--ui-secondary)] text-xs leading-relaxed">
                {requirement.description || "No description is recorded for this item."}
              </p>
              {(requirement as any).action_summary && (
                <div className="pt-2 border-t border-[var(--ui-border)]/80 flex items-start gap-1.5 text-[11px] text-[var(--ui-secondary)]">
                  <span className="font-bold text-[var(--ui-sage)] shrink-0">Action Required:</span>
                  <span>{(requirement as any).action_summary}</span>
                </div>
              )}
            </div>
          </div>

          {/* 3 & 4. Trace Step C & D: Verbatim Official Evidence Excerpt + Official Portal Link */}
          {(() => {
            const directPortalUrl = sanitizeExternalUrl(
              requirement.portal_url ||
              requirement.source_url ||
              primaryCitation?.canonical_url
            );
            const directPortalName =
              requirement.portal_name ||
              primaryCitation?.source_title ||
              `${requirement.authority || "Official Government"} Portal`;

            const evidenceExcerpt =
              primaryCitation?.excerpt ||
              (requirement as any).evidence_excerpts?.[0];

            return (primaryCitation || directPortalUrl || evidenceExcerpt) ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-[var(--ui-text)] uppercase text-[11px] tracking-wide flex items-center gap-1.5">
                    <span>🏛️</span> 3. Recorded source passage
                  </h4>
                  {directPortalUrl && (
                    <a
                      href={directPortalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-[var(--ui-sage)] hover:text-[var(--ui-sage)] font-semibold hover:underline"
                    >
                      <span>4. Open {directPortalName}</span>
                      <span>↗</span>
                    </a>
                  )}
                </div>
                <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-4 space-y-2.5">
                  <div className="flex items-center justify-between font-semibold text-amber-950 text-xs">
                    <span>{String(primaryCitation?.source_title || directPortalName)}</span>
                    {(primaryCitation?.locator || requirement.statutory_act) && (
                      <span className="text-[11px] bg-amber-100 px-2 py-0.5 rounded text-amber-900 font-mono font-medium">
                        {String(primaryCitation?.locator || requirement.statutory_act)}
                      </span>
                    )}
                  </div>
                  {evidenceExcerpt && (
                    <blockquote className="border-l-3 border-amber-400 pl-3.5 italic text-amber-950 text-xs leading-relaxed bg-white/60 p-2.5 rounded-r-lg">
                      &quot;{String(evidenceExcerpt)}&quot;
                    </blockquote>
                  )}
                  {directPortalUrl && (
                    <div className="pt-1 flex items-center gap-1.5 text-[11px] text-amber-800">
                      <span className="font-semibold">Official Source Link:</span>
                      <a
                        href={directPortalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="truncate text-[var(--ui-sage)] hover:underline max-w-sm"
                      >
                        {directPortalUrl}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-[var(--ui-border)] bg-[var(--ui-bg)] p-3.5 text-[var(--ui-secondary)]">
                <span className="font-semibold text-[var(--ui-secondary)]">Source passage not recorded.</span> {contextual ? "This is contextual planning guidance; confirm official requirements before acting." : "Review the recorded rule and supporting evidence before acting."}
              </div>
            );
          })()}

          {/* Engine Assessment Audit Trace */}
          <div className="rounded-xl border border-[var(--ui-border)]/80 p-3.5 bg-white space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[var(--ui-text)] text-xs">{contextual ? "Planning basis" : "Assessment decision trail"}</span>
              <span className="font-mono text-[10px] text-[var(--ui-muted)]">ID: {requirement.requirement_id}</span>
            </div>
            <p className="text-[var(--ui-secondary)] text-[11px] leading-relaxed">
              {requirement.reason_summary || requirement.explanation_reason || (requirement as any).explanation_trace?.reason || "No additional decision explanation is attached to this record."}
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-[var(--ui-border)] bg-[var(--ui-bg)]/50 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-[var(--ui-border-strong)] px-4 py-2 text-xs font-semibold text-[var(--ui-secondary)] hover:bg-[var(--ui-inset)] transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </Overlay>
  );
}
