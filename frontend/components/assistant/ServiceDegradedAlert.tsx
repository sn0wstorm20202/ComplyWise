"use client";

import React from "react";
import { WifiOff, RefreshCw, AlertOctagon, ShieldAlert } from "lucide-react";

interface ServiceDegradedAlertProps {
  message?: string;
  correlationId?: string | null;
  onRetry?: () => void;
  className?: string;
}

export function ServiceDegradedAlert({
  message = "The specialized BIS regulatory intelligence engine is temporarily unavailable.",
  correlationId,
  onRetry,
  className = "",
}: ServiceDegradedAlertProps) {
  return (
    <div className={`rounded-xl border border-amber-300 bg-amber-50/70 p-5 space-y-3 ${className}`}>
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-amber-100 p-2 text-amber-800 shrink-0 mt-0.5">
          <WifiOff className="h-5 w-5 text-amber-700" />
        </div>
        <div className="space-y-1 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-amber-950">
              BIS Intelligence Service Unavailable
            </h3>
            <span className="rounded bg-amber-200/80 px-2 py-0.5 text-[10px] font-semibold text-amber-900 font-mono">
              CIRCUIT_BREAKER_OPEN
            </span>
          </div>
          <p className="text-xs text-amber-900/90 leading-relaxed">
            {message}
          </p>
        </div>
      </div>

      <div className="rounded-lg bg-white/80 border border-amber-200/80 p-3 text-xs text-slate-700 space-y-1.5">
        <div className="flex items-center gap-1.5 font-semibold text-slate-900">
          <ShieldAlert className="h-3.5 w-3.5 text-amber-600" />
          <span>Deterministic Safety Policy Enforced</span>
        </div>
        <p className="text-[11px] text-slate-600 leading-normal">
          In accordance with ComplyWise safety protocols, no synthetic standard numbers, fake clauses, or unverified regulatory mandates are displayed while the BIS engine is disconnected. Please verify standards directly on the official{" "}
          <a
            href="https://www.manakonline.in"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-900 font-semibold underline hover:text-blue-950"
          >
            BIS Manakonline Portal
          </a>{" "}
          or retry below.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
        {correlationId ? (
          <span className="text-[10px] font-mono text-slate-500">
            Trace ID: {correlationId}
          </span>
        ) : (
          <span className="text-[10px] text-slate-400">
            System status: Degraded Mode
          </span>
        )}

        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-1.5 rounded-md bg-amber-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-950 transition-colors shadow-2xs"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Retry Query</span>
          </button>
        )}
      </div>
    </div>
  );
}

export default ServiceDegradedAlert;
