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
  LogOut,
  Menu,
} from "lucide-react";
import { useRouter } from "next/navigation";
import ComplyWiseLogo from "./icons/ComplyWiseLogo";
import { NavView } from "./Sidebar";
import { NotificationsPopover, TeamInviteModal } from "./dashboard/DashboardDrawers";
import { useBusinessContext } from "@/context/BusinessContext";
import { useAuth } from "@/context/AuthContext";

interface TopBarProps {
  activePill: "dashboard" | "compliance" | "reports";
  onSelectPill: (pill: "dashboard" | "compliance" | "reports") => void;
  onNavigateToView: (view: NavView) => void;
  onAddMember?: () => void;
  onToggleMobileMenu?: () => void;
}

export function TopBar({
  activePill,
  onSelectPill,
  onNavigateToView,
  onToggleMobileMenu,
}: TopBarProps) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { profile, availableProfiles, switchProfile } = useBusinessContext();

  const [unreadNotifications, setUnreadNotifications] = useState(true);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  async function handleLogout() {
    setProfileDropdownOpen(false);
    await logout();
    router.push("/auth/signin");
  }

  return (
    <header className="h-16 px-4 sm:px-6 lg:px-8 border-b border-[#1c1d22] flex items-center justify-between bg-[#040406]/90 backdrop-blur-md sticky top-0 z-30 select-none">
      {/* Left: Brand Identity + Primary Nav Pills */}
      <div className="flex items-center gap-3 sm:gap-6 lg:gap-8">
        {/* Mobile Menu Hamburger Button */}
        {onToggleMobileMenu && (
          <button
            type="button"
            onClick={onToggleMobileMenu}
            aria-label="Open mobile navigation"
            className="lg:hidden h-8 w-8 rounded-[8px] bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] flex items-center justify-center text-[#A4A5AA] hover:text-[#F2F2F0] transition-colors cursor-pointer"
          >
            <Menu className="h-4 w-4" />
          </button>
        )}

        {/* Brand Logo & Name */}
        <Link
          href="/dashboard"
          className="flex items-center group cursor-pointer"
        >
          <ComplyWiseLogo className="h-7 w-7 text-[#ffffff] transition-transform group-hover:scale-105" showSubtitle={true} />
        </Link>

        {/* Primary Segmented Navigation Pills */}
        <nav
          aria-label="Primary Navigation"
          className="hidden md:flex items-center p-1 rounded-full bg-[#121317] border border-[#1c1d22] text-xs font-medium"
        >
          <button
            type="button"
            onClick={() => onSelectPill("dashboard")}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full transition-all cursor-pointer ${
              activePill === "dashboard"
                ? "bg-[#1c1d22] border border-[#2e3038] text-[#ffffff] font-medium shadow-xs"
                : "text-[#9194a1] hover:text-[#ffffff] hover:bg-white/[0.02]"
            }`}
          >
            <LayoutDashboard className={`h-3.5 w-3.5 ${activePill === "dashboard" ? "text-[#ffffff]" : "text-[#777a88]"}`} />
            <span>Dashboard</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectPill("compliance")}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full transition-all cursor-pointer ${
              activePill === "compliance"
                ? "bg-[#1c1d22] border border-[#2e3038] text-[#ffffff] font-medium shadow-xs"
                : "text-[#9194a1] hover:text-[#ffffff] hover:bg-white/[0.02]"
            }`}
          >
            <ShieldCheck className={`h-3.5 w-3.5 ${activePill === "compliance" ? "text-[#ffffff]" : "text-[#777a88]"}`} />
            <span>Compliance</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectPill("reports")}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full transition-all cursor-pointer ${
              activePill === "reports"
                ? "bg-[#1c1d22] border border-[#2e3038] text-[#ffffff] font-medium shadow-xs"
                : "text-[#9194a1] hover:text-[#ffffff] hover:bg-white/[0.02]"
            }`}
          >
            <Flag className={`h-3.5 w-3.5 ${activePill === "reports" ? "text-[#ffffff]" : "text-[#777a88]"}`} />
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
              className="inline-block h-7 w-7 rounded-full ring-1 ring-[#08080a] bg-[#121317] border border-[#2e3038] text-[#e2e3e9] text-[10px] font-medium flex items-center justify-center cursor-pointer"
            >
              VS
            </div>
            <div
              title="Priya Sundaram (Lab Test Engineer)"
              className="inline-block h-7 w-7 rounded-full ring-1 ring-[#08080a] bg-[#1c1d22] border border-[#cc9166]/30 text-[#cc9166] text-[10px] font-medium flex items-center justify-center cursor-pointer"
            >
              PS
            </div>
            <div
              title="Arun Mehra (Safety Officer)"
              className="inline-block h-7 w-7 rounded-full ring-1 ring-[#08080a] bg-[#121317] border border-emerald-500/30 text-emerald-400 text-[10px] font-medium flex items-center justify-center cursor-pointer"
            >
              AM
            </div>
            <div
              title="3 more members"
              className="inline-block h-7 w-7 rounded-full ring-1 ring-[#08080a] bg-[#121317] border border-[#1c1d22] text-[#777a88] text-[9px] font-medium flex items-center justify-center cursor-pointer"
            >
              +3
            </div>
          </div>

          {/* Add Member Button */}
          <button
            type="button"
            onClick={() => setInviteModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#121317] hover:bg-[#1c1d22] border border-[#1c1d22] text-[#9194a1] hover:text-[#ffffff] text-xs font-medium transition-colors cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5 text-[#777a88]" />
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
            className="relative h-8 w-8 rounded-[10px] bg-[#121317] border border-[#1c1d22] hover:bg-[#1c1d22] flex items-center justify-center text-[#9194a1] hover:text-[#ffffff] transition-colors cursor-pointer"
          >
            <Bell className="h-4 w-4" />
            {unreadNotifications && (
              <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-[#cc9166] ring-1 ring-[#08080a]" />
            )}
          </button>

          {/* Mail Envelope */}
          <button
            type="button"
            aria-label="Messages"
            onClick={() => onNavigateToView("assistant")}
            title="BIS Copilot Assistant Messages"
            className="h-8 w-8 rounded-[10px] bg-[#121317] border border-[#1c1d22] hover:bg-[#1c1d22] flex items-center justify-center text-[#9194a1] hover:text-[#ffffff] transition-colors cursor-pointer"
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
              <div className="absolute right-0 top-10 z-40 w-64 bg-[#121317] rounded-[10px] shadow-2xl border border-[#1c1d22] p-2 space-y-1 text-xs animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-3 py-2 border-b border-[#1c1d22]">
                  <div className="font-semibold text-[#ffffff] truncate">
                    {user?.full_name || profile.businessName}
                  </div>
                  <div className="text-[11px] text-[#cc9166] truncate">
                    {user?.email || profile.officer}
                  </div>
                  <div className="mt-1 font-mono text-[10px] text-[#777a88] flex items-center justify-between">
                    <span>{profile.businessName}</span>
                    <span className="text-emerald-400 font-bold">● Active</span>
                  </div>
                </div>

                <div className="py-1">
                  <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#777a88]">
                    Switch Demo Profile
                  </div>
                  {availableProfiles.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        switchProfile(p.id);
                        setProfileDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 rounded-[8px] text-xs flex items-center gap-2 transition-colors cursor-pointer ${
                        profile.id === p.id
                          ? "bg-[#1c1d22] text-[#ffffff] font-medium"
                          : "hover:bg-white/[0.04] text-[#9194a1] hover:text-[#ffffff]"
                      }`}
                    >
                      <Building2 className="h-3.5 w-3.5 text-[#777a88] shrink-0" />
                      <span className="truncate">{p.businessName}</span>
                    </button>
                  ))}
                </div>

                <div className="pt-1 border-t border-[#1c1d22] space-y-0.5">
                  <button
                    onClick={() => {
                      onNavigateToView("profile");
                      setProfileDropdownOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-[8px] text-[#9194a1] hover:text-[#ffffff] hover:bg-white/[0.04] flex items-center gap-2 cursor-pointer"
                  >
                    <User className="h-3.5 w-3.5 text-[#777a88]" />
                    <span>Business Profile</span>
                  </button>

                  <button
                    onClick={() => {
                      onNavigateToView("settings");
                      setProfileDropdownOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-[8px] text-[#9194a1] hover:text-[#ffffff] hover:bg-white/[0.04] flex items-center gap-2 cursor-pointer"
                  >
                    <Settings className="h-3.5 w-3.5 text-[#777a88]" />
                    <span>Settings</span>
                  </button>

                  <Link
                    href="/onboarding?new=true"
                    onClick={() => setProfileDropdownOpen(false)}
                    className="w-full text-left px-3 py-2 rounded-[8px] text-[#cc9166] hover:bg-[#cc9166]/10 flex items-center gap-2 font-medium"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-[#cc9166]" />
                    <span>Run New Onboarding</span>
                  </Link>

                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-3 py-2 rounded-[8px] text-rose-400 hover:bg-rose-950/30 hover:text-rose-300 flex items-center gap-2 font-medium transition-colors cursor-pointer border-t border-[#1c1d22]/50 mt-1"
                  >
                    <LogOut className="h-3.5 w-3.5 text-rose-400" />
                    <span>Sign Out</span>
                  </button>
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
