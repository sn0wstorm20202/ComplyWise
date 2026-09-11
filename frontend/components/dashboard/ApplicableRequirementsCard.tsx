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
      className="bg-[#111617] rounded-[14px] p-5 sm:p-6 flex flex-col justify-between h-full min-h-[270px] relative shadow-lg border border-emerald-500/20 cursor-pointer group hover:border-emerald-400/40 transition-all select-none overflow-hidden"
    >
      {/* Subtle ambient gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/[0.04] to-transparent pointer-events-none" />

      {/* Top Header: Expand Arrow on Left, BIS Logo on Right */}
      <div className="flex justify-between items-center relative z-10">
        <div className="h-6 w-6 rounded-[6px] bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-[#A4A5AA] group-hover:text-[#F2F2F0] transition-colors">
          <ArrowUpRight className="h-3 w-3" />
        </div>
        <BISLogo className="h-5 w-5" />
      </div>

      {/* Main Metric */}
      <div className="my-auto pl-0.5 relative z-10">
        <div className="text-xs font-normal text-[#A4A5AA] max-w-[130px] leading-snug">
          Applicable Requirements
        </div>
        <div className="text-4xl sm:text-5xl font-bold text-[#F2F2F0] tracking-tight mt-1.5 font-sans">
          {requirementsData.applicableCount}
        </div>
      </div>

      {/* Bottom Footer Row */}
      <div className="flex items-center justify-between pt-2 border-t border-white/[0.06] relative z-10">
        <span className="text-[11px] text-[#71717A]">
          IS Standards
        </span>
        <span className="px-2.5 py-0.5 rounded-full bg-white/[0.08] border border-white/[0.10] text-[#F2F2F0] font-mono font-medium text-xs">
          {requirementsData.isStandardsRatio}
        </span>
      </div>
    </div>
  );
}

export default ApplicableRequirementsCard;
