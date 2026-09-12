"use client";

import React from "react";
import { GitFork, Scale, BookOpen, CheckCircle2, ArrowUpRight } from "lucide-react";

export function WhatsNextSection() {
  const capabilities = [
    {
      id: "workflows",
      title: "Connected Compliance Workflows",
      status: "In development",
      statusColor: "bg-slate-100 text-[#0F172A] border-[#E2E8F0]",
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
      statusColor: "bg-slate-100 text-[#0F172A] border-[#E2E8F0]",
      description:
        "Extending verified knowledge packs beyond electrical equipment into industrial machinery, chemicals, polymers, steel products, and medical devices.",
      milestone: "Knowledge Pack V2.4",
    },
    {
      id: "evidence",
      title: "Evidence & Requirement Tracking",
      status: "In development",
      statusColor: "bg-slate-100 text-[#0F172A] border-[#E2E8F0]",
      description:
        "Traceable NABL test report verification, automated instrument calibration expiry warnings, and one-click surveillance audit dossier generation.",
      milestone: "Audit Automation",
    },
  ];

  return (
    <section className="py-20 md:py-28 bg-[#F8FAFC] border-b border-[#E2E8F0]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Section Heading */}
        <div className="max-w-2xl space-y-2">
          <div className="text-[11px] font-bold text-[#64748B] uppercase tracking-widest font-mono">
            Platform Roadmap
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-[#0F172A] font-sans">
            What’s being built next.
          </h2>
          <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed font-sans">
            ComplyWise is systematically expanding its regulatory knowledge graph, automation pipelines, and operational integrations.
          </p>
        </div>

        {/* Open Editorial List */}
        <div className="divide-y divide-[#E2E8F0] border-t border-b border-[#E2E8F0]">
          {capabilities.map((cap) => (
            <div
              key={cap.id}
              className="py-6 sm:py-8 grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-6 items-baseline group hover:bg-white transition-colors px-3 -mx-3 rounded-xl"
            >
              <div className="md:col-span-4 space-y-1.5">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-[#0F172A] group-hover:text-blue-900 transition-colors font-sans">
                    {cap.title}
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center rounded px-2 py-0.5 text-[10px] font-semibold border ${cap.statusColor}`}
                  >
                    {cap.status}
                  </span>
                  <span className="font-mono text-[10px] text-[#94A3B8]">
                    {cap.milestone}
                  </span>
                </div>
              </div>

              <div className="md:col-span-8">
                <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed max-w-3xl font-sans">
                  {cap.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Subtle Bottom Note */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#64748B] pt-2 font-mono">
          <span>Active development cycle · Modular monolith architecture</span>
          <span className="text-[#0F172A] font-semibold">Updated weekly</span>
        </div>
      </div>
    </section>
  );
}

export default WhatsNextSection;
