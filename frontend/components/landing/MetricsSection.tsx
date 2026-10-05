"use client";

import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export function MetricsSection() {
  const containerRef = useRef<HTMLElement>(null);
  const metric1Ref = useRef<HTMLSpanElement>(null);
  const metric2Ref = useRef<HTMLSpanElement>(null);
  const metric3Ref = useRef<HTMLSpanElement>(null);
  const metric4Ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const counters = [
        { ref: metric1Ref, end: 100, suffix: "%" },
        { ref: metric2Ref, end: 2400, suffix: "+" },
        { ref: metric3Ref, end: 28, suffix: " States" },
        { ref: metric4Ref, end: 3, prefix: "< ", suffix: " min" },
      ];

      counters.forEach((item) => {
        if (!item.ref.current) return;
        const obj = { val: 0 };
        gsap.to(obj, {
          val: item.end,
          duration: 1.8,
          ease: "power2.out",
          scrollTrigger: {
            trigger: item.ref.current,
            start: "top 88%",
            once: true,
          },
          onUpdate: () => {
            if (item.ref.current) {
              const formatted = Math.floor(obj.val).toLocaleString();
              item.ref.current.textContent = `${item.prefix || ""}${formatted}${item.suffix || ""}`;
            }
          },
        });
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={containerRef}
      className="py-28 md:py-36 bg-[#EFEEE7] border-y border-[rgba(23,23,20,0.06)]"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 md:gap-8">
          {/* Metric 1 */}
          <div className="space-y-3">
            <span
              ref={metric1Ref}
              className="block font-serif text-4xl sm:text-6xl text-[#171714] font-normal tracking-tight"
            >
              0%
            </span>
            <div className="space-y-1">
              <span className="block font-mono text-[10px] uppercase tracking-[0.16em] text-[#557D6B] font-semibold">
                DETERMINISTIC LOGIC
              </span>
              <p className="text-xs text-[#6F6D66] font-light">
                Zero hallucinated rules or probabilistic guesswork
              </p>
            </div>
          </div>

          {/* Metric 2 */}
          <div className="space-y-3">
            <span
              ref={metric2Ref}
              className="block font-serif text-4xl sm:text-6xl text-[#171714] font-normal tracking-tight"
            >
              0+
            </span>
            <div className="space-y-1">
              <span className="block font-mono text-[10px] uppercase tracking-[0.16em] text-[#557D6B] font-semibold">
                INDEXED PROVISIONS
              </span>
              <p className="text-xs text-[#6F6D66] font-light">
                Mandatory QCOs, BIS Form V, and gazette notifications
              </p>
            </div>
          </div>

          {/* Metric 3 */}
          <div className="space-y-3">
            <span
              ref={metric3Ref}
              className="block font-serif text-4xl sm:text-6xl text-[#171714] font-normal tracking-tight"
            >
              0 States
            </span>
            <div className="space-y-1">
              <span className="block font-mono text-[10px] uppercase tracking-[0.16em] text-[#557D6B] font-semibold">
                JURISDICTIONS
              </span>
              <p className="text-xs text-[#6F6D66] font-light">
                Harmonized Central and State industrial frameworks
              </p>
            </div>
          </div>

          {/* Metric 4 */}
          <div className="space-y-3">
            <span
              ref={metric4Ref}
              className="block font-serif text-4xl sm:text-6xl text-[#171714] font-normal tracking-tight"
            >
              0 min
            </span>
            <div className="space-y-1">
              <span className="block font-mono text-[10px] uppercase tracking-[0.16em] text-[#557D6B] font-semibold">
                TIME TO APPLICABILITY
              </span>
              <p className="text-xs text-[#6F6D66] font-light">
                Complete diagnostic intake to verified compliance map
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default MetricsSection;
