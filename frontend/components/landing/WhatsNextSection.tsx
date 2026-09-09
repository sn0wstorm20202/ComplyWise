"use client";

import React from "react";
import { GitFork, Scale, BookOpen, CheckCircle2, ArrowUpRight } from "lucide-react";

export function WhatsNextSection() {
  const capabilities = [
    {
      id: "workflows",
      title: "Connected Compliance Workflows",
      status: "In development",
      statusColor: "bg-stone-100 text-stone-700 border-stone-200",
      description:
        "Automating multi-step clearance procedures across state pollution control boards, factory safety inspectorates, and the central BIS Manakonline portal.",
      milestone: "Phase 2 Delivery",
    },
    {
      id: "intelligence",
      title: "Deeper Regulatory Intelligence",
      status: "Expanding",
      statusColor: "bg-blue-50 text-blue-900 border-blue-200",
      description:
        "Automated Gazette of India monitoring with clause-level text diffs to immediately detect when new Quality Control Orders affect approved manufacturing lines.",
      milestone: "Continuous Integration",
    },
    {
      id: "standards",
      title: "Expanded BIS Standards Coverage",
      status: "Being built",
      statusColor: "bg-stone-100 text-stone-700 border-stone-200",
      description:
        "Extending verified knowledge packs beyond electrical equipment into industrial machinery, chemicals, polymers, steel products, and medical devices.",
      milestone: "Knowledge Pack V2.4",
    },
    {
      id: "evidence",
      title: "Evidence & Requirement Tracking",
      status: "In development",
      statusColor: "bg-stone-100 text-stone-700 border-stone-200",
      description:
        "Traceable NABL test report verification, automated instrument calibration expiry warnings, and one-click surveillance audit dossier generation.",
      milestone: "Audit Automation",
    },
  ];

  return (
    <section className="py-20 md:py-28 bg-white border-b border-stone-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Section Heading */}
        <div className="max-w-2xl space-y-2">
          <div className="text-[11px] font-bold text-stone-500 uppercase tracking-widest">
            Platform Roadmap
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-stone-950">
            What’s being built next.
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
            ComplyWise is systematically expanding its regulatory knowledge graph, automation pipelines, and operational integrations.
          </p>
        </div>

        {/* Open Editorial List (No Excessive Heavy Cards) */}
        <div className="divide-y divide-stone-200/80 border-t border-b border-stone-200/80">
          {capabilities.map((cap) => (
            <div
              key={cap.id}
              className="py-6 sm:py-8 grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-6 items-baseline group hover:bg-stone-50/40 transition-colors px-2 -mx-2 rounded-lg"
            >
              <div className="md:col-span-4 space-y-1.5">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-stone-950 group-hover:text-blue-950 transition-colors">
                    {cap.title}
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center rounded px-2 py-0.5 text-[10px] font-semibold border ${cap.statusColor}`}
                  >
                    {cap.status}
                  </span>
                  <span className="font-mono text-[10px] text-stone-400">
                    {cap.milestone}
                  </span>
                </div>
              </div>

              <div className="md:col-span-8">
                <p className="text-xs sm:text-sm text-stone-600 leading-relaxed max-w-3xl">
                  {cap.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Subtle Bottom Note */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-stone-500 pt-2 font-mono">
          <span>Active development cycle · Modular monolith architecture</span>
          <span className="text-stone-700 font-semibold">Updated weekly</span>
        </div>
      </div>
    </section>
  );
}

export default WhatsNextSection;
