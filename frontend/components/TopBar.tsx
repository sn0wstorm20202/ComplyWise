"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Bell,
  Mail,
  Plus,
  LayoutDashboard,
  ShieldCheck,
  Flag,
  ChevronDown,
  User,
  Settings,
  Building2,
  LogOut,
  Sparkles,
} from "lucide-react";
import ComplyWiseLogo from "./icons/ComplyWiseLogo";
import { NavView } from "./Sidebar";
import { NotificationsPopover, TeamInviteModal } from "./dashboard/DashboardDrawers";
import { useBusinessContext } from "@/context/BusinessContext";

interface TopBarProps {
  activePill: "dashboard" | "compliance" | "reports";
  onSelectPill: (pill: "dashboard" | "compliance" | "reports") => void;
  onNavigateToView: (view: NavView) => void;
  onAddMember?: () => void;
}

export function TopBar({
  activePill,
  onSelectPill,
  onNavigateToView,
}: TopBarProps) {
  const { profile, availableProfiles, switchProfile } = useBusinessContext();

  const [unreadNotifications, setUnreadNotifications] = useState(true);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  return (
    <header className="h-16 px-6 lg:px-8 border-b border-black/[0.04] flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-30 select-none">
      {/* Left: Brand Identity + Primary Nav Pills */}
      <div className="flex items-center gap-6 lg:gap-8">
        {/* Brand Logo & Name */}
        <Link
          href="/dashboard"
          className="flex items-center group cursor-pointer"
        >
          <ComplyWiseLogo className="h-7 w-7 text-slate-900 transition-transform group-hover:scale-105" showSubtitle={true} />
        </Link>

        {/* Primary Segmented Navigation Pills */}
        <nav
          aria-label="Primary Navigation"
          className="hidden md:flex items-center p-1 rounded-full bg-[#edf0f5]/80 text-xs font-semibold"
        >
          <button
            type="button"
            onClick={() => onSelectPill("dashboard")}
            className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full transition-all cursor-pointer ${
              activePill === "dashboard"
                ? "bg-[#0f172a] text-white shadow-xs font-bold"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
            }`}
          >
            <LayoutDashboard className={`h-3.5 w-3.5 ${activePill === "dashboard" ? "text-white" : "text-slate-500"}`} />
            <span>Dashboard</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectPill("compliance")}
            className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full transition-all cursor-pointer ${
              activePill === "compliance"
                ? "bg-[#0f172a] text-white shadow-xs font-bold"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
            }`}
          >
            <ShieldCheck className={`h-3.5 w-3.5 ${activePill === "compliance" ? "text-white" : "text-slate-500"}`} />
            <span>Compliance</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectPill("reports")}
            className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full transition-all cursor-pointer ${
              activePill === "reports"
                ? "bg-[#0f172a] text-white shadow-xs font-bold"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
            }`}
          >
            <Flag className={`h-3.5 w-3.5 ${activePill === "reports" ? "text-white" : "text-slate-500"}`} />
            <span>Reports</span>
          </button>
        </nav>
      </div>

      {/* Right: Team Stack + Utility Actions + Profile */}
      <div className="flex items-center gap-3 lg:gap-5">
        {/* Team Members Avatar Stack */}
        <div className="hidden sm:flex items-center gap-2.5">
          <div className="flex items-center -space-x-2 overflow-hidden">
            <div
              title="Dr. Vikramaditya Sharma (Head of QA)"
              className="inline-block h-8 w-8 rounded-full ring-2 ring-white bg-slate-900 text-white text-[11px] font-bold flex items-center justify-center cursor-pointer shadow-2xs"
            >
              VS
            </div>
            <div
              title="Priya Sundaram (Lab Test Engineer)"
              className="inline-block h-8 w-8 rounded-full ring-2 ring-white bg-indigo-600 text-white text-[11px] font-bold flex items-center justify-center cursor-pointer shadow-2xs"
            >
              PS
            </div>
            <div
              title="Arun Mehra (Safety Officer)"
              className="inline-block h-8 w-8 rounded-full ring-2 ring-white bg-emerald-600 text-white text-[11px] font-bold flex items-center justify-center cursor-pointer shadow-2xs"
            >
              AM
            </div>
            <div
              title="3 more members"
              className="inline-block h-8 w-8 rounded-full ring-2 ring-white bg-[#0f172a] text-white text-[10px] font-bold flex items-center justify-center cursor-pointer shadow-2xs"
            >
              +3
            </div>
          </div>

          {/* Add Member Button */}
          <button
            type="button"
            onClick={() => setInviteModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200/80 border border-slate-200/70 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5 text-slate-500" />
            <span>Add Member</span>
          </button>
        </div>

        {/* Action Icons (Alerts, Mail) */}
        <div className="flex items-center gap-2 relative">
          {/* Notification Bell */}
          <button
            type="button"
            aria-label="Notifications"
            onClick={() => {
              setNotificationsOpen((prev) => !prev);
              setUnreadNotifications(false);
            }}
            className="relative h-9 w-9 rounded-full bg-white border border-slate-200/70 hover:bg-slate-50 flex items-center justify-center text-slate-600 transition-colors shadow-2xs cursor-pointer"
          >
            <Bell className="h-4 w-4" />
            {unreadNotifications && (
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white animate-pulse" />
            )}
          </button>

          {/* Mail Envelope */}
          <button
            type="button"
            aria-label="Messages"
            onClick={() => onNavigateToView("assistant")}
            title="BIS Copilot Assistant Messages"
            className="h-9 w-9 rounded-full bg-white border border-slate-200/70 hover:bg-slate-50 flex items-center justify-center text-slate-600 transition-colors shadow-2xs cursor-pointer"
          >
            <Mail className="h-4 w-4" />
          </button>

          {/* Notifications Popover */}
          <NotificationsPopover
            isOpen={notificationsOpen}
            onClose={() => setNotificationsOpen(false)}
          />

          {/* User Profile Avatar Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setProfileDropdownOpen((prev) => !prev)}
              aria-label="User profile menu"
              className="flex items-center gap-1.5 p-0.5 rounded-full hover:bg-slate-100 transition-colors cursor-pointer focus:outline-hidden"
            >
              <div className="relative h-8 w-8 rounded-full ring-2 ring-slate-200 overflow-hidden shadow-xs shrink-0">
                <Image
                  src="/assets/avatars/user.png"
                  alt={profile.officer || "User"}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
              <ChevronDown className="h-3 w-3 text-slate-400 hidden sm:block" />
            </button>

            {/* Profile Dropdown Menu */}
            {profileDropdownOpen && (
              <div className="absolute right-0 top-11 z-40 w-64 bg-white rounded-2xl shadow-2xl border border-slate-200 p-2 space-y-1 text-xs animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-3 py-2 border-b border-slate-100">
                  <div className="font-bold text-slate-900 truncate">{profile.businessName}</div>
                  <div className="text-[11px] text-slate-400 truncate">{profile.officer}</div>
                  <div className="mt-1 font-mono text-[10px] text-indigo-600 font-semibold">{profile.bisRegistration}</div>
                </div>

                <div className="py-1">
                  <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Switch Demo Profile
                  </div>
                  {availableProfiles.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        switchProfile(p.id);
                        setProfileDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 rounded-xl text-xs flex items-center gap-2 transition-colors ${
                        profile.id === p.id
                          ? "bg-indigo-50 text-indigo-700 font-bold"
                          : "hover:bg-slate-50 text-slate-700"
                      }`}
                    >
                      <Building2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{p.businessName}</span>
                    </button>
                  ))}
                </div>

                <div className="pt-1 border-t border-slate-100 space-y-0.5">
                  <button
                    onClick={() => {
                      onNavigateToView("profile");
                      setProfileDropdownOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                  >
                    <User className="h-3.5 w-3.5 text-slate-400" />
                    <span>Business Profile</span>
                  </button>

                  <button
                    onClick={() => {
                      onNavigateToView("settings");
                      setProfileDropdownOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                  >
                    <Settings className="h-3.5 w-3.5 text-slate-400" />
                    <span>Settings</span>
                  </button>

                  <Link
                    href="/onboarding?new=true"
                    onClick={() => setProfileDropdownOpen(false)}
                    className="w-full text-left px-3 py-2 rounded-xl text-indigo-600 hover:bg-indigo-50 flex items-center gap-2 font-semibold"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
                    <span>Run New Onboarding</span>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Team Invite Modal */}
      <TeamInviteModal
        isOpen={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
      />
    </header>
  );
}

export default TopBar;
