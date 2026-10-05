"use client";

import React from "react";
import { BookOpen, ShieldCheck, FileText, CheckCircle2, GitFork, Sparkles } from "lucide-react";
import { useStaggerFadeUp } from "./motion/useScrollAnimations";

export function ValueStrip() {
  const gridRef = useStaggerFadeUp({ stagger: 0.08, duration: 0.7 });

  const pillars = [
    { label: "BIS Standards", icon: BookOpen, desc: "Mandatory IS & QCOs" },
    { label: "Deterministic Engine", icon: ShieldCheck, desc: "Three-valued logic" },
    { label: "Testing Dossiers", icon: FileText, desc: "NABL parameters" },
    { label: "Statutory Evidence", icon: CheckCircle2, desc: "Audit-ready provenance" },
    { label: "Factory Clearances", icon: GitFork, desc: "Connected workflows" },
    { label: "Grounded AI Agent", icon: Sparkles, desc: "Zero hallucination" },
  ];

  return (
    <section className="py-16 md:py-20 border-y border-slate-200/60 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div ref={gridRef} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-5">
          {pillars.map((pillar) => {
            const Icon = pillar.icon;
            return (
              <div
                key={pillar.label}
                className="group p-5 rounded-[1.5rem] bg-slate-50/60 border border-slate-200/50 hover:bg-white hover:border-slate-300/70 hover:shadow-md transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] flex flex-col items-center text-center cursor-default"
              >
                <div className="h-9 w-9 rounded-full bg-white border border-slate-200/70 text-slate-700 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] shadow-sm">
                  <Icon className="h-4 w-4" strokeWidth={1.5} />
                </div>
                <div className="text-xs font-semibold text-slate-900 font-sans">
                  {pillar.label}
                </div>
                <div className="text-[11px] text-slate-500 mt-1 font-normal">
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
