"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

/**
 * Fade-up entry animation triggered by scroll.
 * Elements start translated down with blur and opacity 0,
 * then resolve to their natural position.
 */
export function useFadeUp(options?: { delay?: number; duration?: number; y?: number }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;

    gsap.set(el, {
      y: options?.y ?? 60,
      opacity: 0,
      filter: "blur(8px)",
    });

    const trigger = ScrollTrigger.create({
      trigger: el,
      start: "top 88%",
      onEnter: () => {
        gsap.to(el, {
          y: 0,
          opacity: 1,
          filter: "blur(0px)",
          duration: options?.duration ?? 1,
          delay: options?.delay ?? 0,
          ease: "power3.out",
        });
      },
      once: true,
    });

    return () => trigger.kill();
  }, [options?.delay, options?.duration, options?.y]);

  return ref;
}

/**
 * Staggered children fade-up animation.
 * Each direct child animates in sequence.
 */
export function useStaggerFadeUp(options?: { stagger?: number; duration?: number; y?: number }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;
    const children = el.children;

    gsap.set(children, {
      y: options?.y ?? 50,
      opacity: 0,
    });

    const trigger = ScrollTrigger.create({
      trigger: el,
      start: "top 85%",
      onEnter: () => {
        gsap.to(children, {
          y: 0,
          opacity: 1,
          duration: options?.duration ?? 0.8,
          stagger: options?.stagger ?? 0.12,
          ease: "power3.out",
        });
      },
      once: true,
    });

    return () => trigger.kill();
  }, [options?.stagger, options?.duration, options?.y]);

  return ref;
}

/**
 * Scale-up entry animation for hero product previews.
 * Element starts at scale 0.92 and resolves to 1.0.
 */
export function useScaleUp(options?: { delay?: number; duration?: number }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;

    gsap.set(el, {
      scale: 0.88,
      opacity: 0,
      filter: "blur(6px)",
    });

    const trigger = ScrollTrigger.create({
      trigger: el,
      start: "top 90%",
      onEnter: () => {
        gsap.to(el, {
          scale: 1,
          opacity: 1,
          filter: "blur(0px)",
          duration: options?.duration ?? 1.2,
          delay: options?.delay ?? 0.15,
          ease: "power3.out",
        });
      },
      once: true,
    });

    return () => trigger.kill();
  }, [options?.delay, options?.duration]);

  return ref;
}

/**
 * Scrubbing text reveal — each word's opacity scrubs from 0.1 to 1.0
 * as the user scrolls through the section.
 */
export function useScrubReveal() {
  const ref = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;

    // Split text into individual word spans
    const text = el.textContent || "";
    const words = text.split(/\s+/).filter(Boolean);
    el.textContent = "";

    words.forEach((word, i) => {
      const span = document.createElement("span");
      span.textContent = word + " ";
      span.style.opacity = "0.12";
      span.style.display = "inline";
      span.style.transition = "none";
      el.appendChild(span);
    });

    const spans = el.querySelectorAll("span");

    gsap.to(spans, {
      opacity: 1,
      stagger: 0.04,
      ease: "none",
      scrollTrigger: {
        trigger: el,
        start: "top 80%",
        end: "bottom 40%",
        scrub: 1,
      },
    });

    return () => {
      ScrollTrigger.getAll().forEach((t) => {
        if (t.trigger === el) t.kill();
      });
    };
  }, []);

  return ref;
}

/**
 * Parallax float effect for background elements.
 */
export function useParallax(speed: number = 0.3) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;

    gsap.to(el, {
      y: () => speed * 120,
      ease: "none",
      scrollTrigger: {
        trigger: el,
        start: "top bottom",
        end: "bottom top",
        scrub: true,
      },
    });

    return () => {
      ScrollTrigger.getAll().forEach((t) => {
        if (t.trigger === el) t.kill();
      });
    };
  }, [speed]);

  return ref;
}
