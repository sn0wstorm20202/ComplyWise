"use client";

import React, { use } from "react";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import WorkflowPipeline from "@/components/workflows/WorkflowPipeline";
import { DEMO_WORKFLOWS } from "@/data/demo/workflows";
import {
  Folder,
  ChevronRight,
  ArrowLeft,
  Calendar,
  Building2,
  FileCheck,
  CheckCircle2,
} from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function WorkflowDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const wfId = resolvedParams.id;

  const wf =
    DEMO_WORKFLOWS.find((w) => w.id === wfId || w.standardCode === wfId) ||
    DEMO_WORKFLOWS[0];

  return (
    <AppShell activeView="workflows">
      <div className="space-y-6 pb-6 select-none max-w-5xl mx-auto">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
            <Folder className="h-3.5 w-3.5 text-slate-400" />
            <Link href="/workflows" className="hover:text-slate-600">
              Workflows
            </Link>
            <ChevronRight className="h-3 w-3 text-slate-300" />
            <span className="text-slate-600 font-semibold">{wf.standardCode}</span>
          </div>

          <Link
            href="/workflows"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Workflows</span>
          </Link>
        </div>

        {/* Real Interactive Workflow Pipeline */}
        <WorkflowPipeline
          workflow={wf}
          onActionClick={(stage) => {
            alert(`Opening action drawer for Stage ${stage.number}: ${stage.name}`);
          }}
        />
      </div>
    </AppShell>
  );
}
