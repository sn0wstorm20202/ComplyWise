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
    const timer = setTimeout(() => setTakingLonger(true), 8000);
    return () => clearTimeout(timer);
  }, []);
  return (
    <div className="space-y-5">
      <div role="status" aria-live="polite" className="flex items-center gap-3 text-sm text-[var(--ui-secondary)]">
        <span className="cw-loading-spinner" aria-hidden="true" />
        <span>{takingLonger ? "Still loading. The server is taking longer than usual." : label}</span>
      </div>
      {variant === "dashboard" ? <div aria-hidden="true" className="space-y-6">
        <div className="cw-loading-shape h-8 w-2/3 rounded-lg" />
        <div className="grid grid-cols-3 gap-4">{[0,1,2].map(i => <div key={i} className="cw-loading-shape h-20 rounded-xl" />)}</div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{[0,1,2].map(i => <div key={i} className="cw-loading-shape h-64 rounded-2xl" />)}</div>
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
