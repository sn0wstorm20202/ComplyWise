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
      className="bg-[#17191C] rounded-[12px] p-5 flex flex-col justify-between h-[280px] relative shadow-sm border border-white/[0.08] cursor-pointer group hover:border-white/[0.14] transition-colors select-none"
    >
      {/* Top Header: BIS Logo + Expand Arrow */}
      <div className="flex justify-between items-center">
        <div className="h-7 w-7 rounded-[8px] bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-[#A1A1AA] group-hover:text-[#F5F5F3] transition-colors">
          <ArrowUpRight className="h-3.5 w-3.5" />
        </div>
        <BISLogo className="h-6 w-6 text-[#F5F5F3]" />
      </div>

      {/* Main Metric */}
      <div className="my-auto pl-0.5">
        <div className="text-xs font-normal text-[#A1A1AA] max-w-[130px] leading-snug">
          Applicable Requirements
        </div>
        <div className="text-4xl sm:text-5xl font-bold text-[#F5F5F3] tracking-tight mt-1">
          {requirementsData.applicableCount}
        </div>
      </div>

      {/* Bottom Footer Row */}
      <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
        <span className="text-[11px] text-[#71717A]">
          IS Standards
        </span>
        <span className="px-2 py-0.5 rounded-full bg-white/[0.08] border border-white/[0.10] text-[#F5F5F3] font-mono font-medium text-xs">
          {requirementsData.isStandardsRatio}
        </span>
      </div>
    </div>
  );
}

export default ApplicableRequirementsCard;
