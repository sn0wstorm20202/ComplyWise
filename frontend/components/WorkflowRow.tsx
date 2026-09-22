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
    <div className="rounded-2xl border border-[#E2E8F0] dark:border-white/10 bg-white dark:bg-[#0D1117] hover:border-[#CBD5E1] dark:hover:border-white/20 hover:shadow-sm dark:hover:shadow-none transition-all p-5 sm:p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/15 px-2.5 py-0.5 rounded-full border border-blue-200 dark:border-blue-500/30">
              {workflow.authority}
            </span>
            <span className="text-[#CBD5E1] dark:text-white/20">·</span>
            <span className="text-[11px] font-mono text-[#64748B] dark:text-[#94A3B8]">
              {workflow.standard}
            </span>
          </div>

          <h3 className="text-sm font-bold text-[#0F172A] dark:text-[#F8FAFC] mt-1">
            {workflow.title}
          </h3>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <StatusBadge status={workflow.status} size="sm" />
          <button
            type="button"
            onClick={() => setShowSteps(!showSteps)}
            className="text-[#94A3B8] dark:text-[#64748B] hover:text-[#475569] dark:hover:text-[#94A3B8] p-1 rounded-full hover:bg-[#F8FAFC] dark:hover:bg-white/5 transition-colors"
          >
            {showSteps ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Stepper Progress Bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-[#475569] dark:text-[#CBD5E1]">
            Step {workflow.current_step} of {workflow.total_steps}:{" "}
            <span className="font-semibold text-[#0F172A] dark:text-[#F8FAFC]">{workflow.current_step_name}</span>
          </span>
          <span className="font-mono text-xs font-bold text-[#475569] dark:text-[#94A3B8]">
            {Math.round((workflow.current_step / workflow.total_steps) * 100)}%
          </span>
        </div>

        <div className="w-full h-2 rounded-full bg-[#F1F5F9] dark:bg-white/10 overflow-hidden">
          <div
            className="h-full bg-[#0F172A] dark:bg-blue-500 rounded-full transition-all duration-500"
            style={{ width: `${(workflow.current_step / workflow.total_steps) * 100}%` }}
          />
        </div>
      </div>

      {/* Blocker or Action Notice if any */}
      {workflow.blocker && (
        <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 text-xs text-amber-900 dark:text-amber-300">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span className="font-medium text-xs">{workflow.blocker}</span>
          </div>
          {onContinue && (
            <button
              onClick={() => onContinue(workflow)}
              type="button"
              className="inline-flex items-center gap-1 font-bold hover:underline shrink-0 text-xs"
            >
              <span>Resolve</span>
              <ArrowRight className="h-3 w-3" />
            </button>
          )}
        </div>
      )}

      {/* Detailed Steps Progression (collapsible) */}
      {showSteps && (
        <div className="pt-3 border-t border-[#F1F5F9] dark:border-white/5 space-y-2">
          <div className="text-[10px] font-semibold text-[#94A3B8] dark:text-[#64748B] uppercase tracking-wider">
            Clearance Steps & Verification Gates
          </div>
          <div className="space-y-1.5">
            {workflow.steps.map((step) => (
              <div
                key={step.number}
                className="flex items-center justify-between p-2.5 rounded-xl bg-[#F8FAFC] dark:bg-white/5 border border-[#F1F5F9] dark:border-white/5 text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      step.status === "COMPLETED"
                        ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-400"
                        : step.status === "IN_PROGRESS"
                        ? "bg-blue-100 dark:bg-blue-500/20 text-blue-800 dark:text-blue-400 ring-1 ring-blue-300 dark:ring-blue-500/40"
                        : "bg-[#E2E8F0] dark:bg-white/10 text-[#64748B] dark:text-[#94A3B8]"
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
                        ? "text-[#94A3B8] dark:text-[#64748B] line-through"
                        : step.status === "IN_PROGRESS"
                        ? "text-[#0F172A] dark:text-[#F8FAFC] font-bold"
                        : "text-[#64748B] dark:text-[#94A3B8]"
                    }`}
                  >
                    {step.name}
                  </span>
                </div>

                <div className="flex items-center gap-2 font-mono text-[11px] text-[#94A3B8] dark:text-[#64748B]">
                  {step.date && <span>Date: {step.date}</span>}
                  {step.status === "COMPLETED" && (
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">✓ Done</span>
                  )}
                  {step.status === "IN_PROGRESS" && (
                    <span className="text-blue-600 dark:text-blue-400 font-semibold">Active</span>
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
