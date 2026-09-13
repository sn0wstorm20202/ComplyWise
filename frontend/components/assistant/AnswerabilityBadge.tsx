"use client";

import React from "react";
import { ShieldCheck, AlertTriangle, AlertCircle, HelpCircle, GitFork, Compass, Clock, WifiOff, XCircle } from "lucide-react";
import { AnswerabilityState } from "@/types";

interface AnswerabilityBadgeProps {
  state: AnswerabilityState;
  decision?: string;
  className?: string;
}

export function AnswerabilityBadge({ state, decision, className = "" }: AnswerabilityBadgeProps) {
  switch (state) {
    case "ANSWERABLE":
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-300 ${className}`}>
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
          <span>VERIFIED REGULATORY FINDINGS</span>
        </span>
      );

    case "PARTIALLY_ANSWERABLE":
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-300 ${className}`}>
          <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
          <span>PARTIALLY VERIFIED</span>
        </span>
      );

    case "INSUFFICIENT_EVIDENCE":
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold bg-amber-100 text-amber-900 border border-amber-400 ${className}`}>
          <AlertCircle className="h-3.5 w-3.5 text-amber-700" />
          <span>VERIFICATION REQUIRED</span>
        </span>
      );

    case "NO_RELEVANT_EVIDENCE":
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-300 ${className}`}>
          <HelpCircle className="h-3.5 w-3.5 text-slate-500" />
          <span>NOT IN INDEXED CORPUS</span>
        </span>
      );

    case "CONFLICTING_EVIDENCE":
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-300 ${className}`}>
          <GitFork className="h-3.5 w-3.5 text-rose-600" />
          <span>CONFLICTING EVIDENCE</span>
        </span>
      );

    case "AMBIGUOUS_QUERY":
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold bg-sky-50 text-sky-800 border border-sky-300 ${className}`}>
          <HelpCircle className="h-3.5 w-3.5 text-sky-600" />
          <span>CLARIFICATION NEEDED</span>
        </span>
      );

    case "OUT_OF_CORPUS":
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold bg-purple-50 text-purple-800 border border-purple-300 ${className}`}>
          <Compass className="h-3.5 w-3.5 text-purple-600" />
          <span>OUT OF BIS JURISDICTION</span>
        </span>
      );

    case "TEMPORALLY_UNCERTAIN":
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold bg-yellow-50 text-yellow-900 border border-yellow-300 ${className}`}>
          <Clock className="h-3.5 w-3.5 text-yellow-700" />
          <span>TEMPORAL VALIDITY UNCERTAIN</span>
        </span>
      );

    case "SERVICE_UNAVAILABLE":
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold bg-orange-50 text-orange-900 border border-orange-300 ${className}`}>
          <WifiOff className="h-3.5 w-3.5 text-orange-600" />
          <span>BIS SERVICE OFFLINE</span>
        </span>
      );

    case "SYSTEM_FAILURE":
    default:
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold bg-rose-100 text-rose-900 border border-rose-400 ${className}`}>
          <XCircle className="h-3.5 w-3.5 text-rose-700" />
          <span>PROCESSING ERROR</span>
        </span>
      );
  }
}
