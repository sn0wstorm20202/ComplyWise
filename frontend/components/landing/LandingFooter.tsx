"use client";

import React, { useRef, useEffect, useState } from "react";
import Link from "next/link";

interface LandingFooterProps {
  onRequestDemo: () => void;
}

export function LandingFooter({ onRequestDemo }: LandingFooterProps) {
  const footerRef = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const footer = footerRef.current;
    if (!footer) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          io.unobserve(footer);
        }
      },
      { threshold: 0.15 }
    );
    io.observe(footer);
    return () => io.disconnect();
  }, []);

  return (
    <footer
      ref={footerRef}
      className="bg-[#06080A] border-t border-white/[0.06] py-10 text-xs"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(12px)",
        transition: "opacity 0.7s ease, transform 0.7s cubic-bezier(0.16,1,0.3,1)",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-white/[0.06] text-[#E5E9E8] font-bold text-xs flex items-center justify-center border border-white/[0.08] hover:bg-white/[0.10] transition-colors duration-200">
            CW
          </div>
          <div>
            <div className="font-bold text-[#E5E9E8] text-xs font-sans">ComplyWise</div>
            <div className="text-[11px] text-[#7E878E]">BIS Compliance Intelligence</div>
          </div>
        </div>

        {/* Links */}
        <div className="flex flex-wrap items-center justify-center gap-6 text-[#7E878E] font-medium font-sans">
          <a href="#product" className="hover:text-[#E5E9E8] transition-colors duration-150">
            Product
          </a>
          <Link href="/dashboard" className="hover:text-[#E5E9E8] transition-colors duration-150">
            Platform
          </Link>
          <a href="#standards" className="hover:text-[#E5E9E8] transition-colors duration-150">
            Standards
          </a>
          <a href="#intelligence" className="hover:text-[#E5E9E8] transition-colors duration-150">
            BIS Agent
          </a>
          <button
            onClick={onRequestDemo}
            className="hover:text-[#E5E9E8] transition-colors duration-150 cursor-pointer"
          >
            Contact
          </button>
        </div>

        {/* Status / Note */}
        <div className="text-[11px] text-[#7E878E] font-normal text-center md:text-right font-sans">
          Building the future of connected compliance, one capability at a time.
          <div className="text-[10px] text-[#3B4550] font-mono mt-0.5">
            Platform in active development
          </div>
        </div>
      </div>
    </footer>
  );
}

export default LandingFooter;
