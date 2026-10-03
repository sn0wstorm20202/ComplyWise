"use client";

import React from "react";

export function RegulatoryMarquee() {
  const regulatoryBodies = [
    "CENTRAL GOVERNMENT",
    "BUREAU OF INDIAN STANDARDS (BIS)",
    "QUALITY CONTROL ORDERS (QCO)",
    "MAHARASHTRA INDUSTRIAL DEVELOPMENT",
    "FSSAI FOOD SAFETY MANDATES",
    "NEW LABOUR CODES 2026",
    "FIRE & LIFE SAFETY AUDITS",
    "CENTRAL POLLUTION CONTROL BOARD (CPCB)",
    "MSME UDYAM REGULATORY REGIME",
    "DIRECTORATE GENERAL OF FOREIGN TRADE (DGFT)",
    "NABL LABORATORY ACCREDITATION",
    "LEGAL METROLOGY ACT",
  ];

  return (
    <section className="relative py-8 bg-[#EFEEE7] border-y border-[rgba(23,23,20,0.06)] overflow-hidden select-none">
      {/* Edge gradient masks for seamless bleed */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-[#EFEEE7] to-transparent z-10" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-[#EFEEE7] to-transparent z-10" />

      {/* Infinite loop ticker */}
      <div className="animate-cw-marquee flex items-center">
        {/* First track */}
        <div className="flex items-center gap-10 whitespace-nowrap pr-10">
          {regulatoryBodies.map((body, i) => (
            <div key={`track1-${i}`} className="flex items-center gap-10">
              <span className="font-mono text-xs tracking-[0.22em] text-[#6F6D66] hover:text-[#171714] transition-colors cursor-default">
                {body}
              </span>
              <span className="h-1.5 w-1.5 rounded-full bg-[#7FAF9A]/60" />
            </div>
          ))}
        </div>

        {/* Duplicate track for seamless infinite repetition */}
        <div className="flex items-center gap-10 whitespace-nowrap pr-10" aria-hidden="true">
          {regulatoryBodies.map((body, i) => (
            <div key={`track2-${i}`} className="flex items-center gap-10">
              <span className="font-mono text-xs tracking-[0.22em] text-[#6F6D66] hover:text-[#171714] transition-colors cursor-default">
                {body}
              </span>
              <span className="h-1.5 w-1.5 rounded-full bg-[#7FAF9A]/60" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default RegulatoryMarquee;
