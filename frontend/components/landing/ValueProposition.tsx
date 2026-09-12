"use client";

import React from "react";
import { CheckCircle2, Clock, ArrowRight, ShieldCheck } from "lucide-react";

export function ValueProposition() {
  return (
    <section id="how-it-works" className="py-20 md:py-28 bg-[#F8FAFC] border-b border-[#E2E8F0]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Section Header */}
        <div className="max-w-2xl space-y-2">
          <div className="text-[11px] font-bold text-[#64748B] uppercase tracking-widest font-mono">
            Operational Architecture
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-[#0F172A] font-sans">
            Compliance intelligence built for real operations.
          </h2>
          <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed font-sans">
            Eliminate ambiguity. ComplyWise connects statutory gazettes, technical standard clauses, and plant documentation into a clear operational roadmap.
          </p>
        </div>

        {/* Open Editorial Sections (Thin Dividers, Open Layout) */}
        <div className="divide-y divide-[#E2E8F0] border-t border-b border-[#E2E8F0]">
          {/* 01 — Understand */}
          <div className="py-12 sm:py-16 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-5 space-y-3">
              <span className="font-mono text-xs font-bold text-[#0F172A] bg-[#F1F5F9] px-2.5 py-1 rounded-md border border-[#E2E8F0]">
                01 — Understand
              </span>
              <h3 className="text-lg sm:text-xl font-bold text-[#0F172A] leading-snug font-sans">
                Find the standards, clauses and requirements relevant to your business.
              </h3>
              <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed font-sans">
                Rather than browsing thousands of pages of BIS standards and Quality Control Orders manually, ComplyWise maps your manufacturing scope, product categories, and raw materials directly to authoritative statutory clauses.
              </p>
            </div>

            <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-2xs text-xs space-y-4">
              <div className="text-[10px] font-semibold text-[#94A3B8] uppercase tracking-wider font-mono">
                Statutory Mapping Pipeline
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1">
                  <div className="text-[10px] font-mono text-[#94A3B8]">INPUT SCOPE</div>
                  <div className="font-bold text-[#0F172A]">16A Domestic Plug</div>
                  <div className="text-[11px] text-[#64748B]">Molded polycarbonate</div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1">
                  <div className="text-[10px] font-mono text-blue-900 font-semibold">MANDATORY STANDARD</div>
                  <div className="font-bold text-[#0F172A]">IS 1293:2019</div>
                  <div className="text-[11px] text-[#64748B]">Scheme I (ISI Mark)</div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1">
                  <div className="text-[10px] font-mono text-emerald-800 font-semibold">ENFORCING ORDER</div>
                  <div className="font-bold text-[#0F172A]">QCO S.O. 1421(E)</div>
                  <div className="text-[11px] text-[#64748B]">DPIIT Gazette Notification</div>
                </div>
              </div>
            </div>
          </div>

          {/* 02 — Analyse */}
          <div className="py-12 sm:py-16 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-5 space-y-3">
              <span className="font-mono text-xs font-bold text-[#0F172A] bg-[#F1F5F9] px-2.5 py-1 rounded-md border border-[#E2E8F0]">
                02 — Analyse
              </span>
              <h3 className="text-lg sm:text-xl font-bold text-[#0F172A] leading-snug font-sans">
                Connect documents, requirements, regulatory changes and evidence.
              </h3>
              <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed font-sans">
                Track whether laboratory test reports meet the specific testing parameters required by BIS. Identify missing calibration certificates or expired evidence records before surveillance auditors arrive.
              </p>
            </div>

            <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-2xs text-xs space-y-3">
              <div className="text-[10px] font-semibold text-[#94A3B8] uppercase tracking-wider font-mono">
                Evidence Traceability Matrix
              </div>
              <div className="space-y-2.5">
                <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <div>
                      <div className="font-bold text-[#0F172A] text-xs">NABL Test Report #TR-1293</div>
                      <div className="text-[11px] text-[#64748B]">Clause 18: Temperature rise within 45K limit verified</div>
                    </div>
                  </div>
                  <span className="font-mono text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    VERIFIED
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Clock className="h-4 w-4 text-amber-600 shrink-0" />
                    <div>
                      <div className="font-bold text-[#0F172A] text-xs">High Voltage Rig Calibration</div>
                      <div className="text-[11px] text-[#64748B]">Calibration certificate renewal required before audit</div>
                    </div>
                  </div>
                  <span className="font-mono text-[10px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                    RENEWAL DUE
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 03 — Act */}
          <div className="py-12 sm:py-16 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-5 space-y-3">
              <span className="font-mono text-xs font-bold text-[#0F172A] bg-[#F1F5F9] px-2.5 py-1 rounded-md border border-[#E2E8F0]">
                03 — Act
              </span>
              <h3 className="text-lg sm:text-xl font-bold text-[#0F172A] leading-snug font-sans">
                Turn compliance intelligence into clear next actions and workflows.
              </h3>
              <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed font-sans">
                Stay ahead of statutory deadlines with structured clearance workflows. Assign responsibility, monitor departmental turnaround times, and file annual returns on time.
              </p>
            </div>

            <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-2xs text-xs space-y-3">
              <div className="text-[10px] font-semibold text-[#94A3B8] uppercase tracking-wider font-mono">
                Departmental Clearance Workflow
              </div>
              <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#0F172A]">BIS Scheme I Certification (ISI Mark)</span>
                  <span className="font-mono text-[11px] text-[#64748B]">Step 3 of 5</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-200 overflow-hidden">
                  <div className="w-3/5 h-full bg-[#0F172A] rounded-full" />
                </div>
                <div className="flex items-center justify-between text-[11px] text-[#64748B] pt-1">
                  <span>Current: Laboratory Sample Testing</span>
                  <span className="text-[#0F172A] font-semibold">In Progress</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ValueProposition;
