"use client";

import React, { useState } from "react";
import { Search, ShieldCheck, BookOpen, CheckCircle2 } from "lucide-react";

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
  const current = queries[activeQueryIndex];

  return (
    <section id="intelligence" className="py-20 md:py-28 bg-[#F8FAFC] border-b border-[#E2E8F0]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Section Header */}
        <div className="max-w-2xl space-y-2">
          <div className="text-[11px] font-bold text-[#64748B] uppercase tracking-widest font-mono">
            Intelligent Assistance
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-[#0F172A] font-sans">
            BIS Agent
          </h2>
          <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed font-sans">
            Ask about standards, clauses, documents or requirements.
          </p>
        </div>

        {/* Product Interface Showcase */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 sm:p-8 shadow-2xs space-y-6">
          {/* Query Bar */}
          <div className="space-y-3">
            <div className="relative flex items-center">
              <Search className="absolute left-3.5 h-4 w-4 text-[#94A3B8]" />
              <div className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] pl-10 pr-4 py-3 text-xs sm:text-sm text-[#0F172A] font-medium font-sans">
                {current.question}
              </div>
            </div>

            {/* Prompt Chips */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider font-mono">
                Suggested Inquiries:
              </span>
              {queries.map((q, idx) => (
                <button
                  key={q.id}
                  onClick={() => setActiveQueryIndex(idx)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
                    activeQueryIndex === idx
                      ? "bg-[#0F172A] text-white border-[#0F172A] shadow-2xs font-semibold"
                      : "bg-white text-[#475569] border-[#E2E8F0] hover:bg-[#F8FAFC] hover:border-slate-300"
                  }`}
                >
                  <BookOpen className="h-3 w-3 text-[#94A3B8]" />
                  <span>&ldquo;{q.question}&rdquo;</span>
                </button>
              ))}
            </div>
          </div>

          {/* Grounded Response Card */}
          <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-5 space-y-4 animate-in fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E2E8F0] pb-3">
              <div className="flex items-center gap-2">
                <span className="font-bold text-[#0F172A] text-xs font-sans">
                  Deterministic Clause Extraction
                </span>
                <span className="text-[10px] font-mono bg-white text-[#0F172A] font-semibold px-2 py-0.5 rounded border border-[#E2E8F0]">
                  Verified
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 font-medium">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                <span>Statutory Authority Grounded</span>
              </div>
            </div>

            {/* Response Body */}
            <div className="text-xs sm:text-sm text-[#334155] leading-relaxed whitespace-pre-line font-sans">
              {current.answer}
            </div>

            {/* Cited Clauses */}
            <div className="space-y-1.5 pt-1">
              <div className="text-[10px] font-semibold text-[#94A3B8] uppercase tracking-wider font-mono">
                Authoritative Clause Citations
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {current.citedClauses.map((c, i) => (
                  <div
                    key={i}
                    className="p-2.5 rounded-lg bg-white border border-[#E2E8F0] text-xs space-y-0.5 shadow-2xs"
                  >
                    <div className="font-bold text-blue-900 font-mono text-[11px]">
                      {c.standard}
                    </div>
                    <div className="font-semibold text-[#0F172A] text-xs font-sans">
                      {c.clause}
                    </div>
                    <div className="text-[11px] text-[#64748B] truncate">
                      {c.title}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Operational Takeaway */}
            <div className="p-3.5 rounded-lg bg-white border border-[#E2E8F0] text-xs flex items-start gap-2.5 shadow-2xs">
              <span className="font-bold text-[#0F172A] shrink-0 font-sans">Actionable Rule:</span>
              <span className="text-[#334155] font-medium font-sans">{current.takeaway}</span>
            </div>

            {/* Source Reference */}
            <div className="text-[10px] text-[#94A3B8] flex items-center justify-between border-t border-[#E2E8F0] pt-2 font-mono">
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
