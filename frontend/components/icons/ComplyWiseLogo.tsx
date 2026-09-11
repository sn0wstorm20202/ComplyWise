"use client";

import React from "react";

interface ComplyWiseLogoProps {
  className?: string;
  showSubtitle?: boolean;
}

export function ComplyWiseLogoMark({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="ComplyWise Logo"
    >
      {/* Left thick diagonal pillar stroke */}
      <path
        d="M8.5 25.5L16.2 6.8C16.6 5.8 17.8 5.8 18.2 6.8L21 13.5"
        stroke="#F2F2F0"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Inner folded electric indigo compliance accent */}
      <path
        d="M11.5 21C13 18 14.8 14.5 16.5 14.5C18.2 14.5 17.2 18.5 16 22"
        stroke="#6E82FF"
        strokeWidth="2.8"
        strokeLinecap="round"
      />
      {/* Right diagonal contrast stroke */}
      <path
        d="M21 17.5L25 25.5"
        stroke="#A4A5AA"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function ComplyWiseLogo({
  className = "h-7 w-7",
  showSubtitle = true,
}: ComplyWiseLogoProps) {
  return (
    <div className="flex items-center gap-2.5 select-none">
      <ComplyWiseLogoMark className={className} />
      <div className="flex flex-col leading-none">
        <span className="font-semibold text-[15px] text-[#F2F2F0] tracking-tight">
          ComplyWise
        </span>
        {showSubtitle && (
          <span className="text-[10px] font-medium text-[#A4A5AA] mt-0.5 tracking-normal">
            BIS Compliance
          </span>
        )}
      </div>
    </div>
  );
}
