"use client";

import React from "react";
import { ArrowUpRight } from "lucide-react";
import BISLogo from "@/components/icons/BISLogo";

interface ApplicableRequirementsCardProps {
  onOpen?: () => void;
}

export function ApplicableRequirementsCard({
  onOpen,
}: ApplicableRequirementsCardProps) {
  return (
    <div className="bg-[#d5e2d8] rounded-[28px] p-6 flex flex-col justify-between h-[280px] relative shadow-xs">
      {/* Floating Expand Arrow Button on Left Border */}
      <div className="absolute -left-3.5 top-1/2 -translate-y-1/2 z-10">
        <button
          type="button"
          onClick={onOpen}
          aria-label="View applicable requirements"
          className="h-8 w-8 rounded-full bg-white hover:bg-slate-50 flex items-center justify-center text-slate-800 shadow-md border border-black/[0.04] transition-transform hover:scale-105"
        >
          <ArrowUpRight className="h-4 w-4" />
        </button>
      </div>

      {/* Top Header: BIS Logo */}
      <div className="flex justify-end items-center">
        <BISLogo className="h-7 w-7" />
      </div>

      {/* Main Metric */}
      <div className="my-auto pl-1">
        <div className="text-xs font-semibold text-slate-700 max-w-[120px] leading-snug">
          Applicable Requirements
        </div>
        <div className="text-5xl font-bold text-slate-950 tracking-tight mt-1">
          18
        </div>
      </div>

      {/* Bottom Footer Row */}
      <div className="flex items-center justify-between pt-2">
        <span className="text-[11px] font-semibold text-slate-700">
          IS Standards
        </span>
        <span className="px-2.5 py-0.5 rounded-full bg-white/70 text-slate-900 font-bold text-xs shadow-2xs">
          09 / 28
        </span>
      </div>
    </div>
  );
}

export default ApplicableRequirementsCard;
