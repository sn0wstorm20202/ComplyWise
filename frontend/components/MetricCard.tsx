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
    success: "bg-emerald-50 text-emerald-700 border-emerald-200",
    warning: "bg-amber-50 text-amber-700 border-amber-200",
    neutral: "bg-[#F1F5F9] text-[#0F172A] border-[#E2E8F0]",
    info: "bg-sky-50 text-sky-700 border-sky-200",
  }[badge?.variant || "neutral"];

  return (
    <div
      className={`bg-white rounded-[16px] border border-[#E2E8F0] p-5 hover:border-[#CBD5E1] shadow-2xs transition-all ${className}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
          {label}
        </span>
        {icon && <div className="text-[#64748B]">{icon}</div>}
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-3xl font-sans font-bold tracking-tight text-[#0F172A]">
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
        <p className="mt-1.5 text-xs text-[#64748B]">{displayText}</p>
      )}
    </div>
  );
}

export default MetricCard;
