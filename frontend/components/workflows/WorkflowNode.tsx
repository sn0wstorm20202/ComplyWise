"use client";

import React from "react";
import { Check, Clock, AlertCircle } from "lucide-react";

export type WorkflowNodeStatus = "completed" | "active" | "pending" | "blocked";

export interface WorkflowNodeProps {
  id: string;
  name: string;
  stageNumber: number;
  status: WorkflowNodeStatus;
  sla?: string;
  isSelected?: boolean;
  onClick?: () => void;
}

export function WorkflowNode({
  name,
  stageNumber,
  status,
  sla,
  isSelected = false,
  onClick,
}: WorkflowNodeProps) {
  const isCompleted = status === "completed";
  const isActive = status === "active";
  const isBlocked = status === "blocked";

  return (
    <button
      type="button"
      aria-pressed={isSelected}
      aria-label={`Step ${stageNumber}: ${name}, ${status}`}
      onClick={onClick}
      className={`flex flex-col items-center gap-2 relative z-10 cursor-pointer group select-none transition-all ${
        isSelected ? "scale-105" : ""
      }`}
    >
      {/* Circle Icon Badge */}
      <div
        className={`h-11 w-11 rounded-full flex items-center justify-center transition-all ${
          isCompleted
            ? "bg-[var(--ui-sage)] text-white shadow-sm ring-4 ring-[var(--ui-sage-soft)]"
            : isActive
            ? "bg-[var(--ui-sage)] text-white shadow-md ring-4 ring-[var(--ui-sage-soft)]"
            : isBlocked
            ? "bg-rose-500 text-white shadow-xs ring-4 ring-rose-50"
            : "bg-white text-[var(--ui-muted)] border-2 border-dashed border-[var(--ui-border-strong)] group-hover:border-[var(--ui-border-strong)]"
        }`}
      >
        {isCompleted ? (
          <Check className="h-5 w-5 stroke-[2.5]" />
        ) : isActive ? (
          <Clock className="h-5 w-5" />
        ) : isBlocked ? (
          <AlertCircle className="h-5 w-5" />
        ) : (
          <span className="text-xs font-bold font-mono">{stageNumber}</span>
        )}
      </div>

      {/* Label and SLA */}
      <div className="text-center max-w-[84px]">
        <div
          className={`text-xs font-semibold leading-tight line-clamp-2 ${
            isActive
              ? "text-[var(--ui-sage)] font-bold"
              : isCompleted
              ? "text-[var(--ui-text)]"
              : "text-[var(--ui-secondary)]"
          }`}
        >
          {name}
        </div>
        {sla && (
          <span className="text-[10px] text-[var(--ui-muted)] font-medium">
            {sla}
          </span>
        )}
      </div>
    </button>
  );
}

export default WorkflowNode;
