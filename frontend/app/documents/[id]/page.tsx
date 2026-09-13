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
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function DocumentDetailPage({ params }: PageProps) {
  const { t } = useLanguage();
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
          <div className="flex items-center gap-2 text-xs text-[#64748B]">
            <Folder className="h-3.5 w-3.5 text-[#64748B]" />
            <Link href="/documents" className="hover:text-[#0F172A] transition-colors">
              {t("navigation.documents")}
            </Link>
            <ChevronRight className="h-3 w-3 text-[#CBD5E1]" />
            <span className="text-[#0F172A] font-mono font-medium">{doc.code}</span>
          </div>

          <Link
            href="/documents"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#64748B] hover:text-[#0F172A] transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>{t("common.back")}</span>
          </Link>
        </div>

        {/* Main Document Details Card */}
        <div className="bg-white rounded-[16px] border border-[#E2E8F0] p-6 sm:p-8 shadow-2xs space-y-6">
          <div className="border-b border-[#E2E8F0] pb-6 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-semibold text-[#0F172A] bg-[#F1F5F9] border border-[#E2E8F0] px-3 py-1 rounded-full">
                {doc.code}
              </span>
              <span
                className={`px-3 py-1 rounded-full font-semibold text-xs border ${
                  doc.status === "VERIFIED"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-amber-50 text-amber-700 border-amber-200"
                }`}
              >
                {doc.status}
              </span>
              <span className="text-xs font-semibold text-[#0F172A] bg-[#F1F5F9] border border-[#E2E8F0] px-3 py-1 rounded-full">
                {doc.category}
              </span>
            </div>

            <h1 className="font-sans text-2xl sm:text-3xl text-[#0F172A] font-bold tracking-tight">
              {doc.name}
            </h1>

            <div className="flex flex-wrap items-center gap-6 text-xs text-[#64748B] pt-2">
              <div>
                Authority: <strong className="text-[#0F172A] font-semibold">{doc.authority}</strong>
              </div>
              <div>
                Format: <strong className="text-[#0F172A] font-semibold">{doc.fileFormat} ({doc.fileSize})</strong>
              </div>
              <div>
                Valid Until: <strong className="text-emerald-700 font-semibold">{doc.validUntil}</strong>
              </div>
            </div>
          </div>

          {/* Statutory Verification Log */}
          <div className="space-y-3">
            <h2 className="text-xs font-semibold text-[#0F172A] uppercase tracking-wider">
              Statutory Verification Details
            </h2>
            <div className="p-5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[#64748B]">Statutory Linked Clause:</span>
                <span className="font-mono font-semibold text-[#0F172A]">{doc.clauseLinked}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#64748B]">Last Verified Date:</span>
                <span className="font-medium text-[#0F172A]">{doc.lastUpdated}</span>
              </div>
              <div className="pt-3 border-t border-[#E2E8F0] text-[#475569] leading-relaxed">
                <strong className="text-[#0F172A]">Auditor / Pre-Validation Notes:</strong> {doc.notes}
              </div>
            </div>
          </div>

          {/* Document Preview Area */}
          <div className="rounded-xl border-2 border-dashed border-[#E2E8F0] p-8 flex flex-col items-center justify-center text-center space-y-4 bg-[#F8FAFC]">
            <div className="p-3 rounded-full bg-white text-[#0F172A] shadow-2xs border border-[#E2E8F0]">
              <FileText className="h-8 w-8" />
            </div>
            <div>
              <div className="font-sans font-bold text-base text-[#0F172A]">
                {doc.name} ({doc.code})
              </div>
              <div className="text-xs text-[#64748B] mt-1 max-w-sm">
                Digitally signed statutory filing evidence formatted for compliance review.
              </div>
            </div>

            <button
              type="button"
              onClick={() => alert(`Downloading ${doc.name} evidence archive...`)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#18181B] text-white text-xs font-semibold hover:bg-[#27272A] transition-all shadow-2xs cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Download Evidence PDF</span>
            </button>
          </div>

          {/* Regulatory Boundary Notice */}
          <div className="p-4 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] text-[11px] text-[#64748B] flex items-center justify-between">
            <span>Official statutory verification is governed by the issuing authority. AI analysis assists in pre-filing validation.</span>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
