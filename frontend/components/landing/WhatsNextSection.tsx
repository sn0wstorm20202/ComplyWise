"use client";

import React from "react";
import { ArrowUpRight } from "lucide-react";

export function WhatsNextSection() {
  const capabilities = [
    {
      id: "workflows",
      title: "Connected Compliance Workflows",
      status: "Building",
      description:
        "Automating multi-step clearance procedures across state pollution control boards, factory safety inspectorates, and the central BIS Manakonline portal.",
      milestone: "Phase 2",
    },
    {
      id: "intelligence",
      title: "Deeper Regulatory Intelligence",
      status: "Expanding",
      description:
        "Automated Gazette of India monitoring with clause-level text diffs to immediately detect when new Quality Control Orders affect approved manufacturing lines.",
      milestone: "Continuous",
    },
    {
      id: "standards",
      title: "Expanded BIS Standards Coverage",
      status: "Building",
      description:
        "Extending verified knowledge packs beyond electrical equipment into industrial machinery, chemicals, polymers, steel products, and medical devices.",
      milestone: "V2.4",
    },
    {
      id: "evidence",
      title: "Evidence & Requirement Tracking",
      status: "Building",
      description:
        "Traceable NABL test report verification, automated instrument calibration expiry warnings, and one-click surveillance audit dossier generation.",
      milestone: "Automation",
    },
  ];

  return (
    <section id="roadmap" className="py-24 md:py-36 bg-white border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Section Header */}
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[10px] font-mono uppercase tracking-[0.2em] font-medium bg-slate-900/[0.04] border border-slate-900/[0.08] text-slate-700">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Platform Trajectory</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#0F172A] leading-[1.1] font-sans">
            Evolving the compliance graph. Continuously.
          </h2>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal font-sans">
            ComplyWise is systematically expanding its regulatory knowledge graph, automation pipelines, and operational integrations across Indian industrial compliance.
          </p>
        </div>

        {/* Editorial Capability List with hover physics */}
        <div className="space-y-0 border-t border-slate-200/80">
          {capabilities.map((cap) => (
            <div
              key={cap.id}
              className="group py-8 sm:py-10 border-b border-slate-200/80 grid grid-cols-1 md:grid-cols-12 gap-5 items-baseline hover:bg-slate-50/50 transition-all duration-500 px-4 -mx-4 rounded-2xl"
            >
              <div className="md:col-span-4 space-y-2.5">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-slate-950 transition-colors duration-300 font-sans flex items-center gap-2">
                  <span>{cap.title}</span>
                  <ArrowUpRight className="h-3.5 w-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" strokeWidth={1.5} />
                </h3>
                <div className="flex items-center gap-2.5">
                  <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-mono font-medium text-slate-700 bg-slate-100 border border-slate-200/80">
                    {cap.status}
                  </span>
                  <span className="font-mono text-[10px] text-slate-400">
                    {cap.milestone}
                  </span>
                </div>
              </div>

              <div className="md:col-span-8">
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-3xl font-sans">
                  {cap.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Subtle bottom signal */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500 font-mono">
          <span>Active development cycle · Modular monolith architecture</span>
          <span className="text-slate-800 font-medium">Updated weekly</span>
        </div>
      </div>
    </section>
  );
}

export default WhatsNextSection;
