"use client";

import React, { use } from "react";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import { DEMO_DOCUMENTS } from "@/data/demo/documents";
import {
  Folder,
  ChevronRight,
  ArrowLeft,
  FileText,
  Download,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Building2,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function DocumentDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const docId = resolvedParams.id;

  const doc =
    DEMO_DOCUMENTS.find((d) => d.id === docId || d.code === docId) ||
    DEMO_DOCUMENTS[0];

  return (
    <AppShell activeView="documents">
      <div className="space-y-6 pb-6 select-none max-w-4xl mx-auto">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
            <Folder className="h-3.5 w-3.5 text-slate-400" />
            <Link href="/documents" className="hover:text-slate-600">
              Documents
            </Link>
            <ChevronRight className="h-3 w-3 text-slate-300" />
            <span className="text-slate-600 font-semibold">{doc.code}</span>
          </div>

          <Link
            href="/documents"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Documents</span>
          </Link>
        </div>

        {/* Main Document Details Card */}
        <div className="bg-white rounded-[28px] border border-slate-200/70 p-8 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-6 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-full">
                {doc.code}
              </span>
              <span
                className={`px-3 py-1 rounded-full font-bold text-xs ${
                  doc.status === "VERIFIED"
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-amber-100 text-amber-800"
                }`}
              >
                {doc.status}
              </span>
              <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full">
                {doc.category}
              </span>
            </div>

            <h1 className="text-2xl font-bold text-slate-950">
              {doc.name}
            </h1>

            <div className="flex flex-wrap items-center gap-6 text-xs text-slate-500 pt-1">
              <div>
                Issuing Authority: <strong className="text-slate-900">{doc.authority}</strong>
              </div>
              <div>
                Format: <strong className="text-slate-900">{doc.fileFormat} ({doc.fileSize})</strong>
              </div>
              <div>
                Valid Until: <strong className="text-emerald-700">{doc.validUntil}</strong>
              </div>
            </div>
          </div>

          {/* Audit Verification Log */}
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Statutory Verification Details
            </h2>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Statutory Linked Clause:</span>
                <span className="font-mono font-bold text-indigo-700">{doc.clauseLinked}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Last Verified Date:</span>
                <span className="font-semibold text-slate-800">{doc.lastUpdated}</span>
              </div>
              <div className="pt-2 border-t border-slate-200/60 text-slate-600">
                <strong>Auditor Notes:</strong> {doc.notes}
              </div>
            </div>
          </div>

          {/* Document Preview Placeholder Area */}
          <div className="rounded-2xl border-2 border-dashed border-slate-200 p-8 flex flex-col items-center justify-center text-center space-y-3 bg-slate-50/50">
            <FileText className="h-12 w-12 text-slate-400" />
            <div>
              <div className="font-bold text-slate-800 text-sm">
                {doc.name} ({doc.code})
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                Digitally signed statutory filing evidence ready for inspection.
              </div>
            </div>

            <button
              type="button"
              onClick={() => alert(`Downloading ${doc.name} verification file...`)}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-[#0f172a] text-white text-xs font-bold hover:bg-slate-800 transition-colors shadow-xs"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Download Evidence PDF</span>
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
