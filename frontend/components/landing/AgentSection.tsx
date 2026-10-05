"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, CheckCircle2 } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useScrubReveal } from "./motion/useScrollAnimations";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

interface AgentQuery {
  id: string;
  question: string;
  answer: string;
  citedClauses: { standard: string; clause: string; title: string }[];
  takeaway: string;
}

export function AgentSection() {
  const queries: AgentQuery[] = [
    {
      id: "q1",
      question: "What does IS 3055:2024 require?",
      answer: "IS 3055:2024 establishes constructional, metrological, and testing requirements for industrial temperature measurement apparatus. It mandates verification under Clause 4.1 (Scale Accuracy within ±0.1°C), Clause 6 (Thermal Shock Resistance), and Clause 8 (Aging Stability).",
      citedClauses: [
        { standard: "IS 3055:2024", clause: "Clause 4.1", title: "Scale Accuracy" },
        { standard: "IS 3055:2024", clause: "Clause 6.2", title: "Thermal Shock" },
        { standard: "QCO 2024", clause: "Section 3(1)", title: "Bureau Licensing" },
      ],
      takeaway: "Factory test bench must possess primary temperature bath calibration logs with current NABL certificates.",
    },
    {
      id: "q2",
      question: "Which documents are required for ISI Mark?",
      answer: "Under BIS Scheme I, applicants must submit: Factory License, NABL Type-Test Report, Plant Layout with calibration logs, STI adherence document, Trademark proof, and Advance Marking Fee challan.",
      citedClauses: [
        { standard: "BIS Form V", clause: "Part II", title: "Technical Dossier" },
        { standard: "BIS Reg. 2018", clause: "Reg 7 & 8", title: "Factory Prereqs" },
      ],
      takeaway: "Calibration certificates must be within 12-month validity before audit submission.",
    },
  ];

  const [activeIdx, setActiveIdx] = useState(0);
  const current = queries[activeIdx];
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  // Scrubbing text reveal for the intro paragraph
  const scrubRef = useScrubReveal();

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (headerRef.current) {
        gsap.from(headerRef.current.children, {
          y: 60,
          opacity: 0,
          filter: "blur(6px)",
          duration: 0.9,
          stagger: 0.12,
          ease: "power3.out",
          scrollTrigger: { trigger: headerRef.current, start: "top 85%", once: true },
        });
      }
      if (cardRef.current) {
        gsap.from(cardRef.current, {
          y: 80,
          opacity: 0,
          scale: 0.96,
          duration: 1.1,
          ease: "power3.out",
          scrollTrigger: { trigger: cardRef.current, start: "top 82%", once: true },
        });
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} id="intelligence" className="py-28 md:py-40 bg-[#FAFAFA] border-b border-slate-200/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Header */}
        <div ref={headerRef} className="max-w-3xl space-y-5">
          <div className="inline-flex items-center gap-2 rounded-full px-3.5 py-1 text-[10px] font-mono uppercase tracking-[0.2em] font-medium bg-slate-900/[0.04] border border-slate-900/[0.06] text-slate-600">
            Source-Grounded Intelligence
          </div>
          <h2 className="text-[clamp(1.8rem,4vw,3.5rem)] font-extrabold tracking-[-0.02em] text-[#0F172A] leading-[1.1] font-sans">
            Ask the BIS Agent. Every answer is citation-backed.
          </h2>
          {/* Scrubbing text reveal */}
          <p
            ref={scrubRef}
            className="text-sm sm:text-base lg:text-lg text-slate-500 leading-relaxed font-sans max-w-2xl"
          >
            Every response is grounded in gazette notifications, published BIS standards, and deterministic clause extraction. Zero hallucinations. Full provenance chain. Every word traceable to its statutory source.
          </p>
        </div>

        {/* Double-Bezel Agent Interface */}
        <div ref={cardRef} className="bezel-shell max-w-5xl mx-auto">
          <div className="bezel-core p-6 sm:p-8 space-y-6">
            {/* Query Bar */}
            <div className="space-y-4">
              <div className="relative flex items-center">
                <Search className="absolute left-4 h-4 w-4 text-slate-400" strokeWidth={1.5} />
                <div className="w-full rounded-full border border-slate-200/70 bg-slate-50/80 pl-11 pr-5 py-3.5 text-sm text-slate-900 font-medium font-sans">
                  {current.question}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {queries.map((q, idx) => (
                  <button
                    key={q.id}
                    onClick={() => setActiveIdx(idx)}
                    className={`px-4 py-2 rounded-full border text-xs font-medium transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] cursor-pointer ${
                      activeIdx === idx
                        ? "bg-[#0F172A] text-white border-[#0F172A] shadow-sm"
                        : "bg-white text-slate-600 border-slate-200/70 hover:bg-slate-50"
                    }`}
                  >
                    {q.question}
                  </button>
                ))}
              </div>
            </div>

            {/* Response */}
            <div className="rounded-2xl border border-slate-200/70 bg-slate-50/50 p-6 space-y-5">
              <div className="flex items-center justify-between border-b border-slate-200/60 pb-4">
                <span className="font-semibold text-slate-900 text-sm font-sans">
                  Clause Extraction
                </span>
                <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 font-medium">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" strokeWidth={1.5} />
                  <span>Grounded</span>
                </div>
              </div>

              <div className="text-sm text-slate-700 leading-relaxed font-sans">
                {current.answer}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {current.citedClauses.map((c, i) => (
                  <div
                    key={i}
                    className="p-3.5 rounded-xl bg-white border border-slate-200/60 text-xs space-y-1 hover:shadow-md hover:border-slate-300/70 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]"
                  >
                    <div className="font-bold text-blue-900 font-mono text-[11px]">{c.standard}</div>
                    <div className="font-semibold text-slate-900">{c.clause}</div>
                    <div className="text-[11px] text-slate-500">{c.title}</div>
                  </div>
                ))}
              </div>

              <div className="p-4 rounded-xl bg-white border border-slate-200/60 text-xs flex items-start gap-3">
                <span className="font-semibold text-slate-900 shrink-0">Actionable:</span>
                <span className="text-slate-600 font-medium">{current.takeaway}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default AgentSection;
