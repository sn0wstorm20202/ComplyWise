"use client";

import React from "react";
import Link from "next/link";
import { GitFork, ArrowUpRight, Clock, ShieldCheck } from "lucide-react";
import WorkflowNode from "../workflows/WorkflowNode";
import WorkflowConnector from "../workflows/WorkflowConnector";

export interface WorkflowStageItem {
  id: string;
  name: string;
  status: "completed" | "active" | "pending" | "blocked";
  sla?: string;
}

export interface WorkflowComponentProps {
  workflowId?: string;
  title?: string;
  authority?: string;
  scheme?: string;
  stages?: WorkflowStageItem[];
  currentStageIndex?: number;
  overallStatus?: string;
  onViewDetails?: () => void;
  className?: string;
}

export function WorkflowComponent({
  workflowId = "wf-bis-01",
  title = "BIS ISI Mark Scheme-I Certification",
  authority = "Bureau of Indian Standards",
  scheme = "Scheme-I",
  stages = [
    { id: "s1", name: "Documentation", status: "completed", sla: "Done" },
    { id: "s2", name: "Lab Testing", status: "completed", sla: "Done" },
    { id: "s3", name: "Factory Audit", status: "active", sla: "6d left" },
    { id: "s4", name: "Grant of License", status: "pending", sla: "15d" },
  ],
  overallStatus = "In Progress",
  onViewDetails,
  className = "",
}: WorkflowComponentProps) {
  return (
    <div className={`bg-white rounded-[28px] p-6 border border-slate-200/60 shadow-xs space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-mono font-bold text-[10px] border border-indigo-100">
              <GitFork className="h-3 w-3" />
              <span>{scheme}</span>
            </span>
            <span className="text-xs font-semibold text-slate-500">
              {authority}
            </span>
          </div>
          <h3 className="text-base font-bold text-slate-900 tracking-tight">
            {title}
          </h3>
        </div>

        {onViewDetails ? (
          <button
            type="button"
            onClick={onViewDetails}
            aria-label="View workflow details"
            className="h-8 w-8 rounded-full bg-slate-100 hover:bg-slate-200/70 flex items-center justify-center text-slate-600 transition-colors"
          >
            <ArrowUpRight className="h-3.5 w-3.5" />
          </button>
        ) : (
          <Link
            href={`/workflows/${workflowId}`}
            className="h-8 w-8 rounded-full bg-slate-100 hover:bg-slate-200/70 flex items-center justify-center text-slate-600 transition-colors"
          >
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>

      {/* Node Pipeline View */}
      <div className="pt-2 flex items-center justify-between w-full overflow-x-auto pb-2">
        {stages.map((stage, idx) => (
          <React.Fragment key={stage.id}>
            <WorkflowNode
              id={stage.id}
              name={stage.name}
              stageNumber={idx + 1}
              status={stage.status}
              sla={stage.sla}
            />
            {idx < stages.length - 1 && (
              <WorkflowConnector
                isCompleted={stages[idx + 1].status === "completed" || stage.status === "completed"}
                isActive={stage.status === "active"}
              />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Bottom Status Bar */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
        <div className="flex items-center gap-1.5 text-slate-500 font-medium">
          <Clock className="h-3.5 w-3.5 text-slate-400" />
          <span>Stage 3 of 4: Factory Audit scheduled at Vadodara plant</span>
        </div>
        <span className="inline-flex items-center gap-1 font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full">
          <ShieldCheck className="h-3 w-3" />
          <span>{overallStatus}</span>
        </span>
      </div>
    </div>
  );
}

export default WorkflowComponent;
