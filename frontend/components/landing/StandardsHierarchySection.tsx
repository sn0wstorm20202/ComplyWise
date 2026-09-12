"use client";

import React, { useState } from "react";
import { ArrowDown, Layers, ShieldCheck, FileCheck, CheckCircle2 } from "lucide-react";

interface HierarchyExample {
  id: string;
  name: string;
  standard: string;
  version: string;
  clause: string;
  requirement: string;
  evidence: string;
}

export function StandardsHierarchySection() {
  const examples: HierarchyExample[] = [
    {
      id: "is-3055",
      name: "Industrial & Laboratory Instruments",
      standard: "IS 3055:2024",
      version: "Third Edition (Reaffirmed 2024)",
      clause: "Clause 4.1 — Scale Accuracy & Calibration Limits",
      requirement: "Maximum permissible deviation capped at ±0.1°C under standard immersion testing.",
      evidence: "NABL Accredited Calibration Certificate with secondary physical standard traceability.",
    },
    {
      id: "is-1293",
      name: "Electrical Accessories & Plugs",
      standard: "IS 1293:2019",
      version: "Second Revision (with Amendment No. 2)",
      clause: "Clause 18.2 — Terminal Temperature Rise",
      requirement: "Terminal temperature rise shall not exceed 45 K when carrying 1.1 times rated test current.",
      evidence: "Type-Test Report from BIS recognized testing laboratory renewed triennially.",
    },
  ];

  const [activeId, setActiveId] = useState<string>("is-3055");
  const activeEx = examples.find((e) => e.id === activeId) || examples[0];

  const levels = [
    { label: "STANDARD", value: activeEx.standard, desc: "Authoritative Bureau of Indian Standards specification" },
    { label: "VERSION", value: activeEx.version, desc: "Gazette-notified revision cycle & published amendments" },
    { label: "CLAUSE", value: activeEx.clause, desc: "Specific technical test section & engineering criteria" },
    { label: "REQUIREMENT", value: activeEx.requirement, desc: "Deterministic threshold applied to manufacturing variables" },
    { label: "EVIDENCE", value: activeEx.evidence, desc: "Audit-ready provenance, NABL test reports, & verified logs" },
  ];

  return (
    <section id="standards" className="py-20 md:py-28 bg-white border-b border-[#E2E8F0]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="max-w-2xl space-y-2">
            <div className="text-[11px] font-bold text-[#64748B] uppercase tracking-widest font-mono">
              Regulatory Architecture
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-[#0F172A] font-sans">
              How ComplyWise understands BIS standards.
            </h2>
            <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed font-sans">
              Unlike conversational AI models that guess or hallucinate statutory obligations, ComplyWise resolves regulatory truth through a five-tier deterministic hierarchy.
            </p>
          </div>

          {/* Example Switcher */}
          <div className="flex items-center gap-2 bg-[#F1F5F9] p-1 rounded-xl text-xs self-start shrink-0 border border-[#E2E8F0]">
            {examples.map((ex) => (
              <button
                key={ex.id}
                onClick={() => setActiveId(ex.id)}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                  activeId === ex.id
                    ? "bg-white text-[#0F172A] font-semibold shadow-2xs"
                    : "text-[#64748B] hover:text-[#0F172A]"
                }`}
              >
                {ex.standard}
              </button>
            ))}
          </div>
        </div>

        {/* Technical Flow Schematic */}
        <div className="bg-[#F8FAFC] rounded-2xl border border-[#E2E8F0] p-6 sm:p-10 shadow-2xs">
          <div className="max-w-3xl mx-auto space-y-3">
            {levels.map((lvl, index) => (
              <React.Fragment key={lvl.label}>
                <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 sm:p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-300 transition-colors">
                  <div className="space-y-0.5">
                    <span className="font-mono text-[10px] font-bold tracking-wider text-blue-900 uppercase">
                      {lvl.label}
                    </span>
                    <div className="text-xs sm:text-sm font-bold text-[#0F172A] font-sans">
                      {lvl.value}
                    </div>
                  </div>
                  <div className="text-[11px] text-[#64748B] max-w-xs sm:text-right font-normal font-sans">
                    {lvl.desc}
                  </div>
                </div>

                {index < levels.length - 1 && (
                  <div className="flex justify-center py-0.5">
                    <ArrowDown className="h-4 w-4 text-[#94A3B8]" />
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default StandardsHierarchySection;
