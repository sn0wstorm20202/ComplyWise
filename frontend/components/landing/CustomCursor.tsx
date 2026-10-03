"use client";

import React, { useEffect, useRef } from "react";
import gsap from "gsap";

export function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mm = gsap.matchMedia();
    mm.add("(min-width: 1280px) and (pointer: fine) and (prefers-reduced-motion: no-preference)", () => {
    // Only enable on desktop pointer devices
    const isPointerFine = window.matchMedia("(pointer: fine)").matches;
    const isDesktop = window.innerWidth >= 1280;
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (!isPointerFine || !isDesktop || prefersReducedMotion) {
      return;
    }


    const cursor = cursorRef.current;
    const ring = ringRef.current;
    if (!cursor || !ring) return;
    gsap.set([cursor, ring], { opacity: 0 });

    // Fast, buttery position interpolators using gsap.quickTo
    const cursorX = gsap.quickTo(cursor, "x", { duration: 0.1, ease: "power3" });
    const cursorY = gsap.quickTo(cursor, "y", { duration: 0.1, ease: "power3" });
    const ringX = gsap.quickTo(ring, "x", { duration: 0.35, ease: "power2.out" });
    const ringY = gsap.quickTo(ring, "y", { duration: 0.35, ease: "power2.out" });

    let isHovering = false;

    const onMouseMove = (e: MouseEvent) => {
      cursorX(e.clientX);
      cursorY(e.clientY);
      ringX(e.clientX);
      ringY(e.clientY);

      if (cursor.style.opacity === "0") {
        gsap.to([cursor, ring], { opacity: 1, duration: 0.3 });
      }
    };

    const onMouseLeave = () => {
      gsap.to([cursor, ring], { opacity: 0, duration: 0.3 });
    };

    const onMouseEnter = () => {
      gsap.to([cursor, ring], { opacity: 1, duration: 0.3 });
    };

    const handlePointerOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      const interactive = target.closest(
        "a, button, [role='button'], input, textarea, select, [data-cursor='interactive']"
      );

      if (interactive && !isHovering) {
        isHovering = true;
        gsap.to(ring, {
          scale: 1.8,
          backgroundColor: "rgba(127, 175, 154, 0.14)",
          borderColor: "rgba(127, 175, 154, 0.5)",
          duration: 0.3,
          ease: "power2.out",
        });
        gsap.to(cursor, {
          scale: 0.5,
          opacity: 0.5,
          duration: 0.2,
        });
      } else if (!interactive && isHovering) {
        isHovering = false;
        gsap.to(ring, {
          scale: 1,
          backgroundColor: "transparent",
          borderColor: "rgba(23, 23, 20, 0.2)",
          duration: 0.3,
          ease: "power2.out",
        });
        gsap.to(cursor, {
          scale: 1,
          opacity: 1,
          duration: 0.2,
        });
      }
    };

    window.addEventListener("mousemove", onMouseMove, { passive: true });
    document.addEventListener("mouseleave", onMouseLeave);
    document.addEventListener("mouseenter", onMouseEnter);
    document.addEventListener("mouseover", handlePointerOver, { passive: true });

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseleave", onMouseLeave);
      document.removeEventListener("mouseenter", onMouseEnter);
      document.removeEventListener("mouseover", handlePointerOver);
    };
    });
    return () => mm.revert();
  }, []);


  return (
    <div aria-hidden="true" className="custom-story-cursor pointer-events-none fixed inset-0 z-[55] overflow-hidden">
      {/* Precision center dot */}
      <div
        ref={cursorRef}
        className="fixed top-0 left-0 -ml-[3px] -mt-[3px] h-[6px] w-[6px] rounded-full bg-[#171714] opacity-0 transition-opacity will-change-transform"
      />
      {/* Outer fluid trailing ring */}
      <div
        ref={ringRef}
        className="fixed top-0 left-0 -ml-[14px] -mt-[14px] h-[28px] w-[28px] rounded-full border border-[rgba(23,23,20,0.22)] opacity-0 transition-[border-color,background-color] will-change-transform"
      />
    </div>
  );
}

export default CustomCursor;
