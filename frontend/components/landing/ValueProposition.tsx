"use client";

import React, { useEffect, useRef } from "react";
import Image from "next/image";
import { CheckCircle2, Clock } from "lucide-react";

function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.querySelectorAll<HTMLElement>(".sr-hidden").forEach((t) => t.classList.add("sr-visible"));
          io.unobserve(el);
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return ref;
}

export function ValueProposition() {
  const ref1 = useReveal();
  const ref2 = useReveal();
  const ref3 = useReveal();
  const headerRef = useReveal();

  return (
    <section id="how-it-works" className="py-24 md:py-32 bg-[#06080A] relative overflow-hidden">
      {/* Subtle background accent */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      <div className="absolute top-1/2 left-1/4 w-[600px] h-[600px] rounded-full bg-blue-900/10 blur-[120px] pointer-events-none -translate-y-1/2" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-20">
        {/* Section Header */}
        <div ref={headerRef} className="max-w-3xl space-y-4">
          <div className="sr-hidden text-[11px] font-bold text-[#3B82F6] uppercase tracking-widest font-mono">
            Operational Architecture
          </div>
          <h2 className="sr-hidden sr-delay-1 text-4xl sm:text-5xl lg:text-[56px] font-bold tracking-tight text-[#F4F6F5] leading-[1.08] font-sans">
            Compliance intelligence built for real operations.
          </h2>
          <p className="sr-hidden sr-delay-2 text-lg text-[#B1B8BD] leading-relaxed font-sans max-w-2xl">
            Eliminate ambiguity. ComplyWise connects statutory gazettes, technical standard clauses, and plant documentation into a clear operational roadmap.
          </p>
        </div>

        {/* Editorial Stages */}
        <div className="space-y-0">

          {/* 01 — Understand — slides from LEFT */}
          <div ref={ref1} className="group border-t border-white/[0.07] py-14 sm:py-20 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center hover:border-white/[0.12] transition-colors">
            <div className="lg:col-span-5 space-y-5 sr-hidden sr-from-left">
              <span className="font-mono text-[11px] font-semibold text-[#3B82F6] tracking-widest uppercase">
                01 — Understand
              </span>
              <h3 className="text-2xl sm:text-3xl font-bold text-[#F4F6F5] leading-snug font-sans">
                Find the standards, clauses and requirements relevant to your business.
              </h3>
              <p className="text-base text-[#B1B8BD] leading-relaxed font-sans">
                Rather than browsing thousands of pages of BIS standards and Quality Control Orders manually, ComplyWise maps your manufacturing scope, product categories, and raw materials directly to authoritative statutory clauses.
              </p>
            </div>

            <div className="lg:col-span-7 relative sr-hidden sr-from-right sr-delay-2">
              <div className="relative rounded-2xl overflow-hidden aspect-[16/9] border border-white/[0.08] card-lift">
                <Image
                  src="/assets/landing/photos/regulatory-documents.jpg"
                  alt="Regulatory documents and BIS standards documentation"
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover object-center opacity-40 group-hover:opacity-50 transition-opacity duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#06080A] via-[#06080A]/30 to-transparent" />

                <div className="absolute inset-0 p-5 sm:p-7 flex flex-col justify-end">
                  <div className="text-[10px] font-mono text-[#7E878E] uppercase tracking-wider mb-3">Statutory Mapping Pipeline</div>
                  <div className="grid grid-cols-3 gap-2.5">
                    <div className="bg-[#0A0D10]/90 backdrop-blur-md border border-white/[0.08] rounded-xl p-3 space-y-1">
                      <div className="text-[10px] font-mono text-[#7E878E]">INPUT SCOPE</div>
                      <div className="text-xs font-bold text-[#F4F6F5]">16A Domestic Plug</div>
                      <div className="text-[11px] text-[#B1B8BD]">Molded polycarbonate</div>
                    </div>
                    <div className="bg-[#0A0D10]/90 backdrop-blur-md border border-blue-500/20 rounded-xl p-3 space-y-1">
                      <div className="text-[10px] font-mono text-blue-400 font-semibold">MANDATORY STD</div>
                      <div className="text-xs font-bold text-[#F4F6F5]">IS 1293:2019</div>
                      <div className="text-[11px] text-[#B1B8BD]">Scheme I (ISI Mark)</div>
                    </div>
                    <div className="bg-[#0A0D10]/90 backdrop-blur-md border border-emerald-500/20 rounded-xl p-3 space-y-1">
                      <div className="text-[10px] font-mono text-emerald-400 font-semibold">ENFORCING ORDER</div>
                      <div className="text-xs font-bold text-[#F4F6F5]">QCO S.O. 1421(E)</div>
                      <div className="text-[11px] text-[#B1B8BD]">DPIIT Gazette</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 02 — Analyse — blur + scale reveal */}
          <div ref={ref2} className="group border-t border-white/[0.07] py-14 sm:py-20 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center hover:border-white/[0.12] transition-colors">
            <div className="lg:col-span-5 space-y-5 lg:order-2 sr-hidden sr-from-right">
              <span className="font-mono text-[11px] font-semibold text-[#3B82F6] tracking-widest uppercase">
                02 — Analyse
              </span>
              <h3 className="text-2xl sm:text-3xl font-bold text-[#F4F6F5] leading-snug font-sans">
                Connect documents, requirements, regulatory changes and evidence.
              </h3>
              <p className="text-base text-[#B1B8BD] leading-relaxed font-sans">
                Track whether laboratory test reports meet the specific testing parameters required by BIS. Identify missing calibration certificates or expired evidence records before surveillance auditors arrive.
              </p>
            </div>

            <div className="lg:col-span-7 relative lg:order-1 sr-hidden sr-scale sr-delay-2">
              <div className="relative rounded-2xl overflow-hidden aspect-[16/9] border border-white/[0.08] card-lift">
                <Image
                  src="/assets/landing/photos/evidence-review.jpg"
                  alt="Evidence review and compliance traceability matrix"
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover object-center opacity-35 group-hover:opacity-45 transition-opacity duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#06080A] via-[#06080A]/30 to-transparent" />

                <div className="absolute inset-0 p-5 sm:p-7 flex flex-col justify-end">
                  <div className="text-[10px] font-mono text-[#7E878E] uppercase tracking-wider mb-3">Evidence Traceability Matrix</div>
                  <div className="space-y-2">
                    <div className="bg-[#0A0D10]/90 backdrop-blur-md border border-white/[0.08] rounded-xl p-3 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                        <div>
                          <div className="font-bold text-[#F4F6F5] text-xs">NABL Test Report #TR-1293</div>
                          <div className="text-[11px] text-[#B1B8BD]">Clause 18: Temperature rise within 45K limit verified</div>
                        </div>
                      </div>
                      <span className="font-mono text-[10px] font-semibold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded border border-emerald-400/20 shrink-0 ml-2">VERIFIED</span>
                    </div>
                    <div className="bg-[#0A0D10]/90 backdrop-blur-md border border-white/[0.08] rounded-xl p-3 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <Clock className="h-4 w-4 text-amber-400 shrink-0" />
                        <div>
                          <div className="font-bold text-[#F4F6F5] text-xs">High Voltage Rig Calibration</div>
                          <div className="text-[11px] text-[#B1B8BD]">Certificate renewal required before audit</div>
                        </div>
                      </div>
                      <span className="font-mono text-[10px] font-semibold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20 shrink-0 ml-2">RENEWAL DUE</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 03 — Act — slides from RIGHT */}
          <div ref={ref3} className="group border-t border-b border-white/[0.07] py-14 sm:py-20 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center hover:border-white/[0.12] transition-colors">
            <div className="lg:col-span-5 space-y-5 sr-hidden sr-from-right">
              <span className="font-mono text-[11px] font-semibold text-[#3B82F6] tracking-widest uppercase">
                03 — Act
              </span>
              <h3 className="text-2xl sm:text-3xl font-bold text-[#F4F6F5] leading-snug font-sans">
                Turn compliance intelligence into clear next actions and workflows.
              </h3>
              <p className="text-base text-[#B1B8BD] leading-relaxed font-sans">
                Stay ahead of statutory deadlines with structured clearance workflows. Assign responsibility, monitor departmental turnaround times, and file annual returns on time.
              </p>
            </div>

            <div className="lg:col-span-7 relative sr-hidden sr-from-left sr-delay-2">
              <div className="relative rounded-2xl overflow-hidden aspect-[16/9] border border-white/[0.08] card-lift">
                <Image
                  src="/assets/landing/photos/compliance-workspace.jpg"
                  alt="Compliance workflow and departmental clearance workspace"
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover object-center opacity-35 group-hover:opacity-45 transition-opacity duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#06080A] via-[#06080A]/30 to-transparent" />

                <div className="absolute inset-0 p-5 sm:p-7 flex flex-col justify-end">
                  <div className="text-[10px] font-mono text-[#7E878E] uppercase tracking-wider mb-3">Departmental Clearance Workflow</div>
                  <div className="bg-[#0A0D10]/90 backdrop-blur-md border border-white/[0.08] rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#F4F6F5] text-xs">BIS Scheme I Certification (ISI Mark)</span>
                      <span className="font-mono text-[11px] text-[#7E878E]">Step 3 of 5</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-white/[0.08] overflow-hidden">
                      <div className="w-3/5 h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full" />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-[#7E878E]">
                      <span>Current: Laboratory Sample Testing</span>
                      <span className="text-blue-400 font-semibold">In Progress</span>
                    </div>
                  </div>
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
