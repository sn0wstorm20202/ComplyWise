"use client";

import React from "react";

export interface LegendItem {
  label: string;
  color: string;
  count?: number | string;
}

export interface ChartLegendProps {
  items: LegendItem[];
  className?: string;
}

export function ChartLegend({ items, className = "" }: ChartLegendProps) {
  return (
    <div className={`flex items-center gap-4 flex-wrap text-xs select-none ${className}`}>
      {items.map((item, idx) => (
        <div key={idx} className="flex items-center gap-1.5">
          <span
            className="h-2.5 w-2.5 rounded-full shrink-0 shadow-2xs"
            style={{ backgroundColor: item.color }}
          />
          <span className="text-slate-600 font-medium">{item.label}</span>
          {item.count !== undefined && (
            <span className="text-slate-900 font-bold ml-0.5">({item.count})</span>
          )}
        </div>
      ))}
    </div>
  );
}

export default ChartLegend;
