"use client";

import React, { use } from "react";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import { DEMO_STANDARDS } from "@/data/demo/standards";
import {
  Folder,
  ChevronRight,
  ArrowLeft,
  Target,
  ShieldCheck,
  Building2,
  Calendar,
  CheckCircle2,
  ExternalLink,
  BookOpen,
} from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function StandardDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const stdId = resolvedParams.id;

  const normalizedId = stdId.replace(/-/g, " ");
  const standard =
    DEMO_STANDARDS.find(
      (s) =>
        s.id.toLowerCase() === stdId.toLowerCase() ||
        s.code.toLowerCase() === normalizedId.toLowerCase()
    ) || DEMO_STANDARDS[0];

  return (
    <AppShell activeView="standards">
      <div className="space-y-6 pb-6 select-none max-w-4xl mx-auto">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2 text-xs text-[#777a88]">
            <Folder className="h-3.5 w-3.5 text-[#5e616e]" />
            <Link href="/standards" className="hover:text-[#ffffff] transition-colors">
              Standards
            </Link>
            <ChevronRight className="h-3 w-3 text-[#5e616e]" />
            <span className="text-[#e2e3e9] font-mono font-medium">{standard.code}</span>
          </div>

          <Link
            href="/standards"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#9194a1] hover:text-[#ffffff] transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Standards</span>
          </Link>
        </div>

        {/* Standard Detail Card */}
        <div className="bg-[#040406] rounded-[10px] border border-[#1c1d22] p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="border-b border-[#1c1d22] pb-6 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-semibold text-[#e2e3e9] bg-[#121317] px-3 py-1 rounded-full border border-[#2e3038]">
                {standard.code}:{standard.year}
              </span>
              <span
                className={`px-3 py-1 rounded-full font-semibold text-xs border ${
                  standard.isMandatory
                    ? "bg-rose-950/40 text-rose-300 border-rose-800/60"
                    : "bg-[#121317] text-[#9194a1] border-[#1c1d22]"
                }`}
              >
                {standard.isMandatory ? "MANDATORY QCO" : "VOLUNTARY"}
              </span>
              <span className="text-xs font-semibold text-[#cc9166] bg-[#cc9166]/10 border border-[#cc9166]/30 px-3 py-1 rounded-full">
                {standard.scheme}
              </span>
            </div>

            <h1 className="font-serif text-2xl sm:text-3xl text-[#ffffff] font-normal">
              {standard.title}
            </h1>

            <div className="flex flex-wrap items-center gap-6 text-xs text-[#9194a1] pt-2">
              <div>
                Issuing Authority: <strong className="text-[#ffffff] font-medium">{standard.authority}</strong>
              </div>
              <div>
                Applicable Clauses: <strong className="text-[#cc9166] font-mono">{standard.applicableClauses} of {standard.totalClauses}</strong>
              </div>
              <div>
                Amendment: <strong className="text-[#ffffff] font-medium">{standard.lastAmendment}</strong>
              </div>
            </div>
          </div>

          {/* Standard Description */}
          <div className="space-y-2">
            <h2 className="text-xs font-semibold text-[#ffffff] uppercase tracking-wider">
              Scope & Purpose
            </h2>
            <p className="text-xs text-[#e2e3e9] leading-relaxed bg-[#121317] p-4 rounded-[10px] border border-[#1c1d22]">
              {standard.description}
            </p>
          </div>

          {/* Mandatory Clauses & Testing Protocol */}
          <div className="space-y-3">
            <h2 className="text-xs font-semibold text-[#ffffff] uppercase tracking-wider">
              Mandatory Testing Clauses & Acceptance Thresholds
            </h2>
            <div className="space-y-3">
              {standard.clauses.map((c) => (
                <div
                  key={c.clauseNumber}
                  className="p-4 rounded-[10px] bg-[#121317] border border-[#1c1d22] space-y-2.5 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-semibold text-[#cc9166]">
                      Clause {c.clauseNumber}: {c.clauseTitle}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-950/40 text-emerald-300 border border-emerald-800/50 font-mono text-[10px] uppercase">
                      Mandatory
                    </span>
                  </div>
                  <div className="text-[#9194a1]">
                    <strong className="text-[#ffffff]">Test Protocol:</strong> {c.testMethod}
                  </div>
                  <div className="text-[#e2e3e9] bg-[#040406] p-3 rounded-lg border border-[#2e3038]/60 leading-relaxed">
                    <strong className="text-[#cc9166]">Statutory Acceptance Criteria:</strong> {c.acceptanceCriteria}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action CTAs */}
          <div className="pt-4 border-t border-[#1c1d22] flex items-center justify-between">
            <Link
              href="/compliance"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[#cc9166] hover:underline"
            >
              <span>View Mandate in Compliance Matrix →</span>
            </Link>

            <Link
              href="/workflows"
              className="px-5 py-2 rounded-full bg-[#ffffff] text-[#08080a] text-xs font-semibold hover:bg-[#e2e3e9] transition-all shadow-lg"
            >
              Initiate Certification Workflow
            </Link>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
