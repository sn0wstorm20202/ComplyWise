"use client";

import React, { useState } from "react";
import { Check, Clock, AlertTriangle, ArrowRight, UserCheck, Calendar, ShieldCheck } from "lucide-react";
import { StatutoryWorkflow, WorkflowStageNode, DEMO_WORKFLOWS } from "@/data/demo/workflows";

interface WorkflowPipelineProps {
  workflow?: StatutoryWorkflow;
  onActionClick?: (stage: WorkflowStageNode) => void;
}

export function WorkflowPipeline({ workflow = DEMO_WORKFLOWS[0], onActionClick }: WorkflowPipelineProps) {
  const [selectedStageId, setSelectedStageId] = useState<string>(
    workflow.stages[workflow.currentStageIndex]?.id || workflow.stages[0].id
  );

  const activeStage = workflow.stages.find((s) => s.id === selectedStageId) || workflow.stages[0];

  return (
    <div className="bg-[#040406] rounded-[10px] border border-[#1c1d22] p-6 sm:p-8 shadow-2xl space-y-6">
      {/* Workflow Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1c1d22] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-semibold text-[#e2e3e9] bg-[#121317] border border-[#2e3038] px-3 py-0.5 rounded-full">
              {workflow.standardCode}
            </span>
            <span className="text-xs font-semibold text-[#cc9166] bg-[#cc9166]/10 border border-[#cc9166]/30 px-3 py-0.5 rounded-full">
              {workflow.authority}
            </span>
          </div>
          <h2 className="font-serif text-xl sm:text-2xl text-[#ffffff] font-normal mt-2">
            {workflow.title}
          </h2>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <span className="text-[#9194a1]">
            Target Deadline: <strong className="text-[#ffffff] font-medium">{workflow.dueDate}</strong>
          </span>
          <span className="px-3 py-1 rounded-full bg-[#121317] text-[#cc9166] font-semibold text-xs border border-[#cc9166]/40">
            Stage {workflow.currentStageIndex + 1} of {workflow.totalStages} Active
          </span>
        </div>
      </div>

      {/* Block Alert if any */}
      {workflow.blocker && (
        <div className="p-4 rounded-[10px] bg-amber-950/20 border border-amber-800/40 flex items-start gap-3 text-xs text-amber-200">
          <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-semibold text-amber-300 block">Active Statutory Gate Requirement:</span>
            <span className="text-amber-200/90">{workflow.blocker}</span>
          </div>
        </div>
      )}

      {/* Interactive HTML / SVG Node Timeline */}
      <div className="py-4 overflow-x-auto">
        <div className="min-w-[720px] flex items-center justify-between relative px-4">
          {/* Connector Line Behind Nodes */}
          <div className="absolute left-8 right-8 top-5 h-0.5 bg-[#1c1d22] -z-0">
            <div
              className="h-full bg-linear-to-r from-[#cc9166] to-[#f4d090] transition-all duration-500 shadow-[0_0_10px_rgba(204,145,102,0.5)]"
              style={{
                width: `${(workflow.currentStageIndex / (workflow.stages.length - 1)) * 100}%`,
              }}
            />
          </div>

          {/* Individual Stages */}
          {workflow.stages.map((stage, idx) => {
            const isCompleted = stage.status === "COMPLETED";
            const isInProgress = stage.status === "IN_PROGRESS";
            const isSelected = stage.id === selectedStageId;

            return (
              <button
                key={stage.id}
                type="button"
                onClick={() => setSelectedStageId(stage.id)}
                className="relative z-10 flex flex-col items-center group cursor-pointer focus:outline-none"
              >
                {/* Circle Node */}
                <div
                  className={`h-10 w-10 rounded-full flex items-center justify-center transition-all duration-200 ${
                    isSelected
                      ? "ring-2 ring-[#cc9166] scale-110 shadow-[0_0_15px_rgba(204,145,102,0.3)]"
                      : "group-hover:scale-105"
                  } ${
                    isCompleted
                      ? "bg-emerald-500 text-black font-bold"
                      : isInProgress
                      ? "bg-[#cc9166] text-black font-bold shadow-[0_0_15px_rgba(204,145,102,0.4)] ring-4 ring-[#cc9166]/20"
                      : "bg-[#121317] border border-[#2e3038] text-[#777a88] group-hover:border-[#5e616e]"
                  }`}
                >
                  {isCompleted ? (
                    <Check className="h-5 w-5 stroke-[2.5]" />
                  ) : isInProgress ? (
                    <div className="relative flex items-center justify-center">
                      <span className="animate-ping absolute h-3 w-3 rounded-full bg-[#cc9166] opacity-75" />
                      <span className="text-xs font-bold">{idx + 1}</span>
                    </div>
                  ) : (
                    <span className="text-xs font-mono">{idx + 1}</span>
                  )}
                </div>

                {/* Stage Label */}
                <span
                  className={`mt-2.5 text-xs font-medium whitespace-nowrap transition-colors ${
                    isSelected
                      ? "text-[#ffffff] font-semibold"
                      : isCompleted
                      ? "text-[#e2e3e9]"
                      : isInProgress
                      ? "text-[#cc9166]"
                      : "text-[#5e616e]"
                  }`}
                >
                  {stage.name}
                </span>

                {/* Status Pill */}
                <span
                  className={`mt-1 text-[10px] uppercase font-mono tracking-wider px-2 py-0.5 rounded-full border ${
                    isCompleted
                      ? "text-emerald-400 bg-emerald-950/40 border-emerald-800/50"
                      : isInProgress
                      ? "text-[#cc9166] bg-[#cc9166]/10 border-[#cc9166]/30"
                      : "text-[#5e616e] bg-[#121317] border-[#1c1d22]"
                  }`}
                >
                  {isCompleted ? "Verified" : isInProgress ? "In Progress" : "Pending"}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Stage Detail Panel */}
      <div className="rounded-[10px] border border-[#1c1d22] bg-[#121317] p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1c1d22] pb-4">
          <div className="flex items-center gap-3">
            <span className="h-8 w-8 rounded-full bg-[#cc9166] text-black font-bold text-xs flex items-center justify-center font-mono shrink-0">
              {activeStage.number}
            </span>
            <div>
              <h3 className="font-serif text-base text-[#ffffff]">
                Stage {activeStage.number}: {activeStage.name}
              </h3>
              <p className="text-xs text-[#9194a1] mt-0.5">{activeStage.description}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs text-[#9194a1]">
            <div className="flex items-center gap-1.5">
              <UserCheck className="h-3.5 w-3.5 text-[#5e616e]" />
              <span>Assigned: <strong className="text-[#ffffff] font-medium">{activeStage.assignedTo}</strong></span>
            </div>
            {activeStage.estimatedCompletion && (
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-[#5e616e]" />
                <span>Target: <strong className="text-[#ffffff] font-medium">{activeStage.estimatedCompletion}</strong></span>
              </div>
            )}
          </div>
        </div>

        {/* Checklist of prerequisites */}
        {activeStage.checklist && activeStage.checklist.length > 0 && (
          <div className="space-y-2.5 pt-2">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-[#777a88]">
              Statutory Checklist Items ({activeStage.checklist.filter((c) => c.done).length} of {activeStage.checklist.length} Completed)
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {activeStage.checklist.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 p-3 rounded-lg bg-[#040406] border border-[#1c1d22] text-xs"
                >
                  <div
                    className={`h-4 w-4 rounded flex items-center justify-center shrink-0 ${
                      item.done
                        ? "bg-emerald-500 text-black font-bold"
                        : "border border-[#2e3038] bg-[#121317]"
                    }`}
                  >
                    {item.done && <Check className="h-3 w-3 stroke-[3]" />}
                  </div>
                  <span className={item.done ? "text-[#ffffff] font-medium" : "text-[#777a88]"}>
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Button */}
        {activeStage.actionCta && (
          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={() => onActionClick && onActionClick(activeStage)}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-[#ffffff] hover:bg-[#e2e3e9] text-[#08080a] text-xs font-semibold shadow-lg transition-all"
            >
              <span>{activeStage.actionCta}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default WorkflowPipeline;
