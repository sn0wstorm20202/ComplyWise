"use client";

import React, { useState, useEffect, useRef } from "react";
import { BookOpen, CheckCircle2 } from "lucide-react";

interface AgentQuery {
  id: string;
  question: string;
  answer: string;
  citedClauses: { standard: string; clause: string; title: string }[];
  statutorySource: string;
  takeaway: string;
}

export function AgentSection() {
  const queries: AgentQuery[] = [
    {
      id: "q1",
      question: "What does IS 3055:2024 require?",
      answer: "IS 3055:2024 (Third Edition) establishes constructional, metrological, and testing requirements for industrial temperature measurement apparatus. It mandates verification under Clause 4.1 (Scale Accuracy within ±0.1°C), Clause 6 (Thermal Shock Resistance), and Clause 8 (Aging Stability). Products under mandatory Quality Control Orders must be marked with the Standard Mark (ISI) via Scheme I conformity assessment.",
      citedClauses: [
        { standard: "IS 3055:2024", clause: "Clause 4.1", title: "Scale Accuracy & Tolerance" },
        { standard: "IS 3055:2024", clause: "Clause 6.2", title: "Thermal Shock Endurance" },
        { standard: "QCO 2024", clause: "Section 3(1)", title: "Mandatory Bureau Licensing" },
      ],
      statutorySource: "Bureau of Indian Standards Act, 2016 & Gazette Order S.O. 921(E)",
      takeaway: "Factory test bench must possess primary temperature bath calibration logs with current NABL certificates.",
    },
    {
      id: "q2",
      question: "Which documents are required?",
      answer: "Under BIS Scheme I (Standard Mark), an applicant enterprise must submit six mandatory statutory records:\n1. Factory License under Factories Act 1948\n2. NABL Accredited Type-Test Report covering all safety clauses\n3. Plant Machinery Layout and In-House Testing Equipment calibration logs\n4. Scheme of Testing and Inspection (STI) adherence document\n5. Proof of Trademark Registration or authorization letter\n6. Advance Marking Fee payment challan.",
      citedClauses: [
        { standard: "BIS Form V", clause: "Part II", title: "Technical Application Dossier" },
        { standard: "BIS Reg. 2018", clause: "Reg 7 & 8", title: "Factory Inspection Prereqs" },
      ],
      statutorySource: "Bureau of Indian Standards (Conformity Assessment) Regulations, 2018",
      takeaway: "Ensure machinery calibration certificates are within their 12-month validity window before audit submission.",
    },
    {
      id: "q3",
      question: "Which clause covers calibration?",
      answer: "Clause 4.1 of IS 3055:2024 specifically defines the metrological calibration requirements. Permissible deviation is restricted to ±0.1°C across the operational range. Testing must be conducted in an environment stabilized at 27°C ± 2°C using reference secondary standards certified by the National Physical Laboratory (NPL) or a NABL-accredited calibration laboratory.",
      citedClauses: [
        { standard: "IS 3055:2024", clause: "Clause 4.1", title: "Permissible Error Thresholds" },
        { standard: "STI/3055/1", clause: "Table 1", title: "Routine Calibration Frequencies" },
      ],
      statutorySource: "Bureau of Indian Standards Technical Specification & Laboratory Guidelines",
      takeaway: "Routine daily test records must document ambient chamber temperature alongside measured tolerance.",
    },
  ];

  const [activeQueryIndex, setActiveQueryIndex] = useState(0);
  const [responseVisible, setResponseVisible] = useState(false);
  const [clausesVisible, setClausesVisible] = useState(false);
  const [takeawayVisible, setTakeawayVisible] = useState(false);
  const [headerVisible, setHeaderVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const current = queries[activeQueryIndex];

  // Section entrance
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHeaderVisible(true);
          io.unobserve(section);
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
    );
    io.observe(section);
    return () => io.disconnect();
  }, []);

  // Sequential response reveal when query changes
  const triggerReveal = () => {
    setResponseVisible(false);
    setClausesVisible(false);
    setTakeawayVisible(false);
    setTimeout(() => setResponseVisible(true), 120);
    setTimeout(() => setClausesVisible(true), 500);
    setTimeout(() => setTakeawayVisible(true), 780);
  };

  useEffect(() => { triggerReveal(); }, [activeQueryIndex]);

  const handleQueryChange = (idx: number) => {
    setActiveQueryIndex(idx);
  };

  return (
    <section ref={sectionRef} id="intelligence" className="py-24 md:py-32 bg-[#06080A] relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      <div className="absolute bottom-0 right-0 w-[600px] h-[400px] rounded-full bg-blue-900/10 blur-[120px] pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-14">
        {/* Section Header */}
        <div
          className="max-w-2xl space-y-4"
          style={{
            opacity: headerVisible ? 1 : 0,
            transform: headerVisible ? "translateY(0)" : "translateY(24px)",
            filter: headerVisible ? "blur(0px)" : "blur(4px)",
            transition: "opacity 0.75s ease, transform 0.75s cubic-bezier(0.16,1,0.3,1), filter 0.75s ease",
          }}
        >
          <div className="text-[11px] font-bold text-[#3B82F6] uppercase tracking-widest font-mono">
            Intelligent Assistance
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-[#F4F6F5] leading-[1.1] font-sans">
            BIS Agent
          </h2>
          <p className="text-base sm:text-lg text-[#B1B8BD] leading-relaxed font-sans">
            Ask about standards, clauses, documents or requirements. Every answer is grounded in authoritative statutory sources.
          </p>
        </div>

        {/* Product Interface Showcase */}
        <div
          className="bg-[#0A0D10] rounded-2xl border border-white/[0.08] p-6 sm:p-8 space-y-6 shadow-[0_40px_80px_rgba(0,0,0,0.6)]"
          style={{
            opacity: headerVisible ? 1 : 0,
            transform: headerVisible ? "translateY(0) scale(1)" : "translateY(20px) scale(0.98)",
            transition: "opacity 0.85s 0.2s ease, transform 0.85s 0.2s cubic-bezier(0.16,1,0.3,1)",
          }}
        >
          {/* Query Bar */}
          <div className="space-y-4">
            <div className="relative flex items-center">
              <div className="absolute left-4 h-4 w-4 text-[#7E878E]">
                <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="7" cy="7" r="5" />
                  <path d="m13 13-2.5-2.5" strokeLinecap="round" />
                </svg>
              </div>
              <div className="w-full rounded-xl border border-white/[0.08] bg-[#06080A] pl-11 pr-4 py-3.5 text-sm text-[#E5E9E8] font-medium font-sans transition-all duration-300">
                {current.question}
              </div>
            </div>

            {/* Prompt Chips */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-semibold text-[#7E878E] uppercase tracking-wider font-mono">
                Suggested:
              </span>
              {queries.map((q, idx) => (
                <button
                  key={q.id}
                  onClick={() => handleQueryChange(idx)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all duration-200 cursor-pointer hover:scale-[1.02] ${
                    activeQueryIndex === idx
                      ? "bg-blue-500/15 text-blue-300 border-blue-500/30"
                      : "bg-transparent text-[#7E878E] border-white/[0.08] hover:bg-white/[0.04] hover:text-[#B1B8BD]"
                  }`}
                >
                  <BookOpen className="h-3 w-3" />
                  <span>&ldquo;{q.question}&rdquo;</span>
                </button>
              ))}
            </div>
          </div>

          {/* Grounded Response Card */}
          <div className="rounded-xl border border-white/[0.07] bg-[#06080A] p-5 space-y-5">
            {/* Header — always visible */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/[0.06] pb-4">
              <div className="flex items-center gap-2">
                <span className="font-bold text-[#E5E9E8] text-sm font-sans">
                  Deterministic Clause Extraction
                </span>
                <span className="text-[10px] font-mono bg-white/[0.06] text-[#B1B8BD] font-semibold px-2 py-0.5 rounded border border-white/[0.08]">
                  Verified
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[12px] text-emerald-400 font-medium">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Statutory Authority Grounded</span>
              </div>
            </div>

            {/* Response Body — reveals first */}
            <div
              className="text-sm text-[#C2C9CD] leading-relaxed whitespace-pre-line font-sans"
              style={{
                opacity: responseVisible ? 1 : 0,
                transform: responseVisible ? "translateY(0)" : "translateY(8px)",
                filter: responseVisible ? "blur(0px)" : "blur(3px)",
                transition: "opacity 0.55s ease, transform 0.55s cubic-bezier(0.16,1,0.3,1), filter 0.55s ease",
              }}
            >
              {current.answer}
            </div>

            {/* Cited Clauses — reveals second */}
            <div
              className="space-y-2"
              style={{
                opacity: clausesVisible ? 1 : 0,
                transform: clausesVisible ? "translateY(0)" : "translateY(10px)",
                transition: "opacity 0.55s ease, transform 0.55s cubic-bezier(0.16,1,0.3,1)",
              }}
            >
              <div className="text-[10px] font-semibold text-[#7E878E] uppercase tracking-wider font-mono">
                Authoritative Clause Citations
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {current.citedClauses.map((c, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-lg bg-[#0A0D10] border border-white/[0.08] text-xs space-y-1 hover:border-blue-500/30 transition-colors duration-200 card-lift"
                    style={{
                      opacity: clausesVisible ? 1 : 0,
                      transitionDelay: clausesVisible ? `${i * 80}ms` : "0ms",
                      transition: "opacity 0.4s ease, border-color 0.2s ease, transform 0.3s ease, box-shadow 0.3s ease",
                    }}
                  >
                    <div className="font-bold text-blue-400 font-mono text-[11px]">
                      {c.standard}
                    </div>
                    <div className="font-semibold text-[#E5E9E8] text-xs font-sans">
                      {c.clause}
                    </div>
                    <div className="text-[11px] text-[#7E878E] truncate">
                      {c.title}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Takeaway — reveals last */}
            <div
              className="p-3.5 rounded-lg bg-amber-500/5 border border-amber-500/20 text-sm flex items-start gap-2.5"
              style={{
                opacity: takeawayVisible ? 1 : 0,
                transform: takeawayVisible ? "translateY(0)" : "translateY(8px)",
                transition: "opacity 0.5s ease, transform 0.5s cubic-bezier(0.16,1,0.3,1)",
              }}
            >
              <span className="font-bold text-amber-400 shrink-0 font-sans text-xs">Actionable Rule:</span>
              <span className="text-[#C2C9CD] font-normal font-sans text-xs">{current.takeaway}</span>
            </div>

            {/* Source Reference */}
            <div
              className="text-[10px] text-[#7E878E] flex items-center justify-between border-t border-white/[0.05] pt-3 font-mono"
              style={{
                opacity: takeawayVisible ? 1 : 0,
                transition: "opacity 0.4s 0.1s ease",
              }}
            >
              <span>Grounding: {current.statutorySource}</span>
              <span>Deterministic Logic Evaluation</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default AgentSection;
