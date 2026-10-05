"use client";

import React, { useEffect, useRef, useState } from "react";
import { Compass, HelpCircle, Layers, ArrowRight } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export function BusinessStoryScene() {
  const containerRef = useRef<HTMLElement>(null);
  const leftColRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const [activeFact, setActiveFact] = useState<string | null>(null);

  // Story step refs
  const stateARef = useRef<HTMLDivElement>(null);
  const stateBRef = useRef<HTMLDivElement>(null);
  const stateCRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mm = gsap.matchMedia();
    mm.add({
      desktop: "(min-width: 1280px)",
      compact: "(max-width: 1279px)",
      reduced: "(prefers-reduced-motion: reduce)",
    }, (context) => {
      const desktop = context.conditions?.desktop;
      if (!desktop || context.conditions?.reduced) {
        if (!context.conditions?.reduced) {
          gsap.from([stateARef.current, stateBRef.current, stateCRef.current], {
            autoAlpha: 0, y: 12, stagger: 0.18, duration: 0.6,
            scrollTrigger: { trigger: cardRef.current, start: "top 85%", once: true },
          });
        }
        return;
      }
      gsap.set([stateBRef.current, stateCRef.current], { autoAlpha: 0 });
      // Pinning the section for smooth scrollytelling transition
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

      // State A visible initially, fades and scales slightly as State B enters
      tl.to(stateARef.current, {
        autoAlpha: 0,
        y: -30,
        duration: 0.6,
        ease: "power2.inOut",
      })
        .fromTo(
          stateBRef.current,
          { autoAlpha: 0, y: 30 },
          { autoAlpha: 1, y: 0, duration: 0.8, ease: "power2.out" },
          "-=0.2"
        )
        .fromTo(containerRef.current?.querySelectorAll(".fact-story-card") || [],
          { y: 10, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.05, duration: 0.3 }, "<0.2")
        .to({}, { duration: 0.5 })
        // State B then highlights the missing variable in State C
        .to(stateBRef.current, {
          autoAlpha: 0,
          y: -25,
          duration: 0.6,
          ease: "power2.inOut",
        })
        .fromTo(
          stateCRef.current,
          { autoAlpha: 0, y: 25 },
          { autoAlpha: 1, y: 0, duration: 0.8, ease: "power2.out" },
          "-=0.2"
        );
    }, containerRef);

    return () => mm.revert();
  }, []);

  return (
    <section
      ref={containerRef}
      id="story"
      className="min-h-screen py-24 md:py-32 bg-[#F7F5EF] border-t border-[rgba(23,23,20,0.06)] flex items-center"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left Column: Chapter Label & Narrative Heading */}
          <div ref={leftColRef} className="lg:col-span-5 space-y-5">
            <div className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-[#96938A] px-3 py-1 rounded-full bg-[#EFEEE7] border border-[rgba(23,23,20,0.06)]">
              <Compass className="h-3.5 w-3.5 text-[#557D6B]" />
              <span>CHAPTER 01 &bull; UNDERSTAND</span>
            </div>

            <h2 className="text-[clamp(2.2rem,4.5vw,3.8rem)] font-serif text-[#171714] leading-[1.08] tracking-[-0.02em]">
              Start with <span className="italic font-light text-[#557D6B]">what you do.</span>
            </h2>

            <p className="text-base text-[#6F6D66] font-light leading-relaxed">
              Tell us about your business in plain language. We turn it into the details that matter for compliance.
            </p>

            <div className="pt-4 flex items-center gap-3 text-xs font-mono text-[#96938A]">
              <Layers className="h-4 w-4 text-[#557D6B]" />
              <span>YOUR DESCRIPTION &rarr; BUSINESS DETAILS</span>
            </div>
          </div>

          {/* Right Column: One Dominant Visual Object with Continuous State Transitions */}
          <div className="lg:col-span-7">
            <div
              ref={cardRef}
              className="business-visual relative min-h-[460px] rounded-[32px] bg-[#EFEEE7] border border-[rgba(23,23,20,0.1)] p-8 sm:p-10 shadow-[0_24px_70px_rgba(23,23,20,0.05)] flex flex-col justify-between overflow-hidden"
            >
              {/* Card Header */}
              <div className="flex flex-wrap gap-3 items-center justify-between border-b border-[rgba(23,23,20,0.08)] pb-4">
                <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.16em] text-[#6F6D66]">
                  <span className="h-2 w-2 rounded-full bg-[#7FAF9A]" />
                  <span>YOUR BUSINESS</span>
                </div>
                <span className="font-mono text-[10px] text-[#96938A] uppercase">
                  ILLUSTRATIVE PROFILE
                </span>
              </div>

              {/* State A: Raw Business Description */}
              <div
                ref={stateARef}
                className="business-state absolute inset-x-8 sm:inset-x-10 top-24 bottom-16 flex flex-col justify-center space-y-4"
              >
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#96938A]">
                  IN YOUR OWN WORDS
                </span>
                <blockquote className="font-serif text-2xl sm:text-3xl text-[#171714] leading-relaxed">
                  &ldquo;We manufacture temperature-control equipment in Maharashtra.
                  We have 84 people across two workshops and operate as a private
                  limited company.&rdquo;
                </blockquote>
                <p className="text-xs text-[#6F6D66] font-light">
                  Start with the details you already know.
                </p>
              </div>

              {/* State B: Canonical Business Facts */}
              <div
                ref={stateBRef}
                className="business-state absolute inset-x-8 sm:inset-x-10 top-24 bottom-16 flex flex-col justify-center space-y-4 "
              >
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#557D6B] font-semibold">
                  BUSINESS DETAILS
                </span>
                <p className="fact-statement text-sm text-[#6F6D66] leading-relaxed">
                  We <span data-active={activeFact === "activity"}>manufacture</span> <span data-active={activeFact === "product"}>temperature-control equipment</span> in <span data-active={activeFact === "location"}>Maharashtra</span>, with <span data-active={activeFact === "scale"}>84 people</span> across two workshops. Our business is <span data-active={activeFact === "type"}>a private limited company</span>.
                </p>
                <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                  <button type="button" aria-pressed={activeFact === "location"} onMouseEnter={() => setActiveFact("location")} onMouseLeave={() => setActiveFact(null)} onFocus={() => setActiveFact("location")} onBlur={() => setActiveFact(null)} onClick={() => setActiveFact(activeFact === "location" ? null : "location")} className="fact-story-card text-left p-3.5 rounded-xl bg-[#F7F5EF] border border-[rgba(23,23,20,0.06)]">
                    <span className="text-[#96938A] block text-[10px]">LOCATION</span>
                    <span className="text-[#171714] font-medium">Maharashtra</span>
                  </button>
                  <button type="button" aria-pressed={activeFact === "type"} onMouseEnter={() => setActiveFact("type")} onMouseLeave={() => setActiveFact(null)} onFocus={() => setActiveFact("type")} onBlur={() => setActiveFact(null)} onClick={() => setActiveFact(activeFact === "type" ? null : "type")} className="fact-story-card text-left p-3.5 rounded-xl bg-[#F7F5EF] border border-[rgba(23,23,20,0.06)]">
                    <span className="text-[#96938A] block text-[10px]">ENTITY TYPE</span>
                    <span className="text-[#171714] font-medium">Private Limited</span>
                  </button>
                  <button type="button" aria-pressed={activeFact === "activity"} onMouseEnter={() => setActiveFact("activity")} onMouseLeave={() => setActiveFact(null)} onFocus={() => setActiveFact("activity")} onBlur={() => setActiveFact(null)} onClick={() => setActiveFact(activeFact === "activity" ? null : "activity")} className="fact-story-card text-left p-3.5 rounded-xl bg-[#F7F5EF] border border-[rgba(23,23,20,0.06)]">
                    <span className="text-[#96938A] block text-[10px]">PRIMARY ACTIVITY</span>
                    <span className="text-[#171714] font-medium">Manufacturing</span>
                  </button>
                  <button type="button" aria-pressed={activeFact === "product"} onMouseEnter={() => setActiveFact("product")} onMouseLeave={() => setActiveFact(null)} onFocus={() => setActiveFact("product")} onBlur={() => setActiveFact(null)} onClick={() => setActiveFact(activeFact === "product" ? null : "product")} className="fact-story-card text-left p-3.5 rounded-xl bg-[#F7F5EF] border border-[rgba(23,23,20,0.06)]">
                    <span className="text-[#96938A] block text-[10px]">PRODUCT SCOPE</span>
                    <span className="text-[#171714] font-medium">Temperature Apparatus</span>
                  </button>
                  <button type="button" aria-pressed={activeFact === "scale"} onMouseEnter={() => setActiveFact("scale")} onMouseLeave={() => setActiveFact(null)} onFocus={() => setActiveFact("scale")} onBlur={() => setActiveFact(null)} onClick={() => setActiveFact(activeFact === "scale" ? null : "scale")} className="fact-story-card text-left p-3.5 rounded-xl bg-[#F7F5EF] border border-[rgba(23,23,20,0.06)]">
                    <span className="text-[#96938A] block text-[10px]">WORKFORCE</span>
                    <span className="text-[#171714] font-medium">84 people</span>
                  </button>
                  <button type="button" aria-pressed={activeFact === "missing"} onMouseEnter={() => setActiveFact("missing")} onMouseLeave={() => setActiveFact(null)} onFocus={() => setActiveFact("missing")} onBlur={() => setActiveFact(null)} onClick={() => setActiveFact(activeFact === "missing" ? null : "missing")} className="fact-story-card text-left p-3.5 rounded-xl bg-[#F1DFDC] border border-[#D9AAA5]/50">
                    <span className="text-[#A6625B] block text-[10px]">ANNUAL TURNOVER</span>
                    <span className="text-[#A6625B] font-bold">MISSING (?)</span>
                  </button>
                </div>
              </div>

              {/* State C: Decision-Critical Unknown */}
              <div
                ref={stateCRef}
                className="business-state absolute inset-x-8 sm:inset-x-10 top-24 bottom-16 flex flex-col justify-center space-y-5 "
              >
                <div tabIndex={0} className="missing-story-fact inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F1DFDC] text-[#A6625B] font-mono text-xs font-semibold w-max">
                  <HelpCircle className="h-3.5 w-3.5" />
                  <span>WE NEED ONE MORE DETAIL</span>
                </div>
                <h3 className="font-serif text-2xl sm:text-3xl text-[#171714]">
                  One missing detail could change what applies.
                </h3>
                <p className="text-xs text-[#6F6D66] font-light leading-relaxed">
                  We ask for your annual turnover before checking the requirements that depend on it.
                </p>
                <div className="flex items-center gap-2 text-xs font-mono text-[#557D6B]">
                  <span>ONE QUESTION NEXT</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </div>
              </div>

              {/* Card Footer Bar */}
              <div className="pt-4 border-t border-[rgba(23,23,20,0.06)] flex flex-wrap gap-3 items-center justify-between text-[11px] font-mono text-[#96938A]">
                <span>BUSINESS DETAILS &rarr; ONE QUESTION</span>
                <span>STEP 01 OF 07</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default BusinessStoryScene;
