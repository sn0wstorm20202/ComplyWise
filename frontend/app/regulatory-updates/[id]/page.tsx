"use client";

import React, { use } from "react";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import { DEMO_REGULATORY_UPDATES } from "@/data/demo/regulatory-updates";
import {
  Folder,
  ChevronRight,
  ArrowLeft,
  ExternalLink,
  ShieldCheck,
  Building2,
  Calendar,
  AlertTriangle,
  FileText,
} from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function RegulatoryUpdateDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const updateId = resolvedParams.id;

  const item =
    DEMO_REGULATORY_UPDATES.find((u) => u.id === updateId) ||
    DEMO_REGULATORY_UPDATES[0];

  return (
    <AppShell activeView="updates">
      <div className="space-y-6 pb-6 select-none max-w-4xl mx-auto">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2 text-xs text-[#777a88]">
            <Folder className="h-3.5 w-3.5 text-[#5e616e]" />
            <Link href="/regulatory-updates" className="hover:text-[#ffffff] transition-colors">
              Regulatory Updates
            </Link>
            <ChevronRight className="h-3 w-3 text-[#5e616e]" />
            <span className="text-[#e2e3e9] font-mono font-medium">{item.gazetteNo}</span>
          </div>

          <Link
            href="/regulatory-updates"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#9194a1] hover:text-[#ffffff] transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Updates</span>
          </Link>
        </div>

        {/* Gazette Main Card */}
        <div className="bg-[#040406] rounded-[10px] border border-[#1c1d22] p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="border-b border-[#1c1d22] pb-6 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-semibold text-[#e2e3e9] bg-[#121317] border border-[#2e3038] px-3 py-1 rounded-full">
                {item.gazetteNo}
              </span>
              <span
                className={`px-3 py-1 rounded-full font-semibold text-xs border font-mono uppercase text-[10px] ${
                  item.impactLevel === "HIGH"
                    ? "bg-rose-950/40 text-rose-300 border-rose-800/60"
                    : "bg-amber-950/40 text-amber-300 border-amber-800/60"
                }`}
              >
                {item.impactLevel} STATUTORY IMPACT
              </span>
              <span className="text-xs font-semibold text-[#cc9166] bg-[#cc9166]/10 border border-[#cc9166]/30 px-3 py-1 rounded-full">
                {item.authority}
              </span>
            </div>

            <h1 className="font-serif text-2xl sm:text-3xl text-[#ffffff] leading-snug font-normal">
              {item.title}
            </h1>

            <div className="flex flex-wrap items-center gap-6 text-xs text-[#9194a1] pt-2">
              <div>
                Published: <strong className="text-[#ffffff] font-medium">{item.publishDate}</strong>
              </div>
              <div>
                Effective Date: <strong className="text-emerald-400 font-medium">{item.effectiveDate}</strong>
              </div>
              <div>
                Category: <strong className="text-[#ffffff] font-medium">{item.category}</strong>
              </div>
            </div>
          </div>

          {/* Executive Summary */}
          <div className="space-y-2">
            <h2 className="text-xs font-semibold text-[#ffffff] uppercase tracking-wider">
              Regulatory Overview & Mandate
            </h2>
            <p className="text-xs text-[#e2e3e9] leading-relaxed bg-[#121317] p-4 rounded-[10px] border border-[#1c1d22]">
              {item.summary}
            </p>
          </div>

          {/* Detailed Compliance Requirements */}
          <div className="space-y-3">
            <h2 className="text-xs font-semibold text-[#ffffff] uppercase tracking-wider">
              Enforcement Actions Required for Compliance
            </h2>
            <div className="space-y-2.5">
              {item.keyRequirements.map((req, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-[10px] bg-[#121317] border border-[#1c1d22] flex items-start gap-3 text-xs"
                >
                  <span className="h-5 w-5 rounded-full bg-[#cc9166] text-black flex items-center justify-center font-bold font-mono text-[11px] shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span className="text-[#e2e3e9] font-medium leading-relaxed">{req}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Affected Standards */}
          <div className="space-y-2 pt-3 border-t border-[#1c1d22]">
            <h2 className="text-xs font-semibold text-[#ffffff] uppercase tracking-wider">
              Affected Indian Standards & Products
            </h2>
            <div className="flex flex-wrap gap-2 pt-1">
              {item.affectedStandards.map((std, idx) => (
                <Link
                  key={idx}
                  href={`/standards/${std.replace(/\s+/g, "-")}`}
                  className="font-mono text-xs font-semibold text-[#cc9166] bg-[#cc9166]/10 border border-[#cc9166]/30 px-3 py-1.5 rounded-full hover:bg-[#cc9166]/20 transition-colors"
                >
                  {std} →
                </Link>
              ))}
            </div>
          </div>

          {/* External Citation Link */}
          <div className="pt-4 border-t border-[#1c1d22] flex items-center justify-between">
            <a
              href={item.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-xs font-medium text-[#9194a1] hover:text-[#ffffff] transition-colors"
            >
              <ExternalLink className="h-4 w-4 text-[#cc9166]" />
              <span>Download Official Gazette Notification (eGazette India)</span>
            </a>

            <Link
              href="/compliance"
              className="px-5 py-2 rounded-full bg-[#ffffff] text-[#08080a] text-xs font-semibold hover:bg-[#e2e3e9] transition-all shadow-md"
            >
              Verify Enterprise Applicability
            </Link>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
