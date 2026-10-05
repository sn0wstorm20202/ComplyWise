"use client";

import React from "react";

export interface WorkflowConnectorProps {
  isCompleted?: boolean;
  isActive?: boolean;
  className?: string;
}

export function WorkflowConnector({
  isCompleted = false,
  isActive = false,
  className = "",
}: WorkflowConnectorProps) {
  return (
    <div className={`flex-1 flex items-center justify-center px-1 relative -top-3.5 ${className}`}>
      <div className="w-full h-1 relative overflow-hidden rounded-full bg-[var(--ui-inset)]">
        <div
          className={`h-full transition-all duration-700 ${
            isCompleted
              ? "w-full bg-[var(--ui-sage)]"
              : isActive
              ? "w-1/2 bg-[var(--ui-sage)] animate-pulse"
              : "w-0"
          }`}
        />
      </div>
    </div>
  );
}

export default WorkflowConnector;
