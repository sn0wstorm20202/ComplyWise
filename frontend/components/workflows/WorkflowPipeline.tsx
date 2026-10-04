"use client";

import React, { useState, useEffect } from "react";
import {
  Check,
  AlertTriangle,
  ArrowRight,
  UserCheck,
  Calendar,
  CheckCircle2,
  Sparkles,
  RotateCcw,
  CheckSquare,
  Square,
} from "lucide-react";
import { StatutoryWorkflow, WorkflowStageNode, DEMO_WORKFLOWS } from "@/data/demo/workflows";

interface WorkflowPipelineProps {
  workflow?: StatutoryWorkflow;
  onActionClick?: (stage: WorkflowStageNode) => void;
  onWorkflowChange?: (workflow: StatutoryWorkflow) => void;
}

export function WorkflowPipeline({
  workflow = DEMO_WORKFLOWS[0],
  onActionClick,
  onWorkflowChange,
}: WorkflowPipelineProps) {
  const [currentWorkflow, setCurrentWorkflow] = useState<StatutoryWorkflow>(workflow);
  const [selectedStageId, setSelectedStageId] = useState<string>(
    workflow.stages[workflow.currentStageIndex]?.id || workflow.stages[0].id
  );
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Sync if prop changes
  useEffect(() => {
    setCurrentWorkflow(workflow);
    setSelectedStageId(
      workflow.stages[workflow.currentStageIndex]?.id || workflow.stages[0].id
    );
  }, [workflow.id]);

  const activeStage =
    currentWorkflow.stages.find((s) => s.id === selectedStageId) ||
    currentWorkflow.stages[0];

  // Toggle checklist item (Tick Mark / Cross Check)
  function handleToggleChecklistItem(stageId: string, itemIdx: number) {
    setCurrentWorkflow((prev) => {
      const updatedStages = prev.stages.map((st) => {
        if (st.id !== stageId) return st;
        const updatedChecklist = (st.checklist || []).map((item, idx) => {
          if (idx !== itemIdx) return item;
          return { ...item, done: !item.done };
        });
        return { ...st, checklist: updatedChecklist };
      });
      const updatedWf = { ...prev, stages: updatedStages };
      onWorkflowChange?.(updatedWf);
      return updatedWf;
    });
  }

  // Mark all checklist items in the active stage as complete
  function handleCheckAll(stageId: string) {
    setCurrentWorkflow((prev) => {
      const updatedStages = prev.stages.map((st) => {
        if (st.id !== stageId) return st;
        const updatedChecklist = (st.checklist || []).map((item) => ({
          ...item,
          done: true,
        }));
        return { ...st, checklist: updatedChecklist };
      });
      const updatedWf = { ...prev, stages: updatedStages };
      onWorkflowChange?.(updatedWf);
      return updatedWf;
    });
  }

  // Advance stage (e.g. clicking "Review", "Please Submit Audit", or action CTA)
  function handleCompleteAndAdvance(stage: WorkflowStageNode) {
    const stageIndex = currentWorkflow.stages.findIndex((s) => s.id === stage.id);
    const nextIndex = stageIndex + 1;
    const hasNext = nextIndex < currentWorkflow.stages.length;

    setCurrentWorkflow((prev) => {
      const updatedStages = prev.stages.map((st, idx) => {
        if (idx === stageIndex) {
          // Mark this stage complete and all checklist items done
          return {
            ...st,
            status: "COMPLETED" as const,
            checklist: (st.checklist || []).map((item) => ({ ...item, done: true })),
            updatedAt: "Just now",
          };
        }
        if (idx === nextIndex) {
          // Advance next stage to IN_PROGRESS
          return {
            ...st,
            status: "IN_PROGRESS" as const,
            updatedAt: "Just now",
          };
        }
        return st;
      });

      const nextStageIndex = hasNext ? nextIndex : stageIndex;
      const updatedWf: StatutoryWorkflow = {
        ...prev,
        currentStageIndex: nextStageIndex,
        status: hasNext ? prev.status : "COMPLETED",
        blocker: stage.number === 3 ? null : prev.blocker, // Clear blocker when audit passes
        stages: updatedStages,
      };

      onWorkflowChange?.(updatedWf);
      return updatedWf;
    });

    if (hasNext) {
      const nextStage = currentWorkflow.stages[nextIndex];
      setSelectedStageId(nextStage.id);
      setSuccessBanner(
        `✓ Stage ${stage.number} (${stage.name}) audit approved & completed! Stage progress bar updated to green. Advanced to Stage ${nextStage.number} (${nextStage.name}).`
      );
    } else {
      setSuccessBanner(
        `✓ Final Stage ${stage.number} (${stage.name}) successfully completed! Entire statutory workflow is now fully certified.`
      );
    }

    onActionClick?.(stage);
    setTimeout(() => setSuccessBanner(null), 6000);
  }

  // Reset demo progression to Stage 3 for testing
  function handleReset() {
    setCurrentWorkflow(DEMO_WORKFLOWS[0]);
    setSelectedStageId(DEMO_WORKFLOWS[0].stages[2].id);
    setSuccessBanner("Workflow reset to Stage 3 (Review pre-submission audit).");
    setTimeout(() => setSuccessBanner(null), 3000);
  }

  return (
    <div className="bg-white rounded-[16px] border border-[var(--ui-border)] p-6 sm:p-8 shadow-2xs space-y-6">
      {/* Workflow Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--ui-border)] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-semibold text-[var(--ui-text)] bg-[var(--ui-inset)] border border-[var(--ui-border)] px-3 py-0.5 rounded-full">
              {currentWorkflow.standardCode}
            </span>
            <span className="text-xs font-semibold text-[var(--ui-text)] bg-[var(--ui-inset)] border border-[var(--ui-border)] px-3 py-0.5 rounded-full">
              {currentWorkflow.authority}
            </span>
            <span className="text-[11px] font-semibold text-[var(--ui-sage)] bg-[var(--ui-sage-faint)] border border-[var(--ui-sage-soft)] px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" />
              Interactive Pipeline
            </span>
          </div>
          <h2 className="font-sans text-xl sm:text-2xl text-[var(--ui-text)] font-bold tracking-tight mt-2">
            {currentWorkflow.title}
          </h2>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <span className="text-[var(--ui-secondary)]">
            Target Deadline: <strong className="text-[var(--ui-text)] font-semibold">{currentWorkflow.dueDate}</strong>
          </span>
          <span className="px-3 py-1 rounded-full bg-[var(--ui-sage)] text-white font-semibold text-xs shadow-2xs">
            Stage {currentWorkflow.currentStageIndex + 1} of {currentWorkflow.totalStages} Active
          </span>
          <button
            type="button"
            onClick={handleReset}
            title="Reset workflow to Stage 3"
            className="p-1.5 rounded-full border border-[var(--ui-border)] hover:bg-[var(--ui-inset)] text-[var(--ui-secondary)] hover:text-[var(--ui-text)] transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Success Notification Banner */}
      {successBanner && (
        <div className="p-4 rounded-xl bg-[var(--ui-sage-faint)] border border-[var(--ui-sage-soft)] flex items-center justify-between gap-3 text-xs text-[var(--ui-sage)] font-medium animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-[var(--ui-sage)] shrink-0" />
            <span>{successBanner}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessBanner(null)}
            className="text-[var(--ui-sage)] hover:text-[var(--ui-sage)] font-bold px-2 py-0.5 rounded hover:bg-[var(--ui-sage-soft)]"
          >
            ✕
          </button>
        </div>
      )}

      {/* Block Alert if any */}
      {currentWorkflow.blocker && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3 text-xs text-amber-900">
          <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-semibold text-amber-950 block">Active Statutory Gate Requirement:</span>
            <span className="text-amber-800">{currentWorkflow.blocker}</span>
          </div>
        </div>
      )}

      {/* Interactive Node Timeline with Vibrant Green Completion Graph */}
      <div className="py-4 overflow-x-auto">
        <div className="min-w-[720px] flex items-center justify-between relative px-4">
          {/* Connector Line Behind Nodes: Turned Emerald Green for progress */}
          <div className="absolute left-8 right-8 top-5 h-1 bg-[var(--ui-border)] -z-0 rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--ui-sage)] transition-all duration-500 rounded-full"
              style={{
                width: `${(currentWorkflow.currentStageIndex / (currentWorkflow.stages.length - 1)) * 100}%`,
              }}
            />
          </div>

          {/* Individual Stages */}
          {currentWorkflow.stages.map((stage, idx) => {
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
                  className={`h-10 w-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                    isSelected
                      ? "ring-3 ring-[var(--ui-sage-soft)] ring-offset-2 scale-110 shadow-md"
                      : "group-hover:scale-105"
                  } ${
                    isCompleted
                      ? "bg-[var(--ui-sage)] text-white font-bold ring-2 ring-[var(--ui-sage-soft)] shadow-sm"
                      : isInProgress
                      ? "bg-[var(--ui-sage)] text-white font-bold ring-4 ring-[var(--ui-sage-soft)]/40 animate-pulse"
                      : "bg-white border-2 border-[var(--ui-border-strong)] text-[var(--ui-secondary)] group-hover:border-[var(--ui-sage-soft)]"
                  }`}
                >
                  {isCompleted ? (
                    <Check className="h-5 w-5 stroke-[2.8]" />
                  ) : isInProgress ? (
                    <div className="relative flex items-center justify-center">
                      <span className="animate-ping absolute h-3 w-3 rounded-full bg-white opacity-75" />
                      <span className="text-xs font-bold text-white">{idx + 1}</span>
                    </div>
                  ) : (
                    <span className="text-xs font-mono font-medium">{idx + 1}</span>
                  )}
                </div>

                {/* Stage Label */}
                <span
                  className={`mt-2.5 text-xs font-medium whitespace-nowrap transition-colors ${
                    isSelected
                      ? "text-[var(--ui-text)] font-bold"
                      : isCompleted
                      ? "text-[var(--ui-sage)] font-semibold"
                      : isInProgress
                      ? "text-[var(--ui-text)] font-bold"
                      : "text-[var(--ui-secondary)]"
                  }`}
                >
                  {stage.name}
                </span>

                {/* Status Pill */}
                <span
                  className={`mt-1 text-[10px] uppercase font-mono tracking-wider px-2 py-0.5 rounded-full border transition-all ${
                    isCompleted
                      ? "text-[var(--ui-sage)] bg-[var(--ui-sage-faint)] border-[var(--ui-sage-soft)] font-bold"
                      : isInProgress
                      ? "text-[var(--ui-sage)] bg-[var(--ui-sage-soft)]/70 border-[var(--ui-sage-soft)] font-bold"
                      : "text-[var(--ui-secondary)] bg-white border-[var(--ui-border)]"
                  }`}
                >
                  {isCompleted ? "Verified ✓" : isInProgress ? "In Progress" : "Pending"}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Stage Detail Panel */}
      <div className="rounded-xl border border-[var(--ui-border)] bg-[var(--ui-bg)] p-6 space-y-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--ui-border)] pb-4">
          <div className="flex items-center gap-3">
            <span
              className={`h-9 w-9 rounded-full font-bold text-xs flex items-center justify-center font-mono shrink-0 ${
                activeStage.status === "COMPLETED"
                  ? "bg-[var(--ui-sage)] text-white"
                  : activeStage.status === "IN_PROGRESS"
                  ? "bg-[var(--ui-sage)] text-white"
                  : "bg-[var(--ui-text)] text-white"
              }`}
            >
              {activeStage.number}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-sans font-bold text-base text-[var(--ui-text)]">
                  Stage {activeStage.number}: {activeStage.name}
                </h3>
                <span
                  className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full border ${
                    activeStage.status === "COMPLETED"
                      ? "bg-[var(--ui-sage-faint)] border-[var(--ui-sage-soft)] text-[var(--ui-sage)] font-bold"
                      : activeStage.status === "IN_PROGRESS"
                      ? "bg-amber-50 border-amber-200 text-amber-800 font-bold"
                      : "bg-white border-[var(--ui-border)] text-[var(--ui-secondary)]"
                  }`}
                >
                  {activeStage.status}
                </span>
              </div>
              <p className="text-xs text-[var(--ui-secondary)] mt-0.5">{activeStage.description}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs text-[var(--ui-secondary)]">
            <div className="flex items-center gap-1.5">
              <UserCheck className="h-3.5 w-3.5 text-[var(--ui-secondary)]" />
              <span>
                Assigned: <strong className="text-[var(--ui-text)] font-semibold">{activeStage.assignedTo}</strong>
              </span>
            </div>
            {activeStage.estimatedCompletion && (
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-[var(--ui-secondary)]" />
                <span>
                  Target: <strong className="text-[var(--ui-text)] font-semibold">{activeStage.estimatedCompletion}</strong>
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Interactive Checklist of Prerequisites */}
        {activeStage.checklist && activeStage.checklist.length > 0 && (
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--ui-secondary)]">
                Statutory Checklist &amp; Verification (
                <strong className="text-[var(--ui-sage)]">
                  {activeStage.checklist.filter((c) => c.done).length}
                </strong>{" "}
                of {activeStage.checklist.length} Verified)
              </div>
              <button
                type="button"
                onClick={() => handleCheckAll(activeStage.id)}
                className="text-[11px] text-[var(--ui-sage)] hover:text-[var(--ui-sage)] font-semibold hover:underline cursor-pointer"
              >
                Mark All Verified
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {activeStage.checklist.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleToggleChecklistItem(activeStage.id, idx)}
                  className={`flex items-center gap-3 p-3 rounded-lg border text-xs text-left transition-all cursor-pointer shadow-2xs group ${
                    item.done
                      ? "bg-[var(--ui-sage-faint)]/50 border-[var(--ui-sage-soft)] hover:bg-[var(--ui-sage-faint)]"
                      : "bg-white border-[var(--ui-border)] hover:border-[var(--ui-border-strong)] hover:bg-[var(--ui-bg)]"
                  }`}
                >
                  <div
                    className={`h-5 w-5 rounded flex items-center justify-center shrink-0 transition-colors ${
                      item.done
                        ? "bg-[var(--ui-sage)] text-white font-bold shadow-xs"
                        : "border-2 border-[var(--ui-border-strong)] bg-white group-hover:border-[var(--ui-sage-soft)]"
                    }`}
                  >
                    {item.done ? (
                      <Check className="h-3.5 w-3.5 stroke-[3]" />
                    ) : (
                      <div className="h-1.5 w-1.5 rounded-xs bg-transparent group-hover:bg-[var(--ui-inset)]" />
                    )}
                  </div>
                  <div className="flex-1">
                    <span
                      className={`font-medium transition-colors ${
                        item.done ? "text-[var(--ui-sage)] font-semibold" : "text-[var(--ui-text)]"
                      }`}
                    >
                      {item.label}
                    </span>
                  </div>
                  <span
                    className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full border shrink-0 ${
                      item.done
                        ? "bg-[var(--ui-sage-soft)] text-[var(--ui-sage)] border-[var(--ui-sage-soft)]"
                        : "bg-[var(--ui-inset)] text-[var(--ui-secondary)] border-[var(--ui-border)]"
                    }`}
                  >
                    {item.done ? "Verified" : "Pending"}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Action Controls: Submit Audit / Review / Complete Stage */}
        <div className="pt-3 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-[var(--ui-border)]">
          <div className="text-xs text-[var(--ui-secondary)]">
            {activeStage.status === "COMPLETED" ? (
              <span className="inline-flex items-center gap-1.5 text-[var(--ui-sage)] font-medium">
                <CheckCircle2 className="h-4 w-4" />
                This stage has passed all statutory review criteria and is verified.
              </span>
            ) : (
              <span>
                Verify statutory test criteria above, then click{" "}
                <strong className="text-[var(--ui-text)]">Please Submit Audit</strong> to advance the pipeline graph.
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {/* Review Button */}
            <button
              type="button"
              onClick={() => {
                alert(
                  `Reviewing statutory audit dossier for Stage ${activeStage.number}: ${activeStage.name}.\n\nChecklist verification: ${
                    activeStage.checklist?.filter((c) => c.done).length || 0
                  }/${activeStage.checklist?.length || 0} complete.`
                );
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-[var(--ui-border-strong)] bg-white hover:bg-[var(--ui-bg)] text-[var(--ui-text)] text-xs font-semibold shadow-2xs transition-all cursor-pointer"
            >
              <span>Review Checklist</span>
            </button>

            {/* Please Submit Audit / Action CTA Button */}
            <button
              type="button"
              onClick={() => handleCompleteAndAdvance(activeStage)}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-[var(--ui-sage)] hover:bg-[var(--ui-sage)] text-white text-xs font-semibold shadow-2xs hover:shadow-sm transition-all cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>
                {activeStage.number === 3
                  ? "Please Submit Audit"
                  : activeStage.actionCta || "Complete & Advance Stage"}
              </span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default WorkflowPipeline;
