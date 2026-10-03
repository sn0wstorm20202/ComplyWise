"use client";

import React, { useEffect, useRef } from "react";
import { ShieldCheck, Cpu, Database, CheckCircle2 } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export function TrustPrincipleScene() {
  const containerRef = useRef<HTMLElement>(null);
  const stackRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const mm = gsap.matchMedia();
    mm.add({
      desktop: "(min-width: 1280px)",
      compact: "(max-width: 1279px)",
      reduced: "(prefers-reduced-motion: reduce)",
    }, (context) => {
      const desktop = context.conditions?.desktop;
      if (context.conditions?.reduced) return;
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top 75%",
          end: "bottom 35%",
          scrub: desktop ? 1 : false,
          once: !desktop,
        },
      });

      tl.fromTo(
        stackRef.current?.children || [],
        { opacity: 0.3, y: 30 },
        { opacity: 1, y: 0, stagger: 0.12, duration: 1, ease: "power2.out" }
      ).fromTo(
        headlineRef.current?.querySelectorAll(".trust-word") || [],
        { opacity: 0.2, y: 8 },
        { opacity: 1, y: 0, duration: 0.6, stagger: 0.12, ease: "power2.out" },
        "-=0.4"
      );
    }, containerRef);

    return () => mm.revert();
  }, []);

  const architectureLayers = [
    {
      role: "UNDERSTAND",
      desc: "Understand your business and ask for details that matter.",
      icon: Cpu,
    },
    {
      role: "SOURCES",
      desc: "Keep the source, version and effective date visible.",
      icon: Database,
    },
    {
      role: "RULES",
      desc: "Check the conditions against your business details.",
      icon: ShieldCheck,
    },
    {
      role: "NEXT STEPS",
      desc: "Bring requirements, documents and tasks into your workspace.",
      icon: CheckCircle2,
    },
  ];

  return (
    <section
      ref={containerRef}
      id="principle"
      className="py-36 md:py-52 bg-[#F7F5EF] border-t border-[rgba(23,23,20,0.06)] relative overflow-hidden"
    >
      {/* Subtle Warm Blush Radial Ambient Aura */}
      <div className="pointer-events-none absolute inset-0 bg-ambient-sage opacity-60" />
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70vw] h-[350px] bg-ambient-warm opacity-50 blur-3xl -z-10" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-20 relative z-10 text-center">
        {/* Chapter Header */}
        <div className="space-y-4 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-[#96938A] px-3.5 py-1 rounded-full bg-[#EFEEE7] border border-[rgba(23,23,20,0.06)]">
            <ShieldCheck className="h-3.5 w-3.5 text-[#557D6B]" />
            <span>HOW COMPLYWISE WORKS</span>
          </div>

          <p className="text-xs font-mono uppercase tracking-[0.16em] text-[#6F6D66]">
            UNDERSTAND &bull; CHECK &bull; EXPLAIN
          </p>
        </div>

        {/* 4 Architectural Layers */}
        <div
          ref={stackRef}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-left"
        >
          {architectureLayers.map((layer, idx) => {
            const Icon = layer.icon;
            return (
              <div
                key={idx}
                className="p-6 rounded-2xl bg-[#EFEEE7] border border-[rgba(23,23,20,0.08)] hover:bg-[#E7EEE9] transition-all duration-500 space-y-3"
              >
                <div className="flex flex-wrap gap-3 items-center justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#557D6B] font-bold">
                    {layer.role}
                  </span>
                  <Icon className="h-4 w-4 text-[#557D6B]" />
                </div>
                <p className="text-xs text-[#6F6D66] font-light leading-relaxed">
                  {layer.desc}
                </p>
              </div>
            );
          })}
        </div>

        {/* The Earned Climax Statement */}
        <div className="space-y-6 pt-4 max-w-4xl mx-auto">
          <p className="text-xl sm:text-2xl font-serif text-[#6F6D66] font-light leading-relaxed">
            A clear role for AI. A visible basis for every result.
          </p>

          <h2
            ref={headlineRef}
            className="text-[clamp(2.5rem,6vw,5.5rem)] font-serif text-[#171714] leading-[1.04] tracking-[-0.02em] font-normal"
          >
            <span className="trust-word inline-block">The</span>{" "}<span className="trust-word inline-block">rules</span>{" "}<span className="trust-word inline-block">decide.</span> <br />
            <span className="italic font-light text-[#557D6B]">
              <span className="trust-word inline-block">The</span>{" "}<span className="trust-word inline-block">AI</span>{" "}<span className="trust-word inline-block">explains.</span>
            </span>
          </h2>

          <p className="text-base text-[#6F6D66] font-light max-w-lg mx-auto">
            ComplyWise uses AI to understand and explain, while verified regulatory knowledge and rules guide the decision.
          </p>
        </div>
      </div>
    </section>
  );
}

export default TrustPrincipleScene;
