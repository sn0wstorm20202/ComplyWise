"use client";

import React from "react";

interface BISLogoProps {
  className?: string;
  showText?: boolean;
}

export function BISLogoMark({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Bureau of Indian Standards Mark"
    >
      {/* Blue Triangle Outer Ring */}
      <path
        d="M20 3.5L36.5 32H3.5L20 3.5Z"
        stroke="#1d4ed8"
        strokeWidth="4.5"
        strokeLinejoin="round"
      />
      {/* Red Anvil / Stylized T in center */}
      <path
        d="M13 15H27M20 15V27M16 27H24"
        stroke="#dc2626"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function BISLogo({
  className = "h-7 w-7",
  showText = true,
}: BISLogoProps) {
  return (
    <div className="flex items-center gap-1.5 select-none">
      <BISLogoMark className={className} />
      {showText && (
        <span className="font-bold text-xl tracking-tight text-slate-900 leading-none">
          BIS
        </span>
      )}
    </div>
  );
}
