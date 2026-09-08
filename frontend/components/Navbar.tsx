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
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-xs">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand & Problem Statement Badge */}
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white font-bold text-lg shadow-xs">
              CW
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold tracking-tight text-slate-900">
                  ComplyWise
                </span>
                <span className="hidden sm:inline-flex items-center rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700 border border-indigo-200/60">
                  PS 26130
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden md:block">
                Industrial Compliance & Standards Intelligence
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
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Backend Connectivity Status Indicator */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50/80 px-3 py-1">
            <span
              className={`h-2 w-2 rounded-full ${
                checking
                  ? "bg-amber-400 animate-pulse"
                  : isOnline
                  ? "bg-emerald-500"
                  : "bg-rose-500"
              }`}
            />
            <span className="text-xs font-medium text-slate-700">
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
