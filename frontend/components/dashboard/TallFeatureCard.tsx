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

  return (
    <div className="bg-gradient-to-b from-[#e7edf6] via-[#ecf2f9] to-[#edf1f8] rounded-[28px] p-6 flex flex-col justify-between relative overflow-hidden border border-slate-200/50 shadow-xs h-full min-h-[580px]">
      {/* Top Header */}
      <div>
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              ComplyWise
            </h2>
            <p className="text-xs text-slate-500 mt-1 max-w-[180px] leading-relaxed">
              Your BIS compliance intelligence platform
            </p>
          </div>
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss platform info"
            className="h-7 w-7 rounded-full bg-white/70 hover:bg-white flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors shadow-2xs"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* 3D Visual Illustration */}
        <div className="relative w-full h-44 my-3 flex items-center justify-center">
          <Image
            src="/assets/complywise-shield-3d.png"
            alt="BIS Compliance Shield & Standards Documents"
            fill
            priority
            className="object-contain drop-shadow-md select-none pointer-events-none"
            unoptimized
          />
        </div>
      </div>

      {/* Bottom Section: Stay Compliant */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900">
            {featuredStandard.title}
          </h3>
          {/* IS Standard Badge */}
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#fef08a] text-slate-900 font-bold text-[11px] shadow-2xs">
            <Star className="h-3 w-3 fill-slate-900 text-slate-900" />
            <span>{featuredStandard.code}</span>
          </span>
        </div>

        <p className="text-xs text-slate-500 leading-relaxed -mt-2">
          {featuredStandard.description}
        </p>

        {/* Trend Area with vertical background bar grid and upward line */}
        <div className="relative h-20 w-full flex items-end">
          {/* Ascending vertical bar grid lines */}
          <div className="absolute inset-0 flex items-end justify-between px-1 opacity-25">
            {points.map((heightPercent, idx) => (
              <div
                key={idx}
                className="w-1 bg-slate-400/80 rounded-t"
                style={{ height: `${heightPercent}%` }}
              />
            ))}
          </div>

          {/* SVG Smooth Curve with Start and End Dots */}
          <svg
            className="w-full h-full relative z-10 overflow-visible"
            viewBox="0 0 200 80"
            preserveAspectRatio="none"
          >
            <path
              d="M 5 68 C 50 62, 90 48, 130 28 C 160 14, 185 8, 195 6"
              fill="none"
              stroke="#0f172a"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            {/* Start Dot */}
            <circle cx="5" cy="68" r="4" fill="#0f172a" />
            <circle cx="5" cy="68" r="7" fill="none" stroke="#0f172a" strokeWidth="1.5" opacity="0.3" />
            {/* End Dot */}
            <circle cx="195" cy="6" r="4.5" fill="#0f172a" />
            <circle cx="195" cy="6" r="8" fill="none" stroke="#0f172a" strokeWidth="1.5" opacity="0.4" />
          </svg>
        </div>

        {/* Action Button & Subtitle */}
        <div className="space-y-3 pt-1">
          {onLearnMore ? (
            <button
              type="button"
              onClick={onLearnMore}
              className="inline-flex items-center gap-2.5 pl-4 pr-1.5 py-1.5 rounded-full bg-white hover:bg-slate-50 text-slate-950 font-semibold text-xs transition-all shadow-xs border border-black/[0.04] group cursor-pointer"
            >
              <span>Learn more</span>
              <div className="h-7 w-7 rounded-full bg-[#0f172a] text-white flex items-center justify-center transition-transform group-hover:translate-x-0.5 shadow-2xs">
                <ArrowRight className="h-3.5 w-3.5" />
              </div>
            </button>
          ) : (
            <Link
              href={`/standards/${featuredStandard.code.replace(/\s+/g, "-")}`}
              className="inline-flex items-center gap-2.5 pl-4 pr-1.5 py-1.5 rounded-full bg-white hover:bg-slate-50 text-slate-950 font-semibold text-xs transition-all shadow-xs border border-black/[0.04] group cursor-pointer"
            >
              <span>Learn more</span>
              <div className="h-7 w-7 rounded-full bg-[#0f172a] text-white flex items-center justify-center transition-transform group-hover:translate-x-0.5 shadow-2xs">
                <ArrowRight className="h-3.5 w-3.5" />
              </div>
            </Link>
          )}

          <p className="text-[11px] text-slate-400 leading-normal max-w-[220px]">
            Explore BIS standards, schemes and updates with ComplyWise.
          </p>
        </div>
      </div>
    </div>
  );
}

export default TallFeatureCard;
