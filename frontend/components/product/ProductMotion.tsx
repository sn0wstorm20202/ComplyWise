"use client";

import { useEffect, useRef, type ReactNode } from "react";
import gsap from "gsap";

export function ProductMotion({ children, stateKey, className = "" }: { children: ReactNode; stateKey?: string | number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const context = gsap.context(() => {
      gsap.fromTo(ref.current, { opacity: 0.65, y: 8 }, { opacity: 1, y: 0, duration: 0.24, ease: "power2.out", clearProps: "all" });
    }, ref);
    return () => context.revert();
  }, [stateKey]);
  return <div ref={ref} className={className}>{children}</div>;
}
