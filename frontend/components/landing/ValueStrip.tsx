"use client";

import React, { useRef, useEffect, useState } from "react";
import { BookOpen, ShieldCheck, FileText, CheckCircle2, GitFork, Sparkles } from "lucide-react";

export function ValueStrip() {
  const pillars = [
    { label: "Standards", icon: BookOpen, desc: "Mandatory IS & QCOs" },
    { label: "Requirements", icon: ShieldCheck, desc: "Deterministic logic" },
    { label: "Documents", icon: FileText, desc: "Testing & statutory dossiers" },
    { label: "Evidence", icon: CheckCircle2, desc: "Authoritative provenance" },
    { label: "Workflows", icon: GitFork, desc: "Departmental clearances" },
    { label: "BIS Agent", icon: Sparkles, desc: "Source-grounded assistance" },
  ];

  const sectionRef = useRef<HTMLElement>(null);
  const [visibleItems, setVisibleItems] = useState<number[]>([]);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          pillars.forEach((_, i) => {
            setTimeout(() => {
              setVisibleItems((prev) => [...prev, i]);
            }, i * 80);
          });
          io.unobserve(section);
        }
      },
      { threshold: 0.2 }
    );
    io.observe(section);
    return () => io.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="border-y border-white/[0.06] bg-[#0A0D10] py-5 sm:py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 divide-y sm:divide-y-0 sm:divide-x divide-white/[0.06]">
          {pillars.map((pillar, i) => {
            const Icon = pillar.icon;
            const isVisible = visibleItems.includes(i);
            return (
              <div
                key={pillar.label}
                className="flex flex-col items-center text-center p-4 sm:px-4 sm:py-3 group"
                style={{
                  opacity: isVisible ? 1 : 0,
                  transform: isVisible ? "translateY(0)" : "translateY(10px)",
                  transition: "opacity 0.5s ease, transform 0.5s cubic-bezier(0.16,1,0.3,1)",
                }}
              >
                <div className="h-7 w-7 rounded-lg bg-white/[0.06] text-blue-400 flex items-center justify-center mb-2 group-hover:bg-white/[0.10] group-hover:scale-110 transition-all duration-200 border border-white/[0.06]">
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <div className="text-xs font-semibold text-[#E5E9E8] font-sans">
                  {pillar.label}
                </div>
                <div className="text-[11px] text-[#7E878E] mt-0.5 font-normal font-sans">
                  {pillar.desc}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default ValueStrip;
