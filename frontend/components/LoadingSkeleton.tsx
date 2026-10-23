"use client";
import React, { useEffect, useState } from "react";

interface LoadingSkeletonProps {
  className?: string;
  count?: number;
  variant?: "bars" | "dashboard";
  label?: string;
}

export function LoadingSkeleton({ className = "h-6 w-full", count = 1, variant = "bars", label = "Loading…" }: LoadingSkeletonProps) {
  const [takingLonger, setTakingLonger] = useState(false);
  useEffect(() => {
    const timeout = setTimeout(() => setTakingLonger(true), 8000);
    return () => clearTimeout(timeout);
  }, []);
  return (
    <div className="space-y-5">
      <div role="status" aria-live="polite" className="flex items-center gap-3 text-sm text-[var(--ui-secondary)]">
        <span className="cw-loading-spinner" aria-hidden="true" />
        <span>{takingLonger ? "Still loading. This is taking longer than usual." : label}</span>
      </div>
      {variant === "dashboard" ? <div aria-hidden="true" className="space-y-6">
        <div className="cw-loading-shape h-8 w-2/3 rounded-lg" />
        <div className="grid grid-cols-3 gap-4">{[0,1,2].map(i => <div key={i} className="cw-loading-shape h-20 rounded-xl" />)}</div>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-12">
          {["md:col-span-12 lg:col-span-5", "md:col-span-6 lg:col-span-4", "md:col-span-6 lg:col-span-3"].map(span => <div key={span} className={`cw-loading-shape h-64 rounded-2xl ${span}`} />)}
        </div>
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          {["lg:col-span-7", "lg:col-span-5"].map(span => <div key={span} className={`cw-loading-shape h-64 rounded-2xl ${span}`} />)}
        </div>
      </div> : <div className="space-y-2" aria-hidden="true">
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className={`cw-loading-shape rounded-md ${className}`}
        />
      ))}</div>}
    </div>
  );
}

export default LoadingSkeleton;
