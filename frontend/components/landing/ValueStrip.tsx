"use client";

import React from "react";
import { BookOpen, ShieldCheck, FileText, CheckCircle2, GitFork, Sparkles } from "lucide-react";

export function ValueStrip() {
  const pillars = [
    { label: "Standards", icon: BookOpen, desc: "Mandatory IS & QCOs" },
    { label: "Requirements", icon: ShieldCheck, desc: "Deterministic logic" },
    { label: "Documents", icon: FileText, desc: "Testing & statutory dossiers" },
    { label: "Evidence", icon: CheckCircle2, desc: "Authoritative provenance" },
    { label: "Workflows", icon: GitFork, desc: "Departmental clearances" },
    { label: "BIS Agent", icon: Sparkles, desc: "Source-grounded assistance" },
  ];

  return (
    <section className="border-y border-stone-200/80 bg-stone-50/60 py-6 sm:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 divide-y sm:divide-y-0 sm:divide-x divide-stone-200/80">
          {pillars.map((pillar) => {
            const Icon = pillar.icon;
            return (
              <div
                key={pillar.label}
                className="flex flex-col items-center text-center p-3 sm:px-4 sm:py-2 group"
              >
                <div className="h-7 w-7 rounded-md bg-stone-100 text-stone-700 flex items-center justify-center mb-1.5 group-hover:bg-stone-200/80 transition-colors">
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <div className="text-xs font-bold text-stone-900">
                  {pillar.label}
                </div>
                <div className="text-[11px] text-stone-500 mt-0.5 font-normal">
                  {pillar.desc}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default ValueStrip;
