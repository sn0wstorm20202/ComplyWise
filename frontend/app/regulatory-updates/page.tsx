"use client";

import React, { useState } from "react";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import { DEMO_REGULATORY_UPDATES } from "@/data/demo/regulatory-updates";
import {
  Search,
  ExternalLink,
  ArrowRight,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export default function RegulatoryUpdatesPage() {
  const { t } = useLanguage();
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
        <div className="bg-white rounded-[16px] border border-[#E2E8F0] p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xs">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full border border-[#E2E8F0] bg-[#F1F5F9] text-[#0F172A] text-[11px] font-semibold tracking-wider uppercase mb-1">
              {t("common.appName")} · {t("navigation.updates")}
            </div>
            <h1 className="font-sans text-2xl sm:text-3xl text-[#0F172A] font-bold tracking-tight">
              {t("navigation.updates")}
            </h1>
            <p className="text-xs text-[#64748B] max-w-2xl leading-relaxed">
              {t("dashboard.regulatoryUpdates")}
            </p>
          </div>

          {/* Search & Filter */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <div className="relative w-56">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[#64748B]" />
              <input
                type="text"
                placeholder={`${t("common.search")}...`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-full border border-[#E2E8F0] bg-[#F8FAFC] text-xs text-[#0F172A] placeholder-[#94A3B8] focus:border-[#0F172A] focus:outline-hidden"
              />
            </div>

            <div className="flex items-center p-1 rounded-full bg-[#F1F5F9] border border-[#E2E8F0] text-xs">
              {["ALL", "HIGH", "MEDIUM"].map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setFilterLevel(lvl)}
                  className={`px-3 py-1 rounded-full transition-all cursor-pointer text-xs ${
                    filterLevel === lvl
                      ? "bg-[#18181B] text-white font-semibold shadow-2xs"
                      : "text-[#64748B] hover:text-[#0F172A]"
                  }`}
                >
                  {lvl === "ALL" ? t("common.all") : lvl}
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
              className="bg-white rounded-[16px] border border-[#E2E8F0] p-6 shadow-2xs hover:border-[#CBD5E1] transition-all space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-semibold text-[#0F172A] bg-[#F1F5F9] border border-[#E2E8F0] px-2.5 py-0.5 rounded-full">
                      {item.gazetteNo}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full font-semibold text-[10px] uppercase font-mono tracking-wider border ${
                        item.impactLevel === "HIGH"
                          ? "bg-rose-50 text-rose-700 border-rose-200"
                          : item.impactLevel === "MEDIUM"
                          ? "bg-amber-50 text-amber-700 border-amber-200"
                          : "bg-[#F1F5F9] text-[#64748B] border-[#E2E8F0]"
                      }`}
                    >
                      {item.impactLevel} IMPACT
                    </span>
                    <span className="text-xs text-blue-700 font-semibold">
                      {item.category}
                    </span>
                  </div>

                  <h2 className="font-sans text-lg text-[#0F172A] font-bold leading-snug mt-1">
                    {item.title}
                  </h2>
                </div>

                <div className="text-right shrink-0 text-xs text-[#64748B] space-y-0.5">
                  <div>Published: <strong className="text-[#0F172A] font-semibold">{item.publishDate}</strong></div>
                  <div>Effective: <strong className="text-emerald-700 font-semibold">{item.effectiveDate}</strong></div>
                </div>
              </div>

              <p className="text-xs text-[#475569] leading-relaxed">
                {item.summary}
              </p>

              {/* Key Requirements Bulletins */}
              <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
                  Enforcement Highlights & Obligations
                </div>
                <ul className="list-disc pl-4 text-xs text-[#334155] space-y-1.5 leading-relaxed">
                  {item.keyRequirements.map((req, idx) => (
                    <li key={idx}>{req}</li>
                  ))}
                </ul>
              </div>

              {/* Footer */}
              <div className="pt-3 border-t border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[#64748B]">Affected Standards:</span>
                  {item.affectedStandards.map((std, idx) => (
                    <span
                      key={idx}
                      className="font-mono text-[11px] font-semibold text-[#0F172A] bg-[#F1F5F9] border border-[#E2E8F0] px-2.5 py-0.5 rounded-full"
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
                    className="inline-flex items-center gap-1.5 text-xs text-[#64748B] hover:text-[#0F172A] transition-colors font-medium"
                  >
                    <span>View Gazette PDF</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>

                  <Link
                    href={`/regulatory-updates/${item.id}`}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#18181B] text-white font-semibold text-xs hover:bg-[#27272A] transition-all shadow-2xs"
                  >
                    <span>{t("common.viewDetails")}</span>
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
