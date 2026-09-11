"use client";

import React from "react";
import { ArrowRight } from "lucide-react";

interface CategorySlice {
  name: string;
  count: number;
  pct: number;
  color: string;
}

const CATEGORIES: CategorySlice[] = [
  { name: "BIS", count: 12, pct: 20, color: "#ae9357" }, // Gilded gold
  { name: "Approvals", count: 18, pct: 30, color: "#6d8cff" }, // Slate blue
  { name: "NOCs", count: 10, pct: 16, color: "#f2c96d" }, // Amber
  { name: "Registrations", count: 8, pct: 14, color: "#75d69c" }, // Emerald
  { name: "Licences", count: 6, pct: 10, color: "#ed7c7c" }, // Coral
  { name: "Certificates", count: 6, pct: 10, color: "#cc9166" }, // Copper
];

interface RequirementCategoriesDonutProps {
  onNavigateToView: (view: string) => void;
}

export function RequirementCategoriesDonut({
  onNavigateToView,
}: RequirementCategoriesDonutProps) {
  const total = CATEGORIES.reduce((acc, c) => acc + c.count, 0);

  // Calculate SVG donut segments
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  let accumulatedPercent = 0;

  return (
    <div className="slash-card p-5 flex flex-col justify-between select-none">
      <div>
        <h2 className="text-sm font-semibold text-[#ffffff] tracking-tight pb-3.5 border-b border-[#1c1d22]">
          Requirement Categories
        </h2>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-3.5">
          {/* Donut Chart */}
          <div className="relative h-28 w-28 shrink-0 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              {/* Background Track */}
              <circle
                cx="50"
                cy="50"
                r={radius}
                fill="none"
                stroke="#1c1d22"
                strokeWidth="12"
              />

              {/* Slices */}
              {CATEGORIES.map((slice) => {
                const strokeLength = (slice.pct / 100) * circumference;
                const strokeOffset = circumference - (accumulatedPercent / 100) * circumference;
                accumulatedPercent += slice.pct;

                return (
                  <circle
                    key={slice.name}
                    cx="50"
                    cy="50"
                    r={radius}
                    fill="none"
                    stroke={slice.color}
                    strokeWidth="12"
                    strokeDasharray={`${strokeLength} ${circumference - strokeLength}`}
                    strokeDashoffset={strokeOffset}
                    className="transition-all duration-500"
                  />
                );
              })}
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="font-serif text-lg font-bold text-[#ffffff] leading-none">
                {total}
              </span>
              <span className="text-[10px] text-[#777a88] mt-0.5">Total</span>
            </div>
          </div>

          {/* Legend Grid */}
          <div className="flex-1 w-full space-y-1 text-xs">
            {CATEGORIES.map((cat) => (
              <div
                key={cat.name}
                className="flex items-center justify-between text-[11px] py-0.5 hover:bg-[#121317] px-1 rounded transition-colors"
              >
                <div className="flex items-center gap-2 truncate">
                  <span
                    className="h-2 w-2 rounded-full shrink-0"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span className="text-[#9194a1] truncate">{cat.name}</span>
                </div>
                <div className="text-right shrink-0 pl-2 font-mono">
                  <span className="text-[#ffffff] font-medium">{cat.count}</span>
                  <span className="text-[#5e616e] text-[10px] ml-1">({cat.pct}%)</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer Link */}
      <div className="pt-3.5 mt-3 border-t border-[#1c1d22]">
        <button
          type="button"
          onClick={() => onNavigateToView("compliance")}
          className="text-xs text-[#cc9166] hover:underline font-medium inline-flex items-center gap-1 cursor-pointer"
        >
          <span>View Category-wise Breakdown</span>
          <ArrowRight className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

export default RequirementCategoriesDonut;
