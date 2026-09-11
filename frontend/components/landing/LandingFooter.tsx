"use client";

import React from "react";
import Link from "next/link";

interface LandingFooterProps {
  onRequestDemo: () => void;
}

export function LandingFooter({ onRequestDemo }: LandingFooterProps) {
  return (
    <footer className="bg-white border-t border-[#E2E8F0] py-10 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-[#0F172A] text-white font-bold text-xs flex items-center justify-center shadow-xs">
            CW
          </div>
          <div>
            <div className="font-bold text-[#0F172A] text-xs font-sans">ComplyWise</div>
            <div className="text-[11px] text-[#64748B]">BIS Compliance Intelligence</div>
          </div>
        </div>

        {/* Links */}
        <div className="flex flex-wrap items-center justify-center gap-6 text-[#64748B] font-medium font-sans">
          <a href="#product" className="hover:text-[#0F172A] transition-colors">
            Product
          </a>
          <Link href="/dashboard" className="hover:text-[#0F172A] transition-colors">
            Platform
          </Link>
          <a href="#standards" className="hover:text-[#0F172A] transition-colors">
            Standards
          </a>
          <a href="#intelligence" className="hover:text-[#0F172A] transition-colors">
            BIS Agent
          </a>
          <button
            onClick={onRequestDemo}
            className="hover:text-[#0F172A] transition-colors cursor-pointer"
          >
            Contact
          </button>
        </div>

        {/* Status / Note */}
        <div className="text-[11px] text-[#64748B] font-normal text-center md:text-right font-sans">
          Building the future of connected compliance, one capability at a time.
          <div className="text-[10px] text-[#94A3B8] font-mono mt-0.5">
            Platform in active development
          </div>
        </div>
      </div>
    </footer>
  );
}

export default LandingFooter;
