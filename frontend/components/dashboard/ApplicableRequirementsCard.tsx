"use client";

import React from "react";
import { ArrowUpRight } from "lucide-react";
import BISLogo from "@/components/icons/BISLogo";

interface ApplicableRequirementsCardProps {
  requirementsData?: {
    applicableCount: number;
    isStandardsRatio: string;
  };
  onOpen?: () => void;
}

export function ApplicableRequirementsCard({
  requirementsData = {
    applicableCount: 18,
    isStandardsRatio: "09 / 28",
  },
  onOpen,
}: ApplicableRequirementsCardProps) {
  return (
    <div
      onClick={onOpen}
      className="bg-[#DCE8DE] rounded-[20px] p-5 sm:p-6 flex flex-col justify-between h-full min-h-[270px] relative shadow-sm border border-[#C5D7C9] cursor-pointer group hover:border-[#B2CAB7] transition-all select-none overflow-hidden"
    >
      {/* Top Header: Floating Arrow on Left, BIS Logo on Right */}
      <div className="flex justify-between items-center relative z-10">
        <div className="h-7 w-7 rounded-full bg-white shadow-2xs flex items-center justify-center text-[#111827] group-hover:scale-105 transition-transform">
          <ArrowUpRight className="h-3.5 w-3.5" />
        </div>
        <BISLogo className="h-5 w-5" />
      </div>

      {/* Main Metric */}
      <div className="my-auto pl-0.5 relative z-10">
        <div className="text-xs font-medium text-[#374151] max-w-[140px] leading-snug">
          Applicable Requirements
        </div>
        <div className="text-5xl sm:text-6xl font-bold text-[#111827] tracking-tight mt-1.5 font-sans">
          {requirementsData.applicableCount}
        </div>
      </div>

      {/* Bottom Footer Row */}
      <div className="flex items-center justify-between pt-3 border-t border-[#C5D7C9]/60 relative z-10">
        <span className="text-xs font-medium text-[#4B5563]">
          IS Standards
        </span>
        <span className="px-3 py-0.5 rounded-full bg-white text-[#111827] font-semibold text-xs shadow-2xs">
          {requirementsData.isStandardsRatio}
        </span>
      </div>
    </div>
  );
}

export default ApplicableRequirementsCard;
