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
        className="stroke-[#0B1220] dark:stroke-[#F7F9FC]"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Inner folded electric indigo/blue compliance accent */}
      <path
        d="M11.5 21C13 18 14.8 14.5 16.5 14.5C18.2 14.5 17.2 18.5 16 22"
        className="stroke-[#2563EB] dark:stroke-[#60A5FA]"
        strokeWidth="2.8"
        strokeLinecap="round"
      />
      {/* Right diagonal contrast stroke */}
      <path
        d="M21 17.5L25 25.5"
        className="stroke-[#334155] dark:stroke-[#D4DBE4]"
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
        <span className="font-bold text-[17px] text-[#0B1220] dark:text-[#F7F9FC] tracking-tight">
          ComplyWise
        </span>
        {showSubtitle && (
          <span className="text-xs font-semibold text-[#475569] dark:text-[#A8B2BE] mt-0.5 tracking-normal">
            BIS Compliance
          </span>
        )}
      </div>
    </div>
  );
}
