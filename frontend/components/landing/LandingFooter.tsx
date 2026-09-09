"use client";

import React from "react";
import Link from "next/link";

interface LandingFooterProps {
  onRequestDemo: () => void;
}

export function LandingFooter({ onRequestDemo }: LandingFooterProps) {
  return (
    <footer className="bg-white border-t border-slate-200/80 py-10 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="h-7 w-7 rounded-md bg-slate-900 text-white font-bold text-xs flex items-center justify-center">
            CW
          </div>
          <div>
            <div className="font-bold text-slate-950 text-xs">ComplyWise</div>
            <div className="text-[11px] text-slate-500">BIS Compliance Intelligence</div>
          </div>
        </div>

        {/* Links */}
        <div className="flex flex-wrap items-center justify-center gap-6 text-slate-600 font-medium">
          <a href="#product" className="hover:text-slate-950 transition-colors">
            Product
          </a>
          <Link href="/dashboard" className="hover:text-slate-950 transition-colors">
            Platform
          </Link>
          <a href="#standards" className="hover:text-slate-950 transition-colors">
            Standards
          </a>
          <a href="#intelligence" className="hover:text-slate-950 transition-colors">
            BIS Agent
          </a>
          <button
            onClick={onRequestDemo}
            className="hover:text-slate-950 transition-colors cursor-pointer"
          >
            Contact
          </button>
        </div>

        {/* Status / Note */}
        <div className="text-[11px] text-stone-500 font-normal text-center md:text-right">
          Building the future of connected compliance, one capability at a time.
          <div className="text-[10px] text-stone-400 font-mono mt-0.5">
            Platform in active development
          </div>
        </div>
      </div>
    </footer>
  );
}

export default LandingFooter;
