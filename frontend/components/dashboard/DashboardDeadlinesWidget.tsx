"use client";

import React from "react";
import { Calendar, ArrowRight, Clock, AlertTriangle } from "lucide-react";

export interface DeadlineEvent {
  id: string;
  day: string;
  month: string;
  title: string;
  subtitle: string;
  daysLeft: number;
  urgency: "HIGH" | "MEDIUM" | "NORMAL";
}

const DEFAULT_DEADLINES: DeadlineEvent[] = [
  {
    id: "dl-1",
    day: "29",
    month: "AUG",
    title: "BIS Certification — Document Submission",
    subtitle: "Mandatory test records pending",
    daysLeft: 3,
    urgency: "HIGH",
  },
  {
    id: "dl-2",
    day: "05",
    month: "SEP",
    title: "Pollution Consent (CTE)",
    subtitle: "Water Act consent application",
    daysLeft: 10,
    urgency: "MEDIUM",
  },
  {
    id: "dl-3",
    day: "12",
    month: "SEP",
    title: "Fire NOC — Inspection",
    subtitle: "Site inspection scheduled by Dept",
    daysLeft: 17,
    urgency: "MEDIUM",
  },
  {
    id: "dl-4",
    day: "30",
    month: "SEP",
    title: "BIS Factory Inspection",
    subtitle: "Quality manual & calibration records",
    daysLeft: 35,
    urgency: "NORMAL",
  },
];

interface DashboardDeadlinesWidgetProps {
  onNavigateToView: (view: string) => void;
}

export function DashboardDeadlinesWidget({
  onNavigateToView,
}: DashboardDeadlinesWidgetProps) {
  return (
    <div className="slash-card p-5 flex flex-col justify-between select-none">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-[#1c1d22]">
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 rounded-full bg-[#121317] border border-[#1c1d22] flex items-center justify-center">
              <Calendar className="h-3 w-3 text-[#cc9166]" />
            </div>
            <h2 className="text-sm font-semibold text-[#ffffff] tracking-tight">
              Upcoming Deadlines
            </h2>
          </div>

          <button
            type="button"
            onClick={() => onNavigateToView("calendar")}
            className="text-[11px] font-medium text-[#cc9166] hover:underline cursor-pointer inline-flex items-center gap-1"
          >
            <span>View All</span>
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>

        {/* Deadline Items List */}
        <div className="divide-y divide-[#1c1d22] mt-1">
          {DEFAULT_DEADLINES.map((item) => (
            <div
              key={item.id}
              onClick={() => onNavigateToView("calendar")}
              className="py-3 flex items-center gap-3 group cursor-pointer hover:bg-[#121317]/50 px-1 -mx-1 rounded-[8px] transition-colors"
            >
              {/* Date Block Badge */}
              <div
                className={`h-11 w-11 rounded-[8px] shrink-0 flex flex-col items-center justify-center border font-mono ${
                  item.urgency === "HIGH"
                    ? "bg-[#ed7c7c]/10 border-[#ed7c7c]/30 text-[#ed7c7c]"
                    : item.urgency === "MEDIUM"
                    ? "bg-[#cc9166]/10 border-[#cc9166]/30 text-[#cc9166]"
                    : "bg-[#121317] border-[#1c1d22] text-[#9194a1]"
                }`}
              >
                <span className="text-xs font-bold leading-none">{item.day}</span>
                <span className="text-[9px] font-semibold tracking-wider mt-0.5">{item.month}</span>
              </div>

              {/* Event Content */}
              <div className="min-w-0 flex-1">
                <div className="font-medium text-xs text-[#ffffff] truncate group-hover:text-[#cc9166] transition-colors">
                  {item.title}
                </div>
                <div className="text-[11px] text-[#777a88] truncate mt-0.5">
                  {item.subtitle}
                </div>
              </div>

              {/* Days Left Tag */}
              <div className="text-right shrink-0">
                <span
                  className={`inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    item.daysLeft <= 3
                      ? "bg-[#ed7c7c]/15 text-[#ed7c7c]"
                      : item.daysLeft <= 14
                      ? "bg-[#cc9166]/15 text-[#cc9166]"
                      : "bg-[#1c1d22] text-[#9194a1]"
                  }`}
                >
                  {item.daysLeft}d left
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer Alert */}
      <div className="pt-3 mt-2 border-t border-[#1c1d22] flex items-center gap-1.5 text-[11px] text-[#9194a1]">
        <Clock className="h-3 w-3 text-[#cc9166]" />
        <span>Syncs directly with official department portals</span>
      </div>
    </div>
  );
}

export default DashboardDeadlinesWidget;
