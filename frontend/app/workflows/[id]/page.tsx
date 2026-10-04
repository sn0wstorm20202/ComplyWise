"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import ErrorState from "@/components/ErrorState";
import { api } from "@/lib/api";
import type { ComplianceCaseDetail } from "@/types";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock,
  FileText,
  Folder,
  ChevronRight,
  Layers,
  Shield,
  Sparkles,
  UserCheck,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function WorkflowDetailPage({ params }: PageProps) {
  const { t } = useLanguage();
  const router = useRouter();
  const resolvedParams = use(params);
  const wfId = resolvedParams.id;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [caseData, setCaseData] = useState<ComplianceCaseDetail | null>(null);
  const [selectedStage, setSelectedStage] = useState<number>(1);

  useEffect(() => {
    loadCaseData();
  }, [wfId]);

  async function loadCaseData() {
    setLoading(true);
    setError(null);
    try {
      const data = await api.cases.getCase(wfId);
      setCaseData(data);
    } catch {
      // If not a case UUID, redirect back to /workflows
      router.push("/workflows");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <AppShell activeView="workflows">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <LoadingSkeleton count={4} />
        </div>
      </AppShell>
    );
  }

  if (error || !caseData) {
    return (
      <AppShell activeView="workflows">
        <div className="max-w-5xl mx-auto px-4 py-8 space-y-4">
          <ErrorState message={error || "Could not find compliance workflow."} onRetry={loadCaseData} />
          <Link href="/workflows" className="text-xs text-primary underline">
            &larr; Return to Workflows
          </Link>
        </div>
      </AppShell>
    );
  }

  const docReqs = caseData.document_requirements || [];
  const docsReqCount = docReqs.length;
  const docsUpCount = docReqs.filter((d) => !!d.latest_submission).length;
  const docsAppCount = docReqs.filter(
    (d) =>
      d.status_code === "VERIFIED" ||
      d.latest_submission?.status_code === "INTERNAL_HUMAN_APPROVED"
  ).length;

  const isCompleted = caseData.status_code === "COMPLETED";
  const isExternal = caseData.status_code === "EXTERNAL_PROCESSING";
  const isSubmitted = caseData.status_code === "SUBMITTED";
  const isHumanReview = caseData.status_code === "HUMAN_REVIEW";
  const isActionReq = caseData.status_code === "ACTION_REQUIRED";

  const stage1Complete = docsReqCount > 0 && docsUpCount >= docsReqCount;
  const stage1Status = isCompleted || stage1Complete ? "COMPLETED" : "IN_PROGRESS";

  const stage2Status = isCompleted
    ? "COMPLETED"
    : stage1Complete
    ? "COMPLETED"
    : docsUpCount > 0
    ? "IN_PROGRESS"
    : "WAITING";

  const stage3Complete = isCompleted || isExternal || isSubmitted || (docsReqCount > 0 && docsAppCount >= docsReqCount);
  let stage3Status: "COMPLETED" | "IN_PROGRESS" | "WAITING" | "ACTION_REQUIRED" = "WAITING";
  if (isCompleted || stage3Complete) stage3Status = "COMPLETED";
  else if (isActionReq) stage3Status = "ACTION_REQUIRED";
  else if (isHumanReview || (stage1Complete && !stage3Complete)) stage3Status = "IN_PROGRESS";

  let progress = 15;
  if (isCompleted) progress = 100;
  else if (isExternal) progress = 85;
  else if (isSubmitted) progress = 70;
  else if (stage3Complete) progress = 60;
  else if (stage3Status === "ACTION_REQUIRED") progress = 35;
  else if (stage3Status === "IN_PROGRESS") progress = 45;
  else if (stage1Complete) progress = 30;
  else if (docsUpCount > 0) progress = 20;

  const stages = [
    {
      number: 1,
      name: "Document Collection",
      desc: `${docsUpCount} of ${docsReqCount} required statutory documents uploaded.`,
      status: stage1Status,
      link: "/documents",
      linkLabel: "Manage Evidence in Documents →",
    },
    {
      number: 2,
      name: "AI Pre-Validation",
      desc: "OCR text extraction and format integrity verification.",
      status: stage2Status,
    },
    {
      number: 3,
      name: "Officer Scrutiny",
      desc:
        stage3Status === "COMPLETED"
          ? "Officer scrutiny approved."
          : stage3Status === "ACTION_REQUIRED"
          ? "Clarification query raised by officer."
          : "Under review by compliance officer.",
      status: stage3Status,
      link: stage3Status === "ACTION_REQUIRED" ? "/documents" : undefined,
      linkLabel: "Resolve Query in Documents →",
    },
    {
      number: 4,
      name: "Form Preparation & Filing",
      desc: "Statutory application dossier generated with verified evidence attachments.",
      status: isCompleted || isExternal ? "COMPLETED" : isSubmitted ? "IN_PROGRESS" : "WAITING",
    },
    {
      number: 5,
      name: "Authority Processing",
      desc: `Statutory synchronization with ${caseData.authority} official portal.`,
      status: isCompleted ? "COMPLETED" : isExternal ? "IN_PROGRESS" : "WAITING",
    },
    {
      number: 6,
      name: "Clearance Granted",
      desc: "Full statutory compliance confirmed & renewal anchored.",
      status: isCompleted ? "COMPLETED" : "WAITING",
    },
  ];

  return (
    <AppShell activeView="workflows">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Folder className="h-3.5 w-3.5 text-muted-foreground" />
            <Link href="/workflows" className="hover:text-foreground transition-colors">
              Workflows
            </Link>
            <ChevronRight className="h-3 w-3 text-muted-foreground" />
            <span className="text-foreground font-mono font-bold">{caseData.case_number}</span>
          </div>

          <Link
            href="/workflows"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to All Workflows</span>
          </Link>
        </div>

        {/* Workflow Detail Box */}
        <div className="p-6 sm:p-8 rounded-2xl border border-border bg-card shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-border pb-5">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-[var(--ui-sage)] bg-[var(--ui-sage-soft)] dark:bg-[var(--ui-sage)] px-2 py-0.5 rounded">
                  {caseData.case_number}
                </span>
                <span className="text-xs font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded">
                  {caseData.authority}
                </span>
              </div>
              <h1 className="text-2xl font-bold text-foreground mt-2">{caseData.requirement_name}</h1>
              <p className="text-xs text-muted-foreground mt-1">
                Statutory Approval Process &bull; Synchronized with regulatory review.
              </p>
            </div>

            <div className="flex flex-col sm:items-end gap-1.5 shrink-0">
              <span className="font-mono text-base font-extrabold text-[var(--ui-sage)]">
                {progress}% Completed
              </span>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-[var(--ui-sage-soft)] text-[var(--ui-sage)] dark:bg-[var(--ui-sage)] dark:text-[var(--ui-sage)]">
                {caseData.status_code.replace(/_/g, " ")}
              </span>
            </div>
          </div>

          {/* Stepper Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {stages.map((st) => {
              const isDone = st.status === "COMPLETED";
              const isInProg = st.status === "IN_PROGRESS";
              const isAct = st.status === "ACTION_REQUIRED";

              return (
                <div
                  key={st.number}
                  className={`p-3.5 rounded-xl border text-xs space-y-2 transition-all ${
                    isDone
                      ? "border-[var(--ui-sage-soft)] bg-[var(--ui-sage-faint)]/50 text-[var(--ui-sage)] dark:border-[var(--ui-sage-soft)] dark:bg-[var(--ui-sage)]/20 dark:text-[var(--ui-sage)]"
                      : isAct
                      ? "border-amber-300 bg-amber-50/60 text-amber-900 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-300"
                      : isInProg
                      ? "border-[var(--ui-sage-soft)] bg-[var(--ui-sage-faint)]/50 text-[var(--ui-sage)] dark:border-[var(--ui-sage-soft)] dark:bg-[var(--ui-sage)]/20 dark:text-[var(--ui-sage)]"
                      : "border-border bg-muted/20 text-muted-foreground opacity-60"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold">STAGE {st.number}</span>
                    {isDone ? (
                      <CheckCircle2 className="w-4 h-4 text-[var(--ui-sage)]" />
                    ) : isAct ? (
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                    ) : isInProg ? (
                      <Clock className="w-4 h-4 text-[var(--ui-sage)] animate-spin" />
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-muted-foreground/30" />
                    )}
                  </div>
                  <div className="font-bold line-clamp-1">{st.name}</div>
                  <p className="text-[11px] opacity-80 line-clamp-2">{st.desc}</p>
                  {st.link && st.linkLabel && (
                    <Link href={st.link} className="text-[11px] font-bold underline block mt-1">
                      {st.linkLabel}
                    </Link>
                  )}
                </div>
              );
            })}
          </div>

          <div className="pt-4 border-t border-border flex items-center justify-between">
            <Link
              href="/documents"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--ui-sage)] hover:bg-[var(--ui-sage)] text-white text-xs font-semibold shadow-sm transition-colors"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Go to Statutory Documents Section &rarr;</span>
            </Link>

            <Link
              href="/compliance"
              className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
            >
              View Compliance Requirements &rarr;
            </Link>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
