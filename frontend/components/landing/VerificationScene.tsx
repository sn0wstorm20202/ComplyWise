"use client";

import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CheckCircle2, ShieldCheck, UserCheck, Eye, Layers } from "lucide-react";

export function VerificationScene() {
  const sectionRef = useRef<HTMLElement>(null);
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const tl = gsap.timeline({ scrollTrigger: { trigger: sectionRef.current, start: "top 70%", once: true } });
      tl.fromTo(".verification-step", { opacity: 0.4, y: 8 }, { opacity: 1, y: 0, backgroundColor: "#EDF4F0", stagger: 0.2, duration: 0.4 })
        .fromTo(".verification-link", { strokeDashoffset: 100 }, { strokeDashoffset: 0, duration: 0.4, stagger: 0.2 }, 0);
    }, sectionRef);
    return () => mm.revert();
  }, []);
  const steps = [
    {
      num: "01",
      title: "Source",
      desc: "Start with the original government source.",
      icon: Eye,
    },
    {
      num: "02",
      title: "Review",
      desc: "Review the relevant passage and its scope.",
      icon: Layers,
    },
    {
      num: "03",
      title: "Verify",
      desc: "Check conditions, dates and exceptions.",
      icon: UserCheck,
    },
    {
      num: "04",
      title: "Publish",
      desc: "Keep the reviewed version available.",
      icon: ShieldCheck,
    },
    {
      num: "05",
      title: "Apply",
      desc: "Check the rule against business details.",
      icon: CheckCircle2,
    },
  ];

  const reviewChecklist = [
    "Source linked",
    "Version checked",
    "Effective date reviewed",
    "Verification status visible",
  ];

  return (
    <section
      ref={sectionRef}
      id="verification"
      className="py-28 md:py-36 bg-[#EFEEE7] border-t border-[rgba(23,23,20,0.06)]"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Editorial Subheader */}
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-[#96938A] px-3.5 py-1 rounded-full bg-[#F7F5EF] border border-[rgba(23,23,20,0.06)]">
            <ShieldCheck className="h-3.5 w-3.5 text-[#557D6B]" />
            <span>HOW WE CHECK SOURCES</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-serif text-[#171714]">
              Built to be clear about <span className="italic font-light text-[#557D6B]">what we know.</span>
            </h2>

          <p className="text-sm sm:text-base text-[#6F6D66] font-light leading-relaxed">
              Sources are reviewed, versions are tracked, and the basis for a result remains visible.
            </p>
        </div>

        {/* 5-Step Pipeline Grid */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div
                key={idx}
                className="verification-step p-5 rounded-2xl bg-[#F7F5EF] border border-[rgba(23,23,20,0.06)] flex flex-col justify-between space-y-4"
              >
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-[#96938A]">{step.num}</span>
                  <Icon className="h-4 w-4 text-[#557D6B]" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="font-serif text-base text-[#171714] leading-snug">
                    {step.title}
                  </h3>
                  <p className="text-xs text-[#6F6D66] font-light leading-relaxed">
                    {step.desc}
                  </p>
                </div>
                <svg viewBox="0 0 100 2" className="w-full h-1" aria-hidden="true"><path className="verification-link" d="M0 1H100" stroke="#7FAF9A" strokeWidth="1" strokeDasharray="100" /></svg>
              </div>
            );
          })}
        </div>

        {/* Verification Standards Checklist */}
        <div className="p-7 rounded-[28px] bg-[#F7F5EF] border border-[rgba(23,23,20,0.08)] space-y-4">
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#96938A] block">
            WHAT STAYS VISIBLE
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono text-[#171714]">
            {reviewChecklist.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-[#557D6B] shrink-0" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default VerificationScene;
