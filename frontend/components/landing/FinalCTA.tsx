"use client";

import React, { useRef, useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";

interface FinalCTAProps {
  onRequestDemo: () => void;
}

export function FinalCTA({ onRequestDemo }: FinalCTAProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const [badgeVisible, setBadgeVisible] = useState(false);
  const [headingVisible, setHeadingVisible] = useState(false);
  const [copyVisible, setCopyVisible] = useState(false);
  const [ctaVisible, setCtaVisible] = useState(false);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setBadgeVisible(true);
          setTimeout(() => setHeadingVisible(true), 150);
          setTimeout(() => setCopyVisible(true), 350);
          setTimeout(() => setCtaVisible(true), 550);
          io.unobserve(section);
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -50px 0px" }
    );
    io.observe(section);
    return () => io.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="py-24 md:py-36 bg-[#0A0D10] text-[#F4F6F5] relative overflow-hidden">
      {/* Subtle background treatment */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 opacity-[0.025]" style={{ backgroundImage: `radial-gradient(rgba(255,255,255,0.5) 1px, transparent 1px)`, backgroundSize: "28px 28px" }} />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full blur-[120px]"
          style={{ background: "rgba(59,130,246,0.06)" }}
        />
      </div>
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
        {/* Badge */}
        <div
          style={{
            opacity: badgeVisible ? 1 : 0,
            transform: badgeVisible ? "translateY(0)" : "translateY(16px)",
            filter: badgeVisible ? "blur(0)" : "blur(3px)",
            transition: "opacity 0.6s ease, transform 0.6s cubic-bezier(0.16,1,0.3,1), filter 0.6s ease",
          }}
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] px-4 py-1.5 text-xs text-[#B1B8BD] backdrop-blur-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
            <span className="font-mono tracking-wide">BIS Compliance Intelligence Platform</span>
          </div>
        </div>

        {/* Main Heading */}
        <h2
          className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#F4F6F5] max-w-3xl mx-auto leading-[1.08] font-sans"
          style={{
            opacity: headingVisible ? 1 : 0,
            transform: headingVisible ? "translateY(0)" : "translateY(20px)",
            filter: headingVisible ? "blur(0)" : "blur(6px)",
            transition: "opacity 0.75s ease, transform 0.75s cubic-bezier(0.16,1,0.3,1), filter 0.75s ease",
          }}
        >
          Compliance is easier when the right information is connected.
        </h2>

        {/* Supporting copy */}
        <p
          className="text-base sm:text-lg text-[#B1B8BD] max-w-xl mx-auto leading-relaxed font-sans"
          style={{
            opacity: copyVisible ? 1 : 0,
            transform: copyVisible ? "translateY(0)" : "translateY(14px)",
            transition: "opacity 0.65s ease, transform 0.65s cubic-bezier(0.16,1,0.3,1)",
          }}
        >
          ComplyWise brings standards, requirements, documents and regulatory intelligence into one calm, operational workspace.
        </p>

        {/* CTAs */}
        <div
          className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4"
          style={{
            opacity: ctaVisible ? 1 : 0,
            transform: ctaVisible ? "translateY(0)" : "translateY(12px)",
            transition: "opacity 0.65s ease, transform 0.65s cubic-bezier(0.16,1,0.3,1)",
          }}
        >
          <button
            onClick={onRequestDemo}
            type="button"
            className="btn-shimmer inline-flex items-center gap-2 rounded-xl bg-white hover:bg-slate-100 text-[#06080A] px-8 py-4 text-sm font-semibold shadow-[0_4px_20px_rgba(255,255,255,0.2)] transition-all duration-200 hover:scale-[1.03] hover:-translate-y-px active:scale-[0.98] cursor-pointer"
          >
            <span>Request a Demo</span>
            <ArrowRight className="h-4 w-4" />
          </button>

          <a
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-xl border border-white/[0.12] bg-white/[0.04] hover:bg-white/[0.08] text-[#E5E9E8] hover:text-white px-8 py-4 text-sm font-semibold transition-all duration-200 hover:scale-[1.02] hover:-translate-y-px backdrop-blur-sm"
          >
            <span>Launch Live Dashboard</span>
          </a>
        </div>

        <p
          className="text-[12px] text-[#7E878E] pt-1 font-mono"
          style={{
            opacity: ctaVisible ? 1 : 0,
            transition: "opacity 0.5s 0.3s ease",
          }}
        >
          Welcoming select industrial manufacturing and conformity testing teams for early evaluation.
        </p>
      </div>
    </section>
  );
}

export default FinalCTA;
