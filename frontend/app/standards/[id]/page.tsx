"use client";

import React, { use } from "react";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import { DEMO_STANDARDS } from "@/data/demo/standards";
import {
  Folder,
  ChevronRight,
  ArrowLeft,
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
          <div className="flex items-center gap-2 text-xs text-[#64748B]">
            <Folder className="h-3.5 w-3.5 text-[#64748B]" />
            <Link href="/standards" className="hover:text-[#0F172A] transition-colors">
              Standards
            </Link>
            <ChevronRight className="h-3 w-3 text-[#CBD5E1]" />
            <span className="text-[#0F172A] font-mono font-medium">{standard.code}</span>
          </div>

          <Link
            href="/standards"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#64748B] hover:text-[#0F172A] transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Standards</span>
          </Link>
        </div>

        {/* Standard Detail Card */}
        <div className="bg-white rounded-[16px] border border-[#E2E8F0] p-6 sm:p-8 shadow-2xs space-y-6">
          <div className="border-b border-[#E2E8F0] pb-6 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-semibold text-[#0F172A] bg-[#F1F5F9] px-3 py-1 rounded-full border border-[#E2E8F0]">
                {standard.code}:{standard.year}
              </span>
              <span
                className={`px-3 py-1 rounded-full font-semibold text-xs border ${
                  standard.isMandatory
                    ? "bg-rose-50 text-rose-700 border-rose-200"
                    : "bg-[#F1F5F9] text-[#64748B] border-[#E2E8F0]"
                }`}
              >
                {standard.isMandatory ? "MANDATORY QCO" : "VOLUNTARY"}
              </span>
              <span className="text-xs font-semibold text-[#0F172A] bg-[#F1F5F9] border border-[#E2E8F0] px-3 py-1 rounded-full">
                {standard.scheme}
              </span>
            </div>

            <h1 className="font-sans text-2xl sm:text-3xl text-[#0F172A] font-bold tracking-tight">
              {standard.title}
            </h1>

            <div className="flex flex-wrap items-center gap-6 text-xs text-[#64748B] pt-2">
              <div>
                Issuing Authority: <strong className="text-[#0F172A] font-semibold">{standard.authority}</strong>
              </div>
              <div>
                Applicable Clauses: <strong className="text-[#0F172A] font-mono font-semibold">{standard.applicableClauses} of {standard.totalClauses}</strong>
              </div>
              <div>
                Amendment: <strong className="text-[#0F172A] font-semibold">{standard.lastAmendment}</strong>
              </div>
            </div>
          </div>

          {/* Standard Description */}
          <div className="space-y-2">
            <h2 className="text-xs font-semibold text-[#0F172A] uppercase tracking-wider">
              Scope & Purpose
            </h2>
            <p className="text-xs text-[#334155] leading-relaxed bg-[#F8FAFC] p-4 rounded-xl border border-[#E2E8F0]">
              {standard.description}
            </p>
          </div>

          {/* Mandatory Clauses & Testing Protocol */}
          <div className="space-y-3">
            <h2 className="text-xs font-semibold text-[#0F172A] uppercase tracking-wider">
              Mandatory Testing Clauses & Acceptance Thresholds
            </h2>
            <div className="space-y-3">
              {standard.clauses.map((c) => (
                <div
                  key={c.clauseNumber}
                  className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2.5 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-[#0F172A]">
                      Clause {c.clauseNumber}: {c.clauseTitle}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono text-[10px] uppercase font-bold">
                      Mandatory
                    </span>
                  </div>
                  <div className="text-[#64748B]">
                    <strong className="text-[#0F172A]">Test Protocol:</strong> {c.testMethod}
                  </div>
                  <div className="text-[#334155] bg-white p-3 rounded-lg border border-[#E2E8F0] leading-relaxed shadow-2xs">
                    <strong className="text-[#0F172A]">Statutory Acceptance Criteria:</strong> {c.acceptanceCriteria}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action CTAs */}
          <div className="pt-4 border-t border-[#E2E8F0] flex items-center justify-between">
            <Link
              href="/compliance"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0F172A] hover:underline"
            >
              <span>View Mandate in Compliance Matrix →</span>
            </Link>

            <Link
              href="/workflows"
              className="px-5 py-2 rounded-full bg-[#18181B] text-white text-xs font-semibold hover:bg-[#27272A] transition-all shadow-2xs"
            >
              Initiate Certification Workflow
            </Link>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
