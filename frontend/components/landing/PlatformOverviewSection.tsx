"use client";

import React, { useRef, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronRight } from "lucide-react";
import HeroProductPreview from "./HeroProductPreview";

export function PlatformOverviewSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [headerVisible, setHeaderVisible] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHeaderVisible(true);
          setTimeout(() => setPreviewVisible(true), 250);
          io.unobserve(section);
        }
      },
      { threshold: 0.08, rootMargin: "0px 0px -40px 0px" }
    );
    io.observe(section);
    return () => io.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="py-24 md:py-32 bg-[#0A0D10] relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 opacity-[0.025]" style={{ backgroundImage: `radial-gradient(rgba(255,255,255,0.5) 1px, transparent 1px)`, backgroundSize: "28px 28px" }} />
      </div>
      {/* Real photo background layer */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden" style={{ height: "100%" }}>
        <Image
          src="/assets/landing/photos/compliance-review.jpg"
          alt="Compliance review workspace"
          fill
          sizes="100vw"
          className="object-cover object-center opacity-[0.06]"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0A0D10] via-[#0A0D10]/90 to-[#0A0D10]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-14">
        {/* Header Copy */}
        <div
          className="flex flex-col md:flex-row md:items-end justify-between gap-8"
          style={{
            opacity: headerVisible ? 1 : 0,
            transform: headerVisible ? "translateY(0)" : "translateY(24px)",
            filter: headerVisible ? "blur(0px)" : "blur(4px)",
            transition: "opacity 0.75s ease, transform 0.75s cubic-bezier(0.16,1,0.3,1), filter 0.75s ease",
          }}
        >
          <div className="max-w-2xl space-y-4">
            <div className="text-[11px] font-bold text-[#3B82F6] uppercase tracking-widest font-mono">
              Operational Workspace
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-[#F4F6F5] leading-[1.1] font-sans">
              One place for your compliance picture.
            </h2>
            <p className="text-base sm:text-lg text-[#B1B8BD] leading-relaxed font-sans">
              Requirements, deadlines, documents, standards, and regulatory updates unified into a single operational interface.
            </p>
          </div>

          <div className="shrink-0">
            <Link
              href="/dashboard"
              className="btn-shimmer inline-flex items-center gap-2 rounded-xl bg-white hover:bg-slate-100 text-[#06080A] px-6 py-3.5 text-sm font-semibold shadow-[0_4px_20px_rgba(255,255,255,0.15)] transition-all duration-200 hover:scale-[1.02] hover:-translate-y-px active:scale-[0.98]"
            >
              <span>Explore Workspace</span>
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* Browser Frame Preview — large perspective entrance */}
        <div
          style={{
            perspective: "1200px",
            opacity: previewVisible ? 1 : 0,
            transition: "opacity 0.9s 0.1s ease",
          }}
        >
          <div
            style={{
              transform: previewVisible
                ? "rotateX(2deg) translateY(0) scale(1)"
                : "rotateX(8deg) translateY(30px) scale(0.96)",
              transformStyle: "preserve-3d",
              filter: previewVisible ? "blur(0px)" : "blur(4px)",
              transition: "transform 1.1s cubic-bezier(0.16,1,0.3,1), filter 0.9s ease",
            }}
            className="rounded-2xl overflow-hidden border border-white/[0.08] shadow-[0_60px_120px_rgba(0,0,0,0.8),0_0_0_1px_rgba(255,255,255,0.04)] hover:shadow-[0_80px_140px_rgba(0,0,0,0.9)] transition-shadow duration-700"
          >
            {/* On hover, flatten perspective slightly */}
            <div className="transition-transform duration-700 hover:[transform:rotateX(0deg)]">
              <HeroProductPreview />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default PlatformOverviewSection;
