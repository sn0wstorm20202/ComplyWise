"use client";

import React from "react";
import Link from "next/link";
import {
  Calendar,
  CheckSquare,
  FileText,
  Building2,
  ArrowRight,
  Edit3,
} from "lucide-react";
import { BusinessProfile } from "@/data/demo";

interface DashboardMetricsRowProps {
  profile: BusinessProfile;
  onNavigateToView: (view: string) => void;
  onOpenCalendar?: () => void;
  onOpenDocuments?: () => void;
  onOpenTasks?: () => void;
}

export function DashboardMetricsRow({
  profile,
  onNavigateToView,
  onOpenCalendar,
  onOpenDocuments,
  onOpenTasks,
}: DashboardMetricsRowProps) {
  // Metric numbers derived from context or calibrated defaults
  const percentage = 62;
  const completedCount = 26;
  const inProgressCount = 18;
  const pendingCount = 11;
  const notApplicableCount = 5;
  const totalReqs = 60;

  // SVG Gauge parameters (circumference: 2 * PI * r = 2 * PI * 42 ≈ 263.89)
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (circumference * percentage) / 100;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3.5 sm:gap-4 items-stretch select-none">
      {/* CARD 1: Overall Compliance Progress */}
      <div className="slash-card p-4 sm:p-5 flex flex-col justify-between hover:border-[#2e3038] transition-colors">
        <div>
          <div className="text-xs font-semibold text-[#ffffff] tracking-tight">
            Overall Compliance Progress
          </div>
          <div className="flex items-center justify-between mt-3">
            {/* Donut Gauge */}
            <div className="relative h-20 w-20 shrink-0 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                {/* Track */}
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  fill="none"
                  stroke="#1c1d22"
                  strokeWidth="8"
                />
                {/* Gauge Progress with Gilded Gradient */}
                <defs>
                  <linearGradient id="gaugeGilded" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#ae9357" />
                    <stop offset="60%" stopColor="#fff0cc" />
                    <stop offset="100%" stopColor="#75d69c" />
                  </linearGradient>
                </defs>
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  fill="none"
                  stroke="url(#gaugeGilded)"
                  strokeWidth="8"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-serif text-lg font-bold text-[#ffffff] tracking-tight">
                  {percentage}%
                </span>
              </div>
            </div>

            {/* Breakdown status dots */}
            <div className="space-y-1 text-[11px] text-[#9194a1]">
              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-[#75d69c]" />
                <span>Completed</span>
                <span className="text-[#ffffff] font-medium ml-auto pl-2">{completedCount}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-[#f2c96d]" />
                <span>In Progress</span>
                <span className="text-[#ffffff] font-medium ml-auto pl-2">{inProgressCount}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-[#ed7c7c]" />
                <span>Pending</span>
                <span className="text-[#ffffff] font-medium ml-auto pl-2">{pendingCount}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-[#5e616e]" />
                <span>Not Applicable</span>
                <span className="text-[#ffffff] font-medium ml-auto pl-2">{notApplicableCount}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-3 mt-3 border-t border-[#1c1d22] flex items-center justify-between text-[10px] text-[#5e616e]">
          <span>Total Requirements: {totalReqs}</span>
          <span>Last: 28 Aug 2026</span>
        </div>
      </div>

      {/* CARD 2: Upcoming Deadlines */}
      <div className="slash-card p-4 sm:p-5 flex flex-col justify-between hover:border-[#2e3038] transition-colors">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#ffffff] tracking-tight">
            <div className="h-5 w-5 rounded-full bg-[#121317] border border-[#1c1d22] flex items-center justify-center">
              <Calendar className="h-3 w-3 text-[#cc9166]" />
            </div>
            <span>Upcoming Deadlines</span>
          </div>

          <div className="mt-4 flex items-baseline gap-2">
            <span className="font-serif text-3xl sm:text-4xl font-bold text-[#ffffff] tracking-tight">
              5
            </span>
            <span className="text-xs text-[#9194a1]">in next 30 days</span>
          </div>

          <div className="flex items-center gap-2 mt-3">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#ed7c7c]/10 border border-[#ed7c7c]/25 text-[#ed7c7c] text-[10px] font-semibold">
              2 Overdue
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#cc9166]/10 border border-[#cc9166]/25 text-[#cc9166] text-[10px] font-semibold">
              3 Due Soon
            </span>
          </div>
        </div>

        <div className="pt-3 mt-4 border-t border-[#1c1d22]">
          <button
            type="button"
            onClick={() => {
              if (onOpenCalendar) onOpenCalendar();
              else onNavigateToView("calendar");
            }}
            className="text-[11px] text-[#9194a1] hover:text-[#cc9166] font-medium inline-flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span>View Calendar</span>
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* CARD 3: Tasks Requiring Action */}
      <div className="slash-card p-4 sm:p-5 flex flex-col justify-between hover:border-[#2e3038] transition-colors">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#ffffff] tracking-tight">
            <div className="h-5 w-5 rounded-full bg-[#121317] border border-[#1c1d22] flex items-center justify-center">
              <CheckSquare className="h-3 w-3 text-[#cc9166]" />
            </div>
            <span>Tasks Requiring Action</span>
          </div>

          <div className="mt-4 flex items-baseline gap-2">
            <span className="font-serif text-3xl sm:text-4xl font-bold text-[#ffffff] tracking-tight">
              7
            </span>
            <span className="text-xs text-[#9194a1]">need your attention</span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 mt-3 text-[10px]">
            <span className="px-2 py-0.5 rounded-full bg-[#ed7c7c]/10 text-[#ed7c7c] font-semibold border border-[#ed7c7c]/20">
              3 High
            </span>
            <span className="px-2 py-0.5 rounded-full bg-[#f2c96d]/10 text-[#f2c96d] font-semibold border border-[#f2c96d]/20">
              2 Medium
            </span>
            <span className="px-2 py-0.5 rounded-full bg-[#75d69c]/10 text-[#75d69c] font-semibold border border-[#75d69c]/20">
              2 Low
            </span>
          </div>
        </div>

        <div className="pt-3 mt-4 border-t border-[#1c1d22]">
          <button
            type="button"
            onClick={() => {
              if (onOpenTasks) onOpenTasks();
              else onNavigateToView("workflows");
            }}
            className="text-[11px] text-[#9194a1] hover:text-[#cc9166] font-medium inline-flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span>View All Tasks</span>
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* CARD 4: Document Status */}
      <div className="slash-card p-4 sm:p-5 flex flex-col justify-between hover:border-[#2e3038] transition-colors">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#ffffff] tracking-tight">
            <div className="h-5 w-5 rounded-full bg-[#121317] border border-[#1c1d22] flex items-center justify-center">
              <FileText className="h-3 w-3 text-[#cc9166]" />
            </div>
            <span>Document Status</span>
          </div>

          <div className="mt-4 flex items-baseline gap-2">
            <span className="font-serif text-3xl sm:text-4xl font-bold text-[#ffffff] tracking-tight">
              36
            </span>
            <span className="text-xs text-[#9194a1]">total documents</span>
          </div>

          <div className="grid grid-cols-2 gap-1.5 mt-3 text-[10px] text-[#9194a1]">
            <div className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-[#75d69c]" />
              <span>16 Approved</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-[#82a8f8]" />
              <span>8 Review</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-[#f2c96d]" />
              <span>6 Attention</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-[#ed7c7c]" />
              <span>6 Missing</span>
            </div>
          </div>
        </div>

        <div className="pt-3 mt-4 border-t border-[#1c1d22]">
          <button
            type="button"
            onClick={() => {
              if (onOpenDocuments) onOpenDocuments();
              else onNavigateToView("documents");
            }}
            className="text-[11px] text-[#9194a1] hover:text-[#cc9166] font-medium inline-flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span>Go to Documents</span>
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* CARD 5: Your Business Snapshot */}
      <div className="slash-card p-4 sm:p-5 flex flex-col justify-between hover:border-[#2e3038] transition-colors">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#ffffff] tracking-tight truncate">
              Business Snapshot
            </span>
            <button
              type="button"
              onClick={() => onNavigateToView("profile")}
              className="text-[10px] font-semibold text-[#cc9166] hover:underline cursor-pointer inline-flex items-center gap-0.5"
            >
              <Edit3 className="h-2.5 w-2.5" />
              <span>Edit</span>
            </button>
          </div>

          <div className="mt-3 space-y-1.5 text-[11px]">
            <div className="flex items-baseline justify-between gap-1">
              <span className="text-[#777a88]">Type</span>
              <span className="text-[#ffffff] font-medium truncate max-w-[120px]">
                {profile.businessType || "Manufacturing Unit"}
              </span>
            </div>
            <div className="flex items-baseline justify-between gap-1">
              <span className="text-[#777a88]">Sector</span>
              <span className="text-[#ffffff] font-medium truncate max-w-[120px]">
                {profile.sector || "Electrical Equipment"}
              </span>
            </div>
            <div className="flex items-baseline justify-between gap-1">
              <span className="text-[#777a88]">Product</span>
              <span className="text-[#cc9166] font-medium truncate max-w-[120px]">
                {profile.activities?.[0] || "Electric Fans (IS 374)"}
              </span>
            </div>
            <div className="flex items-baseline justify-between gap-1">
              <span className="text-[#777a88]">Location</span>
              <span className="text-[#ffffff] font-medium truncate max-w-[120px]">
                {profile.location || "West Bengal, India"}
              </span>
            </div>
            <div className="flex items-baseline justify-between gap-1">
              <span className="text-[#777a88]">Stage</span>
              <span className="text-[#75d69c] font-medium truncate max-w-[120px]">
                {profile.lifecycleStage || "Operational"}
              </span>
            </div>
          </div>
        </div>

        <div className="pt-3 mt-3 border-t border-[#1c1d22]">
          <button
            type="button"
            onClick={() => onNavigateToView("profile")}
            className="text-[11px] text-[#9194a1] hover:text-[#cc9166] font-medium inline-flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span>View Full Profile</span>
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default DashboardMetricsRow;
