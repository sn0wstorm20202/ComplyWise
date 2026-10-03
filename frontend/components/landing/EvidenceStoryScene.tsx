"use client";

import React, { useEffect, useRef } from "react";
import { FileText, Sparkles } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export function EvidenceStoryScene() {
  const containerRef = useRef<HTMLElement>(null);
  const stepsRef = useRef<HTMLDivElement>(null);
  const docRef = useRef<HTMLDivElement>(null);
  const actionRef = useRef<HTMLDivElement>(null);

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
          start: "top 80%",
          end: "bottom 30%",
          scrub: desktop ? 1 : false,
          once: !desktop,
        },
      });

      // Stage 1: Document text highlight glows
      tl.fromTo(
        docRef.current,
        { opacity: 0.5, y: 30 },
        { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" }
      )
        // Stage 2: Steps illuminate progressively
        .fromTo(
          stepsRef.current?.children || [],
          { opacity: 0.2, x: -10 },
          { opacity: 1, x: 0, stagger: 0.1, duration: 1, ease: "power2.out" },
          "-=0.4"
        )
        // Stage 3: Immediate user action item is synthesized
        .fromTo(
          actionRef.current,
          { opacity: 0, scale: 0.94, y: 20 },
          { opacity: 1, scale: 1, y: 0, duration: 0.8, ease: "expo.out" },
          "-=0.3"
        );
    }, containerRef);

    return () => mm.revert();
  }, []);

  const pipeline = [
    { label: "01 SOURCE", val: "Government notification" },
    { label: "02 RELEVANT PART", val: "The passage that describes the requirement" },
    { label: "03 REQUIREMENT", val: "Conditions checked against your business" },
    { label: "04 RESULT", val: "Why it applies and what to do next" },
  ];

  return (
    <section
      ref={containerRef}
      id="evidence"
      className="py-32 md:py-48 bg-[#EFEEE7] border-t border-[rgba(23,23,20,0.06)]"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Editorial Chapter Header */}
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-[#96938A] px-3.5 py-1 rounded-full bg-[#F7F5EF] border border-[rgba(23,23,20,0.06)]">
            <FileText className="h-3.5 w-3.5 text-[#557D6B]" />
            <span>CHAPTER 05 &bull; THE EVIDENCE CHAIN</span>
          </div>

          <h2 className="text-[clamp(2.4rem,5vw,4.2rem)] font-serif text-[#171714] leading-[1.06] tracking-[-0.02em]">
              Every decision <span className="italic font-light text-[#557D6B]">has a trail.</span>
            </h2>

          <p className="text-base text-[#6F6D66] font-light leading-relaxed">
              See the source, the reason, and the next step behind every result.
            </p>
        </div>

        {/* 2-Column Evidentiary Reconstruction */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Left Column: Traceable Pipeline Steps */}
          <div ref={stepsRef} className="lg:col-span-5 space-y-3">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#96938A] block pb-2">
              SOURCE &rarr; RELEVANT PART &rarr; REQUIREMENT &rarr; RESULT
            </span>
            {pipeline.map((item, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-[#F7F5EF] border border-[rgba(23,23,20,0.06)] hover:border-[#7FAF9A]/50 transition-colors space-y-1"
              >
                <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-[#557D6B] font-semibold block">
                  {item.label}
                </span>
                <p className="font-sans text-xs text-[#171714] font-medium">
                  {item.val}
                </p>
              </div>
            ))}
          </div>

          {/* Right Column: Live Source Excerpt & Synthesized Action Item */}
          <div className="lg:col-span-7 space-y-6">
            {/* Source Document Viewer */}
            <div
              ref={docRef}
              className="rounded-[28px] bg-[#F7F5EF] border border-[rgba(23,23,20,0.1)] p-7 sm:p-8 space-y-4 shadow-[0_16px_50px_rgba(23,23,20,0.04)]"
            >
              <div className="flex flex-wrap gap-3 items-center justify-between border-b border-[rgba(23,23,20,0.08)] pb-3 text-[11px] font-mono text-[#96938A]">
                <span>SOURCE PASSAGE</span>
                <span>ILLUSTRATIVE &bull; NOT LEGAL TEXT</span>
              </div>

              <blockquote tabIndex={0} className="evidence-passage text-xs sm:text-sm text-[#171714] font-serif leading-relaxed p-4 rounded-xl bg-[#EFEEE7] border-l-2 border-[#557D6B]">
                A source sets out 
                <mark className="evidence-highlight text-[#557D6B] px-1 py-0.5 rounded font-semibold">
                  the activities and conditions covered by a requirement
                </mark>{" "}
                so you can see how it relates to your business.
              </blockquote>

              <div className="flex flex-wrap gap-3 items-center justify-between text-[11px] font-mono text-[#6F6D66]">
                <span>SOURCE &bull; VERSION &bull; EFFECTIVE DATE</span>
                <span>EXAMPLE SOURCE METADATA</span>
              </div>
            </div>

            {/* Synthesized User Action Item */}
            <div
              ref={actionRef}
              className="rounded-[28px] bg-[#DCEAE2]/60 border border-[#7FAF9A]/60 p-7 sm:p-8 space-y-4"
            >
              <div className="flex flex-wrap gap-3 items-center justify-between text-xs font-mono">
                <span className="text-[#557D6B] font-bold flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  NEXT STEP
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-[#557D6B] text-white text-[10px]">
                  NEEDS ATTENTION
                </span>
              </div>

              <div className="space-y-1.5 text-xs font-sans">
                <h3 className="font-serif text-lg text-[#171714]">
                  Review the requirement and gather the supporting document
                </h3>
                <p className="text-[#6F6D66] font-light leading-relaxed">
                  Keep the source and reason with the task, so your team can review the basis before acting.
                </p>
              </div>

              <div className="pt-2 border-t border-[#7FAF9A]/30 flex flex-wrap gap-3 items-center justify-between text-[11px] font-mono text-[#557D6B]">
                <span>OWNER: YOUR COMPLIANCE TEAM</span>
                <span className="font-semibold">OPEN IN WORKSPACE &rarr;</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default EvidenceStoryScene;
