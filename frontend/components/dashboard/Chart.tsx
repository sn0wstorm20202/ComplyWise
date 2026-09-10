"use client";

import React from "react";

export interface BarDataPoint {
  label: string;
  value: number;
  isHighlight?: boolean;
  tooltip?: string;
}

export interface SplineDataPoint {
  label: string;
  value: number;
  isPeak?: boolean;
  tooltip?: string;
}

export interface ChartProps {
  type: "bars" | "spline";
  barsData?: BarDataPoint[];
  splineData?: SplineDataPoint[];
  height?: number;
  maxValue?: number;
  strokeColor?: string;
  highlightColor?: string;
  onHoverPoint?: (label: string | null) => void;
  className?: string;
}

export function Chart({
  type,
  barsData = [],
  splineData = [],
  height = 110,
  maxValue,
  strokeColor = "#0f172a",
  highlightColor = "#ecfa98",
  onHoverPoint,
  className = "",
}: ChartProps) {
  if (type === "bars") {
    const computedMax = maxValue || Math.max(...barsData.map((d) => d.value), 1);

    return (
      <div className={`flex items-end justify-between gap-2 px-1 w-full ${className}`} style={{ height: `${height}px` }}>
        {barsData.map((d) => {
          const heightPercent = Math.min(100, Math.max(12, Math.round((d.value / computedMax) * 100)));
          return (
            <div
              key={d.label}
              onMouseEnter={() => onHoverPoint && onHoverPoint(d.label)}
              onMouseLeave={() => onHoverPoint && onHoverPoint(null)}
              className="flex-1 flex flex-col items-center gap-2 h-full justify-end group cursor-pointer"
            >
              <div
                className={`w-full max-w-[26px] rounded-full transition-all duration-300 group-hover:scale-y-105 origin-bottom ${
                  d.isHighlight
                    ? "shadow-xs"
                    : "bg-[#f1f5f9] group-hover:bg-slate-300/80"
                }`}
                style={{
                  height: `${heightPercent}%`,
                  backgroundColor: d.isHighlight ? highlightColor : undefined,
                }}
              />
              <span
                className={`text-[11px] font-semibold transition-colors ${
                  d.isHighlight ? "text-slate-900 font-bold" : "text-slate-400 group-hover:text-slate-700"
                }`}
              >
                {d.label}
              </span>
            </div>
          );
        })}
      </div>
    );
  }

  // Spline Area Chart
  const computedMax = maxValue || Math.max(...splineData.map((d) => d.value), 1);
  const totalPoints = splineData.length;
  const width = 300;
  const chartHeight = height;

  const points = splineData.map((pt, i) => {
    const x = totalPoints > 1 ? (i / (totalPoints - 1)) * (width - 24) + 12 : width / 2;
    const y = chartHeight - 12 - (pt.value / computedMax) * (chartHeight - 24);
    return { ...pt, x, y };
  });

  // Build SVG path
  let pathD = "";
  if (points.length > 0) {
    pathD = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const current = points[i];
      const next = points[i + 1];
      const midX = (current.x + next.x) / 2;
      pathD += ` C ${midX} ${current.y}, ${midX} ${next.y}, ${next.x} ${next.y}`;
    }
  }

  const areaD = points.length > 0
    ? `${pathD} L ${points[points.length - 1].x} ${chartHeight} L ${points[0].x} ${chartHeight} Z`
    : "";

  return (
    <div className={`relative w-full ${className}`} style={{ height: `${chartHeight}px` }}>
      <svg
        className="w-full h-full overflow-visible"
        viewBox={`0 0 ${width} ${chartHeight}`}
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f1f5f9" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.05" />
          </linearGradient>
        </defs>

        {/* Gradient fill underneath curve */}
        {areaD && <path d={areaD} fill="url(#chartGradient)" />}

        {/* Spline curve stroke */}
        {pathD && (
          <path
            d={pathD}
            fill="none"
            stroke={strokeColor}
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        )}

        {/* Dots on each day */}
        {points.map((p, idx) => (
          <g key={idx}>
            <circle cx={p.x} cy={p.y} r="3.5" fill={strokeColor} />
            {p.isPeak && (
              <circle
                cx={p.x}
                cy={p.y}
                r="6"
                fill="none"
                stroke={strokeColor}
                strokeWidth="1.5"
                opacity="0.4"
              />
            )}
          </g>
        ))}
      </svg>
    </div>
  );
}

export default Chart;
