"use client";

import React, { useEffect, useRef } from "react";
import { ShieldCheck, FileCheck, ExternalLink, CheckCircle } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export function TrustSection() {
  const containerRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const metadataRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (titleRef.current) {
        gsap.from(titleRef.current, {
          y: 50,
          opacity: 0,
          filter: "blur(6px)",
          duration: 1.1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: titleRef.current,
            start: "top 85%",
            once: true,
          },
        });
      }

      if (cardRef.current) {
        gsap.from(cardRef.current, {
          y: 60,
          opacity: 0,
          duration: 1.2,
          ease: "power3.out",
          scrollTrigger: {
            trigger: cardRef.current,
            start: "top 80%",
            once: true,
          },
        });
      }

      if (metadataRef.current) {
        gsap.from(metadataRef.current.children, {
          y: 20,
          opacity: 0,
          stagger: 0.08,
          duration: 0.7,
          ease: "power2.out",
          scrollTrigger: {
            trigger: metadataRef.current,
            start: "top 88%",
            once: true,
          },
        });
      }
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={containerRef}
      id="trust"
      className="py-32 md:py-48 bg-[#F7F5EF] border-t border-[rgba(23,23,20,0.06)] relative overflow-hidden"
    >
      {/* Subtle Warm Blush Radial Ambient Glow */}
      <div className="pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2 w-[70vw] h-[350px] bg-ambient-warm opacity-50 blur-3xl -z-10" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-20">
        {/* Editorial Trust Statement */}
        <div className="space-y-6 text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-[#96938A] px-3.5 py-1 rounded-full bg-[#EFEEE7] border border-[rgba(23,23,20,0.06)]">
            <ShieldCheck className="h-3.5 w-3.5 text-[#557D6B]" />
            <span>04 &mdash; STATUTORY PROVENANCE MODEL</span>
          </div>

          <h2
            ref={titleRef}
            className="text-[clamp(2.4rem,5.5vw,4.5rem)] font-serif text-[#171714] leading-[1.08] tracking-[-0.02em]"
          >
            AI assists the process.{" "}
            <span className="italic text-[#557D6B] font-light">
              Verified knowledge
            </span>{" "}
            grounds it. Rules determine the outcome.
          </h2>

          <p className="text-base text-[#6F6D66] font-light leading-relaxed max-w-xl mx-auto">
            Statutory compliance cannot tolerate probabilistic guesswork. In
            ComplyWise, every applicability decision is backed by tamper-evident
            gazette clauses and immutable statutory logic.
          </p>
        </div>

        {/* Verification Inspector Card */}
        <div
          ref={cardRef}
          className="rounded-[28px] bg-[#EFEEE7] border border-[rgba(23,23,20,0.08)] p-7 sm:p-10 shadow-[0_20px_60px_rgba(23,23,20,0.04)] space-y-8"
        >
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[rgba(23,23,20,0.08)] pb-6">
            <div className="space-y-1">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#96938A]">
                ACTIVE PROVENANCE INSPECTION
              </span>
              <h3 className="font-serif text-xl sm:text-2xl text-[#171714]">
                Quality Control Order S.O. 1284(E) Clause 4.1
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#DCEAE2] text-[#557D6B] font-mono text-xs font-semibold">
                <CheckCircle className="h-3.5 w-3.5" />
                VERIFIED BY REGULATORY AUDIT ENGINE
              </span>
            </div>
          </div>

          {/* Interactive Clause Citation Content */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm">
            <div className="space-y-3 p-5 rounded-2xl bg-[#F7F5EF] border border-[rgba(23,23,20,0.06)]">
              <span className="font-mono text-[10px] uppercase text-[#96938A] tracking-[0.16em]">
                Statutory Grounding
              </span>
              <p className="font-sans text-xs text-[#171714] leading-relaxed">
                &ldquo;No person shall manufacture, import, distribute, sell, or
                store for sale any goods specified in Column (1) unless they conform
                to Indian Standard IS 3055:2024 and bear the Standard Mark under
                licence from the Bureau of Indian Standards.&rdquo;
              </p>
              <div className="pt-2 flex items-center gap-2 text-[11px] font-mono text-[#557D6B]">
                <FileCheck className="h-3.5 w-3.5" />
                <span>OFFICIAL GAZETTE VOL. LXII ISSUE 14</span>
              </div>
            </div>

            <div className="space-y-3 p-5 rounded-2xl bg-[#F7F5EF] border border-[rgba(23,23,20,0.06)]">
              <span className="font-mono text-[10px] uppercase text-[#96938A] tracking-[0.16em]">
                Deterministic Rule Logic
              </span>
              <div className="font-mono text-xs text-[#171714] bg-[#EFEEE7] p-3 rounded-lg space-y-1">
                <p className="text-[#557D6B] font-semibold">// RULE_IS_3055_QCO</p>
                <p>IF facility_type == &apos;MANUFACTURING&apos;</p>
                <p>AND product_category == &apos;TEMPERATURE_APPARATUS&apos;</p>
                <p>THEN mandate = &apos;BIS_SCHEME_I_MANDATORY&apos;</p>
                <p className="text-[#6F6D66]">// STATUS: DETERMINISTICALLY VERIFIED</p>
              </div>
            </div>
          </div>

          {/* Technical Metadata Row (design.md Section 18) */}
          <div
            ref={metadataRef}
            className="grid grid-cols-2 sm:grid-cols-5 gap-4 pt-6 border-t border-[rgba(23,23,20,0.08)]"
          >
            <div>
              <span className="block font-mono text-[9px] uppercase tracking-[0.16em] text-[#96938A]">
                SOURCE
              </span>
              <span className="font-mono text-xs text-[#171714] font-medium">
                BIS / DPIIT
              </span>
            </div>
            <div>
              <span className="block font-mono text-[9px] uppercase tracking-[0.16em] text-[#96938A]">
                VERSION
              </span>
              <span className="font-mono text-xs text-[#171714] font-medium">
                2026.4 REV 2
              </span>
            </div>
            <div>
              <span className="block font-mono text-[9px] uppercase tracking-[0.16em] text-[#96938A]">
                JURISDICTION
              </span>
              <span className="font-mono text-xs text-[#171714] font-medium">
                CENTRAL + MH
              </span>
            </div>
            <div>
              <span className="block font-mono text-[9px] uppercase tracking-[0.16em] text-[#96938A]">
                EFFECTIVE DATE
              </span>
              <span className="font-mono text-xs text-[#171714] font-medium">
                2026-04-01
              </span>
            </div>
            <div>
              <span className="block font-mono text-[9px] uppercase tracking-[0.16em] text-[#96938A]">
                VERIFICATION
              </span>
              <span className="font-mono text-xs text-[#557D6B] font-medium">
                CERTIFIED IMMUTABLE
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default TrustSection;
