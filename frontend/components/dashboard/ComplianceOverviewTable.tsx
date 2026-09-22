"use client";

import React, { useState, useMemo } from "react";
import { Filter, ArrowRight, ShieldCheck } from "lucide-react";

export interface ComplianceItem {
  id: string;
  code?: string;
  name: string;
  subtext: string;
  authority: string;
  category: "BIS" | "Approvals" | "NOCs" | "Registrations" | "Licences" | "Certificates";
  status: "In Progress" | "Completed" | "Pending";
  progress: number;
  dueDate: string;
  daysLeft?: number;
  actionLabel: "Continue" | "View" | "Start";
}

const DEFAULT_ITEMS: ComplianceItem[] = [
  {
    id: "req-1",
    code: "IS 374:2019",
    name: "BIS Certification — Ceiling Fans",
    subtext: "IS 374:2019 · Mandatory ISI Scheme I",
    authority: "BIS",
    category: "BIS",
    status: "In Progress",
    progress: 60,
    dueDate: "29 Aug 2026",
    daysLeft: 3,
    actionLabel: "Continue",
  },
  {
    id: "req-2",
    code: "FAC-LIC-01",
    name: "Factory Licence",
    subtext: "Manufacturing Unit Registration",
    authority: "DIC",
    category: "Licences",
    status: "Completed",
    progress: 100,
    dueDate: "—",
    actionLabel: "View",
  },
  {
    id: "req-3",
    code: "NOC-FIRE-02",
    name: "Fire NOC",
    subtext: "Factory Building Fire Safety Clearance",
    authority: "Fire Dept",
    category: "NOCs",
    status: "Completed",
    progress: 100,
    dueDate: "—",
    actionLabel: "View",
  },
  {
    id: "req-4",
    code: "CTO-AIR-03",
    name: "Consent to Operate (Air)",
    subtext: "State Pollution Control Board Air Consent",
    authority: "SPCB",
    category: "Approvals",
    status: "In Progress",
    progress: 35,
    dueDate: "14 Jun 2026",
    daysLeft: 12,
    actionLabel: "Continue",
  },
  {
    id: "req-5",
    code: "EPR-PWM-04",
    name: "EPR Packaging Registration",
    subtext: "Plastic Waste Management Rules EPR",
    authority: "CPCB",
    category: "Registrations",
    status: "Pending",
    progress: 0,
    dueDate: "01 Jul 2026",
    daysLeft: 29,
    actionLabel: "Start",
  },
];

interface ComplianceOverviewTableProps {
  items?: ComplianceItem[];
  onNavigateToView: (view: string) => void;
  onSelectRequirement?: (item: ComplianceItem) => void;
}

export function ComplianceOverviewTable({
  items = DEFAULT_ITEMS,
  onNavigateToView,
  onSelectRequirement,
}: ComplianceOverviewTableProps) {
  const [activeTab, setActiveTab] = useState<string>("All");

  const tabs = useMemo(() => {
    const counts = {
      All: items.length,
      BIS: items.filter((i) => i.category === "BIS").length,
      Approvals: items.filter((i) => i.category === "Approvals").length,
      NOCs: items.filter((i) => i.category === "NOCs").length,
      Registrations: items.filter((i) => i.category === "Registrations").length,
      Licences: items.filter((i) => i.category === "Licences").length,
      Certificates: items.filter((i) => i.category === "Certificates").length,
    };
    return [
      { key: "All", label: `All (${counts.All})` },
      { key: "BIS", label: `BIS (${counts.BIS})` },
      { key: "Approvals", label: `Approvals (${counts.Approvals})` },
      { key: "NOCs", label: `NOCs (${counts.NOCs})` },
      { key: "Registrations", label: `Registrations (${counts.Registrations})` },
      { key: "Licences", label: `Licences (${counts.Licences})` },
      { key: "Certificates", label: `Certificates (${counts.Certificates})` },
    ];
  }, [items]);

  const filteredItems = activeTab === "All"
    ? items
    : items.filter((item) => item.category === activeTab);

  return (
    <div className="slash-card p-5 sm:p-6 flex flex-col justify-between select-none bg-white dark:bg-[#0E1318] border border-[#E2E8F0] dark:border-white/12 shadow-sm rounded-2xl">
      <div>
        {/* Header & Filter Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-[#E2E8F0] dark:border-white/10">
          <div>
            <h2 className="text-base font-bold text-[#0B1220] dark:text-[#F7F9FC] tracking-tight">
              Compliance Overview
            </h2>
            <p className="text-xs text-[#475569] dark:text-[#A8B2BE] mt-0.5 font-normal">
              Statutory approvals, BIS licences, and clearances required for your facility.
            </p>
          </div>

          <button
            type="button"
            onClick={() => onNavigateToView("compliance")}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white dark:bg-[#141A21] hover:bg-[#F8FAFD] dark:hover:bg-white/10 border border-[#E2E8F0] dark:border-white/15 text-xs font-semibold text-[#334155] dark:text-[#D4DBE4] hover:text-[#0B1220] dark:hover:text-white transition-colors cursor-pointer self-start sm:self-auto shadow-2xs"
          >
            <Filter className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
            <span>Filter</span>
          </button>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-3 no-scrollbar border-b border-[#E2E8F0] dark:border-white/10">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  isActive
                    ? "bg-[#0B1220] dark:bg-white text-white dark:text-[#070A0D] shadow-xs"
                    : "text-[#475569] dark:text-[#A8B2BE] hover:text-[#0B1220] dark:hover:text-[#F7F9FC] hover:bg-[#F8FAFD] dark:hover:bg-white/5 border border-[#E2E8F0] dark:border-white/10"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Table Container */}
        <div className="overflow-x-auto mt-2">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#E2E8F0] dark:border-white/10 text-[#475569] dark:text-[#A8B2BE] text-xs uppercase font-bold tracking-wider">
                <th className="py-3 px-2">Requirement</th>
                <th className="py-3 px-2">Authority</th>
                <th className="py-3 px-2">Status</th>
                <th className="py-3 px-2">Progress</th>
                <th className="py-3 px-2">Due Date</th>
                <th className="py-3 px-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] dark:divide-white/10">
              {filteredItems.map((item) => (
                <tr
                  key={item.id}
                  className="hover:bg-[#F8FAFD] dark:hover:bg-white/[0.04] transition-colors group"
                >
                  {/* Requirement Name + Code */}
                  <td className="py-3.5 px-2">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-xl bg-[#F1F5F9] dark:bg-white/10 border border-[#E2E8F0] dark:border-white/15 flex items-center justify-center shrink-0 text-blue-600 dark:text-blue-400">
                        <ShieldCheck className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-sm text-[#0B1220] dark:text-[#F7F9FC] truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {item.name}
                        </div>
                        <div className="text-xs text-[#475569] dark:text-[#A8B2BE] font-mono truncate mt-0.5">
                          {item.subtext}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Authority */}
                  <td className="py-3.5 px-2 text-[#334155] dark:text-[#D4DBE4] font-medium whitespace-nowrap text-xs">
                    {item.authority}
                  </td>

                  {/* Status Badge */}
                  <td className="py-3.5 px-2 whitespace-nowrap">
                    {item.status === "Completed" && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 text-xs font-semibold">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400" />
                        Completed
                      </span>
                    )}
                    {item.status === "In Progress" && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30 text-xs font-semibold">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-600 dark:bg-amber-400" />
                        In Progress
                      </span>
                    )}
                    {item.status === "Pending" && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 dark:bg-rose-500/15 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-500/30 text-xs font-semibold">
                        <span className="h-1.5 w-1.5 rounded-full bg-rose-600 dark:bg-rose-400" />
                        Pending
                      </span>
                    )}
                  </td>

                  {/* Progress Bar with Percentage */}
                  <td className="py-3.5 px-2 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-2 rounded-full bg-[#E2E8F0] dark:bg-white/10 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${item.progress}%`,
                            backgroundColor:
                              item.progress === 100
                                ? "#10B981"
                                : item.progress > 0
                                ? "#2563EB"
                                : "transparent",
                          }}
                        />
                      </div>
                      <span className="text-xs font-mono font-semibold text-[#475569] dark:text-[#A8B2BE] w-7">
                        {item.progress}%
                      </span>
                    </div>
                  </td>

                  {/* Due Date */}
                  <td className="py-3.5 px-2 whitespace-nowrap text-xs">
                    {item.dueDate === "—" ? (
                      <span className="text-[#94A3B8]">—</span>
                    ) : (
                      <div>
                        <div className="text-[#0B1220] dark:text-[#F7F9FC] font-semibold">{item.dueDate}</div>
                        {item.daysLeft !== undefined && (
                          <div
                            className={`text-xs font-semibold mt-0.5 ${
                              item.daysLeft <= 3 ? "text-rose-600 dark:text-rose-400" : "text-amber-600 dark:text-amber-400"
                            }`}
                          >
                            {item.daysLeft} days left
                          </div>
                        )}
                      </div>
                    )}
                  </td>

                  {/* Action Button */}
                  <td className="py-3.5 px-2 text-right whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => {
                        if (onSelectRequirement) onSelectRequirement(item);
                        else onNavigateToView("compliance");
                      }}
                      className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                        item.actionLabel === "Continue"
                          ? "bg-blue-600 hover:bg-blue-700 text-white shadow-2xs"
                          : item.actionLabel === "Start"
                          ? "bg-amber-600 hover:bg-amber-700 text-white shadow-2xs"
                          : "border border-[#CBD5E1] dark:border-white/20 text-[#0B1220] dark:text-[#F7F9FC] hover:bg-[#F8FAFD] dark:hover:bg-white/10"
                      }`}
                    >
                      {item.actionLabel}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer Link */}
      <div className="pt-3.5 mt-3 border-t border-[#E2E8F0] dark:border-white/10 flex items-center justify-between">
        <button
          type="button"
          onClick={() => onNavigateToView("compliance")}
          className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-semibold inline-flex items-center gap-1 cursor-pointer"
        >
          <span>View All Requirements</span>
          <ArrowRight className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

export default ComplianceOverviewTable;
