"use client";

import React, { useState } from "react";
import { Filter, ArrowRight, ShieldCheck, FileText, CheckCircle2, Clock, AlertCircle } from "lucide-react";

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
    authority: "Fire Dept.",
    category: "NOCs",
    status: "In Progress",
    progress: 40,
    dueDate: "12 Sep 2026",
    daysLeft: 17,
    actionLabel: "Continue",
  },
  {
    id: "req-4",
    code: "PCB-CTE-01",
    name: "Pollution Consent (CTE)",
    subtext: "Water Act & Air Act Statutory Clearance",
    authority: "WBPCB",
    category: "Approvals",
    status: "Pending",
    progress: 0,
    dueDate: "05 Sep 2026",
    daysLeft: 10,
    actionLabel: "Start",
  },
  {
    id: "req-5",
    code: "GST-REG-01",
    name: "GST Registration",
    subtext: "Statutory Tax Registration (Form REG-06)",
    authority: "GST Dept.",
    category: "Registrations",
    status: "Completed",
    progress: 100,
    dueDate: "—",
    actionLabel: "View",
  },
];

interface ComplianceOverviewTableProps {
  onNavigateToView: (view: string) => void;
  onSelectRequirement?: (req: ComplianceItem) => void;
  liveSummary?: any;
  items?: ComplianceItem[];
}

export function ComplianceOverviewTable({
  onNavigateToView,
  onSelectRequirement,
  liveSummary,
  items: customItems,
}: ComplianceOverviewTableProps) {
  const [activeTab, setActiveTab] = useState<string>("All");

  const items = React.useMemo<ComplianceItem[]>(() => {
    if (customItems && customItems.length > 0) return customItems;
    if (liveSummary?.priority_actions && Array.isArray(liveSummary.priority_actions) && liveSummary.priority_actions.length > 0) {
      return liveSummary.priority_actions.map((act: any, idx: number) => {
        const cat = act.statutory_authority === "BIS"
          ? "BIS"
          : act.statutory_authority === "WPC" || act.statutory_authority === "DGFT"
          ? "Licences"
          : "Approvals";
        return {
          id: act.requirement_id || `req-live-${idx}`,
          code: act.requirement_id || `REQ-00${idx + 1}`,
          name: act.title || "Statutory Requirement",
          subtext: `${act.statutory_authority || "Statutory"} · ${act.act_or_regulation || "Compliance Mandate"}`,
          authority: act.statutory_authority || "Authority",
          category: cat as ComplianceItem["category"],
          status: act.severity === "CRITICAL" ? "Pending" : "In Progress",
          progress: act.due_in_days <= 15 ? 30 : 60,
          dueDate: act.due_in_days ? `In ${act.due_in_days} days` : "30 days",
          daysLeft: act.due_in_days || 15,
          actionLabel: act.severity === "CRITICAL" ? ("Start" as const) : ("Continue" as const),
        };
      });
    }
    return DEFAULT_ITEMS;
  }, [customItems, liveSummary]);

  const tabs = React.useMemo(() => {
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
    <div className="slash-card p-5 flex flex-col justify-between select-none">
      <div>
        {/* Header & Filter Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-[#1c1d22]">
          <div>
            <h2 className="text-sm font-semibold text-[#ffffff] tracking-tight">
              Compliance Overview
            </h2>
            <p className="text-[11px] text-[#9194a1] mt-0.5">
              Statutory approvals, BIS licences, and clearances required for your facility.
            </p>
          </div>

          <button
            type="button"
            onClick={() => onNavigateToView("compliance")}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#121317] hover:bg-[#1c1d22] border border-[#1c1d22] text-xs text-[#e2e3e9] transition-colors cursor-pointer self-start sm:self-auto"
          >
            <Filter className="h-3.5 w-3.5 text-[#cc9166]" />
            <span>Filter</span>
          </button>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-3 no-scrollbar border-b border-[#1c1d22]">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  isActive
                    ? "bg-[#ffffff] text-[#000000] font-semibold"
                    : "text-[#9194a1] hover:text-[#ffffff] hover:bg-white/[0.03] border border-[#1c1d22]"
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
              <tr className="border-b border-[#1c1d22] text-[#777a88] text-[10px] uppercase font-semibold">
                <th className="py-2.5 px-2">Requirement</th>
                <th className="py-2.5 px-2">Authority</th>
                <th className="py-2.5 px-2">Status</th>
                <th className="py-2.5 px-2">Progress</th>
                <th className="py-2.5 px-2">Due Date</th>
                <th className="py-2.5 px-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1c1d22]">
              {filteredItems.map((item) => (
                <tr
                  key={item.id}
                  className="hover:bg-[#121317]/50 transition-colors group"
                >
                  {/* Requirement Name + Code */}
                  <td className="py-3 px-2">
                    <div className="flex items-center gap-2.5">
                      <div className="h-7 w-7 rounded-[8px] bg-[#121317] border border-[#1c1d22] flex items-center justify-center shrink-0 text-[#cc9166]">
                        <ShieldCheck className="h-3.5 w-3.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-[#ffffff] truncate group-hover:text-[#cc9166] transition-colors">
                          {item.name}
                        </div>
                        <div className="text-[10px] text-[#777a88] font-mono truncate">
                          {item.subtext}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Authority */}
                  <td className="py-3 px-2 text-[#9194a1] font-medium whitespace-nowrap">
                    {item.authority}
                  </td>

                  {/* Status Badge */}
                  <td className="py-3 px-2 whitespace-nowrap">
                    {item.status === "Completed" && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#75d69c]/10 text-[#75d69c] border border-[#75d69c]/20 text-[10px] font-semibold">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#75d69c]" />
                        Completed
                      </span>
                    )}
                    {item.status === "In Progress" && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#f2c96d]/10 text-[#f2c96d] border border-[#f2c96d]/20 text-[10px] font-semibold">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#f2c96d]" />
                        In Progress
                      </span>
                    )}
                    {item.status === "Pending" && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#ed7c7c]/10 text-[#ed7c7c] border border-[#ed7c7c]/20 text-[10px] font-semibold">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#ed7c7c]" />
                        Pending
                      </span>
                    )}
                  </td>

                  {/* Progress Bar with Percentage */}
                  <td className="py-3 px-2 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 rounded-full bg-[#1c1d22] overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${item.progress}%`,
                            backgroundColor:
                              item.progress === 100
                                ? "#75d69c"
                                : item.progress > 0
                                ? "#6d8cff"
                                : "transparent",
                          }}
                        />
                      </div>
                      <span className="text-[10px] font-mono text-[#9194a1] w-7">
                        {item.progress}%
                      </span>
                    </div>
                  </td>

                  {/* Due Date */}
                  <td className="py-3 px-2 whitespace-nowrap text-[11px]">
                    {item.dueDate === "—" ? (
                      <span className="text-[#5e616e]">—</span>
                    ) : (
                      <div>
                        <div className="text-[#e2e3e9] font-medium">{item.dueDate}</div>
                        {item.daysLeft !== undefined && (
                          <div
                            className={`text-[9px] font-semibold ${
                              item.daysLeft <= 3 ? "text-[#ed7c7c]" : "text-[#cc9166]"
                            }`}
                          >
                            {item.daysLeft} days left
                          </div>
                        )}
                      </div>
                    )}
                  </td>

                  {/* Action Button */}
                  <td className="py-3 px-2 text-right whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => {
                        if (onSelectRequirement) onSelectRequirement(item);
                        else onNavigateToView("compliance");
                      }}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                        item.actionLabel === "Continue"
                          ? "bg-[#ffffff] text-[#000000] hover:bg-white/90"
                          : item.actionLabel === "Start"
                          ? "bg-[#cc9166] text-[#08080a] font-semibold hover:bg-[#cc9166]/90"
                          : "border border-[#2e3038] text-[#e2e3e9] hover:bg-white/[0.05]"
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
      <div className="pt-3.5 mt-3 border-t border-[#1c1d22] flex items-center justify-between">
        <button
          type="button"
          onClick={() => onNavigateToView("compliance")}
          className="text-xs text-[#cc9166] hover:underline font-medium inline-flex items-center gap-1 cursor-pointer"
        >
          <span>View All Requirements</span>
          <ArrowRight className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

export default ComplianceOverviewTable;
