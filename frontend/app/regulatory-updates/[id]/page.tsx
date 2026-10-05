"use client";

import React, { use } from "react";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import { DEMO_REGULATORY_UPDATES } from "@/data/demo/regulatory-updates";
import {
  Folder,
  ChevronRight,
  ArrowLeft,
  ExternalLink,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function RegulatoryUpdateDetailPage({ params }: PageProps) {
  const { t } = useLanguage();
  const resolvedParams = use(params);
  const updateId = resolvedParams.id;

  const item =
    DEMO_REGULATORY_UPDATES.find((u) => u.id === updateId);

  if (!item) {
    return (
      <AppShell activeView="updates">
        <div className="bg-white rounded-[16px] border border-[var(--ui-border)] p-12 text-center shadow-2xs max-w-4xl mx-auto my-12">
          <h3 className="text-sm font-semibold text-[var(--ui-text)]">{t("common.notFound")}</h3>
          <p className="text-xs text-[var(--ui-secondary)] mt-1">
            Could not locate gazette specification for ID: {updateId}.
          </p>
          <div className="mt-4">
            <Link
              href="/regulatory-updates"
              className="rounded-full border border-[var(--ui-border)] bg-white px-4 py-1.5 text-xs font-semibold text-[var(--ui-text)] hover:bg-[var(--ui-bg)] transition-colors"
            >
              ← {t("common.back")}
            </Link>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell activeView="updates">
      <div className="space-y-6 pb-6 select-none max-w-4xl mx-auto">
        <aside className="rounded-xl bg-[var(--ui-inset)] p-4 text-sm text-[var(--ui-secondary)]">Illustrative update. This sample demonstrates the review experience and is not a current change notification for your business.</aside>
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2 text-xs text-[var(--ui-secondary)]">
            <Folder className="h-3.5 w-3.5 text-[var(--ui-secondary)]" />
            <Link href="/regulatory-updates" className="hover:text-[var(--ui-text)] transition-colors">
              {t("navigation.updates")}
            </Link>
            <ChevronRight className="h-3 w-3 text-[var(--ui-border-strong)]" />
            <span className="text-[var(--ui-text)] font-mono font-medium">{item.gazetteNo}</span>
          </div>

          <Link
            href="/regulatory-updates"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--ui-secondary)] hover:text-[var(--ui-text)] transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>{t("common.back")}</span>
          </Link>
        </div>

        {/* Gazette Main Card */}
        <div className="bg-white rounded-[16px] border border-[var(--ui-border)] p-6 sm:p-8 shadow-2xs space-y-6">
          <div className="border-b border-[var(--ui-border)] pb-6 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-semibold text-[var(--ui-text)] bg-[var(--ui-inset)] border border-[var(--ui-border)] px-3 py-1 rounded-full">
                {item.gazetteNo}
              </span>
              <span
                className={`px-3 py-1 rounded-full font-semibold text-xs border font-mono uppercase text-[10px] ${
                  item.impactLevel === "HIGH"
                    ? "bg-rose-50 text-rose-700 border-rose-200"
                    : "bg-amber-50 text-amber-700 border-amber-200"
                }`}
              >
                {item.impactLevel} STATUTORY IMPACT
              </span>
              <span className="text-xs font-semibold text-[var(--ui-info)] bg-[var(--ui-info-soft)] border border-[var(--ui-sage-soft)] px-3 py-1 rounded-full">
                {item.authority}
              </span>
            </div>

            <h1 className="font-sans text-2xl sm:text-3xl text-[var(--ui-text)] font-bold leading-snug">
              {item.title}
            </h1>

            <div className="flex flex-wrap items-center gap-6 text-xs text-[var(--ui-secondary)] pt-2">
              <div>
                Published: <strong className="text-[var(--ui-text)] font-semibold">{item.publishDate}</strong>
              </div>
              <div>
                Effective Date: <strong className="text-[var(--ui-sage)] font-semibold">{item.effectiveDate}</strong>
              </div>
              <div>
                Category: <strong className="text-[var(--ui-text)] font-semibold">{item.category}</strong>
              </div>
            </div>
          </div>

          {/* Executive Summary */}
          <div className="space-y-2">
            <h2 className="text-xs font-semibold text-[var(--ui-text)] uppercase tracking-wider">
              Regulatory Overview & Mandate
            </h2>
            <p className="text-xs text-[var(--ui-secondary)] leading-relaxed bg-[var(--ui-bg)] p-4 rounded-xl border border-[var(--ui-border)]">
              {item.summary}
            </p>
          </div>

          {/* Detailed Compliance Requirements */}
          <div className="space-y-3">
            <h2 className="text-xs font-semibold text-[var(--ui-text)] uppercase tracking-wider">
              Enforcement Actions Required for Compliance
            </h2>
            <div className="space-y-2.5">
              {(item.keyRequirements || []).map((req, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-[var(--ui-bg)] border border-[var(--ui-border)] flex items-start gap-3 text-xs"
                >
                  <span className="h-5 w-5 rounded-full bg-[var(--ui-text)] text-white flex items-center justify-center font-bold font-mono text-[11px] shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span className="text-[var(--ui-secondary)] font-medium leading-relaxed">{req}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Affected Standards */}
          <div className="space-y-2 pt-3 border-t border-[var(--ui-border)]">
            <h2 className="text-xs font-semibold text-[var(--ui-text)] uppercase tracking-wider">
              Affected Indian Standards & Products
            </h2>
            <div className="flex flex-wrap gap-2 pt-1">
              {item.affectedStandards.map((std, idx) => (
                <Link
                  key={idx}
                  href={`/standards/${std.replace(/\s+/g, "-")}`}
                  className="font-mono text-xs font-semibold text-[var(--ui-text)] bg-[var(--ui-inset)] border border-[var(--ui-border)] px-3 py-1.5 rounded-full hover:bg-[var(--ui-border)] transition-colors"
                >
                  {std} →
                </Link>
              ))}
            </div>
          </div>

          {/* External Citation Link */}
          <div className="pt-4 border-t border-[var(--ui-border)] flex items-center justify-between">
            <a
              href={item.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--ui-info)] hover:underline transition-colors"
            >
              <ExternalLink className="h-4 w-4 text-[var(--ui-info)]" />
              <span>Download Official Gazette Notification (eGazette India)</span>
            </a>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
