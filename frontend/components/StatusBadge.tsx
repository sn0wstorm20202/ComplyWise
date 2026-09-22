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
  // Applicability statuses
  APPLICABLE: {
    label: "Required",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    dot: "bg-emerald-500",
  },
  NOT_APPLICABLE: {
    label: "Not Applicable",
    bg: "bg-[#F1F5F9]",
    text: "text-[#334155]",
    border: "border-[#CBD5E1]",
    dot: "bg-[#475569]",
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
    bg: "bg-rose-50",
    text: "text-rose-700",
    border: "border-rose-200",
    dot: "bg-rose-500",
  },
  POTENTIALLY_RELEVANT: {
    label: "Potentially Relevant",
    bg: "bg-purple-50",
    text: "text-purple-700",
    border: "border-purple-200",
    dot: "bg-purple-500",
  },

  // Workflow statuses
  NOT_STARTED: {
    label: "Not Started",
    bg: "bg-[#F1F5F9]",
    text: "text-[#334155]",
    border: "border-[#CBD5E1]",
    dot: "bg-[#475569]",
  },
  IN_PROGRESS: {
    label: "In Progress",
    bg: "bg-sky-50",
    text: "text-sky-700",
    border: "border-sky-200",
    dot: "bg-sky-500",
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
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    dot: "bg-amber-500",
  },
  NEEDS_CORRECTION: {
    label: "Needs Correction",
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    dot: "bg-amber-500",
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
    bg: "bg-rose-50",
    text: "text-rose-700",
    border: "border-rose-200",
    dot: "bg-rose-500",
  },
  BLOCKED: {
    label: "Blocked",
    bg: "bg-[#F1F5F9]",
    text: "text-[#64748B]",
    border: "border-[#E2E8F0]",
    dot: "bg-[#94A3B8]",
  },

  // Document statuses
  NOT_UPLOADED: {
    label: "Not Uploaded",
    bg: "bg-[#F1F5F9]",
    text: "text-[#64748B]",
    border: "border-[#E2E8F0]",
    dot: "bg-[#94A3B8]",
  },
  UPLOADED: {
    label: "Uploaded",
    bg: "bg-sky-50",
    text: "text-sky-700",
    border: "border-sky-200",
    dot: "bg-sky-500",
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
    bg: "bg-rose-50",
    text: "text-rose-700",
    border: "border-rose-200",
    dot: "bg-rose-500",
  },
  REPLACEMENT_REQUIRED: {
    label: "Replacement Required",
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    dot: "bg-amber-500",
  },
};

const getDarkClasses = (bg: string) => {
  if (bg.includes("emerald") || bg.includes("green"))
    return "dark:bg-emerald-500/20 dark:text-emerald-200 dark:border-emerald-500/40";
  if (bg.includes("rose") || bg.includes("red"))
    return "dark:bg-rose-500/20 dark:text-rose-200 dark:border-rose-500/40";
  if (bg.includes("amber") || bg.includes("yellow"))
    return "dark:bg-amber-500/20 dark:text-amber-200 dark:border-amber-500/40";
  if (bg.includes("sky") || bg.includes("blue"))
    return "dark:bg-blue-500/20 dark:text-blue-200 dark:border-blue-500/40";
  if (bg.includes("purple") || bg.includes("violet"))
    return "dark:bg-purple-500/20 dark:text-purple-200 dark:border-purple-500/40";
  return "dark:bg-white/10 dark:text-[#D4DBE4] dark:border-white/15";
};

export function StatusBadge({ status, className = "", size = "md" }: StatusBadgeProps) {
  const config = STATUS_CONFIGS[status] || {
    label: status ? String(status).replace(/_/g, " ") : "Unknown",
    bg: "bg-[#F1F5F9]",
    text: "text-[#334155]",
    border: "border-[#CBD5E1]",
    dot: "bg-[#475569]",
  };

  const sizeStyles =
    size === "sm"
      ? "text-xs px-2.5 py-0.5 gap-1.5 font-medium"
      : "text-xs px-3 py-1 gap-1.5 font-semibold";

  return (
    <span
      className={`inline-flex items-center rounded-full border ${config.bg} ${config.text} ${config.border} ${getDarkClasses(config.bg)} ${sizeStyles} ${className} transition-colors`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${config.dot}`} />
      <span className="truncate">{config.label}</span>
    </span>
  );
}

export default StatusBadge;
