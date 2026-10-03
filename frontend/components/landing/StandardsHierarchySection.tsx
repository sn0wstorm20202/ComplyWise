"use client";

import React, { useState, useEffect, useRef } from "react";
import { ArrowDown } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export function StandardsHierarchySection() {
  const examples = [
    {
      id: "is-1293",
      standard: "IS 1293:2019",
      version: "Second Revision (Amendment No. 2)",
      clause: "Clause 18.2 — Terminal Temperature Rise",
      requirement: "Terminal temperature rise shall not exceed 45 K at 1.1x rated current.",
      evidence: "Type-Test Report from BIS recognized lab, renewed triennially.",
    },
    {
      id: "is-3055",
      standard: "IS 3055:2024",
      version: "Third Edition (Reaffirmed 2024)",
      clause: "Clause 4.1 — Scale Accuracy & Calibration",
      requirement: "Maximum deviation capped at ±0.1°C under standard immersion testing.",
      evidence: "NABL Accredited Calibration Certificate with NPL traceability.",
    },
  ];

  const [activeId, setActiveId] = useState("is-1293");
  const activeEx = examples.find((e) => e.id === activeId) || examples[0];
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const cascadeRef = useRef<HTMLDivElement>(null);

  const levels = [
    { label: "STANDARD", value: activeEx.standard },
    { label: "VERSION", value: activeEx.version },
    { label: "CLAUSE", value: activeEx.clause },
    { label: "REQUIREMENT", value: activeEx.requirement },
    { label: "EVIDENCE", value: activeEx.evidence },
  ];

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Header entrance
      if (headerRef.current) {
        gsap.from(headerRef.current.children, {
          y: 50,
          opacity: 0,
          filter: "blur(6px)",
          duration: 0.9,
          stagger: 0.12,
          ease: "power3.out",
          scrollTrigger: { trigger: headerRef.current, start: "top 85%", once: true },
        });
      }

      // Cascade cards: staggered card-stack entrance from bottom
      if (cascadeRef.current) {
        const cards = cascadeRef.current.querySelectorAll("[data-cascade-card]");
        gsap.from(cards, {
          y: 100,
          opacity: 0,
          scale: 0.96,
          duration: 0.8,
          stagger: 0.1,
          ease: "power3.out",
          scrollTrigger: { trigger: cascadeRef.current, start: "top 80%", once: true },
        });
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} id="standards" className="py-28 md:py-40 bg-white border-b border-slate-200/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 max-w-5xl mx-auto">
          <div ref={headerRef} className="space-y-4 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full px-3.5 py-1 text-[10px] font-mono uppercase tracking-[0.2em] font-medium bg-slate-900/[0.04] border border-slate-900/[0.06] text-slate-600">
              Regulatory Hierarchy
            </div>
            <h2 className="text-[clamp(1.8rem,4vw,3.5rem)] font-extrabold tracking-[-0.02em] text-[#0F172A] leading-[1.1] font-sans">
              Five-tier deterministic hierarchy. Every obligation proven.
            </h2>
          </div>

          {/* Standard Switcher */}
          <div className="flex items-center gap-2 bg-slate-100/60 p-1.5 rounded-full border border-slate-200/60 self-start md:self-auto shrink-0">
            {examples.map((ex) => (
              <button
                key={ex.id}
                onClick={() => setActiveId(ex.id)}
                className={`px-4 py-2 rounded-full text-xs font-medium transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] cursor-pointer ${
                  activeId === ex.id
                    ? "bg-[#0F172A] text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {ex.standard}
              </button>
            ))}
          </div>
        </div>

        {/* Cascade Architecture */}
        <div className="max-w-4xl mx-auto bezel-shell">
          <div ref={cascadeRef} className="bezel-core p-6 sm:p-10 space-y-3 bg-slate-50/30">
            {levels.map((lvl, index) => (
              <React.Fragment key={lvl.label}>
                <div
                  data-cascade-card
                  className="group bg-white rounded-2xl border border-slate-200/70 p-5 shadow-2xs hover:shadow-md hover:border-slate-300/80 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]"
                >
                  <span className="font-mono text-[10px] font-bold tracking-widest text-blue-900/80 uppercase">
                    {lvl.label}
                  </span>
                  <div className="text-sm sm:text-base font-semibold text-slate-950 font-sans mt-1">
                    {lvl.value}
                  </div>
                </div>

                {index < levels.length - 1 && (
                  <div data-cascade-card className="flex justify-center py-0.5">
                    <div className="h-6 w-6 rounded-full bg-white border border-slate-200/70 flex items-center justify-center text-slate-400 shadow-2xs">
                      <ArrowDown className="h-3 w-3" strokeWidth={1.5} />
                    </div>
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
