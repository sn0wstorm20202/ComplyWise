"use client";

import React, { use, useState, useEffect } from "react";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import { DEMO_DOCUMENTS } from "@/data/demo/documents";
import {
  Folder,
  ChevronRight,
  ArrowLeft,
  FileText,
  Download,
  ShieldCheck,
  CheckCircle2,
  Check,
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

  const [isPortalUploaded, setIsPortalUploaded] = useState<boolean>(false);
  const [bizId, setBizId] = useState<string>("bb0abb9b-409e-405a-bae1-777540bc0907");

  useEffect(() => {
    const activeBizId =
      localStorage.getItem("complywise_active_business_id") ||
      "bb0abb9b-409e-405a-bae1-777540bc0907";
    setBizId(activeBizId);

    try {
      const stored = localStorage.getItem(`complywise_portal_uploaded_${activeBizId}`);
      if (stored) {
        const map = JSON.parse(stored);
        setIsPortalUploaded(!!map[doc.id]);
      }
    } catch {
      // Ignore parse error
    }
  }, [doc.id]);

  function handleTogglePortalUploaded() {
    const nextState = !isPortalUploaded;
    setIsPortalUploaded(nextState);

    try {
      const stored = localStorage.getItem(`complywise_portal_uploaded_${bizId}`);
      const map = stored ? JSON.parse(stored) : {};
      map[doc.id] = nextState;
      localStorage.setItem(`complywise_portal_uploaded_${bizId}`, JSON.stringify(map));
    } catch {
      // Ignore storage error
    }
  }

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
          <div className="border-b border-[#E2E8F0] pb-6 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-semibold text-[#0F172A] bg-[#F1F5F9] border border-[#E2E8F0] px-3 py-1 rounded-full">
                {doc.code}
              </span>
              <span
                className={`px-3 py-1 rounded-full font-semibold text-xs border ${
                  isPortalUploaded
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : doc.status === "VERIFIED"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-amber-50 text-amber-700 border-amber-200"
                }`}
              >
                {isPortalUploaded ? "UPLOADED ON PORTAL" : doc.status}
              </span>
              <span className="text-xs font-semibold text-[#0F172A] bg-[#F1F5F9] border border-[#E2E8F0] px-3 py-1 rounded-full">
                {doc.category}
              </span>
            </div>

            <h1 className="font-sans text-2xl sm:text-3xl text-[#0F172A] font-bold tracking-tight">
              {doc.name}
            </h1>

            {/* Official Portal Filing Tracking Option */}
            <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isPortalUploaded}
                  onChange={handleTogglePortalUploaded}
                  className="h-4 w-4 rounded border-[#CBD5E1] text-[#0F172A] focus:ring-[#0F172A] cursor-pointer"
                />
                <span className="text-xs font-bold text-[#0F172A]">
                  Mark as Uploaded on Official Portal
                </span>
              </label>

              <span
                className={`text-[10px] px-2.5 py-0.5 rounded-full font-mono font-bold self-start sm:self-auto ${
                  isPortalUploaded
                    ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                    : "bg-slate-100 text-slate-600 border border-slate-200"
                }`}
              >
                {isPortalUploaded ? "FILED ON OFFICIAL PORTAL" : "NOT YET UPLOADED ON PORTAL"}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-6 text-xs text-[#64748B] pt-1">
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

          {/* Software Verification Layer Details */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-blue-700" />
                <span>Document Verification Details</span>
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200">
                Layer 2: Software Verified
              </span>
            </div>

            <div className="p-5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-4 text-xs">
              {/* Software checks breakdown */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 bg-white rounded-lg border border-[#E2E8F0] space-y-1">
                  <div className="flex items-center gap-1.5 text-emerald-700 font-bold">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>1. File Type for Compliance</span>
                  </div>
                  <p className="text-[11px] text-[#64748B]">
                    Mandated format {doc.fileFormat} validated ({doc.fileSize}). Within 10 MB statutory portal cap.
                  </p>
                </div>

                <div className="p-3 bg-white rounded-lg border border-[#E2E8F0] space-y-1">
                  <div className="flex items-center gap-1.5 text-emerald-700 font-bold">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>2. Mandatory Fields Filled</span>
                  </div>
                  <p className="text-[11px] text-[#64748B]">
                    Title, Category, Reference Code ({doc.code}), and Expiry date fully recorded.
                  </p>
                </div>

                <div className="p-3 bg-white rounded-lg border border-[#E2E8F0] space-y-1">
                  <div className="flex items-center gap-1.5 text-emerald-700 font-bold">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>3. Format & Expiry Compliance</span>
                  </div>
                  <p className="text-[11px] text-[#64748B]">
                    Prescribed statutory layout validated. Active validity until {doc.validUntil}.
                  </p>
                </div>

                <div className="p-3 bg-white rounded-lg border border-[#E2E8F0] space-y-1">
                  <div className="flex items-center gap-1.5 text-blue-700 font-bold">
                    <CheckCircle2 className="h-3.5 w-3.5 text-blue-600" />
                    <span>4. AI Pre-Validation & OCR</span>
                  </div>
                  <p className="text-[11px] text-[#64748B]">
                    OCR verified against {doc.clauseLinked}. Relevant to {doc.authority} compliance.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-[#E2E8F0]">
                <span className="text-[#64748B]">Statutory Linked Clause:</span>
                <span className="font-mono font-semibold text-[#0F172A]">{doc.clauseLinked}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#64748B]">Last Verified Date:</span>
                <span className="font-medium text-[#0F172A]">{doc.lastUpdated}</span>
              </div>
              <div className="pt-2 border-t border-[#E2E8F0] text-[#475569] leading-relaxed">
                <strong className="text-[#0F172A]">Pre-Validation & Audit Notes:</strong> {doc.notes}
              </div>

              {/* Layer 1 notice */}
              <div className="p-2.5 rounded-lg bg-blue-50/50 border border-blue-200 text-[11px] text-[#475569]">
                <strong className="text-blue-900">Admin-Level Verification:</strong> Manual inspection by an official auditor/administrator is scheduled for a future milestone.
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
                Digitally verified statutory filing evidence formatted for compliance review.
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
            <span>Official statutory verification is governed by the issuing authority. Software verification assists in pre-filing validation.</span>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
