"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
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
import { useLanguage } from "@/context/LanguageContext";
import { LanguageSelector } from "./LanguageSelector";
import { api } from "@/lib/api";

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
  const { profile, activeBusinessId, availableProfiles, userBusinesses, switchProfile } = useBusinessContext();
  const { t } = useLanguage();

  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  // Synchronize unread badge with real calendar notification summary
  useEffect(() => {
    if (!activeBusinessId) return;

    let isMounted = true;
    api.calendar
      .getSummary(activeBusinessId)
      .then((res) => {
        if (isMounted && res) {
          setUnreadCount(res.unread_count || 0);
        }
      })
      .catch(() => {
        // graceful fallback
      });

    return () => {
      isMounted = false;
    };
  }, [activeBusinessId]);

  async function handleLogout() {
    setProfileDropdownOpen(false);
    await logout();
    router.push("/auth/signin");
  }

  return (
    <header className="h-16 px-4 sm:px-6 lg:px-8 border-b border-[#F0F2F5] flex items-center justify-between bg-white sticky top-0 z-30 select-none shadow-2xs">
      {/* Left: Brand Identity + Primary Nav Pills */}
      <div className="flex items-center gap-3 sm:gap-6 lg:gap-8">
        {/* Mobile Menu Hamburger Button */}
        {onToggleMobileMenu && (
          <button
            type="button"
            onClick={onToggleMobileMenu}
            aria-label="Open mobile navigation"
            className="lg:hidden h-8 w-8 rounded-[8px] bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-[#E2E8F0] flex items-center justify-center text-[#64748B] hover:text-[#0F172A] transition-colors cursor-pointer"
          >
            <Menu className="h-4 w-4" />
          </button>
        )}

        {/* Brand Logo & Name */}
        <Link
          href="/dashboard"
          className="flex items-center group cursor-pointer"
        >
          <ComplyWiseLogo className="h-7 w-7 text-[#0F172A] transition-transform group-hover:scale-105" showSubtitle={true} />
        </Link>

        {/* Primary Segmented Navigation Pills */}
        <nav
          aria-label="Primary Navigation"
          className="hidden md:flex items-center p-1 rounded-full bg-[#F1F5F9] border border-[#E2E8F0] text-xs font-medium"
        >
          <button
            type="button"
            onClick={() => onSelectPill("dashboard")}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full transition-all cursor-pointer ${
              activePill === "dashboard"
                ? "bg-[#18181B] border border-[#18181B] text-white font-medium shadow-xs"
                : "text-[#64748B] hover:text-[#0F172A] hover:bg-black/[0.03]"
            }`}
          >
            <LayoutDashboard className={`h-3.5 w-3.5 ${activePill === "dashboard" ? "text-white" : "text-[#64748B]"}`} />
            <span>{t("navigation.dashboard")}</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectPill("compliance")}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full transition-all cursor-pointer ${
              activePill === "compliance"
                ? "bg-[#18181B] border border-[#18181B] text-white font-medium shadow-xs"
                : "text-[#64748B] hover:text-[#0F172A] hover:bg-black/[0.03]"
            }`}
          >
            <ShieldCheck className={`h-3.5 w-3.5 ${activePill === "compliance" ? "text-white" : "text-[#64748B]"}`} />
            <span>{t("navigation.compliance")}</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectPill("reports")}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full transition-all cursor-pointer ${
              activePill === "reports"
                ? "bg-[#18181B] border border-[#18181B] text-white font-medium shadow-xs"
                : "text-[#64748B] hover:text-[#0F172A] hover:bg-black/[0.03]"
            }`}
          >
            <Flag className={`h-3.5 w-3.5 ${activePill === "reports" ? "text-white" : "text-[#64748B]"}`} />
            <span>{t("navigation.reports")}</span>
          </button>
        </nav>
      </div>

      {/* Right: Utility Actions + Profile */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Visible Language Selector */}
        <LanguageSelector />

        {/* Action Icons (Alerts, Mail) */}
        <div className="flex items-center gap-2 relative">
          {/* Notification Bell */}
          <button
            type="button"
            aria-label={t("header.notificationsAria")}
            onClick={() => {
              setNotificationsOpen((prev) => !prev);
            }}
            className="relative h-8 w-8 rounded-full bg-white border border-[#E2E8F0] hover:bg-[#F8FAFC] flex items-center justify-center text-[#64748B] hover:text-[#0F172A] shadow-2xs transition-colors cursor-pointer"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-white font-bold text-[9px] flex items-center justify-center ring-2 ring-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {/* Mail Envelope */}
          <button
            type="button"
            aria-label={t("header.messagesAria")}
            onClick={() => onNavigateToView("assistant")}
            title="BIS Copilot Assistant Messages"
            className="h-8 w-8 rounded-full bg-white border border-[#E2E8F0] hover:bg-[#F8FAFC] flex items-center justify-center text-[#64748B] hover:text-[#0F172A] shadow-2xs transition-colors cursor-pointer"
          >
            <Mail className="h-4 w-4" />
          </button>

          {/* Notifications Popover */}
          <NotificationsPopover
            isOpen={notificationsOpen}
            onClose={() => setNotificationsOpen(false)}
            onNotificationsRead={() => setUnreadCount(0)}
          />

          {/* User Profile Avatar Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setProfileDropdownOpen((prev) => !prev)}
              aria-label={t("header.profileMenuAria")}
              className="flex items-center gap-1.5 p-0.5 rounded-full hover:bg-gray-100 transition-colors cursor-pointer focus:outline-hidden"
            >
              <div className="h-7 w-7 rounded-full bg-[#18181B] text-white flex items-center justify-center shrink-0 shadow-2xs">
                <User className="h-3.5 w-3.5 text-white" />
              </div>
              <ChevronDown className="h-3 w-3 text-[#64748B] hidden sm:block" />
            </button>

            {/* Profile Dropdown Menu */}
            {profileDropdownOpen && (
              <div className="absolute right-0 top-10 z-40 w-64 bg-white rounded-[12px] shadow-2xl border border-[#E2E8F0] p-2 space-y-1 text-xs animate-in fade-in slide-in-from-top-2 duration-150 text-[#0F172A]">
                <div className="px-3 py-2 border-b border-[#F1F5F9]">
                  <div className="font-semibold text-[#0F172A] truncate">
                    {user?.full_name || profile.businessName}
                  </div>
                  <div className="text-[11px] text-[#64748B] truncate">
                    {user?.email || profile.officer}
                  </div>
                  <div className="mt-1 font-mono text-[10px] text-[#64748B] flex items-center justify-between">
                    <span>{profile.businessName}</span>
                    <span className="text-emerald-600 font-bold">● {t("common.active")}</span>
                  </div>
                </div>

                <div className="py-1">
                  <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#94A3B8] flex items-center justify-between">
                    <span>{t("navigation.switchEnterprise")}</span>
                    <span className="font-mono text-[9px] text-slate-400 font-normal">
                      {userBusinesses && userBusinesses.length > 0
                        ? `${userBusinesses.length} Registered`
                        : "10 Registered"}
                    </span>
                  </div>
                  <div className="max-h-56 overflow-y-auto space-y-0.5">
                    {((userBusinesses && userBusinesses.length > 0) ? userBusinesses : availableProfiles).map((b) => {
                      const isActive = profile.id === b.id || profile.businessName === (b as any).name || profile.businessName === (b as any).businessName;
                      const displayName = (b as any).name || (b as any).businessName;
                      return (
                        <button
                          key={b.id}
                          onClick={async () => {
                            await switchProfile(b.id);
                            setProfileDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3 py-1.5 rounded-[8px] text-xs flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                            isActive
                              ? "bg-emerald-50 text-emerald-900 font-semibold"
                              : "hover:bg-[#F8FAFC] text-[#475569] hover:text-[#0F172A]"
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <Building2
                              className={`h-3.5 w-3.5 shrink-0 ${
                                isActive ? "text-emerald-600" : "text-[#94A3B8]"
                              }`}
                            />
                            <span className="truncate">{displayName}</span>
                          </div>
                          {isActive && (
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 ring-2 ring-emerald-200 shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-1 border-t border-[#F1F5F9] space-y-0.5">
                  <button
                    onClick={() => {
                      onNavigateToView("profile");
                      setProfileDropdownOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-[8px] text-[#475569] hover:text-[#0F172A] hover:bg-[#F8FAFC] flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <User className="h-3.5 w-3.5 text-[#94A3B8]" />
                    <span>{t("navigation.profile")}</span>
                  </button>

                  <button
                    onClick={() => {
                      onNavigateToView("settings");
                      setProfileDropdownOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-[8px] text-[#475569] hover:text-[#0F172A] hover:bg-[#F8FAFC] flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <Settings className="h-3.5 w-3.5 text-[#94A3B8]" />
                    <span>{t("navigation.settings")}</span>
                  </button>

                  <Link
                    href="/onboarding?new=true"
                    onClick={() => setProfileDropdownOpen(false)}
                    className="w-full text-left px-3 py-2 rounded-[8px] text-indigo-600 hover:bg-indigo-50 flex items-center gap-2 font-medium transition-colors"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
                    <span>{t("topBar.runOnboarding")}</span>
                  </Link>

                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-3 py-2 rounded-[8px] text-rose-600 hover:bg-rose-50 flex items-center gap-2 font-medium transition-colors cursor-pointer border-t border-[#F1F5F9] mt-1"
                  >
                    <LogOut className="h-3.5 w-3.5 text-rose-600" />
                    <span>{t("navigation.signOut")}</span>
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
