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
    bg: "bg-[var(--ui-sage-faint)]",
    text: "text-[var(--ui-sage)]",
    border: "border-[var(--ui-sage-soft)]",
    dot: "bg-[var(--ui-sage)]",
  },
  NOT_APPLICABLE: {
    label: "Not Applicable",
    bg: "bg-[var(--ui-inset)]",
    text: "text-[var(--ui-secondary)]",
    border: "border-[var(--ui-border)]",
    dot: "bg-[var(--ui-muted)]",
  },
  NEEDS_INFORMATION: {
    label: "Information Needed",
    bg: "bg-[var(--ui-info-soft)]",
    text: "text-[var(--ui-info)]",
    border: "border-[var(--ui-sage-soft)]",
    dot: "bg-[var(--ui-text)]",
  },
  CONFLICT_REVIEW: {
    label: "Needs Review",
    bg: "bg-rose-50",
    text: "text-rose-700",
    border: "border-rose-200",
    dot: "bg-rose-500",
  },
  SUGGESTED: {
    label: "Suggested next step",
    bg: "bg-[var(--ui-sage-faint)]",
    text: "text-[var(--ui-sage)]",
    border: "border-[var(--ui-sage-soft)]",
    dot: "bg-[var(--ui-sage)]",
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
    bg: "bg-[var(--ui-sage-faint)]",
    text: "text-[var(--ui-sage)]",
    border: "border-[var(--ui-sage-soft)]",
    dot: "bg-[var(--ui-sage)]",
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
    bg: "bg-[var(--ui-sage-faint)]",
    text: "text-[var(--ui-sage)]",
    border: "border-[var(--ui-sage-soft)]",
    dot: "bg-[var(--ui-sage)]",
  },

  // Workflow statuses
  NOT_STARTED: {
    label: "Not Started",
    bg: "bg-[var(--ui-inset)]",
    text: "text-[var(--ui-secondary)]",
    border: "border-[var(--ui-border)]",
    dot: "bg-[var(--ui-muted)]",
  },
  IN_PROGRESS: {
    label: "In Progress",
    bg: "bg-[var(--ui-info-soft)]",
    text: "text-[var(--ui-info)]",
    border: "border-[var(--ui-sage-soft)]",
    dot: "bg-[var(--ui-text)]",
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
    bg: "bg-[var(--ui-info-soft)]",
    text: "text-[var(--ui-info)]",
    border: "border-[var(--ui-sage-soft)]",
    dot: "bg-[var(--ui-text)]",
  },
  COMPLETED: {
    label: "Completed",
    bg: "bg-[var(--ui-sage-faint)]",
    text: "text-[var(--ui-sage)]",
    border: "border-[var(--ui-sage-soft)]",
    dot: "bg-[var(--ui-sage)]",
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
    bg: "bg-[var(--ui-inset)]",
    text: "text-[var(--ui-secondary)]",
    border: "border-[var(--ui-border)]",
    dot: "bg-[var(--ui-muted)]",
  },

  // Document statuses
  NOT_UPLOADED: {
    label: "Not Uploaded",
    bg: "bg-[var(--ui-inset)]",
    text: "text-[var(--ui-secondary)]",
    border: "border-[var(--ui-border)]",
    dot: "bg-[var(--ui-muted)]",
  },
  UPLOADED: {
    label: "Uploaded",
    bg: "bg-[var(--ui-info-soft)]",
    text: "text-[var(--ui-info)]",
    border: "border-[var(--ui-sage-soft)]",
    dot: "bg-[var(--ui-text)]",
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
    bg: "bg-[var(--ui-sage-faint)]",
    text: "text-[var(--ui-sage)]",
    border: "border-[var(--ui-sage-soft)]",
    dot: "bg-[var(--ui-sage)]",
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

export function StatusBadge({ status, className = "", size = "md" }: StatusBadgeProps) {
  const config = STATUS_CONFIGS[status] || {
    label: status.replace(/_/g, " "),
    bg: "bg-[var(--ui-inset)]",
    text: "text-[var(--ui-secondary)]",
    border: "border-[var(--ui-border)]",
    dot: "bg-[var(--ui-muted)]",
  };

  const sizeStyles =
    size === "sm"
      ? "text-xs px-2 py-0.5 gap-1.5"
      : "text-xs px-2.5 py-1 gap-1.5 font-medium";

  return (
    <span
      role="status"
      className={`inline-flex items-center rounded-full border transition-colors duration-240 ${config.bg} ${config.text} ${config.border} ${sizeStyles} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}

export default StatusBadge;
