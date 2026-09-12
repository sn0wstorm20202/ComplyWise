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
    <div className="rounded-2xl border border-slate-200/70 bg-white hover:border-slate-300 hover:shadow-xs transition-all p-5 sm:p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-blue-900 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
              {workflow.authority}
            </span>
            <span className="text-slate-300">·</span>
            <span className="text-[11px] font-mono text-slate-500">
              {workflow.standard}
            </span>
          </div>

          <h3 className="text-sm font-bold text-slate-950 mt-1">
            {workflow.title}
          </h3>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <StatusBadge status={workflow.status} size="sm" />
          <button
            type="button"
            onClick={() => setShowSteps(!showSteps)}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-full hover:bg-slate-100 transition-colors"
          >
            {showSteps ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Stepper Progress Bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-slate-700">
            Step {workflow.current_step} of {workflow.total_steps}:{" "}
            <span className="font-semibold text-slate-950">{workflow.current_step_name}</span>
          </span>
          <span className="font-mono text-xs font-bold text-slate-600">
            {Math.round((workflow.current_step / workflow.total_steps) * 100)}%
          </span>
        </div>

        <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
          <div
            className="h-full bg-[#0f172a] rounded-full transition-all duration-500"
            style={{ width: `${(workflow.current_step / workflow.total_steps) * 100}%` }}
          />
        </div>
      </div>

      {/* Blocker or Action Notice if any */}
      {workflow.blocker && (
        <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
            <span className="font-medium text-xs">{workflow.blocker}</span>
          </div>
          {onContinue && (
            <button
              onClick={() => onContinue(workflow)}
              type="button"
              className="inline-flex items-center gap-1 font-bold text-amber-900 hover:underline shrink-0 text-xs"
            >
              <span>Resolve</span>
              <ArrowRight className="h-3 w-3" />
            </button>
          )}
        </div>
      )}

      {/* Detailed Steps Progression (collapsible) */}
      {showSteps && (
        <div className="pt-3 border-t border-slate-100 space-y-2">
          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            Clearance Steps & Verification Gates
          </div>
          <div className="space-y-1.5">
            {workflow.steps.map((step) => (
              <div
                key={step.number}
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      step.status === "COMPLETED"
                        ? "bg-emerald-100 text-emerald-800"
                        : step.status === "IN_PROGRESS"
                        ? "bg-blue-100 text-blue-800 ring-1 ring-blue-300"
                        : "bg-slate-200 text-slate-500"
                    }`}
                  >
                    {step.status === "COMPLETED" ? (
                      <Check className="h-3 w-3" />
                    ) : (
                      step.number
                    )}
                  </div>
                  <span
                    className={`font-medium ${
                      step.status === "COMPLETED"
                        ? "text-slate-500 line-through"
                        : step.status === "IN_PROGRESS"
                        ? "text-slate-900 font-bold"
                        : "text-slate-600"
                    }`}
                  >
                    {step.name}
                  </span>
                </div>

                <div className="flex items-center gap-2 font-mono text-[11px] text-slate-400">
                  {step.date && <span>Date: {step.date}</span>}
                  {step.status === "COMPLETED" && (
                    <span className="text-emerald-700 font-semibold">✓ Done</span>
                  )}
                  {step.status === "IN_PROGRESS" && (
                    <span className="text-blue-700 font-semibold">Active</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default WorkflowRow;
