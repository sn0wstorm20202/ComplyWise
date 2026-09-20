"use client";

import React from "react";
import Link from "next/link";

interface LandingFooterProps {
  onRequestDemo: () => void;
}

export function LandingFooter({ onRequestDemo }: LandingFooterProps) {
  return (
    <footer className="bg-cw-cream border-t border-cw-parchment py-10 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-cw-forest text-cw-cream font-serif font-bold text-xs flex items-center justify-center shadow-sm border border-cw-sage-deep/30">
            CW
          </div>
          <div>
            <div className="font-bold text-cw-charcoal text-xs font-serif">ComplyWise</div>
            <div className="text-[11px] text-cw-forest/80">BIS Compliance Intelligence</div>
          </div>
        </div>

        {/* Links */}
        <div className="flex flex-wrap items-center justify-center gap-6 text-cw-forest/80 font-medium font-sans">
          <a href="#product" className="hover:text-cw-charcoal transition-colors">
            Product
          </a>
          <Link href="/dashboard" className="hover:text-cw-charcoal transition-colors">
            Platform
          </Link>
          <a href="#standards" className="hover:text-cw-charcoal transition-colors">
            Standards
          </a>
          <a href="#intelligence" className="hover:text-cw-charcoal transition-colors">
            BIS Agent
          </a>
          <button
            onClick={onRequestDemo}
            className="hover:text-cw-charcoal transition-colors cursor-pointer"
          >
            Contact
          </button>
        </div>

        {/* Status / Note */}
        <div className="text-[11px] text-cw-forest/70 font-normal text-center md:text-right font-sans">
          Building the future of connected compliance, one capability at a time.
          <div className="text-[10px] text-cw-sage-deep font-mono mt-0.5">
            Platform in active development
          </div>
        </div>
      </div>
    </footer>
  );
}

export default LandingFooter;
