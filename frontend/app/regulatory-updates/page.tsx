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
      <div className="space-y-6 pb-6 select-none max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-[#040406] rounded-[10px] border border-[#1c1d22] p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-32 bg-radial from-[#cc9166]/10 to-transparent blur-2xl pointer-events-none" />
          
          <div className="relative z-10 space-y-1">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full border border-[#cc9166]/30 bg-[#cc9166]/10 text-[#cc9166] text-[11px] font-semibold tracking-wider uppercase mb-1">
              Gazette Monitor · Regulatory Intelligence
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl text-[#ffffff] tracking-tight">
              Official Gazette & QCO Intelligence
            </h1>
            <p className="text-xs text-[#9194a1] max-w-2xl leading-relaxed">
              Continuous tracking of DPIIT Quality Control Orders, BIS Technical Circulars, and CPCB mandates.
            </p>
          </div>

          {/* Search & Filter */}
          <div className="flex flex-wrap items-center gap-3 relative z-10 shrink-0">
            <div className="relative w-56">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[#5e616e]" />
              <input
                type="text"
                placeholder="Search gazette or standard..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-full border border-[#1c1d22] bg-[#121317] text-xs text-[#ffffff] placeholder-[#5e616e] focus:border-[#cc9166] focus:outline-none"
              />
            </div>

            <div className="flex items-center p-1 rounded-full bg-[#121317] border border-[#1c1d22] text-xs">
              {["ALL", "HIGH", "MEDIUM"].map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setFilterLevel(lvl)}
                  className={`px-3 py-1 rounded-full transition-all cursor-pointer text-xs ${
                    filterLevel === lvl
                      ? "bg-[#cc9166] text-black font-semibold shadow-xs"
                      : "text-[#9194a1] hover:text-[#ffffff]"
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
              className="bg-[#040406] rounded-[10px] border border-[#1c1d22] p-6 shadow-2xl hover:border-[#2e3038] hover:shadow-[0_4px_24px_rgba(0,0,0,0.5)] transition-all space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-semibold text-[#e2e3e9] bg-[#121317] border border-[#2e3038] px-2.5 py-0.5 rounded-full">
                      {item.gazetteNo}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full font-semibold text-[10px] uppercase font-mono tracking-wider border ${
                        item.impactLevel === "HIGH"
                          ? "bg-rose-950/40 text-rose-300 border-rose-800/60"
                          : item.impactLevel === "MEDIUM"
                          ? "bg-amber-950/40 text-amber-300 border-amber-800/60"
                          : "bg-[#121317] text-[#9194a1] border-[#1c1d22]"
                      }`}
                    >
                      {item.impactLevel} IMPACT
                    </span>
                    <span className="text-xs text-[#cc9166] font-medium">
                      {item.category}
                    </span>
                  </div>

                  <h2 className="font-serif text-lg text-[#ffffff] font-normal leading-snug mt-1">
                    {item.title}
                  </h2>
                </div>

                <div className="text-right shrink-0 text-xs text-[#9194a1] space-y-0.5">
                  <div>Published: <strong className="text-[#ffffff] font-medium">{item.publishDate}</strong></div>
                  <div>Effective: <strong className="text-emerald-400 font-medium">{item.effectiveDate}</strong></div>
                </div>
              </div>

              <p className="text-xs text-[#9194a1] leading-relaxed">
                {item.summary}
              </p>

              {/* Key Requirements Bulletins */}
              <div className="p-4 rounded-[10px] bg-[#121317] border border-[#1c1d22] space-y-2">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-[#777a88]">
                  Enforcement Highlights & Obligations
                </div>
                <ul className="list-disc pl-4 text-xs text-[#e2e3e9] space-y-1.5 leading-relaxed">
                  {item.keyRequirements.map((req, idx) => (
                    <li key={idx}>{req}</li>
                  ))}
                </ul>
              </div>

              {/* Footer */}
              <div className="pt-3 border-t border-[#1c1d22] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[#777a88]">Affected Standards:</span>
                  {item.affectedStandards.map((std, idx) => (
                    <span
                      key={idx}
                      className="font-mono text-[11px] font-semibold text-[#cc9166] bg-[#cc9166]/10 border border-[#cc9166]/30 px-2.5 py-0.5 rounded-full"
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
                    className="inline-flex items-center gap-1.5 text-xs text-[#9194a1] hover:text-[#ffffff] transition-colors"
                  >
                    <span>View Gazette PDF</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>

                  <Link
                    href={`/regulatory-updates/${item.id}`}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#ffffff] text-[#08080a] font-semibold text-xs hover:bg-[#e2e3e9] transition-all shadow-md"
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
