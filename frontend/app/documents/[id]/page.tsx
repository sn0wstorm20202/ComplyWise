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
          <div className="flex items-center gap-2 text-xs text-[#777a88]">
            <Folder className="h-3.5 w-3.5 text-[#5e616e]" />
            <Link href="/documents" className="hover:text-[#ffffff] transition-colors">
              Documents
            </Link>
            <ChevronRight className="h-3 w-3 text-[#5e616e]" />
            <span className="text-[#e2e3e9] font-mono font-medium">{doc.code}</span>
          </div>

          <Link
            href="/documents"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#9194a1] hover:text-[#ffffff] transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Checklist</span>
          </Link>
        </div>

        {/* Main Document Details Card */}
        <div className="bg-[#040406] rounded-[10px] border border-[#1c1d22] p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="border-b border-[#1c1d22] pb-6 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-semibold text-[#e2e3e9] bg-[#121317] border border-[#2e3038] px-3 py-1 rounded-full">
                {doc.code}
              </span>
              <span
                className={`px-3 py-1 rounded-full font-semibold text-xs border ${
                  doc.status === "VERIFIED"
                    ? "bg-emerald-950/40 text-emerald-300 border-emerald-800/60"
                    : "bg-amber-950/40 text-amber-300 border-amber-800/60"
                }`}
              >
                {doc.status}
              </span>
              <span className="text-xs font-semibold text-[#cc9166] bg-[#cc9166]/10 border border-[#cc9166]/30 px-3 py-1 rounded-full">
                {doc.category}
              </span>
            </div>

            <h1 className="font-serif text-2xl sm:text-3xl text-[#ffffff] font-normal">
              {doc.name}
            </h1>

            <div className="flex flex-wrap items-center gap-6 text-xs text-[#9194a1] pt-2">
              <div>
                Authority: <strong className="text-[#ffffff] font-medium">{doc.authority}</strong>
              </div>
              <div>
                Format: <strong className="text-[#ffffff] font-medium">{doc.fileFormat} ({doc.fileSize})</strong>
              </div>
              <div>
                Valid Until: <strong className="text-emerald-400 font-medium">{doc.validUntil}</strong>
              </div>
            </div>
          </div>

          {/* Statutory Verification Log */}
          <div className="space-y-3">
            <h2 className="text-xs font-semibold text-[#ffffff] uppercase tracking-wider">
              Statutory Verification Details
            </h2>
            <div className="p-5 rounded-[10px] bg-[#121317] border border-[#1c1d22] space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[#777a88]">Statutory Linked Clause:</span>
                <span className="font-mono font-semibold text-[#cc9166]">{doc.clauseLinked}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#777a88]">Last Verified Date:</span>
                <span className="font-medium text-[#e2e3e9]">{doc.lastUpdated}</span>
              </div>
              <div className="pt-3 border-t border-[#1c1d22] text-[#9194a1] leading-relaxed">
                <strong className="text-[#e2e3e9]">Auditor / Pre-Validation Notes:</strong> {doc.notes}
              </div>
            </div>
          </div>

          {/* Document Preview Area */}
          <div className="rounded-[10px] border-2 border-dashed border-[#1c1d22] p-8 flex flex-col items-center justify-center text-center space-y-4 bg-[#121317]/40">
            <div className="p-3 rounded-full bg-[#1c1d22] text-[#cc9166]">
              <FileText className="h-8 w-8" />
            </div>
            <div>
              <div className="font-serif text-base text-[#ffffff]">
                {doc.name} ({doc.code})
              </div>
              <div className="text-xs text-[#777a88] mt-1 max-w-sm">
                Digitally signed statutory filing evidence formatted for compliance review.
              </div>
            </div>

            <button
              type="button"
              onClick={() => alert(`Downloading ${doc.name} evidence archive...`)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#ffffff] text-[#08080a] text-xs font-semibold hover:bg-[#e2e3e9] transition-all shadow-lg"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Download Evidence PDF</span>
            </button>
          </div>

          {/* Regulatory Boundary Notice (Image B) */}
          <div className="p-4 rounded-[10px] border border-[#1c1d22] bg-[#121317]/70 text-[11px] text-[#777a88] flex items-center justify-between">
            <span>Official statutory verification is governed by the issuing authority. AI analysis assists in pre-filing validation.</span>
            <span className="font-mono text-[#cc9166] shrink-0 ml-4">CONFIDENTIAL</span>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
