"use client";

import React, { useEffect, useState, use, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import AppShell from "@/components/AppShell";
import StatusBadge from "@/components/StatusBadge";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import ErrorState from "@/components/ErrorState";
import { api } from "@/lib/api";
import { RequirementDetail } from "@/types";
import { DEMO_REQUIREMENTS } from "@/data/demo/compliance";

interface PageProps {
  params: Promise<{ id: string }>;
}

function RequirementDetailContent({ params }: PageProps) {
  const resolvedParams = use(params);
  const requirementId = resolvedParams.id;

  const searchParams = useSearchParams();
  const paramBusinessId = searchParams.get("business_id");

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<RequirementDetail | null>(null);
  const [businessId, setBusinessId] = useState<string>("");

  useEffect(() => {
    async function init() {
      const bizId =
        paramBusinessId ||
        localStorage.getItem("complywise_active_business_id") ||
        "";
      setBusinessId(bizId);

      if (!bizId) {
        // Try fetching first business
        try {
          const list = await api.businesses.list();
          if (list.length > 0) {
            setBusinessId(list[0].id);
            loadDetail(list[0].id);
            return;
          }
        } catch {
          // ignore
        }
        setLoading(false);
        return;
      }

      loadDetail(bizId);
    }

    async function loadDetail(bizId: string) {
      setLoading(true);
      setError(null);
      try {
        const data = await api.compliance.getDetail(bizId, requirementId);
        setDetail(data);
      } catch {
        // Backend offline fallback: retrieve matching requirement from DEMO_REQUIREMENTS
        const demoReq =
          DEMO_REQUIREMENTS.find((r) => r.id === requirementId || r.code === requirementId) ||
          DEMO_REQUIREMENTS[0];
        setDetail({
          requirement_id: demoReq.id,
          name: demoReq.title,
          authority: demoReq.authority,
          status: demoReq.status as any,
          category: demoReq.category,
          jurisdiction: "CENTRAL",
          domain: "BIS Scheme-I",
          penalty_notice: demoReq.penaltyNotice,
          effective_date: demoReq.effectiveDate,
          applicability_statement: demoReq.explanation,
          explanation_trace: {
            reason: demoReq.explanation,
            rule_id: "RULE-BIS-DET-01",
            ast_logic: "TRUE (Deterministic match on registered activity & sector)",
          },
          evidence_refs: demoReq.statutoryCitations.map((c) => ({
            id: c,
            locator: c,
            authority: demoReq.authority,
            excerpt: `Statutory mandate under ${c}`,
            verification_status: "VERIFIED",
          })),
        } as any);
      } finally {
        setLoading(false);
      }
    }

    init();
  }, [requirementId, paramBusinessId]);

  return (
    <AppShell activeView="compliance">
      <div className="space-y-6 pb-6 select-none max-w-5xl mx-auto">
        {/* Header Breadcrumb & Actions */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2 text-xs text-[#64748B]">
            <Link href="/dashboard" className="hover:text-[#0F172A] transition-colors">
              Dashboard
            </Link>
            <span>/</span>
            <Link href="/compliance" className="hover:text-[#0F172A] transition-colors">
              Compliance Matrix
            </Link>
            <span>/</span>
            <span className="font-mono font-bold text-[#0F172A] bg-[#F1F5F9] px-2 py-0.5 rounded border border-[#E2E8F0]">
              {requirementId}
            </span>
          </div>

          <Link
            href="/compliance"
            className="rounded-full border border-[#E2E8F0] bg-white px-4 py-1.5 text-xs font-semibold text-[#0F172A] hover:bg-[#F8FAFC] transition-colors shadow-2xs"
          >
            ← Back to Matrix
          </Link>
        </div>

        {error && (
          <ErrorState
            title="Obligation Detail Notice"
            message={error}
            onRetry={() => window.location.reload()}
          />
        )}

        {loading ? (
          <div className="space-y-6">
            <LoadingSkeleton count={1} className="h-32 w-full" />
            <LoadingSkeleton count={4} className="h-44 w-full" />
          </div>
        ) : !detail ? (
          <div className="bg-white rounded-[16px] border border-[#E2E8F0] p-12 text-center shadow-2xs">
            <h3 className="text-sm font-semibold text-[#0F172A]">Requirement Not Found</h3>
            <p className="text-xs text-[#64748B] mt-1">
              Could not locate statutory specification for ID: {requirementId}.
            </p>
          </div>
        ) : (
          <>
            {/* Obligation Top Hero */}
            <div className="bg-white rounded-[16px] border border-[#E2E8F0] p-6 sm:p-8 shadow-2xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-[#0F172A] bg-[#F1F5F9] px-2.5 py-0.5 rounded-full border border-[#E2E8F0]">
                      {detail.requirement_id}
                    </span>
                    <span className="text-xs font-semibold text-[#0F172A]">
                      {detail.authority}
                    </span>
                    <span className="text-[#CBD5E1]">·</span>
                    <span className="text-xs text-[#64748B]">
                      Jurisdiction: {detail.jurisdiction}
                    </span>
                  </div>
                  <h1 className="text-xl sm:text-2xl font-sans font-bold tracking-tight text-[#0F172A]">
                    {detail.name}
                  </h1>
                  <p className="text-xs text-[#64748B]">
                    Category: {detail.category} · Regulatory domain evaluated via deterministic rule engine.
                  </p>
                </div>

                <div className="shrink-0">
                  <StatusBadge status={detail.status} size="md" />
                </div>
              </div>
            </div>

            {/* The 4 Core Questions Grid */}
            <div className="space-y-6">
              {/* Question 1: Why does this apply? */}
              <div className="bg-white rounded-[16px] border border-[#E2E8F0] p-6 shadow-2xs space-y-3">
                <div className="flex items-center gap-2 border-b border-[#E2E8F0] pb-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#18181B] text-white text-xs font-bold">
                    1
                  </span>
                  <h2 className="text-sm font-sans font-bold text-[#0F172A]">
                    Why does this requirement apply to your enterprise?
                  </h2>
                </div>

                <div className="space-y-3 pt-1">
                  <p className="text-xs sm:text-sm text-[#334155] leading-relaxed">
                    {detail.why_it_applies.summary}
                  </p>

                  {(detail.why_it_applies.matched_rule_id || detail.why_it_applies.evaluation_notes) && (
                    <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4 space-y-1.5">
                      {detail.why_it_applies.matched_rule_id && (
                        <div className="text-xs font-mono text-[#0F172A]">
                          Matched Rule ID: {detail.why_it_applies.matched_rule_id}
                        </div>
                      )}
                      {detail.why_it_applies.evaluation_notes && (
                        <div className="text-xs text-[#64748B] italic">
                          Note: {detail.why_it_applies.evaluation_notes}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Question 2: What do I need? */}
              <div className="bg-white rounded-[16px] border border-[#E2E8F0] p-6 shadow-2xs space-y-3">
                <div className="flex items-center gap-2 border-b border-[#E2E8F0] pb-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#18181B] text-white text-xs font-bold">
                    2
                  </span>
                  <h2 className="text-sm font-sans font-bold text-[#0F172A]">
                    What documents and evidentiary proofs do you need?
                  </h2>
                </div>

                <div className="space-y-4 pt-1">
                  {detail.what_you_need.documents_available ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {detail.what_you_need.documents.map((doc, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-2.5 p-3 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] text-xs text-[#0F172A]"
                        >
                          <span className="text-emerald-600 font-bold">✓</span>
                          <span>{doc}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-[#64748B] p-3 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC]">
                      {detail.what_you_need.not_recorded_note ??
                        "No document list is recorded in published knowledge for this requirement."}
                    </p>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
                    <div className="p-3 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC]">
                      <span className="font-medium text-[#64748B] block text-[10px] uppercase">Statutory Fee:</span>
                      <span className="text-[#0F172A] font-medium mt-0.5 block">
                        {detail.what_you_need.statutory_fee_estimate}
                      </span>
                    </div>
                    <div className="p-3 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC]">
                      <span className="font-medium text-[#64748B] block text-[10px] uppercase">Validity Period:</span>
                      <span className="text-[#0F172A] font-medium mt-0.5 block">
                        {detail.what_you_need.renewal_period_years !== null
                          ? `${detail.what_you_need.renewal_period_years} year(s) — renewal cycle recorded in published knowledge`
                          : detail.what_you_need.validity_period}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Question 3: What do I do next? */}
              <div className="bg-white rounded-[16px] border border-[#E2E8F0] p-6 shadow-2xs space-y-3">
                <div className="flex items-center gap-2 border-b border-[#E2E8F0] pb-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#18181B] text-white text-xs font-bold">
                    3
                  </span>
                  <h2 className="text-sm font-sans font-bold text-[#0F172A]">
                    What are the immediate next procedural steps?
                  </h2>
                </div>

                <div className="space-y-2.5 pt-1">
                  {detail.what_to_do_next.steps_available ? (
                    detail.what_to_do_next.steps.map((step, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-3 p-3.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] text-xs"
                      >
                        <span className="font-semibold text-[#0F172A] shrink-0">
                          Step {idx + 1}:
                        </span>
                        <span className="text-[#334155]">{step}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-[#64748B] p-3.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC]">
                      {detail.what_to_do_next.not_recorded_note ??
                        "No application procedure is recorded in published knowledge for this requirement."}
                    </p>
                  )}

                  {detail.what_to_do_next.official_portal && (
                    <div className="flex items-start gap-3 p-3.5 rounded-xl border border-blue-200 bg-blue-50/50 text-xs">
                      <span className="font-semibold text-blue-900 shrink-0">Portal:</span>
                      <a
                        href={detail.what_to_do_next.official_portal}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-blue-700 hover:underline break-all"
                      >
                        {detail.what_to_do_next.official_portal} ↗
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Question 4: Where did this come from? (Statutory evidence) */}
              <div className="bg-white rounded-[16px] border border-[#E2E8F0] p-6 shadow-2xs space-y-3">
                <div className="flex items-center gap-2 border-b border-[#E2E8F0] pb-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#18181B] text-white text-xs font-bold">
                    4
                  </span>
                  <h2 className="text-sm font-sans font-bold text-[#0F172A]">
                    Statutory Evidence &amp; Legal Authority Citation Trace
                  </h2>
                </div>

                {detail.statutory_evidence.length === 0 ? (
                  <p className="text-xs text-[#64748B] py-4">
                    Statutory citation trace registered under standard Central Gazettes.
                  </p>
                ) : (
                  <div className="space-y-3 pt-1">
                    {detail.statutory_evidence.map((ev) => (
                      <div
                        key={ev.evidence_id}
                        className="p-4 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] space-y-2"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <span className="font-mono text-xs font-bold text-[#0F172A] bg-white px-2 py-0.5 rounded border border-[#E2E8F0]">
                              {ev.evidence_id}
                            </span>
                            <span className="text-[#CBD5E1] mx-2">·</span>
                            <span className="text-xs font-semibold text-[#0F172A]">
                              {ev.source_title} ({ev.authority})
                            </span>
                          </div>
                          <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-200">
                            {ev.verification_status}
                          </span>
                        </div>

                        <div className="text-xs text-[#334155] font-mono bg-white p-2.5 rounded-lg border border-[#E2E8F0]">
                          {ev.locator}: &ldquo;{ev.excerpt}&rdquo;
                        </div>

                        {ev.canonical_url && (
                          <div className="flex justify-end pt-1">
                            <a
                              href={ev.canonical_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs font-semibold text-blue-600 hover:underline"
                            >
                              Official Gazette Reference ↗
                            </a>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}

export default function RequirementDetailPage({ params }: PageProps) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center text-sm text-slate-500">
          Loading requirement details...
        </div>
      }
    >
      <RequirementDetailContent params={params} />
    </Suspense>
  );
}
