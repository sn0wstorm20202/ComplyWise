"use client";

import React from "react";
import { ArrowUpRight } from "lucide-react";
import BISLogo from "@/components/icons/BISLogo";

interface ApplicableRequirementsCardProps {
  requirementsData: {
    applicableCount: number | null;
    standardsCount: number | null;
  };
  onOpen?: () => void;
  onOpenStandards?: () => void;
}

export function ApplicableRequirementsCard({
  requirementsData,
  onOpen,
  onOpenStandards,
}: ApplicableRequirementsCardProps) {
  return (
    <div
      className="bg-[#DCE8DE] rounded-[20px] p-5 sm:p-6 flex flex-col justify-between h-full min-h-[270px] relative shadow-sm border border-[#C5D7C9] group select-none overflow-hidden"
    >
      {/* Top Header: Floating Arrow on Left, BIS Logo on Right */}
      <div className="flex justify-between items-center relative z-10">
        <button type="button" onClick={onOpen} aria-label="View applicable requirements" className="h-7 w-7 rounded-full bg-white shadow-2xs flex items-center justify-center text-[var(--ui-text)] hover:scale-105 transition-transform">
          <ArrowUpRight className="h-3.5 w-3.5" />
        </button>
        <BISLogo className="h-5 w-5" />
      </div>

      {/* Main Metric */}
      <div className="my-auto pl-0.5 relative z-10">
        <h3 className="text-xs font-medium text-[#374151] max-w-[140px] leading-snug">
          Applicable Requirements
        </h3>
        <div className="text-5xl sm:text-6xl font-bold text-[var(--ui-text)] tracking-tight mt-1.5 font-sans">
          {requirementsData.applicableCount ?? "—"}
        </div>
        {requirementsData.applicableCount == null && <p className="text-xs mt-2 text-[#4B5563]">Assessment needed</p>}
      </div>

      {/* Bottom Footer Row */}
      <button type="button" onClick={onOpenStandards} aria-label="Explore standards" className="flex items-center justify-between gap-2 pt-3 border-t border-[#C5D7C9]/60 relative z-10 text-left">
        <span className="text-xs font-medium text-[#4B5563]">
          Standards to explore
        </span>
        <span className="px-3 py-0.5 rounded-full bg-white text-[var(--ui-text)] font-semibold text-xs shadow-2xs">
          {requirementsData.standardsCount ?? "—"}
        </span>
      </button>
    </div>
  );
}

export default ApplicableRequirementsCard;
