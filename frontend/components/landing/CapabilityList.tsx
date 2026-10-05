"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export function CapabilityList() {
  const containerRef = useRef<HTMLElement>(null);
  const rowsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (rowsRef.current) {
        gsap.from(rowsRef.current.children, {
          y: 35,
          opacity: 0,
          stagger: 0.1,
          duration: 0.8,
          ease: "power2.out",
          scrollTrigger: {
            trigger: rowsRef.current,
            start: "top 85%",
            once: true,
          },
        });
      }
    }, containerRef);

    return () => ctx.revert();
  }, []);

  const capabilities = [
    {
      id: "01",
      name: "Adaptive Diagnostic Intake",
      outcome: "Decision-critical operational facts captured without legal jargon",
      category: "INTAKE PROTOCOL",
      year: "2026",
    },
    {
      id: "02",
      name: "Regulatory Discovery & Citation",
      outcome: "Full-text gazette retrieval and clause-level provenance chains",
      category: "GAZETTE INDEX",
      year: "2026",
    },
    {
      id: "03",
      name: "Deterministic Applicability Engine",
      outcome: "Zero-hallucination statutory rules evaluated against verified thresholds",
      category: "RULE INFERENCE",
      year: "2026",
    },
    {
      id: "04",
      name: "Compliance Workspace & Dossiers",
      outcome: "NABL laboratory test logs, factory STI plans, and recurring schedules",
      category: "OPERATIONS",
      year: "2026",
    },
    {
      id: "05",
      name: "Standards & Industrial Schemes",
      outcome: "BIS Form V, ISI Mark licensing paths, and MSME capital incentives",
      category: "STATUTORY SCHEMES",
      year: "2026",
    },
  ];

  return (
    <section
      ref={containerRef}
      className="py-28 md:py-36 bg-[#EFEEE7] border-t border-[rgba(23,23,20,0.06)]"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Editorial Subheader */}
        <div className="flex flex-wrap items-end justify-between gap-6 pb-6 border-b border-[rgba(23,23,20,0.1)]">
          <div className="space-y-2">
            <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#96938A]">
              03 &mdash; CAPABILITY INVENTORY
            </span>
            <h2 className="text-3xl sm:text-4xl font-serif text-[#171714]">
              System Specifications
            </h2>
          </div>
          <p className="text-xs font-mono uppercase tracking-[0.16em] text-[#6F6D66]">
            STATUTORY ARCHITECTURE &bull; 5 ACTIVE MODULES
          </p>
        </div>

        {/* Editorial List Table */}
        <div ref={rowsRef} className="divide-y divide-[rgba(23,23,20,0.08)]">
          {capabilities.map((item) => (
            <Link
              key={item.id}
              href="/dashboard"
              className="group flex flex-col md:flex-row md:items-center justify-between py-6 sm:py-7 px-4 -mx-4 rounded-xl hover:bg-[#E7EEE9]/80 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]"
            >
              {/* Left Column: ID + Capability Name */}
              <div className="flex items-start sm:items-center gap-6 md:w-2/5">
                <span className="font-mono text-sm text-[#96938A] group-hover:text-[#557D6B] transition-colors">
                  {item.id}
                </span>
                <span className="font-serif text-xl sm:text-2xl text-[#171714] group-hover:text-[#557D6B] group-hover:translate-x-1.5 transition-all duration-500">
                  {item.name}
                </span>
              </div>

              {/* Center Column: Outcome */}
              <div className="mt-2 md:mt-0 md:w-2/5 pr-4">
                <p className="text-xs sm:text-sm text-[#6F6D66] font-light leading-relaxed">
                  {item.outcome}
                </p>
              </div>

              {/* Right Column: Category + Directional Icon */}
              <div className="mt-3 md:mt-0 flex items-center justify-between md:justify-end gap-6 md:w-1/5">
                <span className="font-mono text-[10px] tracking-[0.16em] uppercase text-[#96938A] px-2.5 py-1 rounded bg-[#F7F5EF] border border-[rgba(23,23,20,0.06)]">
                  {item.category}
                </span>
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-transparent group-hover:bg-[#557D6B] text-[#6F6D66] group-hover:text-white transition-all duration-500">
                  <ArrowUpRight className="h-4 w-4" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export default CapabilityList;
