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
    success: "bg-emerald-950/40 text-emerald-400 border-emerald-800/40",
    warning: "bg-amber-950/40 text-amber-400 border-amber-800/40",
    neutral: "bg-[#121317] text-[#9194a1] border-[#2e3038]",
    info: "bg-sky-950/40 text-sky-400 border-sky-800/40",
  }[badge?.variant || "neutral"];

  return (
    <div
      className={`bg-[#040406] rounded-[10px] border border-[#1c1d22] p-5 hover:border-[#2e3038] transition-colors ${className}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-[#777a88]">
          {label}
        </span>
        {icon && <div className="text-[#777a88]">{icon}</div>}
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-3xl font-serif font-medium tracking-tight text-[#ffffff]">
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
        <p className="mt-1.5 text-xs text-[#777a88]">{displayText}</p>
      )}
    </div>
  );
}

export default MetricCard;
