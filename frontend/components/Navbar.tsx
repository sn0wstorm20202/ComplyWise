"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { healthApi } from "@/lib/api/health";
import { HealthData } from "@/types";

export function Navbar() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [checking, setChecking] = useState<boolean>(true);
  const [isOnline, setIsOnline] = useState<boolean | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function checkHealth() {
      try {
        const data = await healthApi.get();
        if (isMounted) {
          setHealth(data);
          setIsOnline(data?.status === "ok");
        }
      } catch {
        if (isMounted) {
          setIsOnline(false);
        }
      } finally {
        if (isMounted) {
          setChecking(false);
        }
      }
    }

    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const navItems = [
    { label: "My Profile", href: "/profile" },
    { label: "Dashboard", href: "/" },
    { label: "New / Resume Assessment", href: "/onboarding" },
    { label: "Compliance", href: "/compliance" },
    { label: "Documents", href: "/documents" },
    { label: "Workflows", href: "/workflows" },
    { label: "Calendar", href: "/calendar" },
    { label: "Schemes", href: "/schemes" },
    { label: "Standards", href: "/standards" },
    { label: "Assistant", href: "/assistant" },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#1c1d22] bg-[#040406]/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand & Problem Statement Badge */}
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#cc9166] text-[#08080a] font-bold text-lg shadow-xs">
              CW
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold tracking-tight text-[#ffffff]">
                  ComplyWise
                </span>
                <span className="hidden sm:inline-flex items-center rounded-full bg-[#121317] px-2.5 py-0.5 text-[11px] font-semibold text-[#cc9166] border border-[#2e3038]">
                  PS 26130
                </span>
              </div>
              <p className="text-[11px] text-[#777a88] hidden md:block">
                Industrial Compliance &amp; Standards Intelligence
              </p>
            </div>
          </Link>
        </div>

        {/* Navigation items */}
        <nav className="hidden lg:flex items-center gap-1">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="rounded-full px-3 py-1.5 text-xs font-medium text-[#9194a1] hover:bg-[#121317] hover:text-[#ffffff] transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Backend Connectivity Status Indicator */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-full border border-[#1c1d22] bg-[#121317] px-3 py-1">
            <span
              className={`h-2 w-2 rounded-full ${
                checking
                  ? "bg-amber-400 animate-pulse"
                  : isOnline
                  ? "bg-emerald-500"
                  : "bg-rose-500"
              }`}
            />
            <span className="text-xs font-medium text-[#9194a1]">
              {checking
                ? "Connecting..."
                : isOnline
                ? `API Online ${health?.api_version ? `(${health.api_version})` : ""}`
                : "API Offline"}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
