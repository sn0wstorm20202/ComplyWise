"use client";

import React from "react";
import { MapPin } from "lucide-react";

export function CoverageScene() {
  const sectorExamples = [
    {
      name: "Electrical & Electronics",
      standards: "Products and manufacturing activity",
      mandate: "Check relevant requirements",
    },
    {
      name: "Industrial Machinery & Metrology",
      standards: "Equipment and workshop operations",
      mandate: "Check relevant requirements",
    },
    {
      name: "Automotive Components",
      standards: "Components and production processes",
      mandate: "Check relevant requirements",
    },
    {
      name: "Chemicals & Petrochemicals",
      standards: "Materials and handling activities",
      mandate: "Check relevant requirements",
    },
    {
      name: "Food & Beverage Processing",
      standards: "Processing and business operations",
      mandate: "Check relevant requirements",
    },
    {
      name: "Pharmaceuticals & Medical Devices",
      standards: "Products and operating location",
      mandate: "Check relevant requirements",
    },
    {
      name: "Textiles & Technical Fabrics",
      standards: "Materials and production activity",
      mandate: "Check relevant requirements",
    },
    {
      name: "Clean Tech & EV Battery Storage",
      standards: "Equipment and storage activities",
      mandate: "Check relevant requirements",
    },
  ];

  return (
    <section
      id="coverage"
      className="py-28 md:py-36 bg-[#F7F5EF] border-t border-[rgba(23,23,20,0.06)]"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-14">
        {/* Editorial Subheader */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-[rgba(23,23,20,0.08)]">
          <div className="space-y-3 max-w-xl">
            <div className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-[#96938A] px-3.5 py-1 rounded-full bg-[#EFEEE7] border border-[rgba(23,23,20,0.06)]">
              <MapPin className="h-3.5 w-3.5 text-[#557D6B]" />
              <span>CHAPTER 08 &bull; INDUSTRIAL COVERAGE</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-serif text-[#171714]">
              Built around the way <span className="italic font-light text-[#557D6B]">your business operates.</span>
            </h2>
            <p className="text-sm text-[#6F6D66] font-light leading-relaxed">
              Start with your business, location and activity. ComplyWise maps the relevant requirements from there.
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono text-[#557D6B]">
            <span className="px-3 py-1.5 rounded-full bg-[#DCEAE2] font-semibold">
              CENTRAL GOVERNMENT
            </span>
            <span className="px-3 py-1.5 rounded-full bg-[#DCEAE2] font-semibold">
              MAHARASHTRA STATE
            </span>
          </div>
        </div>

        <p className="text-xs text-[#6F6D66]">Examples of business context. Coverage depends on the activity and available sources; this is not a complete catalogue.</p>
        {/* Sectors Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {sectorExamples.map((sector, idx) => (
            <div
              key={idx}
              tabIndex={0}
              className="sector-story-card p-6 rounded-2xl bg-[#EFEEE7] border border-[rgba(23,23,20,0.08)] hover:bg-[#E7EEE9] transition-all duration-300 space-y-2.5"
            >
              <div className="flex items-center justify-between text-[10px] font-mono text-[#96938A]">
                <span>SECTOR {String(idx + 1).padStart(2, "0")}</span>
                <span className="text-[#557D6B] font-semibold">CONTEXT</span>
              </div>
              <h3 className="font-serif text-lg text-[#171714]">
                {sector.name}
              </h3>
              <p className="font-mono text-xs text-[#6F6D66]">
                {sector.standards}
              </p>
              <div className="pt-2 text-[11px] font-mono text-[#557D6B] border-t border-[rgba(23,23,20,0.05)]">
                {sector.mandate}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default CoverageScene;
