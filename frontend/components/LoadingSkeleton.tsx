import React from "react";

interface LoadingSkeletonProps {
  className?: string;
  count?: number;
}

export function LoadingSkeleton({ className = "h-6 w-full", count = 1 }: LoadingSkeletonProps) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className={`animate-pulse rounded-md bg-[#121317] border border-[#1c1d22]/50 ${className}`}
        />
      ))}
    </div>
  );
}

export default LoadingSkeleton;
