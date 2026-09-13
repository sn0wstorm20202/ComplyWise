"use client";

import React, { useState } from "react";
import { CheckCircle2, AlertTriangle, XCircle, HelpCircle, GitFork, ChevronDown, ChevronUp, ShieldAlert } from "lucide-react";
import { BisClaim, ClaimStatus, AuthorityTier } from "@/types";

interface ClaimDecompositionCardProps {
  claims: BisClaim[];
  className?: string;
}

function getClaimStatusBadge(status: ClaimStatus) {
  switch (status) {
    case "SUPPORTED":
      return (
        <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-800 border border-emerald-200">
          <CheckCircle2 className="h-3 w-3 text-emerald-600" />
          <span>SUPPORTED</span>
        </span>
      );
    case "PARTIALLY_SUPPORTED":
      return (
        <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800 border border-amber-200">
          <AlertTriangle className="h-3 w-3 text-amber-600" />
          <span>PARTIAL</span>
        </span>
      );
    case "UNSUPPORTED":
      return (
        <span className="inline-flex items-center gap-1 rounded bg-rose-50 px-2 py-0.5 text-[11px] font-semibold text-rose-800 border border-rose-200">
          <XCircle className="h-3 w-3 text-rose-600" />
          <span>UNSUPPORTED</span>
        </span>
      );
    case "CONFLICTED":
      return (
        <span className="inline-flex items-center gap-1 rounded bg-purple-50 px-2 py-0.5 text-[11px] font-semibold text-purple-800 border border-purple-200">
          <GitFork className="h-3 w-3 text-purple-600" />
          <span>CONFLICTED</span>
        </span>
      );
    case "UNVERIFIED":
    default:
      return (
        <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700 border border-slate-300">
          <HelpCircle className="h-3 w-3 text-slate-500" />
          <span>UNVERIFIED</span>
        </span>
      );
  }
}

function getAuthorityLabel(tier?: number): string {
  switch (tier) {
    case AuthorityTier.TIER_1_REGULATORY:
      return "Tier 1: Official Gazette / Standard";
    case AuthorityTier.TIER_2_STATUTORY_PORTAL:
      return "Tier 2: Statutory Portal (BIS/DPIIT)";
    case AuthorityTier.TIER_3_TECHNICAL_DATA:
      return "Tier 3: Technical / Lab Specification";
    case AuthorityTier.TIER_4_SECONDARY_INFO:
      return "Tier 4: Secondary Regulatory Reference";
    default:
      return "Tier 5: Unverified / Contextual";
  }
}

export function ClaimDecompositionCard({ claims, className = "" }: ClaimDecompositionCardProps) {
  const [expanded, setExpanded] = useState(true);

  if (!claims || claims.length === 0) {
    return null;
  }

  const supportedCount = claims.filter((c) => c.status === "SUPPORTED").length;
  const partialCount = claims.filter((c) => c.status === "PARTIALLY_SUPPORTED").length;
  const unsupportedCount = claims.filter((c) => c.status === "UNSUPPORTED").length;

  return (
    <div className={`rounded-lg border border-slate-200 bg-white shadow-xs overflow-hidden ${className}`}>
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 bg-slate-50/80 hover:bg-slate-100/80 border-b border-slate-200 transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-900 tracking-wide uppercase">
            Atomic Regulatory Claims ({claims.length})
          </span>
          <div className="flex items-center gap-1 text-[10px]">
            {supportedCount > 0 && (
              <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold">
                {supportedCount} verified
              </span>
            )}
            {partialCount > 0 && (
              <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-semibold">
                {partialCount} partial
              </span>
            )}
            {unsupportedCount > 0 && (
              <span className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 font-semibold">
                {unsupportedCount} unverified
              </span>
            )}
          </div>
        </div>
        <div className="text-slate-400">
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
      </button>

      {expanded && (
        <div className="divide-y divide-slate-100 p-2 space-y-2">
          {claims.map((claim, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-md transition-colors ${
                claim.status === "UNSUPPORTED"
                  ? "bg-rose-50/50 border border-rose-100"
                  : claim.status === "PARTIALLY_SUPPORTED"
                  ? "bg-amber-50/40 border border-amber-100"
                  : "bg-white border border-slate-150"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono font-bold text-slate-500">
                    Claim #{idx + 1}
                  </span>
                  {getClaimStatusBadge(claim.status)}
                </div>
                {claim.authority_tier !== undefined && (
                  <span className="text-[10px] text-slate-500 font-medium">
                    {getAuthorityLabel(claim.authority_tier)}
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-800 leading-relaxed font-normal">
                {claim.claim_text}
              </p>

              {claim.citation && (
                <div className="mt-2 text-[11px] font-mono text-blue-900 bg-blue-50/60 px-2 py-1 rounded border border-blue-100 inline-block">
                  Citation: {claim.citation}
                </div>
              )}

              {claim.verification_reason && (
                <div className="mt-2 text-[11px] text-amber-800 bg-amber-50 px-2 py-1 rounded border border-amber-200 flex items-start gap-1.5">
                  <ShieldAlert className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />
                  <span>{claim.verification_reason}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ClaimDecompositionCard;
