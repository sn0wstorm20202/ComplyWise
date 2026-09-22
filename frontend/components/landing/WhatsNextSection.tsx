"use client";

import React, { useRef, useEffect, useState } from "react";

export function WhatsNextSection() {
  const capabilities = [
    {
      id: "workflows",
      title: "Connected Compliance Workflows",
      status: "In development",
      statusColor: "bg-white/[0.06] text-[#B1B8BD] border-white/[0.08]",
      accentColor: "bg-[#7E878E]",
      description:
        "Automating multi-step clearance procedures across state pollution control boards, factory safety inspectorates, and the central BIS Manakonline portal.",
      milestone: "Phase 2 Delivery",
    },
    {
      id: "intelligence",
      title: "Deeper Regulatory Intelligence",
      status: "Expanding",
      statusColor: "bg-blue-500/10 text-blue-300 border-blue-500/20",
      accentColor: "bg-blue-400",
      description:
        "Automated Gazette of India monitoring with clause-level text diffs to immediately detect when new Quality Control Orders affect approved manufacturing lines.",
      milestone: "Continuous Integration",
    },
    {
      id: "standards",
      title: "Expanded BIS Standards Coverage",
      status: "Being built",
      statusColor: "bg-white/[0.06] text-[#B1B8BD] border-white/[0.08]",
      accentColor: "bg-[#7E878E]",
      description:
        "Extending verified knowledge packs beyond electrical equipment into industrial machinery, chemicals, polymers, steel products, and medical devices.",
      milestone: "Knowledge Pack V2.4",
    },
    {
      id: "evidence",
      title: "Evidence & Requirement Tracking",
      status: "In development",
      statusColor: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
      accentColor: "bg-emerald-400",
      description:
        "Traceable NABL test report verification, automated instrument calibration expiry warnings, and one-click surveillance audit dossier generation.",
      milestone: "Audit Automation",
    },
  ];

  const sectionRef = useRef<HTMLElement>(null);
  const [headerVisible, setHeaderVisible] = useState(false);
  const [lineProgress, setLineProgress] = useState(0);
  const [visibleItems, setVisibleItems] = useState<number[]>([]);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHeaderVisible(true);
          // Animate timeline line drawing
          setTimeout(() => setLineProgress(100), 300);
          // Stagger milestones
          capabilities.forEach((_, i) => {
            setTimeout(() => {
              setVisibleItems((prev) => [...prev, i]);
            }, 400 + i * 200);
          });
          io.unobserve(section);
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
    );
    io.observe(section);
    return () => io.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="py-24 md:py-32 bg-[#06080A] relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      <div className="absolute top-0 left-1/3 w-[400px] h-[400px] rounded-full bg-blue-900/10 blur-[120px] pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-14">
        {/* Section Heading */}
        <div
          className="max-w-2xl space-y-4"
          style={{
            opacity: headerVisible ? 1 : 0,
            transform: headerVisible ? "translateY(0)" : "translateY(24px)",
            filter: headerVisible ? "blur(0px)" : "blur(4px)",
            transition: "opacity 0.75s ease, transform 0.75s cubic-bezier(0.16,1,0.3,1), filter 0.75s ease",
          }}
        >
          <div className="text-[11px] font-bold text-[#3B82F6] uppercase tracking-widest font-mono">
            Platform Roadmap
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-[#F4F6F5] leading-[1.1] font-sans">
            What&apos;s being built next.
          </h2>
          <p className="text-base sm:text-lg text-[#B1B8BD] leading-relaxed font-sans">
            ComplyWise is systematically expanding its regulatory knowledge graph, automation pipelines, and operational integrations.
          </p>
        </div>

        {/* Timeline List */}
        <div className="relative">
          {/* Animated timeline line — draws as section enters */}
          <div
            className="absolute left-[11px] top-4 w-px hidden sm:block"
            style={{
              height: `${lineProgress}%`,
              background: "linear-gradient(to bottom, rgba(59,130,246,0.4), rgba(255,255,255,0.06), transparent)",
              transition: "height 1.4s cubic-bezier(0.16,1,0.3,1) 0.3s",
              transformOrigin: "top center",
            }}
          />

          <div className="space-y-0">
            {capabilities.map((cap, index) => {
              const isVisible = visibleItems.includes(index);
              return (
                <div
                  key={cap.id}
                  className="group sm:pl-10 relative py-8 border-b border-white/[0.06] last:border-0 hover:bg-white/[0.01] transition-colors rounded-xl -mx-2 px-2 sm:px-10"
                  style={{
                    opacity: isVisible ? 1 : 0,
                    transform: isVisible ? "translateX(0)" : "translateX(-20px)",
                    filter: isVisible ? "blur(0px)" : "blur(3px)",
                    transition: "opacity 0.6s ease, transform 0.6s cubic-bezier(0.16,1,0.3,1), filter 0.5s ease",
                  }}
                >
                  {/* Timeline dot */}
                  <div className="absolute left-0 top-10 hidden sm:flex items-center justify-center">
                    <div className={`h-5 w-5 rounded-full ${cap.accentColor} opacity-60 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center`}>
                      <div className="h-2 w-2 rounded-full bg-[#06080A]" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-6 items-start">
                    <div className="md:col-span-4 space-y-2">
                      <h3 className="text-lg font-bold text-[#E5E9E8] group-hover:text-[#F4F6F5] transition-colors duration-200 font-sans">
                        {cap.title}
                      </h3>
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center rounded px-2 py-0.5 text-[10px] font-semibold border ${cap.statusColor}`}>
                          {cap.status}
                        </span>
                        <span className="font-mono text-[10px] text-[#7E878E]">
                          {cap.milestone}
                        </span>
                      </div>
                    </div>

                    <div className="md:col-span-8">
                      <p className="text-sm sm:text-base text-[#B1B8BD] leading-relaxed font-sans">
                        {cap.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Subtle Bottom Note */}
        <div
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#7E878E] pt-2 font-mono"
          style={{
            opacity: visibleItems.length === capabilities.length ? 1 : 0,
            transition: "opacity 0.5s 0.2s ease",
          }}
        >
          <span>Active development cycle · Modular monolith architecture</span>
          <span className="text-[#B1B8BD] font-semibold">Updated weekly</span>
        </div>
      </div>
    </section>
  );
}

export default WhatsNextSection;
