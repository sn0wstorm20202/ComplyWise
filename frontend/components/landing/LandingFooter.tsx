"use client";

import React from "react";
import Link from "next/link";

interface LandingFooterProps {
  onSeeWhatApplies?: () => void;
}

export function LandingFooter({ onSeeWhatApplies }: LandingFooterProps) {
  return (
    <footer className="bg-[#EFEEE7] border-t border-[rgba(23,23,20,0.08)] py-16 sm:py-24 text-xs font-sans">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
          {/* Brand & Manifesto Statement */}
          <div className="md:col-span-5 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#171714] text-[#F7F5EF] font-mono text-[11px] font-semibold tracking-wider">
                CW
              </div>
              <span className="font-sans text-base font-semibold tracking-tight text-[#171714]">
                ComplyWise
              </span>
            </div>
            <p className="text-[#6F6D66] font-light leading-relaxed max-w-sm">
              You tell us about your business. We help you see what matters — and what to do next.
            </p>
            <div className="pt-2">
              <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#96938A]">
                SOURCE-LINKED &bull; BUSINESS-FOCUSED
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="md:col-span-3 space-y-3">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#96938A] block">
              Platform
            </span>
            <ul className="space-y-2 text-[#6F6D66]">
              <li>
                <Link
                  href="/dashboard"
                  className="hover:text-[#171714] transition-colors"
                >
                  Compliance Workspace
                </Link>
              </li>
              <li>
                <Link
                  href="/onboarding"
                  className="hover:text-[#171714] transition-colors"
                >
                  Business Profile
                </Link>
              </li>
              <li>
                <Link
                  href="/standards"
                  className="hover:text-[#171714] transition-colors"
                >
                  Standards
                </Link>
              </li>
              <li>
                <Link
                  href="/schemes"
                  className="hover:text-[#171714] transition-colors"
                >
                  Schemes
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources & Legal */}
          <div className="md:col-span-4 space-y-3">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#96938A] block">
              Governance &amp; Trust
            </span>
            <ul className="space-y-2 text-[#6F6D66]">
              <li>
                <a
                  href="#principle"
                  className="hover:text-[#171714] transition-colors"
                >
                  How ComplyWise Works
                </a>
              </li>
              <li>
                <a
                  href="#verification"
                  className="hover:text-[#171714] transition-colors"
                >
                  How We Check Sources
                </a>
              </li>
              <li>
                <Link
                  href="/auth/signin"
                  className="hover:text-[#171714] transition-colors"
                >
                  Sign In
                </Link>
              </li>
              <li>
                <button
                  onClick={onSeeWhatApplies}
                  className="hover:text-[#171714] transition-colors cursor-pointer text-left"
                >
                  See What Applies
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar: Sparse Copyright + Technical Metadata */}
        <div className="pt-8 border-t border-[rgba(23,23,20,0.08)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 font-mono text-[11px] text-[#96938A]">
          <div>&copy; {new Date().getFullYear()} ComplyWise. All rights reserved.</div>
          <div className="flex items-center gap-6">
            <span>JURISDICTION: IN-CENTRAL &bull; MH</span>
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[#7FAF9A]" />
              <span>SOURCE &bull; REASON &bull; NEXT STEP</span>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default LandingFooter;
