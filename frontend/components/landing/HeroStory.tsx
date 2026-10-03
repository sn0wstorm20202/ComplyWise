"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, ArrowDown, ShieldCheck, Sparkles, HelpCircle } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export function HeroStory() {
  const containerRef = useRef<HTMLElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const tagRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subRef = useRef<HTMLParagraphElement>(null);
  const ctaGroupRef = useRef<HTMLDivElement>(null);
  const livingCardRef = useRef<HTMLDivElement>(null);

  // Transformation states: 0: Raw text -> 1: Canonical facts -> 2: Regulatory landscape -> 3: Missing fact -> 4: Adaptive question
  const [activeStep, setActiveStep] = useState(0);
  const [previewPaused, setPreviewPaused] = useState(false);

  useEffect(() => {
    if (previewPaused) return;
    const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
    let interval: ReturnType<typeof setInterval> | undefined;
    const observer = new IntersectionObserver(([entry]) => {
      clearInterval(interval);
      if (entry.isIntersecting && !motionPreference.matches) interval = setInterval(() => setActiveStep((prev) => {
        if (prev >= 3) clearInterval(interval);
        return Math.min(prev + 1, 4);
      }), 3800);
    });
    if (livingCardRef.current) observer.observe(livingCardRef.current);
    const stopOnReducedMotion = () => { if (motionPreference.matches) clearInterval(interval); };
    motionPreference.addEventListener("change", stopOnReducedMotion);
    return () => { observer.disconnect(); clearInterval(interval); motionPreference.removeEventListener("change", stopOnReducedMotion); };
  }, [previewPaused]);

  useEffect(() => {
    const mm = gsap.matchMedia();
    mm.add({ motion: "(prefers-reduced-motion: no-preference)", reduced: "(prefers-reduced-motion: reduce)" }, (context) => {
      if (context.conditions?.reduced) return;
      const tl = gsap.timeline({ defaults: { ease: "expo.out" } });

      tl.fromTo(
        tagRef.current,
        { y: 20, opacity: 0, filter: "blur(6px)" },
        { y: 0, opacity: 1, filter: "blur(0px)", duration: 0.9, delay: 0.2 }
      )
        .fromTo(
          titleRef.current?.querySelectorAll(".hero-line-text") || [],
          { yPercent: 105, opacity: 0 },
          { yPercent: 0, opacity: 1, duration: 1.1, stagger: 0.13 },
          "-=0.6"
        )
        .fromTo(
          subRef.current,
          { y: 25, opacity: 0, filter: "blur(4px)" },
          { y: 0, opacity: 1, filter: "blur(0px)", duration: 1.0 },
          "-=0.8"
        )
        .fromTo(
          ctaGroupRef.current,
          { y: 20, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.8 },
          "-=0.7"
        )
        .fromTo(
          livingCardRef.current,
          { scale: 0.93, opacity: 0, y: 40 },
          { scale: 1, opacity: 1, y: 0, duration: 1.4, ease: "expo.out" },
          "-=0.6"
        );

      const pointerMedia = gsap.matchMedia();
      pointerMedia.add("(min-width: 1280px) and (pointer: fine)", () => {
        const hero = containerRef.current;
        if (!hero || !glowRef.current) return;
        const nodes = hero.querySelectorAll(".constellation-node");
        const constellation = hero.querySelector(".hero-constellation");
        gsap.to(nodes, { y: 2, x: -1, duration: 7, stagger: 0.4, repeat: -1, yoyo: true, ease: "sine.inOut" });
        gsap.to(constellation, { y: -12, opacity: 0.15, scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: 1 } });
        const glowX = gsap.quickTo(glowRef.current, "x", { duration: 1.2, ease: "power2.out" });
        const glowY = gsap.quickTo(glowRef.current, "y", { duration: 1.2, ease: "power2.out" });
        const nodeX = gsap.quickTo(constellation, "x", { duration: 1.4, ease: "power2.out" });
        const handleMouseMove = (e: MouseEvent) => {
          const rect = hero.getBoundingClientRect();
          const x = (e.clientX - rect.left) / rect.width - 0.5;
          glowX(x * 35);
          glowY(((e.clientY - rect.top) / rect.height - 0.5) * 25);
          nodeX(x * 4);
        };
        hero.addEventListener("mousemove", handleMouseMove, { passive: true });
        const observer = new IntersectionObserver(([entry]) => {
          gsap.getTweensOf(nodes).forEach((tween) => entry.isIntersecting ? tween.resume() : tween.pause());
        });
        observer.observe(hero);
        return () => { hero.removeEventListener("mousemove", handleMouseMove); observer.disconnect(); };
      });
      return () => pointerMedia.revert();
    }, containerRef);

    return () => mm.revert();
  }, []);

  return (
    <section
      ref={containerRef}
      id="hero"
      className="relative min-h-screen pt-24 pb-28 md:pt-28 md:pb-36 flex flex-col justify-between overflow-hidden bg-[#F7F5EF]"
    >
      {/* Ambient Visual Field (Sage + Blush + Regulatory Grid) */}
      <div
        ref={glowRef}
        className="pointer-events-none absolute inset-0 bg-ambient-sage opacity-70 will-change-transform"
      />
      <div className="pointer-events-none absolute top-1/4 left-1/2 -translate-x-1/2 w-[80vw] h-[400px] bg-ambient-warm opacity-60" />
      <div className="pointer-events-none absolute inset-0 bg-regulatory-grid opacity-30" />
      <div className="pointer-events-none absolute inset-0 bg-grain" />

      <svg className="hero-constellation pointer-events-none absolute inset-0 h-full w-full opacity-30" viewBox="0 0 1200 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <path d="M100 220L230 390L120 630M230 390L420 200M830 210L990 330L1080 580L880 700" fill="none" stroke="#7FAF9A" strokeWidth="0.7" opacity="0.3" />
        {[[100,220],[230,390],[120,630],[420,200],[830,210],[990,330],[1080,580],[880,700]].map(([x,y], index) => (
          <g className="constellation-node" key={index}>
            <circle cx={x} cy={y} r="18" fill="#7FAF9A" opacity="0.06" />
            <circle cx={x} cy={y} r="3" fill="#7FAF9A" opacity="0.5" />
          </g>
        ))}
      </svg>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        {/* Top Peripheral Metadata Annotations */}
        <div className="hidden md:flex flex-wrap gap-3 items-center justify-between text-[11px] font-mono tracking-[0.16em] uppercase text-[#96938A] pb-4 border-b border-[rgba(23,23,20,0.06)] mb-7">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[#7FAF9A]" />
            <span>CENTRAL GOVERNMENT &bull; MAHARASHTRA JURISDICTION</span>
          </div>
          <div>BUSINESS DETAILS &bull; CLEAR NEXT STEPS</div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-3.5 w-3.5 text-[#557D6B]" />
            <span>EVIDENCE-GROUNDED &bull; VERSIONED</span>
          </div>
        </div>

        {/* Hero Editorial Composition */}
        <div className="text-center max-w-4xl mx-auto space-y-7">
          {/* Eyebrow Status Pill */}
          <div ref={tagRef} className="flex justify-center">
            <div className="inline-flex items-center gap-2 rounded-full px-4 py-1 text-[11px] font-mono uppercase tracking-[0.2em] font-medium bg-[#EFEEE7] border border-[rgba(23,23,20,0.08)] text-[#6F6D66]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#7FAF9A] story-status-dot" />
              <span>Clarity for your business</span>
            </div>
          </div>

          {/* New Preferred Intriguing Headline per design_updated.md Section 6 */}
          <h1
            ref={titleRef}
            className="text-[clamp(2.75rem,7vw,6.2rem)] font-serif font-normal text-[#171714] leading-[1.02] tracking-[-0.03em]"
          >
            <span className="hero-line"><span className="hero-line-text">Behind every</span></span>
            <span className="hero-line"><span className="hero-line-text">business is a</span></span>
            <span className="hero-line"><span className="hero-line-text"><span className="hero-italic italic font-light text-[#557D6B]">rulebook.</span></span></span>
          </h1>

          {/* Supporting Copy */}
          <p
            ref={subRef}
            className="text-[clamp(1rem,1.35vw,1.25rem)] text-[#6F6D66] font-sans leading-relaxed max-w-2xl mx-auto font-light"
          >
            ComplyWise helps you understand what applies to your business — and what to do next.
          </p>

          {/* Action Group */}
          <div
            ref={ctaGroupRef}
            className="flex flex-wrap items-center justify-center gap-4 pt-3"
          >
            <Link
              href="/dashboard"
              className="hero-primary group inline-flex items-center gap-3 rounded-full bg-[#171714] hover:bg-[#557D6B] text-[#F7F5EF] pl-7 pr-2.5 py-3 text-sm font-medium shadow-[0_8px_24px_rgba(23,23,20,0.12)] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98]"
            >
              <span>Explore Workspace</span>
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/15 text-[#F7F5EF] transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:scale-105">
                <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
              </span>
            </Link>

            <a
              href="#story"
              className="hero-secondary group inline-flex items-center gap-2 rounded-full bg-[#EFEEE7] hover:bg-[#E7EEE9] text-[#171714] border border-[rgba(23,23,20,0.12)] px-7 py-3 text-sm font-medium transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] cursor-pointer active:scale-[0.98]"
            >
              <span className="nav-story-link">See How It Works</span>
              <ArrowDown className="h-3.5 w-3.5 text-[#6F6D66]" />
            </a>
          </div>
        </div>

        {/* Living Product Film Preview Card (design_updated.md Section 6.3) */}
        <div ref={livingCardRef} className="mt-16 sm:mt-22 max-w-4xl mx-auto">
          <div className="rounded-[30px] bg-[#EFEEE7] border border-[rgba(23,23,20,0.1)] p-6 sm:p-9 shadow-[0_24px_70px_rgba(23,23,20,0.06)] space-y-6">
            {/* Stage Indicator Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[rgba(23,23,20,0.08)] pb-4">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#7FAF9A]" />
                <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-[#6F6D66]">
                  ILLUSTRATIVE BUSINESS &bull; STEP {activeStep + 1} OF 5
                </span>
              </div>
              <button type="button" onClick={() => { if (previewPaused && activeStep === 4) setActiveStep(0); setPreviewPaused(!previewPaused); }} aria-pressed={previewPaused} className="preview-playback text-xs text-[#6F6D66] min-h-11 px-2">{previewPaused ? "Play preview" : "Pause preview"}</button>
              {/* Stepper Dots */}
              <div className="flex items-center gap-2">
                {[0, 1, 2, 3, 4].map((step) => (
                  <button
                    key={step}
                    onClick={() => { setPreviewPaused(true); setActiveStep(step); }}
                    aria-pressed={activeStep === step}
                    className={`preview-step relative h-2 rounded-full transition-all duration-500 ${
                      activeStep === step
                        ? "w-8 bg-[#557D6B]"
                        : "w-2 bg-[rgba(23,23,20,0.15)] hover:bg-[rgba(23,23,20,0.3)]"
                    }`}
                    aria-label={`Go to step ${step + 1}`}
                  />
                ))}
              </div>
            </div>

            {/* Living Stage Viewport */}
            <div className="min-h-[170px] flex items-center justify-center text-center p-4">
              {activeStep === 0 && (
                <div className="space-y-3 animate-in fade-in zoom-in-95 duration-500">
                  <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#96938A] block">
                    YOUR BUSINESS
                  </span>
                  <blockquote className="font-serif text-2xl sm:text-3xl text-[#171714] leading-relaxed max-w-xl mx-auto">
                    &ldquo;We manufacture temperature-control equipment in Maharashtra.&rdquo;
                  </blockquote>
                </div>
              )}

              {activeStep === 1 && (
                <div className="space-y-4 animate-in fade-in zoom-in-95 duration-500 w-full">
                  <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#96938A] block">
                    BUSINESS DETAILS
                  </span>
                  <div className="flex flex-wrap justify-center gap-3">
                    <span className="px-4 py-2 rounded-full bg-[#F7F5EF] border border-[rgba(23,23,20,0.08)] font-mono text-xs text-[#171714]">
                      LOCATION: MAHARASHTRA
                    </span>
                    <span className="px-4 py-2 rounded-full bg-[#F7F5EF] border border-[rgba(23,23,20,0.08)] font-mono text-xs text-[#171714]">
                      ACTIVITY: MANUFACTURING
                    </span>
                    <span className="px-4 py-2 rounded-full bg-[#F7F5EF] border border-[rgba(23,23,20,0.08)] font-mono text-xs text-[#171714]">
                      PRODUCT: TEMPERATURE EQUIPMENT
                    </span>
                    <span className="px-4 py-2 rounded-full bg-[#F7F5EF] border border-[rgba(23,23,20,0.08)] font-mono text-xs text-[#171714]">
                      SCALE: 84 PEOPLE
                    </span>
                  </div>
                </div>
              )}

              {activeStep === 2 && (
                <div className="space-y-4 animate-in fade-in zoom-in-95 duration-500 w-full">
                  <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#96938A] block">
                    WHAT IS MISSING?
                  </span>
                  <div className="flex flex-wrap justify-center items-center gap-3">
                    <span className="px-3.5 py-1.5 rounded-full bg-[#DCEAE2] text-[#557D6B] font-mono text-xs font-semibold">
                      LOCATION KNOWN
                    </span>
                    <span className="px-3.5 py-1.5 rounded-full bg-[#DCEAE2] text-[#557D6B] font-mono text-xs font-semibold">
                      ACTIVITY KNOWN
                    </span>
                    <span className="px-3.5 py-1.5 rounded-full bg-[#F7F5EF] text-[#96938A] font-mono text-xs opacity-60">
                      TURNOVER NOT PROVIDED
                    </span>
                    <span className="px-3.5 py-1.5 rounded-full bg-[#F7F5EF] text-[#96938A] font-mono text-xs opacity-60">
                      ONE DETAIL TO CHECK
                    </span>
                  </div>
                </div>
              )}

              {activeStep === 3 && (
                <div className="space-y-3 animate-in fade-in zoom-in-95 duration-500">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F1DFDC] text-[#A6625B] font-mono text-xs font-semibold">
                    <HelpCircle className="h-3.5 w-3.5" />
                    <span>ONE QUESTION</span>
                  </div>
                  <h3 className="font-serif text-xl sm:text-2xl text-[#171714]">
                    What is your annual turnover?
                  </h3>
                  <p className="font-sans text-xs text-[#6F6D66] font-light">
                    This detail can change the requirements we show you.
                  </p>
                </div>
              )}

              {activeStep === 4 && (
                <div className="space-y-3 animate-in fade-in zoom-in-95 duration-500">
                  <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#557D6B] block font-semibold">
                    WHAT APPLIES
                  </span>
                  <h3 className="font-serif text-2xl sm:text-3xl text-[#171714]">
                    A result with its source and next step.
                  </h3>
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#DCEAE2] text-[#557D6B] font-mono text-xs font-medium">
                    <Sparkles className="h-3 w-3" />
                    <span>Business details → requirement → next step</span>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Footnote */}
            <div className="pt-3 border-t border-[rgba(23,23,20,0.06)] flex items-center justify-between text-[11px] font-mono text-[#96938A]">
              <span>BUSINESS &rarr; DETAILS &rarr; REQUIREMENTS</span>
              <span>SCROLL TO SEE HOW IT WORKS</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default HeroStory;
