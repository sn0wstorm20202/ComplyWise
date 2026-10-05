"use client";

import React, { useEffect, useRef, useState } from "react";
import { HelpCircle, GitBranch, Check, Sparkles } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export function AdaptiveQuestionScene() {
  const containerRef = useRef<HTMLElement>(null);
  const leftColRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const questionBoxRef = useRef<HTMLDivElement>(null);
  const answerPillRef = useRef<HTMLDivElement>(null);
  const branchUpdateRef = useRef<HTMLDivElement>(null);

  const [answerSelected, setAnswerSelected] = useState(false);

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

      // Question appears first
      tl.fromTo(
        questionBoxRef.current,
        { scale: 0.95, opacity: 0.4 },
        { scale: 1, opacity: 1, duration: 0.8, ease: "power2.out" }
      )
        // User answer "₹18 Cr" locks into position
        .fromTo(
          answerPillRef.current,
          { scale: 0.85, opacity: 0, y: 15 },
          { scale: 1, opacity: 1, y: 0, duration: 0.8, ease: "expo.out" }
        )
        // Rule path updates: branches re-route
        .fromTo(
          branchUpdateRef.current,
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" }
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
          {/* Left Column: Narrative Headline */}
          <div ref={leftColRef} className="lg:col-span-5 space-y-5">
            <div className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-[#96938A] px-3 py-1 rounded-full bg-[#EFEEE7] border border-[rgba(23,23,20,0.06)]">
              <HelpCircle className="h-3.5 w-3.5 text-[#557D6B]" />
              <span>CHAPTER 02 &bull; ADAPTIVE QUESTION</span>
            </div>

            <h2 className="text-[clamp(2.2rem,4.5vw,3.8rem)] font-serif text-[#171714] leading-[1.08] tracking-[-0.02em]">
              Only answer what <span className="italic font-light text-[#557D6B]">changes the answer.</span>
            </h2>

            <p className="text-base text-[#6F6D66] font-light leading-relaxed">
              When an important detail is missing, ComplyWise asks for it. Nothing more.
            </p>

            <div className="pt-4 flex items-center gap-3 text-xs font-mono text-[#557D6B]">
              <GitBranch className="h-4 w-4" />
              <span>ASK ONLY WHAT MATTERS</span>
            </div>
          </div>

          {/* Right Column: Visual Adaptive Question Card */}
          <div className="lg:col-span-7">
            <div
              ref={cardRef}
              className="rounded-[32px] bg-[#EFEEE7] border border-[rgba(23,23,20,0.1)] p-8 sm:p-10 shadow-[0_24px_70px_rgba(23,23,20,0.05)] space-y-8"
            >
              <div className="flex flex-wrap gap-3 items-center justify-between border-b border-[rgba(23,23,20,0.08)] pb-4">
                <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-[#6F6D66]">
                  ONE QUESTION
                </span>
                <span className="font-mono text-[10px] text-[#96938A]">
                  ILLUSTRATIVE ANSWER
                </span>
              </div>

              {/* Question Box */}
              <div
                ref={questionBoxRef}
                className="p-6 rounded-2xl bg-[#F7F5EF] border border-[rgba(23,23,20,0.08)] space-y-4"
              >
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#557D6B]" />
                  <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#96938A]">
                    WHY WE ARE ASKING
                  </span>
                </div>
                <h3 className="font-serif text-2xl text-[#171714]">
                  &ldquo;What is your annual turnover?&rdquo;
                </h3>
                <p className="text-xs text-[#6F6D66] leading-relaxed">This detail can change the requirements we show you.</p>
              </div>

              {/* Answer Lock-in */}
              <div
                ref={answerPillRef}
                className={`answer-story-card flex flex-wrap gap-3 items-center justify-between p-4 rounded-xl border text-[#557D6B] ${answerSelected ? "is-selected bg-[#DCEAE2] border-[#7FAF9A]/50" : "bg-[#F7F5EF] border-[rgba(23,23,20,0.08)]"}`}
              >
                <div className="flex items-center gap-3">
                  <div className="h-6 w-6 rounded-full bg-[#557D6B] text-white flex items-center justify-center">
                    <Check className="h-3.5 w-3.5" />
                  </div>
                  <button type="button" className="font-mono text-sm font-semibold min-h-11 px-2" aria-pressed={answerSelected} onClick={() => setAnswerSelected(!answerSelected)}>
                    {answerSelected ? "₹18 Cr · Selected" : "Select example: ₹18 Cr"}
                  </button>
                </div>
                <span className="font-mono text-xs uppercase tracking-wider text-[#557D6B]/80">
                  {answerSelected ? "ANSWER SELECTED" : "EXAMPLE ANSWER"}
                </span>
              </div>

              <div className={`answer-connector ${answerSelected ? "is-selected" : ""}`} aria-hidden="true"><span /></div>
              {/* Rule Path Update Visualization */}
              <div
                ref={branchUpdateRef}
                className="p-5 rounded-2xl bg-[#F7F5EF] border border-[rgba(23,23,20,0.08)] space-y-3"
              >
                <div className="flex flex-wrap gap-3 items-center justify-between text-xs font-mono">
                  <span className="text-[#96938A] uppercase">REQUIREMENTS TO CHECK</span>
                  <span className="text-[#557D6B] font-semibold flex items-center gap-1.5">
                    <Sparkles className="h-3 w-3" />
                    {answerSelected ? "DETAIL ADDED" : "AFTER YOU ANSWER"}
                  </span>
                </div>

                <div className="space-y-2 text-xs font-mono">
                  <div className="flex flex-wrap gap-3 items-center justify-between p-2.5 rounded-lg bg-[rgba(23,23,20,0.03)] text-[#96938A] line-through">
                    <span>REQUIREMENTS THAT DO NOT MATCH</span>
                    <span>SET ASIDE</span>
                  </div>
                  <div className="flex flex-wrap gap-3 items-center justify-between p-2.5 rounded-lg bg-[#E7EEE9] text-[#171714] font-medium border border-[#7FAF9A]/40">
                    <span>REQUIREMENTS THAT MATCH YOUR DETAILS</span>
                    <span className="text-[#557D6B] font-bold">CHECK NEXT</span>
                  </div>
                </div>

                <p className="text-[11px] text-[#6F6D66] font-light leading-relaxed pt-1">
                  This detail can change the requirements we show you. The next check uses your updated business details.
                </p>
              </div>

              <div className="pt-2 border-t border-[rgba(23,23,20,0.06)] flex flex-wrap gap-3 items-center justify-between text-[11px] font-mono text-[#96938A]">
                <span>STATUS: BUSINESS DETAILS UPDATED</span>
                <span>STEP 02 OF 07</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default AdaptiveQuestionScene;
