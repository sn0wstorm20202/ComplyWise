"use client";

import React, { useState } from "react";
import { GitFork, Check, Clock, AlertTriangle, ArrowRight, ChevronDown, ChevronUp } from "lucide-react";
import { WorkflowItem } from "@/lib/mockData";
import StatusBadge from "@/components/StatusBadge";

interface WorkflowRowProps {
  workflow: WorkflowItem;
  onContinue?: (workflow: WorkflowItem) => void;
}

export function WorkflowRow({ workflow, onContinue }: WorkflowRowProps) {
  const [showSteps, setShowSteps] = useState(false);

  return (
    <div className="rounded-lg border border-slate-200/80 bg-slate-50/40 hover:bg-white hover:border-slate-300 transition-all p-4 space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-blue-900">
              {workflow.authority}
            </span>
            <span className="text-slate-300">·</span>
            <span className="text-[11px] font-mono text-slate-500">
              {workflow.standard}
            </span>
          </div>

          <h3 className="text-xs font-bold text-slate-950">
            {workflow.title}
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <StatusBadge status={workflow.status} size="sm" />
          <button
            onClick={() => setShowSteps(!showSteps)}
            className="text-slate-400 hover:text-slate-700 p-1"
          >
            {showSteps ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Stepper Progress Bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[11px]">
          <span className="font-medium text-slate-700">
            Step {workflow.current_step} of {workflow.total_steps}:{" "}
            <span className="font-semibold text-slate-950">{workflow.current_step_name}</span>
          </span>
          <span className="font-mono text-slate-400">
            {Math.round((workflow.current_step / workflow.total_steps) * 100)}%
          </span>
        </div>

        <div className="w-full h-1.5 rounded-full bg-slate-200 overflow-hidden">
          <div
            className="h-full bg-blue-900 rounded-full transition-all duration-500"
            style={{ width: `${(workflow.current_step / workflow.total_steps) * 100}%` }}
          />
        </div>
      </div>

      {/* Blocker or Action Notice if any */}
      {workflow.blocker && (
        <div className="flex items-center justify-between p-2.5 rounded-md bg-amber-50 border border-amber-200 text-xs text-amber-900">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
            <span className="font-medium text-[11px]">{workflow.blocker}</span>
          </div>
          {onContinue && (
            <button
              onClick={() => onContinue(workflow)}
              type="button"
              className="inline-flex items-center gap-1 font-bold text-amber-900 hover:underline shrink-0 text-[11px]"
            >
              <span>Action</span>
              <ArrowRight className="h-3 w-3" />
            </button>
          )}
        </div>
      )}

      {/* Detailed Steps Progression (collapsible) */}
      {showSteps && (
        <div className="pt-2 border-t border-slate-100 space-y-2">
          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            Clearance Steps & Verification Gates
          </div>
          <div className="space-y-1.5">
            {workflow.steps.map((step) => (
              <div
                key={step.number}
                className="flex items-center justify-between p-2 rounded bg-white border border-slate-100 text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      step.status === "COMPLETED"
                        ? "bg-emerald-100 text-emerald-800"
                        : step.status === "IN_PROGRESS"
                        ? "bg-blue-100 text-blue-900 ring-2 ring-blue-900/20"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {step.status === "COMPLETED" ? <Check className="h-3 w-3" /> : step.number}
                  </div>
                  <span
                    className={`font-medium ${
                      step.status === "COMPLETED"
                        ? "text-slate-800"
                        : step.status === "IN_PROGRESS"
                        ? "text-blue-950 font-bold"
                        : "text-slate-400"
                    }`}
                  >
                    {step.name}
                  </span>
                </div>
                {step.date && (
                  <span className="text-[10px] font-mono text-slate-400">
                    {step.date}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
        <span>Last activity: {workflow.last_updated}</span>
        <span className="text-slate-500">Statutory Department SLA: 30 Days</span>
      </div>
    </div>
  );
}

export default WorkflowRow;
