"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  LayoutGrid,
  FileCheck,
  Flag,
  Plus,
  Bell,
  Mail,
} from "lucide-react";
import ComplyWiseLogo from "@/components/icons/ComplyWiseLogo";
import { NavView } from "./Sidebar";

interface TopBarProps {
  activePill?: "dashboard" | "compliance" | "reports";
  onSelectPill?: (pill: "dashboard" | "compliance" | "reports") => void;
  onNavigateToView?: (view: NavView) => void;
  onAddMember?: () => void;
}

export function TopBar({
  activePill = "dashboard",
  onSelectPill,
  onNavigateToView,
  onAddMember,
}: TopBarProps) {
  const [unreadNotifications, setUnreadNotifications] = useState(true);

  function handlePillClick(pill: "dashboard" | "compliance" | "reports") {
    if (onSelectPill) onSelectPill(pill);
    if (onNavigateToView) {
      if (pill === "dashboard") onNavigateToView("dashboard");
      if (pill === "compliance") onNavigateToView("compliance");
      if (pill === "reports") onNavigateToView("updates");
    }
  }

  return (
    <header className="h-[76px] px-6 lg:px-8 flex items-center justify-between border-b border-black/[0.04] bg-transparent">
      {/* Left: Brand Identity + Segmented Nav */}
      <div className="flex items-center gap-6 lg:gap-8">
        <button
          onClick={() => handlePillClick("dashboard")}
          type="button"
          className="text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 rounded-lg"
        >
          <ComplyWiseLogo className="h-8 w-8" />
        </button>

        {/* Segmented Navigation Switcher */}
        <nav
          aria-label="Top segmented navigation"
          className="flex items-center gap-1.5 p-1 rounded-full bg-slate-200/50"
        >
          <button
            type="button"
            onClick={() => handlePillClick("dashboard")}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all ${
              activePill === "dashboard"
                ? "bg-[#0f172a] text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
            }`}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            <span>Dashboard</span>
          </button>

          <button
            type="button"
            onClick={() => handlePillClick("compliance")}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all ${
              activePill === "compliance"
                ? "bg-[#0f172a] text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
            }`}
          >
            <FileCheck className="h-3.5 w-3.5" />
            <span>Compliance</span>
          </button>

          <button
            type="button"
            onClick={() => handlePillClick("reports")}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all ${
              activePill === "reports"
                ? "bg-[#0f172a] text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
            }`}
          >
            <Flag className="h-3.5 w-3.5" />
            <span>Reports</span>
          </button>
        </nav>
      </div>

      {/* Right: Team Stack + Utility Actions + Profile */}
      <div className="flex items-center gap-4 lg:gap-6">
        {/* Team Members Avatar Stack */}
        <div className="flex items-center gap-2.5">
          <div className="relative h-9 w-28 shrink-0">
            <Image
              src="/assets/avatars/team-stack.png"
              alt="Team members"
              fill
              className="object-contain"
              unoptimized
            />
          </div>

          {/* Add Member Button */}
          <button
            type="button"
            onClick={onAddMember}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-slate-200/50 hover:bg-slate-200 text-slate-700 text-xs font-medium transition-colors"
          >
            <Plus className="h-3.5 w-3.5 text-slate-500" />
            <span>Add Member</span>
          </button>
        </div>

        {/* Action Icons (Alerts, Mail) */}
        <div className="flex items-center gap-2.5">
          {/* Notification Bell */}
          <button
            type="button"
            aria-label="Notifications"
            onClick={() => setUnreadNotifications(false)}
            className="relative h-9 w-9 rounded-full bg-white border border-slate-200/70 hover:bg-slate-50 flex items-center justify-center text-slate-600 transition-colors shadow-2xs"
          >
            <Bell className="h-4 w-4" />
            {unreadNotifications && (
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white" />
            )}
          </button>

          {/* Mail Envelope */}
          <button
            type="button"
            aria-label="Messages"
            className="h-9 w-9 rounded-full bg-white border border-slate-200/70 hover:bg-slate-50 flex items-center justify-center text-slate-600 transition-colors shadow-2xs"
          >
            <Mail className="h-4 w-4" />
          </button>

          {/* User Profile Avatar */}
          <div className="relative h-9 w-9 rounded-full ring-2 ring-slate-200 overflow-hidden bg-slate-200 ml-1 cursor-pointer">
            <Image
              src="/assets/avatars/user.png"
              alt="User profile"
              fill
              className="object-cover"
              unoptimized
            />
          </div>
        </div>
      </div>
    </header>
  );
}

export default TopBar;
