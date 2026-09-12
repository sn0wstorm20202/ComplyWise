"use client";

import React from "react";

export type AnalyticsCardVariant = "white" | "sage" | "gradient";

export interface AnalyticsCardProps {
  title?: string;
  subtitle?: string;
  headerRight?: React.ReactNode;
  variant?: AnalyticsCardVariant;
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
}

const variantStyles: Record<AnalyticsCardVariant, string> = {
  white: "bg-white border border-slate-200/60 shadow-xs",
  sage: "bg-[#d5e2d8] border border-[#c3d3c6] shadow-xs",
  gradient: "bg-gradient-to-b from-[#e7edf6] via-[#ecf2f9] to-[#edf1f8] border border-slate-200/50 shadow-xs",
};

export function AnalyticsCard({
  title,
  subtitle,
  headerRight,
  variant = "white",
  className = "",
  children,
  onClick,
}: AnalyticsCardProps) {
  return (
    <div
      onClick={onClick}
      className={`rounded-[28px] p-6 flex flex-col justify-between relative transition-all ${
        variantStyles[variant]
      } ${onClick ? "cursor-pointer group hover:border-slate-300" : ""} ${className}`}
    >
      {/* Optional Standardized Header */}
      {(title || headerRight) && (
        <div>
          <div className="flex items-center justify-between">
            {title && (
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                {title}
              </h3>
            )}
            {headerRight && <div className="flex items-center gap-1.5">{headerRight}</div>}
          </div>
          {subtitle && (
            <div className="text-xs font-medium text-slate-400 mt-1">
              {subtitle}
            </div>
          )}
        </div>
      )}

      {/* Card Body */}
      {children}
    </div>
  );
}

export default AnalyticsCard;
