"use client";

import React, { useEffect, useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ChevronRight } from "lucide-react";
import HeroProductPreview from "./HeroProductPreview";

interface HeroSectionProps {
  onRequestDemo: () => void;
}

export function HeroSection({ onRequestDemo }: HeroSectionProps) {
  const [entered, setEntered] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Trigger smooth entrance sequence after mount
    const t = setTimeout(() => setEntered(true), 60);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    // Very subtle scroll parallax
    const handleScroll = () => {
      if (window.scrollY < 1200) {
        setScrollY(window.scrollY);
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="relative bg-[#06080A] text-slate-100">
      {/* ═════════════════════════════════════════════════════════════════ */}
      {/* HERO SECTION                                                      */}
      {/* ═════════════════════════════════════════════════════════════════ */}
      <section
        ref={heroRef}
        className="relative overflow-hidden w-full pt-16 pb-16 sm:pt-20 sm:pb-20 lg:pt-24 lg:pb-24 min-h-[80vh] flex items-center"
      >
        {/* ── Real Document Photograph Layer (Right 48-50%) ── */}
        <div
          className="absolute right-0 top-0 bottom-0 w-full lg:w-[50%] xl:w-[48%] pointer-events-none select-none overflow-hidden z-0"
          style={{
            opacity: entered ? 0.58 : 0,
            transform: `translateY(${scrollY * 0.12}px) scale(${entered ? 1 : 1.02})`,
            transition:
              "opacity 1.2s cubic-bezier(0.16, 1, 0.3, 1), transform 0.1s ease-out",
          }}
        >
          <div className="relative w-full h-full">
            <Image
              src="/assets/landing/photos/hero.jpg"
              alt="Physical regulatory documents and statutory dossiers"
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover object-[center_30%]"
              style={{
                filter: "brightness(1.08) contrast(1.05) saturate(1.0)",
              }}
            />

            {/* Strong fade toward the LEFT so headline and text remain 100% readable */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(to right, #06080A 0%, rgba(6,8,10,0.96) 14%, rgba(6,8,10,0.68) 32%, rgba(6,8,10,0.18) 55%, transparent 80%)",
              }}
            />

            {/* Soft fade toward top */}
            <div
              className="absolute inset-x-0 top-0 h-28"
              style={{
                background:
                  "linear-gradient(to bottom, #06080A 0%, transparent 100%)",
              }}
            />

            {/* Soft fade toward bottom (end of hero) */}
            <div
              className="absolute inset-x-0 bottom-0 h-32"
              style={{
                background:
                  "linear-gradient(to top, #06080A 0%, transparent 100%)",
              }}
            />

            {/* Soft fade toward right outer edge */}
            <div
              className="absolute inset-y-0 right-0 w-16"
              style={{
                background:
                  "linear-gradient(to left, #06080A 0%, transparent 100%)",
              }}
            />
          </div>
        </div>

        {/* Hero Content Grid */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left Column: Editorial Information & Actions */}
            <div className="lg:col-span-6 xl:col-span-6 space-y-7 text-left">
              {/* Regulatory Status Eyebrow */}
              <div
                style={{
                  opacity: entered ? 1 : 0,
                  transform: entered ? "translateY(0)" : "translateY(16px)",
                  filter: entered ? "blur(0px)" : "blur(4px)",
                  transition:
                    "opacity 0.7s 0.1s ease, transform 0.7s 0.1s cubic-bezier(0.16,1,0.3,1), filter 0.7s 0.1s ease",
                }}
                className="inline-flex items-center gap-2.5 rounded-full border border-white/10 bg-[#101419]/90 px-3.5 py-1.5 text-xs text-slate-300 shadow-xl backdrop-blur-md"
              >
                <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse" />
                <span className="font-mono text-[11px] uppercase tracking-wider text-slate-300 font-semibold">
                  BIS COMPLIANCE INTELLIGENCE
                </span>
                <span className="text-white/20">|</span>
                <span className="text-[11px] font-mono text-slate-400 hidden sm:inline">
                  QCOs &amp; Statutory Dossiers
                </span>
              </div>

              {/* Main Cinematic Headline */}
              <div className="space-y-3">
                <h1
                  className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-[1.08] font-sans"
                  style={{
                    opacity: entered ? 1 : 0,
                    transform: entered ? "translateY(0)" : "translateY(28px)",
                    filter: entered ? "blur(0px)" : "blur(6px)",
                    transition:
                      "opacity 0.85s 0.22s cubic-bezier(0.16,1,0.3,1), transform 0.85s 0.22s cubic-bezier(0.16,1,0.3,1), filter 0.85s 0.22s ease",
                  }}
                >
                  Stay ahead of <br className="hidden sm:inline" />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-slate-400">
                    compliance.
                  </span>
                </h1>
                <p
                  className="text-xl sm:text-2xl lg:text-3xl font-medium text-slate-300/90 tracking-tight font-sans"
                  style={{
                    opacity: entered ? 1 : 0,
                    transform: entered ? "translateY(0)" : "translateY(20px)",
                    transition:
                      "opacity 0.8s 0.38s ease, transform 0.8s 0.38s cubic-bezier(0.16,1,0.3,1)",
                  }}
                >
                  Understand what applies. Act with confidence.
                </p>
              </div>

              {/* Grounded Product Copy */}
              <p
                className="text-sm sm:text-base text-slate-400 leading-relaxed max-w-xl font-normal font-sans"
                style={{
                  opacity: entered ? 1 : 0,
                  transform: entered ? "translateY(0)" : "translateY(16px)",
                  transition:
                    "opacity 0.8s 0.52s ease, transform 0.8s 0.52s cubic-bezier(0.16,1,0.3,1)",
                }}
              >
                ComplyWise unifies BIS standards, statutory requirements, laboratory dossiers, and regulatory gazettes into one calm, connected operational workspace.
              </p>

              {/* Editorial Metadata Signals */}
              <div
                className="grid grid-cols-3 gap-3 pt-1 border-t border-white/[0.08] max-w-lg text-[11px] font-mono"
                style={{
                  opacity: entered ? 1 : 0,
                  transition: "opacity 0.8s 0.64s ease",
                }}
              >
                <div className="space-y-0.5">
                  <span className="text-slate-400 uppercase text-[10px] block font-semibold">
                    STANDARDS
                  </span>
                  <span className="text-white font-medium">Mandatory IS</span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-slate-400 uppercase text-[10px] block font-semibold">
                    ENGINE
                  </span>
                  <span className="text-white font-medium">Deterministic</span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-slate-400 uppercase text-[10px] block font-semibold">
                    PROVENANCE
                  </span>
                  <span className="text-white font-medium">NABL &amp; Gazette</span>
                </div>
              </div>

              {/* Primary Action Row */}
              <div
                className="flex flex-wrap items-center gap-3.5 pt-2"
                style={{
                  opacity: entered ? 1 : 0,
                  transform: entered ? "translateY(0)" : "translateY(12px)",
                  transition:
                    "opacity 0.8s 0.78s ease, transform 0.8s 0.78s cubic-bezier(0.16,1,0.3,1)",
                }}
              >
                <Link
                  href="/dashboard"
                  className="btn-shimmer relative inline-flex items-center gap-2 rounded-xl bg-white hover:bg-slate-100 text-[#06080A] px-6 py-3.5 text-xs sm:text-sm font-semibold shadow-[0_4px_20px_rgba(255,255,255,0.2)] transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                >
                  <span>Launch Live Dashboard</span>
                  <ArrowRight className="h-4 w-4 text-[#06080A]" />
                </Link>

                <a
                  href="#how-it-works"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/12 bg-white/[0.04] hover:bg-white/[0.08] text-slate-200 hover:text-white px-6 py-3.5 text-xs sm:text-sm font-semibold transition-all duration-200 backdrop-blur-md hover:scale-[1.01]"
                >
                  <span>Explore Architecture</span>
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                </a>
              </div>
            </div>

            {/* Right Column: Clean space for the atmospheric photograph */}
            <div className="hidden lg:block lg:col-span-6 xl:col-span-6 min-h-[460px] pointer-events-none" />
          </div>
        </div>
      </section>

      {/* ═════════════════════════════════════════════════════════════════ */}
      {/* VISUAL SEPARATION: 80-120px between Hero and Next Section        */}
      {/* ═════════════════════════════════════════════════════════════════ */}
      <div className="h-20 sm:h-24 lg:h-28" />

      {/* ═════════════════════════════════════════════════════════════════ */}
      {/* NEXT SECTION: OPERATIONAL INTERFACE PREVIEW                       */}
      {/* ═════════════════════════════════════════════════════════════════ */}
      <section
        id="product"
        className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pb-24 sm:pb-32"
        style={{
          opacity: entered ? 1 : 0,
          transform: entered ? "translateY(0)" : "translateY(28px)",
          transition:
            "opacity 0.9s 0.6s ease, transform 0.9s 0.6s cubic-bezier(0.16,1,0.3,1)",
        }}
      >
        <div className="mb-5 flex items-center justify-between text-xs text-slate-400 font-mono">
          <span className="uppercase tracking-widest text-[11px] text-slate-400 font-semibold">
            OPERATIONAL INTERFACE PREVIEW
          </span>
          <span className="hidden sm:inline text-slate-400">
            Apex Industrial Electro-Mechanicals Ltd. · Active Evaluation
          </span>
        </div>
        <HeroProductPreview />
      </section>
    </div>
  );
}

export default HeroSection;
