"use client";

import React, { useState } from "react";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import { DEMO_REGULATORY_UPDATES, RegulatoryUpdate } from "@/data/demo/regulatory-updates";
import {
  Folder,
  ChevronRight,
  Search,
  ExternalLink,
  ShieldAlert,
  Calendar,
  Building2,
  FileCheck,
  ArrowRight,
  Filter,
} from "lucide-react";

export default function RegulatoryUpdatesPage() {
  const [search, setSearch] = useState("");
  const [filterLevel, setFilterLevel] = useState<string>("ALL");

  const filteredUpdates = DEMO_REGULATORY_UPDATES.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.gazetteNo.toLowerCase().includes(search.toLowerCase()) ||
      item.affectedStandards.some((s) => s.toLowerCase().includes(search.toLowerCase()));
    const matchesFilter =
      filterLevel === "ALL" || item.impactLevel === filterLevel;
    return matchesSearch && matchesFilter;
  });

  return (
    <AppShell activeView="updates">
      <div className="space-y-6 pb-6 select-none">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pt-1">
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
              <Folder className="h-3.5 w-3.5 text-slate-400" />
              <span>Home Page</span>
              <ChevronRight className="h-3 w-3 text-slate-300" />
              <Folder className="h-3.5 w-3.5 text-slate-400" />
              <span className="text-slate-600 font-semibold">Regulatory Updates</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-950">
              Official Gazette & QCO Monitor
            </h1>
            <p className="text-xs text-slate-500">
              Continuous tracking of DPIIT Quality Control Orders, BIS Technical Circulars, and CPCB mandates.
            </p>
          </div>

          {/* Search & Filter */}
          <div className="flex items-center gap-3">
            <div className="relative w-64">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search gazette or standard..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-full border border-slate-200 bg-white text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div className="flex items-center p-1 rounded-full bg-slate-200/50 text-xs font-semibold">
              {["ALL", "HIGH", "MEDIUM"].map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setFilterLevel(lvl)}
                  className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
                    filterLevel === lvl
                      ? "bg-[#0f172a] text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Updates List */}
        <div className="space-y-4">
          {filteredUpdates.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-[28px] border border-slate-200/70 p-6 shadow-xs hover:border-slate-300 transition-all space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full">
                      {item.gazetteNo}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
                        item.impactLevel === "HIGH"
                          ? "bg-rose-100 text-rose-800"
                          : item.impactLevel === "MEDIUM"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {item.impactLevel} IMPACT
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      {item.category}
                    </span>
                  </div>

                  <h2 className="text-base font-bold text-slate-900 mt-1">
                    {item.title}
                  </h2>
                </div>

                <div className="text-right shrink-0 text-xs text-slate-500">
                  <div>Published: <strong className="text-slate-900">{item.publishDate}</strong></div>
                  <div>Effective: <strong className="text-emerald-700">{item.effectiveDate}</strong></div>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                {item.summary}
              </p>

              {/* Key Requirements Bulletins */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Enforcement Highlights & Obligations
                </div>
                <ul className="list-disc pl-4 text-xs text-slate-700 space-y-1">
                  {item.keyRequirements.map((req, idx) => (
                    <li key={idx}>{req}</li>
                  ))}
                </ul>
              </div>

              {/* Footer */}
              <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">Affected Standards:</span>
                  {item.affectedStandards.map((std, idx) => (
                    <span
                      key={idx}
                      className="font-mono text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md"
                    >
                      {std}
                    </span>
                  ))}
                </div>

                <div className="flex items-center gap-3">
                  <a
                    href={item.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-900 font-semibold"
                  >
                    <span>View Gazette PDF</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>

                  <Link
                    href={`/regulatory-updates/${item.id}`}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#0f172a] text-white font-bold hover:bg-slate-800 transition-colors"
                  >
                    <span>Analyze Impact</span>
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
