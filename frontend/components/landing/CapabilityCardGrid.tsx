"use client";

import React, { useEffect, useRef } from "react";
import { Compass, Cpu, CheckSquare } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export function CapabilityCardGrid() {
  const containerRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (headerRef.current) {
        gsap.from(headerRef.current.children, {
          y: 40,
          opacity: 0,
          duration: 0.9,
          stagger: 0.1,
          ease: "power2.out",
          scrollTrigger: {
            trigger: headerRef.current,
            start: "top 85%",
            once: true,
          },
        });
      }

      if (cardsRef.current) {
        gsap.from(cardsRef.current.children, {
          y: 60,
          opacity: 0,
          duration: 1.1,
          stagger: 0.16,
          ease: "power3.out",
          scrollTrigger: {
            trigger: cardsRef.current,
            start: "top 80%",
            once: true,
          },
        });
      }
    }, containerRef);

    return () => ctx.revert();
  }, []);

  const capabilities = [
    {
      num: "01",
      badge: "UNDERSTAND",
      icon: Compass,
      title: "Business context into structured facts",
      description:
        "Adaptive, non-legalistic questions extract your plant parameters, chemical thresholds, and manufacturing workflows without tedious regulatory questionnaires.",
      details: [
        "Dynamic intake engine",
        "Threshold boundary detection",
        "Zero redundant questions",
      ],
    },
    {
      num: "02",
      badge: "DECIDE",
      icon: Cpu,
      title: "Rules, thresholds & exemptions into truth",
      description:
        "Statutory rules run through deterministic decision trees against official gazette notifications and BIS schedules. 100% provenance, zero hallucinations.",
      details: [
        "Zero-hallucination logic",
        "Full citation audit trail",
        "State & Central synchronization",
      ],
    },
    {
      num: "03",
      badge: "ACT",
      icon: CheckSquare,
      title: "Requirements into workflows & dossiers",
      description:
        "Turn verified applicability into actionable test schedules, NABL laboratory dossiers, factory inspection checklists, and tamper-evident audit filings.",
      details: [
        "NABL lab dossier builder",
        "Audit-ready factory STI plans",
        "Dynamic statutory deadlines",
      ],
    },
  ];

  return (
    <section
      ref={containerRef}
      id="capabilities"
      className="py-32 md:py-48 bg-[#F7F5EF] border-t border-[rgba(23,23,20,0.06)]"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Editorial Section Header */}
        <div ref={headerRef} className="max-w-2xl space-y-4">
          <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.2em] text-[#96938A]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#7FAF9A]" />
            <span>02 &mdash; OPERATIONAL ARCHITECTURE</span>
          </div>
          <h2 className="text-[clamp(2.2rem,4.5vw,3.8rem)] font-serif text-[#171714] leading-[1.05] tracking-[-0.02em]">
            From raw operations to verified statutory compliance.
          </h2>
          <p className="text-base text-[#6F6D66] font-light leading-relaxed">
            A three-stage deterministic pipeline engineered specifically for the
            rigors of Indian statutory mandates and laboratory audits.
          </p>
        </div>

        {/* 3 Large Editorial Cards Grid */}
        <div
          ref={cardsRef}
          className="grid grid-cols-1 lg:grid-cols-3 gap-8"
        >
          {capabilities.map((card, idx) => {
            const Icon = card.icon;
            return (
              <div
                key={idx}
                className="group relative rounded-[28px] bg-[#EFEEE7] border border-[rgba(23,23,20,0.08)] hover:border-[#7FAF9A]/50 hover:bg-[#E7EEE9] p-8 sm:p-10 flex flex-col justify-between transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-1.5 shadow-[0_4px_20px_rgba(23,23,20,0.02)] hover:shadow-[0_24px_50px_rgba(127,175,154,0.12)] cursor-default overflow-hidden"
              >
                {/* Subtle Ambient Radial Highlight on Hover */}
                <div className="pointer-events-none absolute -top-24 -right-24 w-48 h-48 rounded-full bg-[#7FAF9A]/20 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                <div className="space-y-7 relative z-10">
                  {/* Top Bar: Low-Contrast Number + Badge + Icon */}
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-3xl font-light text-[#96938A] group-hover:text-[#557D6B] transition-colors duration-500">
                      {card.num}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-[10px] tracking-[0.16em] uppercase text-[#6F6D66] px-2.5 py-1 rounded-full bg-[#F7F5EF] border border-[rgba(23,23,20,0.06)]">
                        {card.badge}
                      </span>
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F7F5EF] text-[#6F6D66] group-hover:text-[#557D6B] group-hover:bg-[#DCEAE2] transition-all duration-500">
                        <Icon className="h-5 w-5" strokeWidth={1.5} />
                      </div>
                    </div>
                  </div>

                  {/* Card Title */}
                  <h3 className="font-serif text-2xl text-[#171714] leading-snug">
                    {card.title}
                  </h3>

                  {/* Animated Hairline Divider (0% -> 100% on hover) */}
                  <div className="relative w-full h-[1px] bg-[rgba(23,23,20,0.08)] overflow-hidden">
                    <div className="absolute inset-y-0 left-0 w-0 group-hover:w-full bg-[#557D6B] transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]" />
                  </div>

                  {/* Description */}
                  <p className="text-sm text-[#6F6D66] leading-relaxed font-light">
                    {card.description}
                  </p>
                </div>

                {/* Sub-item Bullets */}
                <div className="pt-8 space-y-2 border-t border-[rgba(23,23,20,0.05)] mt-8 relative z-10">
                  {card.details.map((detail, dIdx) => (
                    <div
                      key={dIdx}
                      className="flex items-center gap-2 text-xs font-mono text-[#6F6D66] group-hover:text-[#171714] transition-colors"
                    >
                      <span className="h-1 w-1 rounded-full bg-[#7FAF9A]" />
                      <span>{detail}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default CapabilityCardGrid;
