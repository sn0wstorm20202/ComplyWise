import React from "react";
import { ApplicabilityStatus, DocumentStatus, WorkflowStatus } from "@/types";

type AnyStatus = ApplicabilityStatus | WorkflowStatus | DocumentStatus | string;

interface StatusBadgeProps {
  status: AnyStatus;
  className?: string;
  size?: "sm" | "md";
}

interface StatusConfig {
  label: string;
  bg: string;
  text: string;
  border: string;
  dot: string;
}

const STATUS_CONFIGS: Record<string, StatusConfig> = {
  // Applicability statuses (Mapped to friendly founder language per Part 12)
  APPLICABLE: {
    label: "Required",
    bg: "bg-emerald-950/40",
    text: "text-emerald-400",
    border: "border-emerald-800/40",
    dot: "bg-emerald-400",
  },
  NOT_APPLICABLE: {
    label: "Not Applicable",
    bg: "bg-[#121317]",
    text: "text-[#777a88]",
    border: "border-[#2e3038]",
    dot: "bg-[#5e616e]",
  },
  NEEDS_INFORMATION: {
    label: "Information Needed",
    bg: "bg-sky-950/40",
    text: "text-sky-400",
    border: "border-sky-800/40",
    dot: "bg-sky-400",
  },
  CONFLICT_REVIEW: {
    label: "Needs Review",
    bg: "bg-rose-950/40",
    text: "text-rose-400",
    border: "border-rose-800/40",
    dot: "bg-rose-400",
  },
  UNVERIFIED: {
    label: "Review Recommended",
    bg: "bg-amber-950/40",
    text: "text-amber-400",
    border: "border-amber-800/40",
    dot: "bg-amber-400",
  },
  REQUIRED: {
    label: "Required",
    bg: "bg-emerald-950/40",
    text: "text-emerald-400",
    border: "border-emerald-800/40",
    dot: "bg-emerald-400",
  },
  ACTION_NEEDED: {
    label: "Action Needed",
    bg: "bg-[#1c140d]",
    text: "text-[#cc9166]",
    border: "border-[#cc9166]/40",
    dot: "bg-[#cc9166]",
  },
  POTENTIALLY_RELEVANT: {
    label: "Potentially Relevant",
    bg: "bg-purple-950/40",
    text: "text-purple-300",
    border: "border-purple-800/40",
    dot: "bg-purple-400",
  },

  // Workflow statuses (FRONTEND_INSTRUCTIONS.md §5)
  NOT_STARTED: {
    label: "Not Started",
    bg: "bg-[#121317]",
    text: "text-[#777a88]",
    border: "border-[#2e3038]",
    dot: "bg-[#5e616e]",
  },
  IN_PROGRESS: {
    label: "In Progress",
    bg: "bg-sky-950/40",
    text: "text-sky-400",
    border: "border-sky-800/40",
    dot: "bg-sky-400",
  },
  WAITING_FOR_USER: {
    label: "Waiting for User",
    bg: "bg-amber-950/40",
    text: "text-amber-400",
    border: "border-amber-800/40",
    dot: "bg-amber-400",
  },
  UNDER_REVIEW: {
    label: "Under Review",
    bg: "bg-[#1c140d]",
    text: "text-[#cc9166]",
    border: "border-[#cc9166]/40",
    dot: "bg-[#cc9166]",
  },
  NEEDS_CORRECTION: {
    label: "Needs Correction",
    bg: "bg-amber-950/40",
    text: "text-amber-400",
    border: "border-amber-800/40",
    dot: "bg-amber-400",
  },
  READY: {
    label: "Ready to Submit",
    bg: "bg-teal-950/40",
    text: "text-teal-300",
    border: "border-teal-800/40",
    dot: "bg-teal-400",
  },
  SUBMITTED: {
    label: "Submitted",
    bg: "bg-sky-950/40",
    text: "text-sky-400",
    border: "border-sky-800/40",
    dot: "bg-sky-400",
  },
  COMPLETED: {
    label: "Completed",
    bg: "bg-emerald-950/40",
    text: "text-emerald-400",
    border: "border-emerald-800/40",
    dot: "bg-emerald-400",
  },
  OVERDUE: {
    label: "Overdue",
    bg: "bg-rose-950/40",
    text: "text-rose-400",
    border: "border-rose-800/40",
    dot: "bg-rose-400",
  },
  BLOCKED: {
    label: "Blocked",
    bg: "bg-stone-950/40",
    text: "text-stone-400",
    border: "border-stone-800/40",
    dot: "bg-stone-500",
  },

  // Document statuses (FRONTEND_INSTRUCTIONS.md §5)
  NOT_UPLOADED: {
    label: "Not Uploaded",
    bg: "bg-[#121317]",
    text: "text-[#777a88]",
    border: "border-[#2e3038]",
    dot: "bg-[#5e616e]",
  },
  UPLOADED: {
    label: "Uploaded",
    bg: "bg-sky-950/40",
    text: "text-sky-400",
    border: "border-sky-800/40",
    dot: "bg-sky-400",
  },
  PROCESSING: {
    label: "Processing",
    bg: "bg-amber-950/40",
    text: "text-amber-400",
    border: "border-amber-800/40",
    dot: "bg-amber-400",
  },
  VERIFIED: {
    label: "Verified",
    bg: "bg-emerald-950/40",
    text: "text-emerald-400",
    border: "border-emerald-800/40",
    dot: "bg-emerald-400",
  },
  ISSUE: {
    label: "Issue Found",
    bg: "bg-rose-950/40",
    text: "text-rose-400",
    border: "border-rose-800/40",
    dot: "bg-rose-400",
  },
  NEEDS_REVIEW: {
    label: "Needs Review",
    bg: "bg-amber-950/40",
    text: "text-amber-400",
    border: "border-amber-800/40",
    dot: "bg-amber-400",
  },
  EXPIRED: {
    label: "Expired",
    bg: "bg-rose-950/40",
    text: "text-rose-400",
    border: "border-rose-800/40",
    dot: "bg-rose-400",
  },
  REPLACEMENT_REQUIRED: {
    label: "Replacement Required",
    bg: "bg-amber-950/40",
    text: "text-amber-400",
    border: "border-amber-800/40",
    dot: "bg-amber-400",
  },
};

export function StatusBadge({ status, className = "", size = "md" }: StatusBadgeProps) {
  const config = STATUS_CONFIGS[status] || {
    label: status.replace(/_/g, " "),
    bg: "bg-[#121317]",
    text: "text-[#9194a1]",
    border: "border-[#2e3038]",
    dot: "bg-[#5e616e]",
  };

  const sizeStyles =
    size === "sm"
      ? "text-xs px-2 py-0.5 gap-1.5"
      : "text-xs px-2.5 py-1 gap-1.5 font-medium";

  return (
    <span
      className={`inline-flex items-center rounded-full border ${config.bg} ${config.text} ${config.border} ${sizeStyles} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}

export default StatusBadge;
