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
          <div className="flex items-center gap-2 text-xs text-[#64748B]">
            <Folder className="h-3.5 w-3.5 text-[#64748B]" />
            <Link href="/workflows" className="hover:text-[#0F172A] transition-colors">
              Workflows
            </Link>
            <ChevronRight className="h-3 w-3 text-[#CBD5E1]" />
            <span className="text-[#0F172A] font-mono font-medium">{wf.standardCode}</span>
          </div>

          <Link
            href="/workflows"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#64748B] hover:text-[#0F172A] transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Roadmaps</span>
          </Link>
        </div>

        {/* Real Interactive Workflow Pipeline */}
        <WorkflowPipeline
          workflow={wf}
          onActionClick={(stage) => {
            alert(`Opening statutory action dossier for Stage ${stage.number}: ${stage.name}`);
          }}
        />
      </div>
    </AppShell>
  );
}
