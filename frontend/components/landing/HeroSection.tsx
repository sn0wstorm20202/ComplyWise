"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowUpRight, ArrowRight, ShieldCheck, Sparkles, Database } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

interface HeroSectionProps {
  onSeeWhatApplies?: () => void;
}

export function HeroSection({ onSeeWhatApplies }: HeroSectionProps) {
  const containerRef = useRef<HTMLElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const tagRef = useRef<HTMLDivElement>(null);
  const line1Ref = useRef<HTMLSpanElement>(null);
  const line2Ref = useRef<HTMLSpanElement>(null);
  const subRef = useRef<HTMLParagraphElement>(null);
  const ctaGroupRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const annotationsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Signature 1: Staggered Hero Reveal with expo.out easing
      const tl = gsap.timeline({ defaults: { ease: "expo.out" } });

      tl.fromTo(
        tagRef.current,
        { y: 24, opacity: 0, filter: "blur(6px)" },
        { y: 0, opacity: 1, filter: "blur(0px)", duration: 0.9, delay: 0.3 }
      )
        .fromTo(
          [line1Ref.current, line2Ref.current],
          { y: 60, opacity: 0, filter: "blur(10px)" },
          { y: 0, opacity: 1, filter: "blur(0px)", duration: 1.4, stagger: 0.18 },
          "-=0.6"
        )
        .fromTo(
          subRef.current,
          { y: 30, opacity: 0, filter: "blur(6px)" },
          { y: 0, opacity: 1, filter: "blur(0px)", duration: 1.1 },
          "-=0.9"
        )
        .fromTo(
          ctaGroupRef.current,
          { y: 25, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.9 },
          "-=0.7"
        )
        .fromTo(
          annotationsRef.current?.children || [],
          { opacity: 0, y: 15 },
          { opacity: 1, y: 0, stagger: 0.1, duration: 0.8 },
          "-=0.6"
        );

      // Hero Interactive Doppelrand Frame Entry & Scroll Parallax
      if (previewRef.current) {
        gsap.fromTo(
          previewRef.current,
          { scale: 0.92, opacity: 0, y: 50, filter: "blur(8px)" },
          {
            scale: 1,
            opacity: 1,
            y: 0,
            filter: "blur(0px)",
            duration: 1.6,
            delay: 0.6,
            ease: "expo.out",
          }
        );

        gsap.to(previewRef.current, {
          y: -50,
          ease: "none",
          scrollTrigger: {
            trigger: previewRef.current,
            start: "top 80%",
            end: "bottom 10%",
            scrub: 1.2,
          },
        });
      }

      // Signature 2: Desktop Subtle Mouse Parallax
      const isDesktop = window.innerWidth >= 1024;
      if (isDesktop && containerRef.current && glowRef.current) {
        const handleMouseMove = (e: MouseEvent) => {
          const { clientX, clientY } = e;
          const xPos = (clientX / window.innerWidth - 0.5) * 40;
          const yPos = (clientY / window.innerHeight - 0.5) * 30;

          gsap.to(glowRef.current, {
            x: xPos,
            y: yPos,
            duration: 1.2,
            ease: "power2.out",
          });
        };

        window.addEventListener("mousemove", handleMouseMove, { passive: true });
        return () => window.removeEventListener("mousemove", handleMouseMove);
      }
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={containerRef}
      className="relative min-h-screen pt-36 pb-28 md:pt-48 md:pb-36 flex flex-col justify-between overflow-hidden bg-[#F7F5EF]"
    >
      {/* Ambient Visual Field (Sage + Blush + Regulatory Grid) */}
      <div
        ref={glowRef}
        className="pointer-events-none absolute inset-0 -z-10 bg-ambient-sage opacity-70 will-change-transform"
      />
      <div className="pointer-events-none absolute top-1/4 left-1/2 -translate-x-1/2 w-[80vw] h-[400px] bg-ambient-warm opacity-60 -z-10" />
      <div className="pointer-events-none absolute inset-0 bg-regulatory-grid opacity-40 -z-10" />
      <div className="pointer-events-none absolute inset-0 bg-grain -z-10" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        {/* Top Peripheral Metadata Annotations */}
        <div
          ref={annotationsRef}
          className="hidden md:flex items-center justify-between text-[11px] font-mono tracking-[0.16em] uppercase text-[#96938A] pb-12 border-b border-[rgba(23,23,20,0.06)] mb-14"
        >
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[#7FAF9A]" />
            <span>CENTRAL GOVERNMENT &bull; MAHARASHTRA JURISDICTION</span>
          </div>
          <div>EST. 2026 &bull; STATUTORY RULE ENGINE</div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-3.5 w-3.5 text-[#557D6B]" />
            <span>ZERO-HALLUCINATION PROVENANCE</span>
          </div>
        </div>

        {/* Hero Editorial Composition */}
        <div className="text-center max-w-4xl mx-auto space-y-8">
          {/* Eyebrow Status Pill */}
          <div ref={tagRef} className="flex justify-center">
            <div className="inline-flex items-center gap-2 rounded-full px-4 py-1 text-[11px] font-mono uppercase tracking-[0.2em] font-medium bg-[#EFEEE7] border border-[rgba(23,23,20,0.08)] text-[#6F6D66]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#7FAF9A] animate-pulse" />
              <span>Deterministic Industrial Intelligence</span>
            </div>
          </div>

          {/* Oversized Editorial Serif Headline */}
          <h1 className="text-[clamp(2.75rem,7vw,6.5rem)] font-serif font-normal text-[#171714] leading-[0.98] tracking-[-0.03em]">
            <span ref={line1Ref} className="block">
              The rules decide.
            </span>
            <span
              ref={line2Ref}
              className="block italic font-light text-[#557D6B]"
            >
              The AI explains.
            </span>
          </h1>

          {/* Calming Narrative Body */}
          <p
            ref={subRef}
            className="text-[clamp(1rem,1.4vw,1.3rem)] text-[#6F6D66] font-sans leading-relaxed max-w-2xl mx-auto font-light"
          >
            ComplyWise maps your business operations directly to mandatory
            Quality Control Orders, factory test schemes, and statutory gazettes.
            Clear, deterministic outcomes without legal ambiguity.
          </p>

          {/* Signature Action Buttons */}
          <div
            ref={ctaGroupRef}
            className="flex flex-wrap items-center justify-center gap-4 pt-3"
          >
            <Link
              href="/dashboard"
              className="group inline-flex items-center gap-3 rounded-full bg-[#171714] hover:bg-[#557D6B] text-[#F7F5EF] pl-7 pr-2.5 py-3 text-sm font-medium shadow-[0_8px_24px_rgba(23,23,20,0.12)] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98]"
            >
              <span>Explore Workspace</span>
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/15 text-[#F7F5EF] transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:scale-105">
                <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
              </span>
            </Link>

            <button
              onClick={onSeeWhatApplies}
              className="inline-flex items-center gap-2 rounded-full bg-[#EFEEE7] hover:bg-[#E7EEE9] text-[#171714] border border-[rgba(23,23,20,0.12)] px-7 py-3 text-sm font-medium transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] cursor-pointer active:scale-[0.98]"
            >
              <span>See What Applies</span>
              <ArrowRight className="h-3.5 w-3.5 text-[#6F6D66]" />
            </button>
          </div>
        </div>

        {/* Signature Doppelrand Live Regulatory Card Preview */}
        <div ref={previewRef} className="mt-16 sm:mt-24 max-w-4xl mx-auto">
          <div className="p-2 sm:p-3 rounded-[32px] bg-[rgba(23,23,20,0.03)] border border-[rgba(23,23,20,0.08)] shadow-[0_32px_80px_rgba(23,23,20,0.07)] backdrop-blur-sm">
            <div className="rounded-[24px] bg-[#EFEEE7] border border-[rgba(23,23,20,0.06)] p-6 sm:p-9 space-y-6">
              {/* Preview Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[rgba(23,23,20,0.08)] pb-5">
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <span className="h-2 w-2 rounded-full bg-[#7FAF9A]" />
                    <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-[#6F6D66]">
                      EVIDENCE-VERIFIED DOSSIER &bull; RULE-014
                    </span>
                  </div>
                  <h3 className="font-serif text-xl sm:text-2xl text-[#171714]">
                    IS 3055:2024 &mdash; Quality Control Order Mandate
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#DCEAE2] text-[#557D6B] font-mono text-[11px] font-medium">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    APPLICABLE
                  </span>
                </div>
              </div>

              {/* Preview Content Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 pt-1">
                <div className="p-4 rounded-[18px] bg-[#F7F5EF] border border-[rgba(23,23,20,0.06)] space-y-1.5">
                  <span className="font-mono text-[10px] uppercase text-[#96938A] tracking-[0.14em]">
                    Statutory Source
                  </span>
                  <p className="font-sans text-xs text-[#171714] font-medium">
                    Gazette of India (Extraordinary) S.O. 1284(E)
                  </p>
                </div>

                <div className="p-4 rounded-[18px] bg-[#F7F5EF] border border-[rgba(23,23,20,0.06)] space-y-1.5">
                  <span className="font-mono text-[10px] uppercase text-[#96938A] tracking-[0.14em]">
                    Testing Mandate
                  </span>
                  <p className="font-sans text-xs text-[#171714] font-medium">
                    Clause 4.1 Metrological Scale &plusmn;0.1&deg;C (NABL Scope)
                  </p>
                </div>

                <div className="p-4 rounded-[18px] bg-[#F7F5EF] border border-[rgba(23,23,20,0.06)] space-y-1.5">
                  <span className="font-mono text-[10px] uppercase text-[#96938A] tracking-[0.14em]">
                    Audit Requirement
                  </span>
                  <p className="font-sans text-xs text-[#171714] font-medium">
                    BIS Scheme I &bull; STI Plant Quality Plan Verified
                  </p>
                </div>
              </div>

              {/* Provenance Footer Bar */}
              <div className="flex flex-wrap items-center justify-between text-[11px] font-mono text-[#6F6D66] pt-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-3.5 w-3.5 text-[#7FAF9A]" />
                  <span>DETERMINISTIC EVALUATION: 100% PROVENANCE CHAIN</span>
                </div>
                <div className="flex items-center gap-2">
                  <Database className="h-3.5 w-3.5 text-[#96938A]" />
                  <span>SYNCED: CENTRAL REPOSITORY 2026.4</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default HeroSection;
