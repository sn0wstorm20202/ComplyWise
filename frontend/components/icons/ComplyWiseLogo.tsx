"use client";

import React from "react";

interface ComplyWiseLogoProps {
  className?: string;
  showSubtitle?: boolean;
}

export function ComplyWiseLogoMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="ComplyWise Logo"
    >
      {/* Left thick diagonal dark stroke */}
      <path
        d="M8.5 25.5L16.2 6.8C16.6 5.8 17.8 5.8 18.2 6.8L21 13.5"
        stroke="#0f172a"
        strokeWidth="3.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Inner folded accent */}
      <path
        d="M11 21.5C12.5 18 14.5 14 16.5 14C18.5 14 17.5 19 16 23"
        stroke="#0f172a"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
      {/* Right diagonal contrast stroke */}
      <path
        d="M21 17L25 25.5"
        stroke="#64748b"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function ComplyWiseLogo({
  className = "h-8 w-8",
  showSubtitle = true,
}: ComplyWiseLogoProps) {
  return (
    <div className="flex items-center gap-2.5 select-none">
      <ComplyWiseLogoMark className={className} />
      <div className="flex flex-col leading-none">
        <span className="font-bold text-[17px] text-slate-900 tracking-tight">
          ComplyWise
        </span>
        {showSubtitle && (
          <span className="text-[10px] font-medium text-slate-400 mt-0.5 tracking-normal">
            BIS Compliance
          </span>
        )}
      </div>
    </div>
  );
}
