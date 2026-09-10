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
    <div className="bg-white rounded-[28px] border border-slate-200/70 p-6 shadow-xs space-y-6">
      {/* Workflow Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
              {workflow.standardCode}
            </span>
            <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full">
              {workflow.authority}
            </span>
          </div>
          <h2 className="text-lg font-bold text-slate-900 mt-1.5">
            {workflow.title}
          </h2>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <span className="text-slate-500">
            Due: <strong className="text-slate-900">{workflow.dueDate}</strong>
          </span>
          <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 font-bold text-xs border border-blue-200">
            Stage {workflow.currentStageIndex + 1} of {workflow.totalStages} Active
          </span>
        </div>
      </div>

      {/* Block Alert if any */}
      {workflow.blocker && (
        <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200/80 flex items-start gap-2.5 text-xs text-amber-900">
          <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Active Regulatory Requirement: </span>
            <span>{workflow.blocker}</span>
          </div>
        </div>
      )}

      {/* Interactive HTML / SVG Node Timeline */}
      <div className="py-2 overflow-x-auto">
        <div className="min-w-[700px] flex items-center justify-between relative px-2">
          {/* Connector Line Behind Nodes */}
          <div className="absolute left-6 right-6 top-5 h-1 bg-slate-200 -z-0">
            <div
              className="h-full bg-emerald-500 transition-all duration-500"
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
                className="relative z-10 flex flex-col items-center group cursor-pointer focus:outline-hidden"
              >
                {/* Circle Node */}
                <div
                  className={`h-10 w-10 rounded-full flex items-center justify-center transition-all duration-200 ${
                    isSelected
                      ? "ring-4 ring-indigo-500/20 shadow-md scale-110"
                      : "group-hover:scale-105"
                  } ${
                    isCompleted
                      ? "bg-emerald-500 text-white"
                      : isInProgress
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/30 ring-4 ring-indigo-100"
                      : "bg-white border-2 border-slate-300 text-slate-400 group-hover:border-slate-400"
                  }`}
                >
                  {isCompleted ? (
                    <Check className="h-5 w-5 stroke-[2.5]" />
                  ) : isInProgress ? (
                    <div className="relative flex items-center justify-center">
                      <span className="animate-ping absolute h-3 w-3 rounded-full bg-indigo-400 opacity-75" />
                      <span className="text-xs font-bold">{idx + 1}</span>
                    </div>
                  ) : (
                    <span className="text-xs font-bold text-slate-500">{idx + 1}</span>
                  )}
                </div>

                {/* Stage Label */}
                <span
                  className={`mt-2 text-xs font-semibold whitespace-nowrap transition-colors ${
                    isSelected
                      ? "text-indigo-600 font-bold"
                      : isCompleted
                      ? "text-slate-800"
                      : isInProgress
                      ? "text-indigo-600"
                      : "text-slate-400"
                  }`}
                >
                  {stage.name}
                </span>

                {/* Status Pill */}
                <span
                  className={`mt-0.5 text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded-sm ${
                    isCompleted
                      ? "text-emerald-700 bg-emerald-50"
                      : isInProgress
                      ? "text-indigo-700 bg-indigo-50"
                      : "text-slate-400 bg-slate-100"
                  }`}
                >
                  {isCompleted ? "Done" : isInProgress ? "Active" : "Pending"}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Stage Detail Panel */}
      <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="h-7 w-7 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">
              {activeStage.number}
            </span>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                Stage {activeStage.number}: {activeStage.name}
              </h3>
              <p className="text-xs text-slate-500">{activeStage.description}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs text-slate-600">
            <div className="flex items-center gap-1.5">
              <UserCheck className="h-3.5 w-3.5 text-slate-400" />
              <span>Assigned: <strong>{activeStage.assignedTo}</strong></span>
            </div>
            {activeStage.estimatedCompletion && (
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                <span>Target: <strong>{activeStage.estimatedCompletion}</strong></span>
              </div>
            )}
          </div>
        </div>

        {/* Checklist of prerequisites */}
        {activeStage.checklist && activeStage.checklist.length > 0 && (
          <div className="space-y-2 pt-1">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Statutory Checklist Items ({activeStage.checklist.filter((c) => c.done).length} / {activeStage.checklist.length} Verified)
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {activeStage.checklist.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white border border-slate-200/80 text-xs shadow-2xs"
                >
                  <div
                    className={`h-4 w-4 rounded-md flex items-center justify-center shrink-0 ${
                      item.done
                        ? "bg-emerald-500 text-white"
                        : "border border-slate-300 bg-slate-50"
                    }`}
                  >
                    {item.done && <Check className="h-3 w-3 stroke-[2.5]" />}
                  </div>
                  <span className={item.done ? "text-slate-800 font-medium" : "text-slate-500"}>
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
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#0f172a] hover:bg-slate-800 text-white text-xs font-bold shadow-xs transition-colors"
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
