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
          <div className="flex items-center gap-2 text-xs text-[#64748B]">
            <Folder className="h-3.5 w-3.5 text-[#64748B]" />
            <Link href="/regulatory-updates" className="hover:text-[#0F172A] transition-colors">
              Regulatory Updates
            </Link>
            <ChevronRight className="h-3 w-3 text-[#CBD5E1]" />
            <span className="text-[#0F172A] font-mono font-medium">{item.gazetteNo}</span>
          </div>

          <Link
            href="/regulatory-updates"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#64748B] hover:text-[#0F172A] transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Updates</span>
          </Link>
        </div>

        {/* Gazette Main Card */}
        <div className="bg-white rounded-[16px] border border-[#E2E8F0] p-6 sm:p-8 shadow-2xs space-y-6">
          <div className="border-b border-[#E2E8F0] pb-6 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-semibold text-[#0F172A] bg-[#F1F5F9] border border-[#E2E8F0] px-3 py-1 rounded-full">
                {item.gazetteNo}
              </span>
              <span
                className={`px-3 py-1 rounded-full font-semibold text-xs border font-mono uppercase text-[10px] ${
                  item.impactLevel === "HIGH"
                    ? "bg-rose-50 text-rose-700 border-rose-200"
                    : "bg-amber-50 text-amber-700 border-amber-200"
                }`}
              >
                {item.impactLevel} STATUTORY IMPACT
              </span>
              <span className="text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1 rounded-full">
                {item.authority}
              </span>
            </div>

            <h1 className="font-sans text-2xl sm:text-3xl text-[#0F172A] font-bold leading-snug">
              {item.title}
            </h1>

            <div className="flex flex-wrap items-center gap-6 text-xs text-[#64748B] pt-2">
              <div>
                Published: <strong className="text-[#0F172A] font-semibold">{item.publishDate}</strong>
              </div>
              <div>
                Effective Date: <strong className="text-emerald-700 font-semibold">{item.effectiveDate}</strong>
              </div>
              <div>
                Category: <strong className="text-[#0F172A] font-semibold">{item.category}</strong>
              </div>
            </div>
          </div>

          {/* Executive Summary */}
          <div className="space-y-2">
            <h2 className="text-xs font-semibold text-[#0F172A] uppercase tracking-wider">
              Regulatory Overview & Mandate
            </h2>
            <p className="text-xs text-[#334155] leading-relaxed bg-[#F8FAFC] p-4 rounded-xl border border-[#E2E8F0]">
              {item.summary}
            </p>
          </div>

          {/* Detailed Compliance Requirements */}
          <div className="space-y-3">
            <h2 className="text-xs font-semibold text-[#0F172A] uppercase tracking-wider">
              Enforcement Actions Required for Compliance
            </h2>
            <div className="space-y-2.5">
              {item.keyRequirements.map((req, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-start gap-3 text-xs"
                >
                  <span className="h-5 w-5 rounded-full bg-[#18181B] text-white flex items-center justify-center font-bold font-mono text-[11px] shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span className="text-[#334155] font-medium leading-relaxed">{req}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Affected Standards */}
          <div className="space-y-2 pt-3 border-t border-[#E2E8F0]">
            <h2 className="text-xs font-semibold text-[#0F172A] uppercase tracking-wider">
              Affected Indian Standards & Products
            </h2>
            <div className="flex flex-wrap gap-2 pt-1">
              {item.affectedStandards.map((std, idx) => (
                <Link
                  key={idx}
                  href={`/standards/${std.replace(/\s+/g, "-")}`}
                  className="font-mono text-xs font-semibold text-[#0F172A] bg-[#F1F5F9] border border-[#E2E8F0] px-3 py-1.5 rounded-full hover:bg-[#E2E8F0] transition-colors"
                >
                  {std} →
                </Link>
              ))}
            </div>
          </div>

          {/* External Citation Link */}
          <div className="pt-4 border-t border-[#E2E8F0] flex items-center justify-between">
            <a
              href={item.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-xs font-semibold text-blue-600 hover:underline transition-colors"
            >
              <ExternalLink className="h-4 w-4 text-blue-600" />
              <span>Download Official Gazette Notification (eGazette India)</span>
            </a>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
