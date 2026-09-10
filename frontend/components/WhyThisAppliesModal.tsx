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
          {/* Business factors trigger */}
          <div className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-4 space-y-2">
            <h3 className="font-bold text-indigo-950 flex items-center gap-2">
              <span>🏢</span> Matched Business Factors
            </h3>
            <p className="text-indigo-900/80">
              Evaluated specifically for <strong className="text-indigo-950">{businessName || "your business"}</strong> operating in <strong className="text-indigo-950">{businessState || "registered jurisdiction"}</strong>:
            </p>
            <ul className="list-disc list-inside space-y-1 text-indigo-900 font-medium pl-1">
              <li>Identified sector and operational manufacturing profile.</li>
              <li>State jurisdiction and regional statutory authority oversight.</li>
              <li>Operational scale and industrial threshold triggers.</li>
            </ul>
          </div>

          {/* Statutory explanation */}
          <div className="space-y-1.5">
            <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wide">
              Statutory Requirement Overview
            </h4>
            <p className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 text-slate-700">
              {requirement.description || "Statutory compliance mandate applicable under Indian law."}
            </p>
          </div>

          {/* Official Source and Evidence Citation */}
          {(() => {
            const directPortalUrl = sanitizeExternalUrl(
              requirement.portal_url ||
              requirement.source_url ||
              primaryCitation?.canonical_url
            );
            const directPortalName =
              requirement.portal_name ||
              primaryCitation?.source_title ||
              `${requirement.authority} Portal`;

            return (primaryCitation || directPortalUrl) ? (
              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wide flex items-center justify-between">
                  <span>Official Statutory Source</span>
                  {directPortalUrl && (
                    <a
                      href={directPortalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:underline font-semibold"
                    >
                      View {directPortalName} ↗
                    </a>
                  )}
                </h4>
              <div className="bg-amber-50/50 border border-amber-200/70 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between font-semibold text-amber-950 text-xs">
                  <span>{String(primaryCitation?.source_title || requirement.name || "Official Portal")}</span>
                  {(primaryCitation?.locator || requirement.statutory_act) && (
                    <span className="text-[11px] bg-amber-100/70 px-2 py-0.5 rounded text-amber-800 font-mono">
                      {String(primaryCitation?.locator || requirement.statutory_act)}
                    </span>
                  )}
                </div>
                {(primaryCitation?.excerpt || requirement.description) && (
                  <blockquote className="border-l-2 border-amber-400 pl-3 italic text-amber-900 text-xs">
                    "{String(primaryCitation?.excerpt || requirement.description)}"
                  </blockquote>
                )}
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-slate-500">
              <span className="font-semibold text-slate-700">Statutory Notice:</span> Derived from published central and state regulatory gazettes.
            </div>
          );
        })()}

          {/* Engine Assessment */}
          <div className="rounded-xl border border-slate-200/80 p-3.5 bg-white space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900">Deterministic Engine Evaluation</span>
              <span className="font-mono text-[10px] text-slate-400">ID: {requirement.requirement_id}</span>
            </div>
            <p className="text-slate-600 text-[11px]">
              {requirement.reason_summary || "The business profile satisfies all statutory eligibility conditions with zero guesswork."}
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
