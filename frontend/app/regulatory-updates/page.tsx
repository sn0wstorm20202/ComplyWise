"use client";

import React, { useState } from "react";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import Disclosure from "@/components/product/Disclosure";
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
        <aside className="rounded-xl bg-[var(--ui-inset)] p-4 text-sm text-[var(--ui-secondary)]"><strong className="text-[var(--ui-text)]">Sample regulatory feed.</strong> Live change monitoring is not available yet. These illustrative updates demonstrate how a change can be reviewed.</aside>
        {/* Header */}
        <div className="bg-white rounded-[16px] border border-[var(--ui-border)] p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xs">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full border border-[var(--ui-border)] bg-[var(--ui-inset)] text-[var(--ui-text)] text-[11px] font-semibold tracking-wider uppercase mb-1">
              {t("common.appName")} · {t("navigation.updates")}
            </div>
            <h1 className="font-sans text-2xl sm:text-3xl text-[var(--ui-text)] font-bold tracking-tight">
              {t("navigation.updates")}
            </h1>
            <p className="text-xs text-[var(--ui-secondary)] max-w-2xl leading-relaxed">
              {t("dashboard.regulatoryUpdates")}
            </p>
          </div>

          {/* Search & Filter */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <div className="relative w-56">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[var(--ui-secondary)]" />
              <input
                type="text"
                placeholder={`${t("common.search")}...`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-full border border-[var(--ui-border)] bg-[var(--ui-bg)] text-xs text-[var(--ui-text)] placeholder-[var(--ui-muted)] focus:border-[var(--ui-text)] focus:outline-hidden"
              />
            </div>

            <div className="flex items-center p-1 rounded-full bg-[var(--ui-inset)] border border-[var(--ui-border)] text-xs">
              {["ALL", "HIGH", "MEDIUM"].map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setFilterLevel(lvl)}
                  className={`px-3 py-1 rounded-full transition-all cursor-pointer text-xs ${
                    filterLevel === lvl
                      ? "bg-[var(--ui-text)] text-white font-semibold shadow-2xs"
                      : "text-[var(--ui-secondary)] hover:text-[var(--ui-text)]"
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
              className="bg-white rounded-[16px] border border-[var(--ui-border)] p-6 shadow-2xs hover:border-[var(--ui-border-strong)] transition-all space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-semibold text-[var(--ui-text)] bg-[var(--ui-inset)] border border-[var(--ui-border)] px-2.5 py-0.5 rounded-full">
                      {item.gazetteNo}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full font-semibold text-[10px] uppercase font-mono tracking-wider border ${
                        item.impactLevel === "HIGH"
                          ? "bg-rose-50 text-rose-700 border-rose-200"
                          : item.impactLevel === "MEDIUM"
                          ? "bg-amber-50 text-amber-700 border-amber-200"
                          : "bg-[var(--ui-inset)] text-[var(--ui-secondary)] border-[var(--ui-border)]"
                      }`}
                    >
                      {item.impactLevel} IMPACT
                    </span>
                    <span className="text-xs text-[var(--ui-info)] font-semibold">
                      {item.category}
                    </span>
                  </div>

                  <h2 className="font-sans text-lg text-[var(--ui-text)] font-bold leading-snug mt-1">
                    {item.title}
                  </h2>
                </div>

                <div className="text-right shrink-0 text-xs text-[var(--ui-secondary)] space-y-0.5">
                  <div>Published: <strong className="text-[var(--ui-text)] font-semibold">{item.publishDate}</strong></div>
                  <div>Effective: <strong className="text-[var(--ui-sage)] font-semibold">{item.effectiveDate}</strong></div>
                </div>
              </div>

              <p className="text-xs text-[var(--ui-secondary)] leading-relaxed">
                {item.summary}
              </p>

              {/* Key Requirements Bulletins */}
              <Disclosure title="What should I do?">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--ui-secondary)]">
                  Enforcement Highlights & Obligations
                </div>
                <ul className="list-disc pl-4 text-xs text-[var(--ui-secondary)] space-y-1.5 leading-relaxed">
                  {item.keyRequirements.map((req, idx) => (
                    <li key={idx}>{req}</li>
                  ))}
                </ul>
              </Disclosure>

              {/* Footer */}
              <div className="pt-3 border-t border-[var(--ui-border)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[var(--ui-secondary)]">Affected Standards:</span>
                  {item.affectedStandards.map((std, idx) => (
                    <span
                      key={idx}
                      className="font-mono text-[11px] font-semibold text-[var(--ui-text)] bg-[var(--ui-inset)] border border-[var(--ui-border)] px-2.5 py-0.5 rounded-full"
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
                    className="inline-flex items-center gap-1.5 text-xs text-[var(--ui-secondary)] hover:text-[var(--ui-text)] transition-colors font-medium"
                  >
                    <span>View Gazette PDF</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>

                  <Link
                    href={`/regulatory-updates/${item.id}`}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[var(--ui-text)] text-white font-semibold text-xs hover:bg-[var(--ui-text)] transition-all shadow-2xs"
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
