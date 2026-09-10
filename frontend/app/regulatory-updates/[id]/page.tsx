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
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
            <Folder className="h-3.5 w-3.5 text-slate-400" />
            <Link href="/regulatory-updates" className="hover:text-slate-600">
              Regulatory Updates
            </Link>
            <ChevronRight className="h-3 w-3 text-slate-300" />
            <span className="text-slate-600 font-semibold">{item.gazetteNo}</span>
          </div>

          <Link
            href="/regulatory-updates"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Updates</span>
          </Link>
        </div>

        {/* Gazette Main Card */}
        <div className="bg-white rounded-[28px] border border-slate-200/70 p-8 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-6 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-full">
                {item.gazetteNo}
              </span>
              <span
                className={`px-3 py-1 rounded-full font-bold text-xs ${
                  item.impactLevel === "HIGH"
                    ? "bg-rose-100 text-rose-800"
                    : "bg-amber-100 text-amber-800"
                }`}
              >
                {item.impactLevel} STATUTORY IMPACT
              </span>
              <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full">
                {item.authority}
              </span>
            </div>

            <h1 className="text-2xl font-bold text-slate-950 leading-snug">
              {item.title}
            </h1>

            <div className="flex flex-wrap items-center gap-6 text-xs text-slate-500 pt-1">
              <div>
                Published: <strong className="text-slate-900">{item.publishDate}</strong>
              </div>
              <div>
                Effective Date: <strong className="text-emerald-700">{item.effectiveDate}</strong>
              </div>
              <div>
                Category: <strong className="text-slate-900">{item.category}</strong>
              </div>
            </div>
          </div>

          {/* Executive Summary */}
          <div className="space-y-2">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Regulatory Overview & Mandate
            </h2>
            <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100">
              {item.summary}
            </p>
          </div>

          {/* Detailed Compliance Requirements */}
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Enforcement Actions Required for Compliance
            </h2>
            <div className="space-y-2">
              {item.keyRequirements.map((req, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-2xl bg-white border border-slate-200/80 flex items-start gap-3 shadow-2xs text-xs"
                >
                  <span className="h-5 w-5 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span className="text-slate-800 font-medium leading-relaxed">{req}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Affected Standards */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Affected Indian Standards & Products
            </h2>
            <div className="flex flex-wrap gap-2">
              {item.affectedStandards.map((std, idx) => (
                <Link
                  key={idx}
                  href={`/standards/${std.replace(/\s+/g, "-")}`}
                  className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-1.5 rounded-xl hover:bg-indigo-100 transition-colors"
                >
                  {std} →
                </Link>
              ))}
            </div>
          </div>

          {/* External Citation Link */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <a
              href={item.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-xs font-bold text-slate-700 hover:text-slate-950"
            >
              <ExternalLink className="h-4 w-4" />
              <span>Download Official Gazette Notification (eGazette India)</span>
            </a>

            <Link
              href="/compliance"
              className="px-5 py-2 rounded-full bg-[#0f172a] text-white text-xs font-bold hover:bg-slate-800 transition-colors"
            >
              Verify Enterprise Applicability
            </Link>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
