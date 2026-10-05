import React from "react";

interface MetricCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  description?: string;
  variant?: string;
  badge?: {
    text: string;
    variant?: "success" | "warning" | "neutral" | "info";
  };
  icon?: React.ReactNode;
  className?: string;
}

export function MetricCard({
  label,
  value,
  subtext,
  description,
  badge,
  icon,
  className = "",
}: MetricCardProps) {
  const displayText = subtext || description;
  const badgeStyles = {
    success: "bg-[var(--ui-sage-faint)] text-[var(--ui-sage)] border-[var(--ui-sage-soft)]",
    warning: "bg-amber-50 text-amber-700 border-amber-200",
    neutral: "bg-[var(--ui-inset)] text-[var(--ui-text)] border-[var(--ui-border)]",
    info: "bg-[var(--ui-info-soft)] text-[var(--ui-info)] border-[var(--ui-sage-soft)]",
  }[badge?.variant || "neutral"];

  return (
    <div
      className={`bg-white rounded-[16px] border border-[var(--ui-border)] p-5 hover:border-[var(--ui-border-strong)] shadow-2xs transition-all ${className}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--ui-secondary)]">
          {label}
        </span>
        {icon && <div className="text-[var(--ui-secondary)]">{icon}</div>}
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-3xl font-sans font-bold tracking-tight text-[var(--ui-text)]">
          {value}
        </span>
        {badge && (
          <span
            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${badgeStyles}`}
          >
            {badge.text}
          </span>
        )}
      </div>

      {displayText && (
        <p className="mt-1.5 text-xs text-[var(--ui-secondary)]">{displayText}</p>
      )}
    </div>
  );
}

export default MetricCard;
