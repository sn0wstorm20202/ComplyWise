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
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
            <Folder className="h-3.5 w-3.5 text-slate-400" />
            <Link href="/standards" className="hover:text-slate-600">
              Standards
            </Link>
            <ChevronRight className="h-3 w-3 text-slate-300" />
            <span className="text-slate-600 font-semibold">{standard.code}</span>
          </div>

          <Link
            href="/standards"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Standards</span>
          </Link>
        </div>

        {/* Standard Detail Card */}
        <div className="bg-white rounded-[28px] border border-slate-200/70 p-8 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-6 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200">
                {standard.code}:{standard.year}
              </span>
              <span
                className={`px-3 py-1 rounded-full font-bold text-xs ${
                  standard.isMandatory
                    ? "bg-rose-100 text-rose-800"
                    : "bg-slate-100 text-slate-700"
                }`}
              >
                {standard.isMandatory ? "MANDATORY QCO" : "VOLUNTARY"}
              </span>
              <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
                {standard.scheme}
              </span>
            </div>

            <h1 className="text-2xl font-bold text-slate-950">
              {standard.title}
            </h1>

            <div className="flex flex-wrap items-center gap-6 text-xs text-slate-500 pt-1">
              <div>
                Issuing Authority: <strong className="text-slate-900">{standard.authority}</strong>
              </div>
              <div>
                Applicable Clauses: <strong className="text-indigo-700">{standard.applicableClauses} of {standard.totalClauses}</strong>
              </div>
              <div>
                Amendment: <strong className="text-slate-900">{standard.lastAmendment}</strong>
              </div>
            </div>
          </div>

          {/* Standard Description */}
          <div className="space-y-2">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Scope & Purpose
            </h2>
            <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100">
              {standard.description}
            </p>
          </div>

          {/* Mandatory Clauses & Testing Protocol */}
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Mandatory Testing Clauses & Acceptance Thresholds
            </h2>
            <div className="space-y-2.5">
              {standard.clauses.map((c) => (
                <div
                  key={c.clauseNumber}
                  className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
                      Clause {c.clauseNumber}: {c.clauseTitle}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px]">
                      Mandatory
                    </span>
                  </div>
                  <div className="text-slate-600">
                    <strong>Test Protocol:</strong> {c.testMethod}
                  </div>
                  <div className="text-slate-700 bg-slate-50 p-2.5 rounded-xl">
                    <strong>Statutory Acceptance Criteria:</strong> {c.acceptanceCriteria}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action CTAs */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <Link
              href="/compliance"
              className="inline-flex items-center gap-2 text-xs font-bold text-indigo-600 hover:text-indigo-800"
            >
              <span>View Mandate in Compliance Matrix →</span>
            </Link>

            <Link
              href="/workflows"
              className="px-5 py-2 rounded-full bg-[#0f172a] text-white text-xs font-bold hover:bg-slate-800 transition-colors"
            >
              Initiate Certification Workflow
            </Link>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
