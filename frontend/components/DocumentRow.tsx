"use client";

import React from "react";
import { FileText, Eye } from "lucide-react";
import { DocumentItem } from "@/lib/mockData";
import StatusBadge from "@/components/StatusBadge";

interface DocumentRowProps {
  document: DocumentItem;
  onInspect?: (doc: DocumentItem) => void;
}

export function DocumentRow({ document, onInspect }: DocumentRowProps) {
  return (
    <div className="p-5 rounded-2xl border border-[#E2E8F0] dark:border-white/10 bg-white dark:bg-[#0D1117] hover:border-[#CBD5E1] dark:hover:border-white/20 hover:shadow-sm dark:hover:shadow-none transition-all space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="h-9 w-9 rounded-xl bg-blue-50 dark:bg-blue-500/15 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30 flex items-center justify-center shrink-0 mt-0.5">
            <FileText className="h-4 w-4" />
          </div>

          <div className="space-y-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-[#0F172A] dark:text-[#F8FAFC] truncate">
                {document.name}
              </span>
              <span className="font-mono text-[10px] text-[#94A3B8] dark:text-[#64748B]">
                {document.code}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#64748B] dark:text-[#94A3B8]">
              <span className="font-medium text-[#475569] dark:text-[#CBD5E1]">{document.authority}</span>
              <span className="text-[#CBD5E1] dark:text-white/20">·</span>
              <span>{document.category}</span>
              <span className="text-[#CBD5E1] dark:text-white/20">·</span>
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
              className="p-1.5 text-[#94A3B8] dark:text-[#64748B] hover:text-[#475569] dark:hover:text-[#94A3B8] rounded-full hover:bg-[#F8FAFC] dark:hover:bg-white/5 transition-colors"
              title="Inspect Document"
            >
              <Eye className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Linked Clause & Expiry Metadata */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#F1F5F9] dark:border-white/5 text-[11px]">
        <div className="text-[#64748B] dark:text-[#94A3B8] truncate">
          <span className="font-semibold text-[#475569] dark:text-[#CBD5E1]">Statutory Link:</span>{" "}
          <span className="font-mono text-[#334155] dark:text-[#CBD5E1] font-semibold">{document.clause_linked}</span>
        </div>

        {document.valid_until && (
          <div
            className={`font-mono text-[11px] font-medium ${
              document.status === "ISSUE"
                ? "text-rose-600 dark:text-rose-400 font-bold"
                : document.status === "NEEDS_REVIEW"
                ? "text-amber-600 dark:text-amber-400 font-semibold"
                : "text-[#64748B] dark:text-[#94A3B8]"
            }`}
          >
            Validity: {document.valid_until}
          </div>
        )}
      </div>

      {document.notes && (
        <div className="text-[11px] text-[#64748B] dark:text-[#94A3B8] bg-[#F8FAFC] dark:bg-white/5 p-2.5 rounded-xl border border-[#E2E8F0] dark:border-white/10 leading-relaxed">
          {document.notes}
        </div>
      )}
    </div>
  );
}

export default DocumentRow;
