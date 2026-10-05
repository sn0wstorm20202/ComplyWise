"use client";

import React, { useEffect, useRef } from "react";
import { Search, Database } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export function RegulatoryDiscoveryScene() {
  const containerRef = useRef<HTMLElement>(null);
  const leftColRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const rawSourcesRef = useRef<HTMLDivElement>(null);
  const pipelineRef = useRef<HTMLDivElement>(null);
  const structuredRef = useRef<HTMLDivElement>(null);

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
          start: desktop ? "top top" : "top 85%",
          end: desktop ? "+=110%" : undefined,
          pin: !!desktop,
          once: !desktop,
          scrub: desktop ? 1 : false,
          
        },
      });

      // Raw sources compress as pipeline steps highlight
      tl.to(rawSourcesRef.current, {
        opacity: 0.3,
        scale: 0.95,
        duration: 0.5,
        ease: "power2.inOut",
      })
        .fromTo(
          pipelineRef.current,
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" }
        )
        // Pipeline condenses into structured knowledge
        .to(pipelineRef.current, {
          opacity: 0.3,
          duration: 0.4,
        })
        .fromTo(
          structuredRef.current,
          { opacity: 0, y: 30, scale: 0.96 },
          { opacity: 1, y: 0, scale: 1, duration: 0.9, ease: "expo.out" }
        );
    }, containerRef);

    return () => mm.revert();
  }, []);

  const sources = [
    { type: "GAZETTE OF INDIA", title: "Government notification", date: "SOURCE" },
    { type: "BUREAU OF STANDARDS", title: "Product standard", date: "SOURCE" },
    { type: "STATE NOTIFICATION", title: "State requirement", date: "SOURCE" },
    { type: "LABOUR MINISTRY", title: "Workplace requirement", date: "SOURCE" },
  ];

  return (
    <section
      ref={containerRef}
      id="mechanism"
      className="min-h-screen py-24 md:py-32 bg-[#EFEEE7] border-t border-[rgba(23,23,20,0.06)] flex items-center"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left Column: Chapter Label & Narrative Heading */}
          <div ref={leftColRef} className="lg:col-span-5 space-y-5">
            <div className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-[#96938A] px-3 py-1 rounded-full bg-[#F7F5EF] border border-[rgba(23,23,20,0.06)]">
              <Search className="h-3.5 w-3.5 text-[#557D6B]" />
              <span>CHAPTER 03 &bull; REGULATORY DISCOVERY</span>
            </div>

            <h2 className="text-[clamp(2.2rem,4.5vw,3.8rem)] font-serif text-[#171714] leading-[1.08] tracking-[-0.02em]">
              Find the rules that <span className="italic font-light text-[#557D6B]">belong to you.</span>
            </h2>

            <p className="text-base text-[#6F6D66] font-light leading-relaxed">
              We bring together the requirements that matter for your business, location and activity.
            </p>

            <div className="pt-4 flex items-center gap-3 text-xs font-mono text-[#557D6B]">
              <Database className="h-4 w-4" />
              <span>BUSINESS &bull; LOCATION &bull; ACTIVITY</span>
            </div>
          </div>

          {/* Right Column: Visual Discovery Pipeline */}
          <div className="lg:col-span-7">
            <div
              ref={cardRef}
              className="rounded-[32px] bg-[#F7F5EF] border border-[rgba(23,23,20,0.1)] p-8 sm:p-10 shadow-[0_24px_70px_rgba(23,23,20,0.05)] space-y-7"
            >
              <div className="flex flex-wrap gap-3 items-center justify-between border-b border-[rgba(23,23,20,0.08)] pb-4">
                <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-[#6F6D66]">
                  FINDING THE RELEVANT REQUIREMENTS
                </span>
                <span className="font-mono text-[10px] text-[#96938A]">
                  ILLUSTRATIVE SOURCES
                </span>
              </div>

              {/* Raw Sources Stream */}
              <div ref={rawSourcesRef} className="space-y-3">
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#96938A] block">
                  GOVERNMENT SOURCES &amp; STANDARDS
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {sources.map((item, idx) => (
                    <div
                      key={idx}
                      tabIndex={0}
                      className="source-story-card p-3 rounded-xl bg-[#EFEEE7] border border-[rgba(23,23,20,0.06)] space-y-1"
                    >
                      <div className="flex flex-wrap gap-3 items-center justify-between text-[10px] font-mono text-[#96938A]">
                        <span>{item.type}</span>
                        <span>{item.date}</span>
                      </div>
                      <p className="font-sans text-xs text-[#171714] font-medium truncate">
                        {item.title}
                      </p>
                      <span className="story-metadata font-mono text-[10px] text-[#557D6B]">SOURCE · VERSION · EFFECTIVE DATE ↗</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pipeline Stages */}
              <div
                ref={pipelineRef}
                className="flex flex-wrap gap-3 items-center justify-between p-3.5 rounded-2xl bg-[#EFEEE7] border border-[rgba(23,23,20,0.08)] text-[11px] font-mono"
              >
                <span className="text-[#557D6B] font-bold">GATHER</span>
                <span className="text-[#96938A]">&rarr;</span>
                <span className="text-[#557D6B] font-bold">FILTER</span>
                <span className="text-[#96938A]">&rarr;</span>
                <span className="text-[#557D6B] font-bold">MATCH</span>
                <span className="text-[#96938A]">&rarr;</span>
                <span className="text-[#557D6B] font-bold">REVIEW</span>
              </div>

              {/* Collapsed Structured Knowledge */}
              <div
                ref={structuredRef}
                className="p-5 rounded-2xl bg-[#DCEAE2]/60 border border-[#7FAF9A]/50 space-y-3"
              >
                <div className="flex flex-wrap gap-3 items-center justify-between font-mono text-xs">
                  <span className="text-[#557D6B] font-bold">
                    RELEVANT REQUIREMENT
                  </span>
                  <span className="text-[#557D6B]">SOURCE LINKED</span>
                </div>
                <p className="text-xs font-sans text-[#171714] leading-relaxed">
                  A requirement connected to your business details, its source, and the conditions to check.
                </p>
              </div>

              <div className="pt-2 border-t border-[rgba(23,23,20,0.06)] flex flex-wrap gap-3 items-center justify-between text-[11px] font-mono text-[#96938A]">
                <span>RESULT: RELEVANT REQUIREMENTS</span>
                <span>STEP 03 OF 07</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default RegulatoryDiscoveryScene;
