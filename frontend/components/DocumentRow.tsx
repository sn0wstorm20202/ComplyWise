"use client";

import React from "react";
import { FileText, Download, Eye, AlertCircle, CheckCircle2, ShieldCheck } from "lucide-react";
import { DocumentItem } from "@/lib/mockData";
import StatusBadge from "@/components/StatusBadge";

interface DocumentRowProps {
  document: DocumentItem;
  onInspect?: (doc: DocumentItem) => void;
}

export function DocumentRow({ document, onInspect }: DocumentRowProps) {
  return (
    <div className="p-3.5 rounded-lg border border-slate-200/80 bg-slate-50/40 hover:bg-white hover:border-slate-300 hover:shadow-xs transition-all space-y-2">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-900 border border-blue-200 flex items-center justify-center shrink-0 mt-0.5">
            <FileText className="h-4 w-4" />
          </div>

          <div className="space-y-0.5 min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-bold text-slate-950 truncate">
                {document.name}
              </span>
              <span className="font-mono text-[10px] text-slate-400">
                {document.code}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
              <span className="font-medium text-slate-700">{document.authority}</span>
              <span className="text-slate-300">·</span>
              <span>{document.category}</span>
              <span className="text-slate-300">·</span>
              <span className="font-mono">{document.file_format} ({document.file_size})</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <StatusBadge status={document.status} size="sm" />
          {onInspect && (
            <button
              onClick={() => onInspect(document)}
              type="button"
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded transition-colors"
              title="Inspect Document"
            >
              <Eye className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Linked Clause & Expiry Metadata */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100/80 text-[11px]">
        <div className="text-slate-500 truncate">
          <span className="font-semibold text-slate-600">Statutory Link:</span>{" "}
          <span className="font-mono text-slate-700">{document.clause_linked}</span>
        </div>

        {document.valid_until && (
          <div
            className={`font-mono text-[10px] font-medium ${
              document.status === "ISSUE"
                ? "text-rose-600 font-bold"
                : document.status === "NEEDS_REVIEW"
                ? "text-amber-600"
                : "text-slate-500"
            }`}
          >
            Validity: {document.valid_until}
          </div>
        )}
      </div>

      {document.notes && (
        <div className="text-[11px] text-slate-500 bg-white p-2 rounded border border-slate-100 italic">
          {document.notes}
        </div>
      )}
    </div>
  );
}

export default DocumentRow;
