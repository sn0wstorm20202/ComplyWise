"use client";

import React, { useState, useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CheckCircle2 } from "lucide-react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export function ValueProposition() {
  const [selectedProduct, setSelectedProduct] = useState<"plug" | "meter" | "switch">("plug");
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const bentoRef = useRef<HTMLDivElement>(null);

  const productData = {
    plug: {
      name: "16A Polycarbonate Plugs & Sockets",
      standard: "IS 1293:2019",
      qco: "QCO S.O. 1421(E)",
      scheme: "Scheme I (ISI Mark)",
      status: "MANDATORY",
    },
    meter: {
      name: "Smart Electricity Meter (Static)",
      standard: "IS 16444 (Part 1):2015",
      qco: "QCO S.O. 2356(E)",
      scheme: "Scheme I (ISI Mark)",
      status: "MANDATORY",
    },
    switch: {
      name: "Modular Switches (Flush-Type)",
      standard: "IS 3854:1997",
      qco: "QCO S.O. 1827(E)",
      scheme: "Scheme I (ISI Mark)",
      status: "MANDATORY",
    },
  };

  const active = productData[selectedProduct];

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Section header fade-up
      if (headerRef.current) {
        gsap.from(headerRef.current.children, {
          y: 60,
          opacity: 0,
          filter: "blur(6px)",
          duration: 0.9,
          stagger: 0.15,
          ease: "power3.out",
          scrollTrigger: {
            trigger: headerRef.current,
            start: "top 85%",
            once: true,
          },
        });
      }

      // Bento cards staggered scale-in
      if (bentoRef.current) {
        gsap.from(bentoRef.current.children, {
          y: 80,
          opacity: 0,
          scale: 0.95,
          duration: 1,
          stagger: 0.15,
          ease: "power3.out",
          scrollTrigger: {
            trigger: bentoRef.current,
            start: "top 82%",
            once: true,
          },
        });
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} id="bento-system" className="py-28 md:py-40 bg-[#FAFAFA] border-b border-slate-200/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-20">
        {/* Header */}
        <div ref={headerRef} className="max-w-3xl space-y-5">
          <div className="inline-flex items-center gap-2 rounded-full px-3.5 py-1 text-[10px] font-mono uppercase tracking-[0.2em] font-medium bg-slate-900/[0.04] border border-slate-900/[0.06] text-slate-600">
            Deterministic Architecture
          </div>
          <h2 className="text-[clamp(1.8rem,4vw,3.5rem)] font-extrabold tracking-[-0.02em] text-[#0F172A] leading-[1.1] font-sans">
            Engineered for statutory certainty. Zero regulatory guesswork.
          </h2>
          <p className="text-sm sm:text-base text-slate-500 leading-relaxed font-sans max-w-2xl">
            Indian industrial compliance cannot depend on AI hallucinations. ComplyWise maps manufacturing variables to authoritative BIS standards through deterministic logic and tamper-evident provenance.
          </p>
        </div>

        {/* Gapless Bento Grid */}
        <div ref={bentoRef} className="grid grid-flow-dense grid-cols-1 md:grid-cols-12 gap-5">
          {/* Card 1: Statutory Mapping Pipeline (7 cols) */}
          <div className="col-span-12 md:col-span-7 bezel-shell">
            <div className="bezel-core p-6 sm:p-8 space-y-6 h-full flex flex-col">
              <div className="space-y-4 flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-wider font-semibold text-slate-400">
                    Statutory Mapping Pipeline
                  </span>
                  <span className="text-[10px] font-mono font-medium text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/70">
                    Live Gazette Sync
                  </span>
                </div>

                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight font-sans leading-tight">
                  Direct mapping from your plant scope to gazette orders.
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 leading-relaxed font-sans">
                  Select a manufactured product to see how ComplyWise resolves the mandatory standard and enforcing gazette notification.
                </p>

                {/* Scope Switcher */}
                <div className="flex flex-wrap gap-2 pt-1">
                  {(["plug", "meter", "switch"] as const).map((key) => (
                    <button
                      key={key}
                      onClick={() => setSelectedProduct(key)}
                      className={`px-4 py-2 rounded-full text-xs font-medium transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] cursor-pointer ${
                        selectedProduct === key
                          ? "bg-[#0F172A] text-white shadow-sm"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200/70"
                      }`}
                    >
                      {key === "plug" && "Plugs & Sockets"}
                      {key === "meter" && "Smart Meters"}
                      {key === "switch" && "Flush Switches"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Telemetry Result */}
              <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/60 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-xl bg-white border border-slate-200/50 space-y-1">
                    <span className="text-[10px] font-mono text-slate-400">PRODUCT SCOPE</span>
                    <div className="font-semibold text-slate-900 text-xs truncate">{active.name}</div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-white border border-slate-200/50 space-y-1">
                    <span className="text-[10px] font-mono text-blue-900 font-semibold">MANDATORY IS</span>
                    <div className="font-semibold text-blue-950 text-xs font-mono">{active.standard}</div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-white border border-slate-200/50 space-y-1">
                    <span className="text-[10px] font-mono text-emerald-800 font-semibold">ENFORCING QCO</span>
                    <div className="font-semibold text-emerald-950 text-xs font-mono">{active.qco}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Evidence & NABL (5 cols) */}
          <div className="col-span-12 md:col-span-5 bezel-shell">
            <div className="bezel-core p-6 sm:p-8 space-y-5 h-full flex flex-col">
              <div className="space-y-3 flex-1">
                <span className="font-mono text-[10px] uppercase tracking-wider font-semibold text-slate-400">
                  Evidence Traceability
                </span>
                <h3 className="text-xl font-bold text-slate-900 tracking-tight font-sans leading-tight">
                  Laboratory test dossiers and calibration logs.
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed font-sans">
                  Pre-validate test parameters against statutory thresholds before surveillance inspectors arrive.
                </p>
              </div>

              <div className="space-y-2.5">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" strokeWidth={1.5} />
                    <div>
                      <div className="font-semibold text-slate-900 text-xs">IS 1293 Clause 18</div>
                      <div className="text-[10px] text-slate-500">Rise 38.4K &lt; 45K threshold</div>
                    </div>
                  </div>
                  <span className="font-mono text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/70">
                    PASS
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-amber-600 shrink-0" strokeWidth={1.5} />
                    <div>
                      <div className="font-semibold text-slate-900 text-xs">HV Test Rig #02</div>
                      <div className="text-[10px] text-slate-500">Calibration valid to 28 Oct 2026</div>
                    </div>
                  </div>
                  <span className="font-mono text-[10px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/70">
                    VALID
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Deterministic Engine (5 cols) */}
          <div className="col-span-12 md:col-span-5 bezel-shell">
            <div className="bezel-core p-6 sm:p-8 space-y-5 h-full flex flex-col">
              <div className="space-y-3 flex-1">
                <span className="font-mono text-[10px] uppercase tracking-wider font-semibold text-slate-400">
                  Rule Engine
                </span>
                <h3 className="text-xl font-bold text-slate-900 tracking-tight font-sans leading-tight">
                  Three-valued deterministic logic. No LLM hallucinations.
                </h3>
              </div>

              {/* Truth Values — Dark Inversion */}
              <div className="p-4 rounded-xl bg-[#0F172A] text-white font-mono text-[11px] space-y-2.5">
                <div className="flex items-center justify-between text-slate-400 text-[10px] border-b border-slate-700/80 pb-2">
                  <span>LOGIC STATE</span>
                  <span>SYSTEM ACTION</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-emerald-400 font-bold">TRUE</span>
                  <span className="text-slate-300">Mandatory statutory obligation</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-bold">FALSE</span>
                  <span className="text-slate-500">Exempt with audit rationale</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-amber-400 font-bold">UNKNOWN</span>
                  <span className="text-slate-300">Generate targeted questionnaire</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 4: Clearance Workflows (7 cols) */}
          <div className="col-span-12 md:col-span-7 bezel-shell">
            <div className="bezel-core p-6 sm:p-8 space-y-5 h-full flex flex-col">
              <div className="space-y-3 flex-1">
                <span className="font-mono text-[10px] uppercase tracking-wider font-semibold text-slate-400">
                  Workflow Automation
                </span>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight font-sans leading-tight">
                  Connected clearance pipelines across state and central portals.
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 leading-relaxed font-sans">
                  Unify applications across BIS Manakonline, State Pollution Control Boards, and Industrial Safety into multi-stage workflows.
                </p>
              </div>

              {/* Workflow Progress */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-900">BIS Scheme I Certification</span>
                  <span className="font-mono text-[11px] text-slate-500">Step 3 of 5</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                  <div className="w-3/5 h-full bg-[#0F172A] rounded-full transition-all duration-1000 ease-[cubic-bezier(0.32,0.72,0,1)]" />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span>Laboratory Sample Testing</span>
                  <span className="font-medium text-emerald-700">18d avg turnaround</span>
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
