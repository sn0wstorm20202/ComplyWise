"use client";

import React from "react";
import Image from "next/image";
import { X, ArrowRight, Star } from "lucide-react";

interface TallFeatureCardProps {
  onLearnMore?: () => void;
  onDismiss?: () => void;
}

export function TallFeatureCard({ onLearnMore, onDismiss }: TallFeatureCardProps) {
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
            className="object-contain drop-shadow-md"
            unoptimized
          />
        </div>
      </div>

      {/* Bottom Section: Stay Compliant */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900">
            Stay Compliant
          </h3>
          {/* IS Standard Badge */}
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#fef08a] text-slate-900 font-bold text-[11px] shadow-2xs">
            <Star className="h-3 w-3 fill-slate-900 text-slate-900" />
            <span>IS 3055</span>
          </span>
        </div>

        <p className="text-xs text-slate-500 leading-relaxed -mt-2">
          Simplify your regulatory journey with expert insights.
        </p>

        {/* Trend Area with vertical background bar grid and upward line */}
        <div className="relative h-20 w-full flex items-end">
          {/* Ascending vertical bar grid lines */}
          <div className="absolute inset-0 flex items-end justify-between px-1 opacity-25">
            {[18, 22, 25, 29, 34, 38, 44, 49, 55, 62, 70, 78, 85, 92, 98].map(
              (heightPercent, idx) => (
                <div
                  key={idx}
                  className="w-1 bg-slate-400/80 rounded-t"
                  style={{ height: `${heightPercent}%` }}
                />
              )
            )}
          </div>

          {/* SVG Smooth Curve with Start and End Dots */}
          <svg
            className="w-full h-full overflow-visible z-10"
            viewBox="0 0 200 60"
            fill="none"
          >
            <path
              d="M 10 48 Q 50 48 80 40 T 140 22 T 190 8"
              stroke="#94a3b8"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            {/* Start Dot */}
            <circle cx="10" cy="48" r="3" fill="#0f172a" />
            {/* End Dot */}
            <circle cx="190" cy="8" r="3" fill="#0f172a" />
          </svg>
        </div>

        {/* Floating "Learn more" pill button */}
        <div className="flex justify-center -mt-2">
          <button
            type="button"
            onClick={onLearnMore}
            className="inline-flex items-center gap-3 pl-5 pr-1.5 py-1.5 rounded-full bg-white hover:bg-slate-50 text-slate-900 text-xs font-semibold shadow-xs border border-slate-200/60 transition-all group"
          >
            <span>Learn more</span>
            <div className="h-7 w-7 rounded-full bg-[#0f172a] text-white flex items-center justify-center group-hover:translate-x-0.5 transition-transform">
              <ArrowRight className="h-3.5 w-3.5" />
            </div>
          </button>
        </div>

        {/* Card Footer Caption */}
        <div className="rounded-xl bg-white/40 border border-white/60 p-2.5 text-center mt-2">
          <p className="text-[11px] text-slate-500 font-medium">
            Explore BIS standards, schemes and updates with ComplyWise.
          </p>
        </div>
      </div>
    </div>
  );
}

export default TallFeatureCard;
