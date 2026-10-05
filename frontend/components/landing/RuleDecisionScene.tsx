"use client";

import React, { useEffect, useRef } from "react";
import { Cpu, CheckCircle2, ShieldCheck } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export function RuleDecisionScene() {
  const containerRef = useRef<HTMLElement>(null);
  const leftColRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const ruleRef = useRef<HTMLDivElement>(null);
  const checkingRef = useRef<HTMLDivElement>(null);
  const decisionBadgeRef = useRef<HTMLDivElement>(null);

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

      // Step 1: Rule logic expression appears
      tl.fromTo(
        ruleRef.current,
        { opacity: 0.4, scale: 0.96 },
        { opacity: 1, scale: 1, duration: 0.7, ease: "power2.out" }
      )
        // Step 2: Evaluation checking parameters tick green
        .fromTo(
          checkingRef.current?.children || [],
          { opacity: 0, x: -8 },
          { opacity: 1, x: 0, stagger: 0.18, duration: 0.35, ease: "power2.out" }
        )
        .fromTo(containerRef.current?.querySelectorAll(".condition-line") || [],
          { scaleX: 0 }, { scaleX: 1, stagger: 0.18, duration: 0.3 }, "<")
        // Step 3: APPLICABLE decision badge resolves
        .fromTo(
          decisionBadgeRef.current,
          { scale: 0.88, opacity: 0 },
          { scale: 1, opacity: 1, duration: 0.9, ease: "expo.out" }
        );
    }, containerRef);

    return () => mm.revert();
  }, []);

  return (
    <section
      ref={containerRef}
      className="min-h-screen py-24 md:py-32 bg-[#F7F5EF] border-t border-[rgba(23,23,20,0.06)] flex items-center"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left Column: Chapter Label & Narrative Heading */}
          <div ref={leftColRef} className="lg:col-span-5 space-y-5">
            <div className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-[#96938A] px-3 py-1 rounded-full bg-[#EFEEE7] border border-[rgba(23,23,20,0.06)]">
              <Cpu className="h-3.5 w-3.5 text-[#557D6B]" />
              <span>CHAPTER 04 &bull; APPLICABILITY</span>
            </div>

            <h2 className="text-[clamp(2.2rem,4.5vw,3.8rem)] font-serif text-[#171714] leading-[1.08] tracking-[-0.02em]">
              See <span className="italic font-light text-[#557D6B]">why it applies.</span>
            </h2>

            <p className="text-base text-[#6F6D66] font-light leading-relaxed">
              Each result is connected to the conditions and source behind it.
            </p>

            <div className="pt-4 flex items-center gap-3 text-xs font-mono text-[#557D6B]">
              <ShieldCheck className="h-4 w-4" />
              <span>RULE CHECK</span>
            </div>
          </div>

          {/* Right Column: Rule-014 Evaluation Card */}
          <div className="lg:col-span-7">
            <div
              ref={cardRef}
              className="rounded-[32px] bg-[#EFEEE7] border border-[rgba(23,23,20,0.1)] p-8 sm:p-10 shadow-[0_24px_70px_rgba(23,23,20,0.05)] space-y-6"
            >
              <div className="flex flex-wrap gap-3 items-center justify-between border-b border-[rgba(23,23,20,0.08)] pb-4">
                <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-[#6F6D66]">
                  EVALUATING RULE-014
                </span>
                <span className="font-mono text-[10px] text-[#96938A]">
                  ILLUSTRATIVE RULE
                </span>
              </div>

              {/* Rule Expression Box */}
              <div
                ref={ruleRef}
                className="p-5 rounded-2xl bg-[#F7F5EF] border border-[rgba(23,23,20,0.08)] font-mono text-xs text-[#171714] space-y-1.5"
              >
                <span className="text-[#557D6B] font-semibold block text-[10px] uppercase tracking-wider">
                  BUSINESS DETAILS &rarr; CONDITIONS &rarr; RESULT
                </span>
                <p>Activity: manufacturing</p>
                <p>Product: temperature-control equipment</p>
                <p>Scale: answer provided</p>
                <p className="text-[#6F6D66]">Check against the requirement and its source</p>
              </div>

              {/* Condition Checklist */}
              <div
                ref={checkingRef}
                className="grid grid-cols-2 gap-3 text-xs font-mono"
              >
                <div className="condition-row p-3.5 rounded-xl bg-[#F7F5EF] flex flex-wrap gap-3 items-center justify-between">
                  <span className="condition-line" aria-hidden="true" /><span className="text-[#6F6D66]">BUSINESS DETAIL</span>
                  <span className="text-[#557D6B] font-bold">✓ Provided</span>
                </div>
                <div className="condition-row p-3.5 rounded-xl bg-[#F7F5EF] flex flex-wrap gap-3 items-center justify-between">
                  <span className="condition-line" aria-hidden="true" /><span className="text-[#6F6D66]">FACILITY MATCH</span>
                  <span className="text-[#557D6B] font-bold">✓ Matched</span>
                </div>
                <div className="condition-row p-3.5 rounded-xl bg-[#F7F5EF] flex flex-wrap gap-3 items-center justify-between">
                  <span className="condition-line" aria-hidden="true" /><span className="text-[#6F6D66]">EXEMPTIONS</span>
                  <span className="text-[#6F6D66] font-bold">✓ Checked</span>
                </div>
                <div className="condition-row p-3.5 rounded-xl bg-[#F7F5EF] flex flex-wrap gap-3 items-center justify-between">
                  <span className="condition-line" aria-hidden="true" /><span className="text-[#6F6D66]">EFFECTIVE DATE</span>
                  <span className="text-[#557D6B] font-bold">✓ Checked</span>
                </div>
              </div>

              {/* Climax Decision Outcome Badge & Source Attribution */}
              <div
                ref={decisionBadgeRef}
                className="p-6 rounded-2xl bg-[#DCEAE2] border border-[#7FAF9A]/60 space-y-3"
              >
                <div className="flex flex-wrap gap-3 items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#557D6B] text-white font-mono text-xs font-semibold">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    APPLICABLE
                  </span>
                  <span className="font-mono text-xs text-[#557D6B] font-semibold">
                    EXAMPLE RESULT
                  </span>
                </div>

                <div className="text-xs font-sans text-[#171714] space-y-1">
                  <p className="font-medium">
                    The business details match the conditions in this illustrative requirement.
                  </p>
                  <p className="text-[11px] text-[#557D6B] font-mono">
                    Source → conditions → result. See the trail below.
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-[rgba(23,23,20,0.06)] flex flex-wrap gap-3 items-center justify-between text-[11px] font-mono text-[#96938A]">
                <span>RESULT: CONNECTED TO ITS SOURCE</span>
                <span>STEP 04 OF 07</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default RuleDecisionScene;
