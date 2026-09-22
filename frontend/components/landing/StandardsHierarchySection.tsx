"use client";

import React, { useState, useEffect, useRef } from "react";
import { ArrowDown } from "lucide-react";

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
  const [visibleLevels, setVisibleLevels] = useState<number[]>([]);
  const [headerVisible, setHeaderVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const levelRefs = useRef<(HTMLDivElement | null)[]>([]);

  const activeEx = examples.find((e) => e.id === activeId) || examples[0];

  const levels = [
    {
      label: "STANDARD",
      value: activeEx.standard,
      desc: "Authoritative Bureau of Indian Standards specification",
      accent: "text-blue-400",
      border: "border-blue-500/20",
      bg: "bg-blue-500/5",
    },
    {
      label: "VERSION",
      value: activeEx.version,
      desc: "Gazette-notified revision cycle & published amendments",
      accent: "text-slate-300",
      border: "border-white/[0.08]",
      bg: "bg-white/[0.03]",
    },
    {
      label: "CLAUSE",
      value: activeEx.clause,
      desc: "Specific technical test section & engineering criteria",
      accent: "text-slate-300",
      border: "border-white/[0.08]",
      bg: "bg-white/[0.03]",
    },
    {
      label: "REQUIREMENT",
      value: activeEx.requirement,
      desc: "Deterministic threshold applied to manufacturing variables",
      accent: "text-amber-400",
      border: "border-amber-500/20",
      bg: "bg-amber-500/5",
    },
    {
      label: "EVIDENCE",
      value: activeEx.evidence,
      desc: "Audit-ready provenance, NABL test reports, & verified logs",
      accent: "text-emerald-400",
      border: "border-emerald-500/20",
      bg: "bg-emerald-500/5",
    },
  ];

  // Sequential staggered reveal when section enters viewport
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHeaderVisible(true);
          // Stagger each level appearing like a graph being constructed
          levels.forEach((_, i) => {
            setTimeout(() => {
              setVisibleLevels((prev) => [...prev, i]);
            }, 200 + i * 180);
          });
          io.unobserve(section);
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -60px 0px" }
    );

    io.observe(section);
    return () => io.disconnect();
  }, []);

  // Re-run reveal when standard changes
  const handleSwitch = (id: string) => {
    setActiveId(id);
    setVisibleLevels([]);
    setTimeout(() => {
      levels.forEach((_, i) => {
        setTimeout(() => {
          setVisibleLevels((prev) => [...prev, i]);
        }, i * 140);
      });
    }, 50);
  };

  return (
    <section ref={sectionRef} id="standards" className="py-24 md:py-32 bg-[#0A0D10] relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      <div className="absolute top-1/2 right-1/4 w-[500px] h-[500px] rounded-full bg-emerald-900/10 blur-[120px] pointer-events-none -translate-y-1/2" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-14">
        {/* Section Header */}
        <div
          className="flex flex-col md:flex-row md:items-end justify-between gap-8"
          style={{
            opacity: headerVisible ? 1 : 0,
            transform: headerVisible ? "translateY(0)" : "translateY(24px)",
            filter: headerVisible ? "blur(0px)" : "blur(4px)",
            transition: "opacity 0.75s ease, transform 0.75s cubic-bezier(0.16,1,0.3,1), filter 0.75s ease",
          }}
        >
          <div className="max-w-2xl space-y-4">
            <div className="text-[11px] font-bold text-[#3B82F6] uppercase tracking-widest font-mono">
              Regulatory Architecture
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-[#F4F6F5] leading-[1.1] font-sans">
              How ComplyWise understands BIS standards.
            </h2>
            <p className="text-base sm:text-lg text-[#B1B8BD] leading-relaxed font-sans">
              Unlike conversational AI models that guess or hallucinate statutory obligations, ComplyWise resolves regulatory truth through a five-tier deterministic hierarchy.
            </p>
          </div>

          {/* Example Switcher */}
          <div className="flex items-center gap-1.5 bg-[#101419] p-1 rounded-xl text-xs self-start shrink-0 border border-white/[0.08]">
            {examples.map((ex) => (
              <button
                key={ex.id}
                onClick={() => handleSwitch(ex.id)}
                className={`px-3.5 py-2 rounded-lg font-mono font-medium transition-all cursor-pointer text-[11px] ${
                  activeId === ex.id
                    ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                    : "text-[#7E878E] hover:text-[#B1B8BD]"
                }`}
              >
                {ex.standard}
              </button>
            ))}
          </div>
        </div>

        {/* Technical Flow Schematic — sequential graph reveal */}
        <div className="bg-[#06080A] rounded-2xl border border-white/[0.07] p-6 sm:p-10">
          <div className="max-w-3xl mx-auto space-y-2">
            {levels.map((lvl, index) => {
              const isVisible = visibleLevels.includes(index);
              return (
                <React.Fragment key={lvl.label}>
                  <div
                    ref={(el) => { levelRefs.current[index] = el; }}
                    className={`${lvl.bg} rounded-xl border ${lvl.border} p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-white/[0.15] transition-all duration-300`}
                    style={{
                      opacity: isVisible ? 1 : 0,
                      transform: isVisible ? "translateX(0) scale(1)" : "translateX(-16px) scale(0.98)",
                      filter: isVisible ? "blur(0px)" : "blur(3px)",
                      transition: `opacity 0.6s ease, transform 0.6s cubic-bezier(0.16,1,0.3,1), filter 0.5s ease, border-color 0.2s ease`,
                    }}
                  >
                    <div className="space-y-1">
                      <span className={`font-mono text-[10px] font-bold tracking-wider uppercase ${lvl.accent}`}>
                        {lvl.label}
                      </span>
                      <div className="text-sm sm:text-base font-semibold text-[#E5E9E8] font-sans">
                        {lvl.value}
                      </div>
                    </div>
                    <div className="text-[12px] text-[#7E878E] max-w-xs sm:text-right font-sans leading-relaxed">
                      {lvl.desc}
                    </div>
                  </div>

                  {index < levels.length - 1 && (
                    <div
                      className="flex justify-center py-1"
                      style={{
                        opacity: isVisible && visibleLevels.includes(index + 1) ? 1 : 0,
                        transition: "opacity 0.4s ease",
                      }}
                    >
                      <ArrowDown className="h-4 w-4 text-[#3B4550]" />
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

export default StandardsHierarchySection;
