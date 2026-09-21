"use client";

import { useEffect, useRef, useCallback } from "react";

/**
 * useScrollReveal — attaches IntersectionObserver to a container ref.
 * All children with class "sr-hidden" get "sr-visible" added when in view.
 * Returns the ref to attach to the section container.
 */
export function useScrollReveal(options?: IntersectionObserverInit) {
  const ref = useRef<HTMLElement | null>(null);

  const observe = useCallback((el: HTMLElement | null) => {
    if (!el) return;
    ref.current = el;

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const targets = (entry.target as HTMLElement).querySelectorAll<HTMLElement>(".sr-hidden");
            targets.forEach((t) => t.classList.add("sr-visible"));
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -60px 0px", ...options }
    );

    io.observe(el);
    return () => io.disconnect();
  }, []);

  return observe;
}
