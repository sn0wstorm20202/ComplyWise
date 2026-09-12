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
    description: "Simplify your regulatory journey with expert insights.",
    authority: "Bureau of Indian Standards",
    points: [18, 22, 25, 29, 34, 38, 44, 49, 55, 62, 70, 78, 85, 92, 98],
  },
  onLearnMore,
  onDismiss,
}: TallFeatureCardProps) {
  const points = featuredStandard.points;
  const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null);

  return (
    <div className="bg-[#101114] rounded-[16px] p-6 flex flex-col justify-between border border-white/[0.08] shadow-xl h-full min-h-[580px] relative overflow-hidden group select-none">
      {/* 1. Header: ComplyWise platform title + Dismiss button */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-0.5">
          <h2 className="text-xl font-bold text-[#F2F2F0] tracking-tight">
            ComplyWise
          </h2>
          <p className="text-xs text-[#71717A]">
            Your BIS compliance intelligence platform
          </p>
        </div>

        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss card"
            className="h-7 w-7 rounded-[8px] bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] flex items-center justify-center text-[#71717A] hover:text-[#F2F2F0] transition-colors cursor-pointer shrink-0"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* 2. Visual Frame: 3D Compliance Shield Illustration */}
      <div className="relative w-full h-44 sm:h-48 my-auto flex items-center justify-center overflow-hidden">
        {/* Subtle Ambient Radial Glow */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(110,130,255,0.15)_0%,transparent_70%)] pointer-events-none" />
        <Image
          src="/assets/complywise-shield-3d.png"
          alt="BIS Compliance Shield & Documents"
          fill
          priority
          className="object-contain drop-shadow-[0_16px_32px_rgba(0,0,0,0.7)] select-none pointer-events-none transition-transform duration-300 group-hover:scale-105"
          unoptimized
        />
      </div>

      {/* 3. Section: "Stay Compliant" Title + IS Standard Badge + Subtitle */}
      <div className="space-y-1.5 pt-2">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-base font-semibold text-[#F2F2F0] tracking-tight">
            {featuredStandard.title}
          </h3>
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#F2C96D]/15 border border-[#F2C96D]/30 text-[#F2C96D] font-semibold text-[11px] shrink-0 shadow-xs">
            <Star className="h-3 w-3 fill-[#F2C96D] text-[#F2C96D]" />
            <span>{featuredStandard.code}</span>
          </span>
        </div>
        <p className="text-xs text-[#A4A5AA] leading-relaxed">
          {featuredStandard.description}
        </p>
      </div>

      {/* 4. Technical SVG Trend Chart */}
      <div className="pt-2 pb-1">
        <div className="relative h-20 w-full flex items-end bg-[#0B0C0E]/50 rounded-[10px] p-2 border border-white/[0.04]">
          {/* Vertical Guide Marks with rounded tops */}
          <div className="absolute inset-x-3 inset-y-2 flex items-end justify-between pointer-events-none">
            {points.map((val, idx) => (
              <div
                key={idx}
                className={`w-[2px] rounded-t-full transition-colors ${
                  hoveredIndex === idx ? "bg-[#6E82FF]" : "bg-white/[0.06]"
                }`}
                style={{ height: `${val}%` }}
              />
            ))}
          </div>

          {/* SVG Smooth Cubic Bezier Spline */}
          <svg
            className="w-full h-full relative z-10 overflow-visible"
            viewBox="0 0 240 60"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="shieldTrendGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6E82FF" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#6E82FF" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Gradient Area under curve */}
            <path
              d="M 6 52 C 50 48, 95 36, 145 22 C 180 12, 215 8, 234 6 L 234 60 L 6 60 Z"
              fill="url(#shieldTrendGradient)"
            />

            {/* Main Spline Curve */}
            <path
              d="M 6 52 C 50 48, 95 36, 145 22 C 180 12, 215 8, 234 6"
              fill="none"
              stroke="#6E82FF"
              strokeWidth="2.4"
              strokeLinecap="round"
            />

            {/* Start Node */}
            <circle cx="6" cy="52" r="3.5" fill="#6E82FF" />
            <circle cx="6" cy="52" r="7" fill="none" stroke="#6E82FF" strokeWidth="1" opacity="0.3" />

            {/* End Node */}
            <circle cx="234" cy="6" r="4" fill="#6E82FF" />
            <circle cx="234" cy="6" r="8" fill="none" stroke="#6E82FF" strokeWidth="1" opacity="0.4" />
          </svg>

          {/* Invisible hover triggers */}
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

      {/* 5. Footer: "Learn more ->" Pill CTA + Bottom Context Copy */}
      <div className="pt-2 space-y-2 border-t border-white/[0.06]">
        <div>
          {onLearnMore ? (
            <button
              type="button"
              onClick={onLearnMore}
              className="inline-flex items-center gap-2.5 pl-4 pr-2 py-1.5 rounded-full bg-white/[0.08] hover:bg-white/[0.14] border border-white/[0.12] text-[#F2F2F0] font-medium text-xs transition-all group/btn cursor-pointer shadow-xs"
            >
              <span>Learn more</span>
              <div className="h-6 w-6 rounded-full bg-[#101114] border border-white/[0.16] text-[#F2F2F0] flex items-center justify-center transition-transform group-hover/btn:translate-x-0.5 shadow-xs">
                <ArrowRight className="h-3 w-3" />
              </div>
            </button>
          ) : (
            <Link
              href={`/standards/${featuredStandard.code.replace(/\s+/g, "-")}`}
              className="inline-flex items-center gap-2.5 pl-4 pr-2 py-1.5 rounded-full bg-white/[0.08] hover:bg-white/[0.14] border border-white/[0.12] text-[#F2F2F0] font-medium text-xs transition-all group/btn cursor-pointer shadow-xs"
            >
              <span>Learn more</span>
              <div className="h-6 w-6 rounded-full bg-[#101114] border border-white/[0.16] text-[#F2F2F0] flex items-center justify-center transition-transform group-hover/btn:translate-x-0.5 shadow-xs">
                <ArrowRight className="h-3 w-3" />
              </div>
            </Link>
          )}
        </div>

        <p className="text-[11px] text-[#71717A] leading-tight">
          Explore BIS standards, schemes and updates with ComplyWise.
        </p>
      </div>
    </div>
  );
}

export default TallFeatureCard;
