"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowUpRight, Menu, X } from "lucide-react";
import gsap from "gsap";

interface FloatingNavProps {
  onSeeWhatApplies?: () => void;
}

export function FloatingNav(_: FloatingNavProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navContainerRef = useRef<HTMLElement>(null);
  const pillRef = useRef<HTMLDivElement>(null);
  const brandRef = useRef<HTMLAnchorElement>(null);
  const linksRef = useRef<HTMLDivElement>(null);
  const ctaGroupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileOpen(false);
    };
    document.addEventListener("keydown", close);
    return () => document.removeEventListener("keydown", close);
  }, [mobileOpen]);

  // Signature entrance animation per design.md Section 12
  useEffect(() => {
    const mm = gsap.matchMedia();
    mm.add({
      desktop: "(min-width: 1280px)",
      compact: "(max-width: 1279px)",
      reduced: "(prefers-reduced-motion: reduce)",
    }, (context) => {
      if (context.conditions?.reduced) return;
      const tl = gsap.timeline({ defaults: { ease: "expo.out" } });

      tl.fromTo(
        pillRef.current,
        {
          scaleX: 0.96,
          opacity: 0,
          y: -20,
        },
        {
          scaleX: 1,
          opacity: 1,
          y: 0,
          duration: 1.1,
          delay: 0.2,
        }
      )
        .fromTo(
          brandRef.current,
          { opacity: 0, x: -15 },
          { opacity: 1, x: 0, duration: 0.6 },
          "-=0.5"
        )
        .fromTo(
          linksRef.current?.children || [],
          { opacity: 0, y: 8 },
          { opacity: 1, y: 0, stagger: 0.08, duration: 0.5 },
          "-=0.4"
        )
        .fromTo(
          ctaGroupRef.current,
          { opacity: 0, scale: 0.95 },
          { opacity: 1, scale: 1, duration: 0.6 },
          "-=0.4"
        );
    }, navContainerRef);

    return () => mm.revert();
  }, []);

  return (
    <>
      {/* Floating Capsule Header */}
      <header
        ref={navContainerRef}
        className="fixed top-5 inset-x-0 z-50 flex justify-center px-4 pointer-events-none"
      >
        <div
          ref={pillRef}
          className={`pointer-events-auto max-w-4xl w-full rounded-full transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] ${
            scrolled
              ? "bg-[#F7F5EF]/92 backdrop-blur-xl border border-[rgba(23,23,20,0.12)] shadow-[0_12px_36px_rgba(23,23,20,0.06)] py-2.5 px-4 sm:px-6"
              : "bg-[#F7F5EF]/80 backdrop-blur-lg border border-[rgba(23,23,20,0.07)] shadow-[0_4px_20px_rgba(23,23,20,0.03)] py-3 px-5 sm:px-7"
          }`}
        >
          <div className="flex flex-wrap gap-3 items-center justify-between">
            {/* Minimal Brand Monogram & Title */}
            <Link
              ref={brandRef}
              href="/"
              className="flex items-center gap-2.5 group"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#171714] text-[#F7F5EF] font-mono text-[11px] font-semibold tracking-wider transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-105">
                CW
              </div>
              <div className="flex items-center gap-2">
                <span className="font-sans text-[13.5px] font-semibold tracking-tight text-[#171714]">
                  ComplyWise
                </span>
                <span className="hidden md:inline-block font-mono text-[9px] uppercase tracking-[0.16em] text-[#96938A] border-l border-[rgba(23,23,20,0.12)] pl-2">
                  Business clarity
                </span>
              </div>
            </Link>

            {/* Quiet Editorial Section Links (Desktop per design_updated.md) */}
            <nav
              ref={linksRef}
              className="hidden lg:flex items-center gap-7 text-[12.5px] text-[#6F6D66] font-medium"
            >
              <a
                href="#story"
                className="nav-story-link hover:text-[#557D6B] transition-colors duration-300"
              >
                Product
              </a>
              <a
                href="#mechanism"
                className="nav-story-link hover:text-[#557D6B] transition-colors duration-300"
              >
                How It Works
              </a>
              <a
                href="#evidence"
                className="nav-story-link hover:text-[#557D6B] transition-colors duration-300"
              >
                Evidence
              </a>
              <a
                href="#faq"
                className="nav-story-link hover:text-[#557D6B] transition-colors duration-300"
              >
                FAQ
              </a>
            </nav>

            {/* Right: Focused Sign In + Explore Workspace */}
            <div
              ref={ctaGroupRef}
              className="flex items-center gap-2 sm:gap-3"
            >
              <Link
                href="/auth/signin"
                className="hidden sm:inline-flex text-[12px] sm:text-[13px] font-medium text-[#6F6D66] hover:text-[#171714] px-2.5 py-1.5 transition-colors duration-300"
              >
                Sign In
              </Link>

              <Link
                href="/dashboard"
                className="group relative inline-flex items-center gap-2 rounded-full bg-[#171714] hover:bg-[#557D6B] text-[#F7F5EF] pl-4 pr-1.5 py-1.5 text-[12px] sm:text-[12.5px] font-medium shadow-sm transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98]"
              >
                <span>Explore<span className="hidden sm:inline"> Workspace</span></span>
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/15 text-[#F7F5EF] transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                  <ArrowUpRight className="h-3 w-3" strokeWidth={2} />
                </span>
              </Link>

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="lg:hidden p-1.5 text-[#171714] rounded-full hover:bg-[rgba(23,23,20,0.05)] transition-colors"
                aria-label="Toggle navigation menu"
                aria-expanded={mobileOpen}
                aria-controls="mobile-story-nav"
              >
                {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      {mobileOpen && (
        <nav id="mobile-story-nav" aria-label="Mobile navigation" className="fixed inset-0 z-40 bg-[#F7F5EF] px-6 pt-28 pb-10 flex flex-col justify-between lg:hidden animate-in fade-in duration-300">
          <div className="space-y-6">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#96938A]">
              Navigation
            </p>
            <div className="flex flex-col gap-5 text-xl font-serif text-[#171714]">
              <a
                href="#story"
                onClick={() => setMobileOpen(false)}
                className="hover:text-[#557D6B] transition-colors"
              >
                Product
              </a>
              <a
                href="#mechanism"
                onClick={() => setMobileOpen(false)}
                className="hover:text-[#557D6B] transition-colors"
              >
                How It Works
              </a>
              <a
                href="#evidence"
                onClick={() => setMobileOpen(false)}
                className="hover:text-[#557D6B] transition-colors"
              >
                Evidence
              </a>
              <a
                href="#faq"
                onClick={() => setMobileOpen(false)}
                className="hover:text-[#557D6B] transition-colors"
              >
                Frequently Asked Questions
              </a>
            </div>
          </div>

          <div className="space-y-4 pt-8 border-t border-[rgba(23,23,20,0.08)]">
            <Link
              href="/auth/signin"
              onClick={() => setMobileOpen(false)}
              className="block w-full text-center py-3 rounded-full border border-[rgba(23,23,20,0.12)] text-[#171714] font-medium text-sm"
            >
              Sign In to ComplyWise
            </Link>
            <Link
              href="/dashboard"
              onClick={() => setMobileOpen(false)}
              className="flex items-center justify-center gap-2 w-full py-3.5 rounded-full bg-[#171714] text-[#F7F5EF] font-medium text-sm"
            >
              <span>Explore Workspace</span>
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </nav>
      )}
    </>
  );
}

export default FloatingNav;
