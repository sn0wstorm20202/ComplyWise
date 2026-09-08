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
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    dot: "bg-emerald-500",
  },
  NOT_APPLICABLE: {
    label: "Not Applicable",
    bg: "bg-slate-50",
    text: "text-slate-600",
    border: "border-slate-200",
    dot: "bg-slate-400",
  },
  NEEDS_INFORMATION: {
    label: "Information Needed",
    bg: "bg-sky-50",
    text: "text-sky-700",
    border: "border-sky-200",
    dot: "bg-sky-500",
  },
  CONFLICT_REVIEW: {
    label: "Needs Review",
    bg: "bg-rose-50",
    text: "text-rose-700",
    border: "border-rose-200",
    dot: "bg-rose-500",
  },
  UNVERIFIED: {
    label: "Review Recommended",
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    dot: "bg-amber-500",
  },
  REQUIRED: {
    label: "Required",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    dot: "bg-emerald-500",
  },
  ACTION_NEEDED: {
    label: "Action Needed",
    bg: "bg-indigo-50",
    text: "text-indigo-700",
    border: "border-indigo-200",
    dot: "bg-indigo-500",
  },
  POTENTIALLY_RELEVANT: {
    label: "Potentially Relevant",
    bg: "bg-purple-50",
    text: "text-purple-700",
    border: "border-purple-200",
    dot: "bg-purple-500",
  },

  // Workflow statuses (FRONTEND_INSTRUCTIONS.md §5)
  NOT_STARTED: {
    label: "Not Started",
    bg: "bg-slate-50",
    text: "text-slate-600",
    border: "border-slate-200",
    dot: "bg-slate-400",
  },
  IN_PROGRESS: {
    label: "In Progress",
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
    dot: "bg-blue-500",
  },
  WAITING_FOR_USER: {
    label: "Waiting for User",
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    dot: "bg-amber-500",
  },
  UNDER_REVIEW: {
    label: "Under Review",
    bg: "bg-indigo-50",
    text: "text-indigo-700",
    border: "border-indigo-200",
    dot: "bg-indigo-500",
  },
  NEEDS_CORRECTION: {
    label: "Needs Correction",
    bg: "bg-orange-50",
    text: "text-orange-700",
    border: "border-orange-200",
    dot: "bg-orange-500",
  },
  READY: {
    label: "Ready to Submit",
    bg: "bg-teal-50",
    text: "text-teal-700",
    border: "border-teal-200",
    dot: "bg-teal-500",
  },
  SUBMITTED: {
    label: "Submitted",
    bg: "bg-sky-50",
    text: "text-sky-700",
    border: "border-sky-200",
    dot: "bg-sky-500",
  },
  COMPLETED: {
    label: "Completed",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    dot: "bg-emerald-500",
  },
  OVERDUE: {
    label: "Overdue",
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200",
    dot: "bg-red-500",
  },
  BLOCKED: {
    label: "Blocked",
    bg: "bg-stone-50",
    text: "text-stone-700",
    border: "border-stone-300",
    dot: "bg-stone-500",
  },

  // Document statuses (FRONTEND_INSTRUCTIONS.md §5)
  NOT_UPLOADED: {
    label: "Not Uploaded",
    bg: "bg-slate-50",
    text: "text-slate-600",
    border: "border-slate-200",
    dot: "bg-slate-400",
  },
  UPLOADED: {
    label: "Uploaded",
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
    dot: "bg-blue-500",
  },
  PROCESSING: {
    label: "Processing",
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    dot: "bg-amber-500",
  },
  VERIFIED: {
    label: "Verified",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    dot: "bg-emerald-500",
  },
  ISSUE: {
    label: "Issue Found",
    bg: "bg-rose-50",
    text: "text-rose-700",
    border: "border-rose-200",
    dot: "bg-rose-500",
  },
  NEEDS_REVIEW: {
    label: "Needs Review",
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    dot: "bg-amber-500",
  },
  EXPIRED: {
    label: "Expired",
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200",
    dot: "bg-red-500",
  },
  REPLACEMENT_REQUIRED: {
    label: "Replacement Required",
    bg: "bg-orange-50",
    text: "text-orange-700",
    border: "border-orange-200",
    dot: "bg-orange-500",
  },
};

export function StatusBadge({ status, className = "", size = "md" }: StatusBadgeProps) {
  const config = STATUS_CONFIGS[status] || {
    label: status.replace(/_/g, " "),
    bg: "bg-slate-50",
    text: "text-slate-700",
    border: "border-slate-200",
    dot: "bg-slate-400",
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
