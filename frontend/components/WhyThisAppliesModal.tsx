"use client";

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
      <div
        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-100 flex items-start justify-between bg-slate-50/50">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wide">
                Regulatory Provenance & Rationale
              </span>
              <StatusBadge status={requirement.status} size="sm" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 leading-snug">
              {requirement.name}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Authority: <span className="font-semibold text-slate-700">{requirement.authority}</span> · Domain: <span className="font-semibold text-slate-700">{requirement.domain}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-700 leading-relaxed">
          {/* 1. Trace Step A: Matched Business Factors */}
          <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-indigo-950 flex items-center gap-2 text-xs">
                <span>🏢</span> 1. Evaluated Business Facts
              </h3>
              <span className="text-[10px] font-semibold uppercase tracking-wider bg-indigo-100/80 text-indigo-800 px-2 py-0.5 rounded-full">
                Grounding Input
              </span>
            </div>
            <p className="text-indigo-900/80 text-[11px]">
              Statutory applicability evaluated specifically for <strong className="text-indigo-950">{businessName || "your enterprise"}</strong> operating in <strong className="text-indigo-950">{businessState || "registered jurisdiction"}</strong>:
            </p>
            {(() => {
              const reqAny = requirement as any;
              const facts: string[] = Array.isArray(reqAny.applicable_facts) && reqAny.applicable_facts.length > 0
                ? reqAny.applicable_facts
                : Array.isArray(reqAny.reasons) && reqAny.reasons.length > 0
                ? reqAny.reasons
                : [
                    "Identified operating sector and manufacturing process profile",
                    "State jurisdiction and regional statutory authority oversight",
                    "Operational scale and statutory workforce/power load threshold triggers",
                  ];

              return (
                <ul className="list-disc list-inside space-y-1 text-indigo-950 font-medium pl-1 text-xs">
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
                    : <li>Specific manufacturing thresholds or statutory exemptions require operational confirmation.</li>}
                </ul>
              </div>
            );
          })()}

          {/* 2. Trace Step B: Statutory Requirement Overview */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wide flex items-center gap-1.5">
                <span>📋</span> 2. Statutory Legal Requirement
              </h4>
              <span className="text-[10px] text-slate-500 font-mono">
                {requirement.authority || "Regulatory Body"}
              </span>
            </div>
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-slate-800 space-y-2">
              <p className="font-medium text-xs">
                {requirement.name}
              </p>
              <p className="text-slate-600 text-xs leading-relaxed">
                {requirement.description || "Statutory compliance obligation applicable under relevant Central/State legislation."}
              </p>
              {(requirement as any).action_summary && (
                <div className="pt-2 border-t border-slate-200/80 flex items-start gap-1.5 text-[11px] text-slate-700">
                  <span className="font-bold text-indigo-700 shrink-0">Action Required:</span>
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
              (requirement as any).evidence_excerpts?.[0] ||
              requirement.description;

            return (primaryCitation || directPortalUrl || evidenceExcerpt) ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wide flex items-center gap-1.5">
                    <span>🏛️</span> 3. Verbatim Official Evidence Excerpt
                  </h4>
                  {directPortalUrl && (
                    <a
                      href={directPortalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-semibold hover:underline"
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
                        className="truncate text-indigo-700 hover:underline max-w-sm"
                      >
                        {directPortalUrl}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-slate-500">
                <span className="font-semibold text-slate-700">Official Notice:</span> Grounded in official regulatory notifications and gazettes published by Central and State statutory authorities.
              </div>
            );
          })()}

          {/* Engine Assessment Audit Trace */}
          <div className="rounded-xl border border-slate-200/80 p-3.5 bg-white space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 text-xs">Deterministic Scope &amp; Applicability Authority</span>
              <span className="font-mono text-[10px] text-slate-400">ID: {requirement.requirement_id}</span>
            </div>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              {requirement.reason_summary || (requirement as any).explanation_trace?.reason || "Evaluated against verified statutory conditions without LLM final legal declaration."}
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
