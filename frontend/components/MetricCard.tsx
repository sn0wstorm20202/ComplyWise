import React from "react";

interface MetricCardProps {
  label: string;
  value: string | number;
  subtext?: string;
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
  badge,
  icon,
  className = "",
}: MetricCardProps) {
  const badgeStyles = {
    success: "bg-emerald-50 text-emerald-700 border-emerald-200",
    warning: "bg-amber-50 text-amber-700 border-amber-200",
    neutral: "bg-slate-50 text-slate-700 border-slate-200",
    info: "bg-blue-50 text-blue-700 border-blue-200",
  }[badge?.variant || "neutral"];

  return (
    <div
      className={`bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs hover:shadow-sm transition-shadow ${className}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          {label}
        </span>
        {icon && <div className="text-slate-400">{icon}</div>}
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-3xl font-semibold tracking-tight text-slate-900">
          {value}
        </span>
        {badge && (
          <span
            className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${badgeStyles}`}
          >
            {badge.text}
          </span>
        )}
      </div>

      {subtext && (
        <p className="mt-1 text-xs text-slate-500">{subtext}</p>
      )}
    </div>
  );
}

export default MetricCard;
