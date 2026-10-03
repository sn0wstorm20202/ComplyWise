"use client";

import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export function ManifestoSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const textRef = useRef<HTMLParagraphElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (!textRef.current) return;

      const words = textRef.current.querySelectorAll(".manifesto-word");

      gsap.fromTo(
        words,
        {
          opacity: 0.12,
          color: "#96938A",
        },
        {
          opacity: 1,
          color: "#171714",
          stagger: 0.05,
          ease: "none",
          scrollTrigger: {
            trigger: textRef.current,
            start: "top 75%",
            end: "bottom 35%",
            scrub: 1.2,
          },
        }
      );

      // Section header entrance
      if (headerRef.current) {
        gsap.from(headerRef.current, {
          y: 30,
          opacity: 0,
          duration: 0.8,
          ease: "power2.out",
          scrollTrigger: {
            trigger: headerRef.current,
            start: "top 85%",
            once: true,
          },
        });
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const statementWords = [
    { text: "Compliance", highlight: false },
    { text: "should", highlight: false },
    { text: "not", highlight: false },
    { text: "be", highlight: false },
    { text: "a", highlight: false },
    { text: "scavenger", highlight: false },
    { text: "hunt.", highlight: false },
    { text: "Every", highlight: false },
    { text: "business", highlight: false },
    { text: "is", highlight: false },
    { text: "different.", highlight: false },
    { text: "Your", highlight: false },
    { text: "regulatory", highlight: false },
    { text: "posture", highlight: false },
    { text: "should", highlight: false },
    { text: "be", highlight: false },
    { text: "too.", highlight: false },
    { text: "The", highlight: false },
    { text: "rules", highlight: true },
    { text: "decide.", highlight: true },
    { text: "The", highlight: false },
    { text: "AI", highlight: true },
    { text: "explains.", highlight: true },
  ];

  return (
    <section
      ref={sectionRef}
      id="manifesto"
      className="relative py-32 md:py-48 bg-[#F7F5EF] border-t border-[rgba(23,23,20,0.06)] overflow-hidden"
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Section Annotation */}
        <div
          ref={headerRef}
          className="flex items-center gap-3 text-[11px] font-mono uppercase tracking-[0.2em] text-[#96938A]"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-[#7FAF9A]" />
          <span>01 &mdash; PHILOSOPHY &amp; ARCHITECTURE</span>
        </div>

        {/* Signature Progressive Word Scrubbing */}
        <p
          ref={textRef}
          className="font-serif text-[clamp(2rem,5.2vw,4.5rem)] text-[#171714] leading-[1.2] tracking-[-0.02em] font-normal"
        >
          {statementWords.map((word, idx) => (
            <span
              key={idx}
              className={`manifesto-word inline-block mr-[0.25em] transition-colors ${
                word.highlight ? "italic font-normal text-[#557D6B]" : ""
              }`}
            >
              {word.text}{" "}
            </span>
          ))}
        </p>

        {/* Editorial Footnote */}
        <div className="pt-6 border-t border-[rgba(23,23,20,0.08)] flex flex-wrap items-center justify-between gap-4 text-xs font-mono text-[#6F6D66]">
          <div>PRINCIPLE: ZERO HALLUCINATION &bull; DETERMINISTIC APPLICABILITY</div>
          <div>INSPECTION MODEL: SECTION 02 &bull; COMPLIWISE 2026</div>
        </div>
      </div>
    </section>
  );
}

export default ManifestoSection;
