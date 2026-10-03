"use client";

import React, { useRef, useEffect } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

interface FinalCTAProps {
  onSeeWhatApplies?: () => void;
}

export function FinalCTA({ onSeeWhatApplies }: FinalCTAProps) {
  const containerRef = useRef<HTMLElement>(null);
  const circleRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const mm = gsap.matchMedia();
    mm.add({
      desktop: "(min-width: 1280px)",
      compact: "(max-width: 1279px)",
      reduced: "(prefers-reduced-motion: reduce)",
    }, (context) => {
      if (context.conditions?.reduced) return;
      if (headlineRef.current) {
        gsap.from(headlineRef.current, {
          y: 40,
          opacity: 0,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: headlineRef.current,
            start: "top 85%",
            once: true,
          },
        });
      }

      if (circleRef.current) {
        gsap.from(circleRef.current, {
          scale: 0.85,
          opacity: 0,
          duration: 1.2,
          ease: "expo.out",
          scrollTrigger: {
            trigger: circleRef.current,
            start: "top 85%",
            once: true,
          },
        });
      }
    }, containerRef);

    return () => mm.revert();
  }, []);

  return (
    <section
      ref={containerRef}
      className="py-36 md:py-52 bg-[#F7F5EF] border-t border-[rgba(23,23,20,0.06)] relative overflow-hidden text-center"
    >
      {/* Subtle Sage Ambient Radial Aura */}
      <div className="pointer-events-none absolute inset-0 bg-ambient-sage opacity-80" />
      <div className="pointer-events-none absolute bottom-0 inset-x-0 h-40 bg-gradient-to-t from-[#EFEEE7] to-transparent" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-14 relative z-10">
        <div className="space-y-4">
          <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#96938A]">
            06 &mdash; NEXT STEP
          </span>
          <h2
            ref={headlineRef}
            className="text-[clamp(2.5rem,6vw,5.5rem)] font-serif text-[#171714] leading-[1.04] tracking-[-0.02em]"
          >
            Know what applies.{" "}
            <span className="italic font-light text-[#557D6B]">
              Know what to do next.
            </span>
          </h2>
          <p className="text-base text-[#6F6D66] font-light max-w-lg mx-auto">
            Start with your business. See the requirements, the reasons and the next steps together.
          </p>
        </div>

        {/* Signature Circular Expanding Magnetic CTA (design.md Section 21 & Signature 8) */}
        <div ref={circleRef} className="flex justify-center pt-2">
          <Link
            href="/dashboard"
            className="group relative flex h-44 w-44 sm:h-52 sm:w-52 flex-col items-center justify-center rounded-full bg-[#EFEEE7] border border-[rgba(23,23,20,0.12)] p-6 text-center shadow-[0_12px_40px_rgba(23,23,20,0.06)] transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:scale-105 active:scale-95 overflow-hidden"
          >
            {/* Sage circle expansion effect from center */}
            <div className="pointer-events-none absolute inset-0 rounded-full bg-[#557D6B] scale-0 transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-100" />

            {/* Inner Content */}
            <div className="relative z-10 flex flex-col items-center gap-2">
              <span className="font-serif text-lg sm:text-xl text-[#171714] group-hover:text-[#F7F5EF] transition-colors duration-500 leading-tight">
                Explore
                <br />
                Workspace
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#171714] group-hover:bg-[#F7F5EF] text-[#F7F5EF] group-hover:text-[#171714] transition-all duration-500">
                <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
              </div>
            </div>
          </Link>
        </div>

        {/* Secondary Auxiliary Link */}
        <div className="pt-2">
          <button
            onClick={onSeeWhatApplies}
            className="font-mono text-xs uppercase tracking-[0.16em] text-[#6F6D66] hover:text-[#171714] transition-colors underline underline-offset-4 cursor-pointer"
          >
            See what applies to your business &rarr;
          </button>
        </div>
      </div>
    </section>
  );
}

export default FinalCTA;
