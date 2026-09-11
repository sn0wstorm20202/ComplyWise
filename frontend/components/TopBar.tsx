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
    <header className="h-16 px-6 lg:px-8 border-b border-white/[0.07] flex items-center justify-between bg-[#09090B]/80 backdrop-blur-md sticky top-0 z-30 select-none">
      {/* Left: Brand Identity + Primary Nav Pills */}
      <div className="flex items-center gap-6 lg:gap-8">
        {/* Brand Logo & Name */}
        <Link
          href="/dashboard"
          className="flex items-center group cursor-pointer"
        >
          <ComplyWiseLogo className="h-7 w-7 text-[#F5F5F3] transition-transform group-hover:scale-105" showSubtitle={true} />
        </Link>

        {/* Primary Segmented Navigation Pills */}
        <nav
          aria-label="Primary Navigation"
          className="hidden md:flex items-center p-1 rounded-full bg-white/[0.04] border border-white/[0.07] text-xs font-medium"
        >
          <button
            type="button"
            onClick={() => onSelectPill("dashboard")}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full transition-all cursor-pointer ${
              activePill === "dashboard"
                ? "bg-white/[0.10] border border-white/[0.08] text-[#F5F5F3] font-medium shadow-xs"
                : "text-[#71717A] hover:text-[#A1A1AA] hover:bg-white/[0.03]"
            }`}
          >
            <LayoutDashboard className={`h-3.5 w-3.5 ${activePill === "dashboard" ? "text-[#F5F5F3]" : "text-[#71717A]"}`} />
            <span>Dashboard</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectPill("compliance")}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full transition-all cursor-pointer ${
              activePill === "compliance"
                ? "bg-white/[0.10] border border-white/[0.08] text-[#F5F5F3] font-medium shadow-xs"
                : "text-[#71717A] hover:text-[#A1A1AA] hover:bg-white/[0.03]"
            }`}
          >
            <ShieldCheck className={`h-3.5 w-3.5 ${activePill === "compliance" ? "text-[#F5F5F3]" : "text-[#71717A]"}`} />
            <span>Compliance</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectPill("reports")}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full transition-all cursor-pointer ${
              activePill === "reports"
                ? "bg-white/[0.10] border border-white/[0.08] text-[#F5F5F3] font-medium shadow-xs"
                : "text-[#71717A] hover:text-[#A1A1AA] hover:bg-white/[0.03]"
            }`}
          >
            <Flag className={`h-3.5 w-3.5 ${activePill === "reports" ? "text-[#F5F5F3]" : "text-[#71717A]"}`} />
            <span>Reports</span>
          </button>
        </nav>
      </div>

      {/* Right: Team Stack + Utility Actions + Profile */}
      <div className="flex items-center gap-3 lg:gap-4">
        {/* Team Members Avatar Stack */}
        <div className="hidden sm:flex items-center gap-2.5">
          <div className="flex items-center -space-x-2 overflow-hidden">
            <div
              title="Dr. Vikramaditya Sharma (Head of QA)"
              className="inline-block h-7 w-7 rounded-full ring-1 ring-[#09090B] bg-[#17191C] border border-white/[0.12] text-[#F5F5F3] text-[10px] font-medium flex items-center justify-center cursor-pointer"
            >
              VS
            </div>
            <div
              title="Priya Sundaram (Lab Test Engineer)"
              className="inline-block h-7 w-7 rounded-full ring-1 ring-[#09090B] bg-[#1E2230] border border-accent/30 text-accent text-[10px] font-medium flex items-center justify-center cursor-pointer"
            >
              PS
            </div>
            <div
              title="Arun Mehra (Safety Officer)"
              className="inline-block h-7 w-7 rounded-full ring-1 ring-[#09090B] bg-[#18261F] border border-emerald-500/30 text-emerald-400 text-[10px] font-medium flex items-center justify-center cursor-pointer"
            >
              AM
            </div>
            <div
              title="3 more members"
              className="inline-block h-7 w-7 rounded-full ring-1 ring-[#09090B] bg-[#17191C] border border-white/[0.10] text-[#71717A] text-[9px] font-medium flex items-center justify-center cursor-pointer"
            >
              +3
            </div>
          </div>

          {/* Add Member Button */}
          <button
            type="button"
            onClick={() => setInviteModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#17191C] hover:bg-white/[0.06] border border-white/[0.08] text-[#A1A1AA] hover:text-[#F5F5F3] text-xs font-medium transition-colors cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5 text-[#71717A]" />
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
            className="relative h-8 w-8 rounded-[8px] bg-[#17191C] border border-white/[0.08] hover:bg-white/[0.06] flex items-center justify-center text-[#A1A1AA] hover:text-[#F5F5F3] transition-colors cursor-pointer"
          >
            <Bell className="h-4 w-4" />
            {unreadNotifications && (
              <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-rose-500 ring-1 ring-[#09090B]" />
            )}
          </button>

          {/* Mail Envelope */}
          <button
            type="button"
            aria-label="Messages"
            onClick={() => onNavigateToView("assistant")}
            title="BIS Copilot Assistant Messages"
            className="h-8 w-8 rounded-[8px] bg-[#17191C] border border-white/[0.08] hover:bg-white/[0.06] flex items-center justify-center text-[#A1A1AA] hover:text-[#F5F5F3] transition-colors cursor-pointer"
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
              className="flex items-center gap-1.5 p-0.5 rounded-full hover:bg-white/[0.06] transition-colors cursor-pointer focus:outline-hidden"
            >
              <div className="relative h-7 w-7 rounded-full ring-1 ring-white/[0.12] overflow-hidden shrink-0">
                <Image
                  src="/assets/avatars/user.png"
                  alt={profile.officer || "User"}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
              <ChevronDown className="h-3 w-3 text-[#71717A] hidden sm:block" />
            </button>

            {/* Profile Dropdown Menu */}
            {profileDropdownOpen && (
              <div className="absolute right-0 top-10 z-40 w-64 bg-[#17191C] rounded-[12px] shadow-2xl border border-white/[0.10] p-2 space-y-1 text-xs animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-3 py-2 border-b border-white/[0.07]">
                  <div className="font-semibold text-[#F5F5F3] truncate">{profile.businessName}</div>
                  <div className="text-[11px] text-[#71717A] truncate">{profile.officer}</div>
                  <div className="mt-1 font-mono text-[10px] text-accent font-medium">{profile.bisRegistration}</div>
                </div>

                <div className="py-1">
                  <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#71717A]">
                    Switch Demo Profile
                  </div>
                  {availableProfiles.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        switchProfile(p.id);
                        setProfileDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 rounded-[8px] text-xs flex items-center gap-2 transition-colors ${
                        profile.id === p.id
                          ? "bg-white/[0.08] text-[#F5F5F3] font-medium"
                          : "hover:bg-white/[0.04] text-[#A1A1AA] hover:text-[#F5F5F3]"
                      }`}
                    >
                      <Building2 className="h-3.5 w-3.5 text-[#71717A] shrink-0" />
                      <span className="truncate">{p.businessName}</span>
                    </button>
                  ))}
                </div>

                <div className="pt-1 border-t border-white/[0.07] space-y-0.5">
                  <button
                    onClick={() => {
                      onNavigateToView("profile");
                      setProfileDropdownOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-[8px] text-[#A1A1AA] hover:text-[#F5F5F3] hover:bg-white/[0.04] flex items-center gap-2"
                  >
                    <User className="h-3.5 w-3.5 text-[#71717A]" />
                    <span>Business Profile</span>
                  </button>

                  <button
                    onClick={() => {
                      onNavigateToView("settings");
                      setProfileDropdownOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-[8px] text-[#A1A1AA] hover:text-[#F5F5F3] hover:bg-white/[0.04] flex items-center gap-2"
                  >
                    <Settings className="h-3.5 w-3.5 text-[#71717A]" />
                    <span>Settings</span>
                  </button>

                  <Link
                    href="/onboarding?new=true"
                    onClick={() => setProfileDropdownOpen(false)}
                    className="w-full text-left px-3 py-2 rounded-[8px] text-accent hover:bg-accent/10 flex items-center gap-2 font-medium"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-accent" />
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
