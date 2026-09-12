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
    <div
      onClick={onClick}
      className={`flex flex-col items-center gap-2 relative z-10 cursor-pointer group select-none transition-all ${
        isSelected ? "scale-105" : ""
      }`}
    >
      {/* Circle Icon Badge */}
      <div
        className={`h-11 w-11 rounded-full flex items-center justify-center transition-all ${
          isCompleted
            ? "bg-emerald-500 text-white shadow-sm ring-4 ring-emerald-50"
            : isActive
            ? "bg-indigo-600 text-white shadow-md ring-4 ring-indigo-100 animate-pulse"
            : isBlocked
            ? "bg-rose-500 text-white shadow-xs ring-4 ring-rose-50"
            : "bg-white text-slate-400 border-2 border-dashed border-slate-300 group-hover:border-slate-400"
        }`}
      >
        {isCompleted ? (
          <Check className="h-5 w-5 stroke-[2.5]" />
        ) : isActive ? (
          <Clock className="h-5 w-5 animate-spin-slow" />
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
              ? "text-indigo-600 font-bold"
              : isCompleted
              ? "text-slate-900"
              : "text-slate-500"
          }`}
        >
          {name}
        </div>
        {sla && (
          <span className="text-[10px] text-slate-400 font-medium">
            {sla}
          </span>
        )}
      </div>
    </div>
  );
}

export default WorkflowNode;
