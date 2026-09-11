"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { X, ArrowRight, Star } from "lucide-react";

interface TallFeatureCardProps {
  featuredStandard?: {
    code: string;
    title: string;
    badge: string;
    description: string;
    authority: string;
    points: number[];
  };
  onLearnMore?: () => void;
  onDismiss?: () => void;
}

export function TallFeatureCard({
  featuredStandard = {
    code: "IS 3055",
    title: "Stay Compliant",
    badge: "★ IS 3055",
    description: "Simplify your regulatory journey with expert insights and verified statutory mandates.",
    authority: "Bureau of Indian Standards",
    points: [18, 22, 25, 29, 34, 38, 44, 49, 55, 62, 70, 78, 85, 92, 98],
  },
  onLearnMore,
  onDismiss,
}: TallFeatureCardProps) {
  const points = featuredStandard.points;
  const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null);

  return (
    <div className="bg-[#17191C] rounded-[16px] p-5 sm:p-6 flex flex-col justify-between border border-white/[0.08] shadow-lg h-full min-h-[560px] relative overflow-hidden group">
      {/* 1. Header: Title / Status on left, Action (Dismiss) on right */}
      <div className="flex items-start justify-between gap-4 pb-2">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-[#F5F5F3] tracking-tight">
              {featuredStandard.title}
            </h2>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#F2C96D]/15 border border-[#F2C96D]/30 text-[#F2C96D] font-medium text-[11px]">
              <Star className="h-3 w-3 fill-[#F2C96D] text-[#F2C96D]" />
              <span>{featuredStandard.code}</span>
            </span>
          </div>
          <p className="text-xs text-[#71717A]">
            {featuredStandard.authority}
          </p>
        </div>

        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss platform info"
            className="h-7 w-7 rounded-[8px] bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] flex items-center justify-center text-[#71717A] hover:text-[#F5F5F3] transition-colors cursor-pointer shrink-0"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* 2. Middle Body: Copy + Visual side-by-side or stacked on mobile */}
      <div className="my-auto py-3 space-y-4">
        {/* Visual Frame: 3D Compliance Shield */}
        <div className="relative w-full h-40 sm:h-44 flex items-center justify-center rounded-[12px] bg-[#111214]/60 border border-white/[0.04] p-3 overflow-hidden">
          {/* Subtle Ambient Radial Light behind 3D asset */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(109,140,255,0.08)_0%,transparent_70%)] pointer-events-none" />
          <Image
            src="/assets/complywise-shield-3d.png"
            alt="BIS Compliance Shield & Standards Documents"
            fill
            priority
            className="object-contain drop-shadow-[0_12px_24px_rgba(0,0,0,0.6)] select-none pointer-events-none transition-transform duration-300 group-hover:scale-105"
            unoptimized
          />
        </div>

        {/* Copy & Metadata */}
        <div className="space-y-2">
          <p className="text-xs sm:text-[13px] text-[#A1A1AA] leading-relaxed">
            {featuredStandard.description}
          </p>
          <div className="flex items-center gap-2 text-[11px] text-[#71717A]">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            <span>Scheme-I Mandatory ISI Certification</span>
          </div>
        </div>
      </div>

      {/* 3. Technical SVG Chart */}
      <div className="pt-2 pb-3">
        <div className="flex items-center justify-between text-[11px] text-[#71717A] mb-1.5">
          <span>Compliance Index</span>
          <span className="text-accent font-mono font-medium">
            {hoveredIndex !== null ? `${points[hoveredIndex]}%` : "+32% Trend"}
          </span>
        </div>

        <div className="relative h-16 w-full flex items-end bg-[#111214]/40 rounded-[8px] p-1 border border-white/[0.04]">
          {/* Vertical Guide Marks */}
          <div className="absolute inset-x-2 inset-y-1 flex items-end justify-between pointer-events-none">
            {points.map((val, idx) => (
              <div
                key={idx}
                className={`w-[1px] rounded-t transition-colors ${
                  hoveredIndex === idx ? "bg-accent/80" : "bg-white/[0.06]"
                }`}
                style={{ height: `${val}%` }}
              />
            ))}
          </div>

          {/* SVG Smooth Cubic Bezier Spline */}
          <svg
            className="w-full h-full relative z-10 overflow-visible"
            viewBox="0 0 200 60"
            preserveAspectRatio="none"
          >
            <path
              d="M 5 52 C 45 48, 85 36, 125 22 C 155 12, 180 8, 195 6"
              fill="none"
              stroke="#6D8CFF"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
            {/* Start Endpoint */}
            <circle cx="5" cy="52" r="3.5" fill="#6D8CFF" />
            <circle cx="5" cy="52" r="6.5" fill="none" stroke="#6D8CFF" strokeWidth="1" opacity="0.3" />
            {/* End Endpoint */}
            <circle cx="195" cy="6" r="4" fill="#6D8CFF" />
            <circle cx="195" cy="6" r="7.5" fill="none" stroke="#6D8CFF" strokeWidth="1" opacity="0.4" />
          </svg>

          {/* Interactive invisible hover triggers */}
          <div className="absolute inset-0 flex items-stretch z-20">
            {points.map((_, idx) => (
              <div
                key={idx}
                className="flex-1 cursor-crosshair"
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* 4. Footer: CTA on left, Supporting text on right */}
      <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between gap-3">
        {onLearnMore ? (
          <button
            type="button"
            onClick={onLearnMore}
            className="inline-flex items-center gap-2 pl-3.5 pr-1.5 py-1.5 rounded-full bg-white/[0.08] hover:bg-white/[0.12] border border-white/[0.10] text-[#F5F5F3] font-medium text-xs transition-all group/btn cursor-pointer"
          >
            <span>Learn more</span>
            <div className="h-6 w-6 rounded-full bg-accent text-[#09090B] flex items-center justify-center transition-transform group-hover/btn:translate-x-0.5 shadow-xs">
              <ArrowRight className="h-3 w-3" />
            </div>
          </button>
        ) : (
          <Link
            href={`/standards/${featuredStandard.code.replace(/\s+/g, "-")}`}
            className="inline-flex items-center gap-2 pl-3.5 pr-1.5 py-1.5 rounded-full bg-white/[0.08] hover:bg-white/[0.12] border border-white/[0.10] text-[#F5F5F3] font-medium text-xs transition-all group/btn cursor-pointer"
          >
            <span>Learn more</span>
            <div className="h-6 w-6 rounded-full bg-accent text-[#09090B] flex items-center justify-center transition-transform group-hover/btn:translate-x-0.5 shadow-xs">
              <ArrowRight className="h-3 w-3" />
            </div>
          </Link>
        )}

        <span className="text-[11px] text-[#71717A] text-right truncate">
          Updated today
        </span>
      </div>
    </div>
  );
}

export default TallFeatureCard;
