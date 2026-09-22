"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Bell,
  Mail,
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
import ThemeToggle from "./ThemeToggle";
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
  const { profile, activeBusinessId, availableProfiles, userBusinesses, switchProfile } =
    useBusinessContext();
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
    <header className="h-16 px-4 sm:px-6 lg:px-8 border-b border-[#E2E8F0] dark:border-white/12 flex items-center justify-between bg-white dark:bg-[#0E1318] sticky top-0 z-30 select-none shadow-2xs transition-colors duration-200">
      {/* Left: Brand Identity + Primary Nav Pills */}
      <div className="flex items-center gap-3 sm:gap-6 lg:gap-8">
        {/* Mobile Menu Hamburger Button */}
        {onToggleMobileMenu && (
          <button
            type="button"
            onClick={onToggleMobileMenu}
            aria-label="Open mobile navigation"
            className="lg:hidden h-9 w-9 rounded-xl bg-[#F8FAFD] dark:bg-[#141A21] hover:bg-[#F1F5F9] dark:hover:bg-white/10 border border-[#E2E8F0] dark:border-white/15 flex items-center justify-center text-[#334155] dark:text-[#D4DBE4] hover:text-[#0B1220] dark:hover:text-white transition-colors cursor-pointer"
          >
            <Menu className="h-4 w-4" />
          </button>
        )}

        {/* Brand Logo & Name */}
        <Link
          href="/dashboard"
          className="flex items-center group cursor-pointer"
        >
          <ComplyWiseLogo
            className="h-7 w-7 transition-transform group-hover:scale-105"
            showSubtitle={true}
          />
        </Link>

        {/* Primary Segmented Navigation Pills */}
        <nav
          aria-label="Primary Navigation"
          className="hidden md:flex items-center p-1 rounded-full bg-[#F1F5F9] dark:bg-[#141A21] border border-[#E2E8F0] dark:border-white/12 text-xs font-medium"
        >
          <button
            type="button"
            onClick={() => onSelectPill("dashboard")}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full transition-all cursor-pointer ${activePill === "dashboard"
                ? "bg-[#0B1220] dark:bg-white text-white dark:text-[#070A0D] font-semibold shadow-xs"
                : "text-[#334155] dark:text-[#D4DBE4] hover:text-[#0B1220] dark:hover:text-[#F7F9FC] hover:bg-black/[0.04] dark:hover:bg-white/5 font-medium"
              }`}
          >
            <LayoutDashboard
              className={`h-3.5 w-3.5 ${activePill === "dashboard"
                  ? "text-white dark:text-[#070A0D]"
                  : "text-[#475569] dark:text-[#A8B2BE]"
                }`}
            />
            <span>{t("navigation.dashboard")}</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectPill("compliance")}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full transition-all cursor-pointer ${activePill === "compliance"
                ? "bg-[#0B1220] dark:bg-white text-white dark:text-[#070A0D] font-semibold shadow-xs"
                : "text-[#334155] dark:text-[#D4DBE4] hover:text-[#0B1220] dark:hover:text-[#F7F9FC] hover:bg-black/[0.04] dark:hover:bg-white/5 font-medium"
              }`}
          >
            <ShieldCheck
              className={`h-3.5 w-3.5 ${activePill === "compliance"
                  ? "text-white dark:text-[#070A0D]"
                  : "text-[#475569] dark:text-[#A8B2BE]"
                }`}
            />
            <span>{t("navigation.compliance")}</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectPill("reports")}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full transition-all cursor-pointer ${activePill === "reports"
                ? "bg-[#0B1220] dark:bg-white text-white dark:text-[#070A0D] font-semibold shadow-xs"
                : "text-[#334155] dark:text-[#D4DBE4] hover:text-[#0B1220] dark:hover:text-[#F7F9FC] hover:bg-black/[0.04] dark:hover:bg-white/5 font-medium"
              }`}
          >
            <Flag
              className={`h-3.5 w-3.5 ${activePill === "reports"
                  ? "text-white dark:text-[#070A0D]"
                  : "text-[#475569] dark:text-[#A8B2BE]"
                }`}
            />
            <span>{t("navigation.reports")}</span>
          </button>
        </nav>
      </div>

      {/* Right: Theme Toggle + Language Selector + Actions + Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Theme Toggle Button */}
        <ThemeToggle />

        {/* Visible Language Selector */}
        <LanguageSelector />

        {/* Action Icons (Alerts, Mail) */}
        <div className="flex items-center gap-1.5 sm:gap-2 relative">
          {/* Notification Bell */}
          <button
            type="button"
            aria-label={t("header.notificationsAria")}
            onClick={() => {
              setNotificationsOpen((prev) => !prev);
            }}
            className="relative h-9 w-9 rounded-xl bg-white dark:bg-[#141A21] border border-[#E2E8F0] dark:border-white/15 hover:bg-[#F8FAFD] dark:hover:bg-white/10 flex items-center justify-center text-[#334155] dark:text-[#D4DBE4] hover:text-[#0B1220] dark:hover:text-white shadow-2xs transition-colors cursor-pointer"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white font-bold text-xs flex items-center justify-center ring-2 ring-white dark:ring-[#0E1318]">
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
            className="h-9 w-9 rounded-xl bg-white dark:bg-[#141A21] border border-[#E2E8F0] dark:border-white/15 hover:bg-[#F8FAFD] dark:hover:bg-white/10 flex items-center justify-center text-[#334155] dark:text-[#D4DBE4] hover:text-[#0B1220] dark:hover:text-white shadow-2xs transition-colors cursor-pointer"
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
              className="flex items-center gap-1.5 p-0.5 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors cursor-pointer focus:outline-hidden"
            >
              <div className="h-8 w-8 rounded-full bg-[#0B1220] dark:bg-white/15 text-white flex items-center justify-center shrink-0 shadow-2xs border border-transparent dark:border-white/20">
                <User className="h-4 w-4 text-white dark:text-slate-100" />
              </div>
              <ChevronDown className="h-3 w-3 text-[#475569] dark:text-[#A8B2BE] hidden sm:block" />
            </button>

            {/* Profile Dropdown Menu */}
            {profileDropdownOpen && (
              <div className="absolute right-0 top-11 z-40 w-64 bg-white dark:bg-[#0E1318] rounded-2xl shadow-2xl border border-[#E2E8F0] dark:border-white/15 p-2 space-y-1 text-xs animate-in fade-in slide-in-from-top-2 duration-150 text-[#0B1220] dark:text-[#F7F9FC]">
                <div className="px-3 py-2.5 border-b border-[#F1F5F9] dark:border-white/10">
                  <div className="font-semibold text-sm text-[#0B1220] dark:text-[#F7F9FC] truncate">
                    {user?.full_name || profile.businessName}
                  </div>
                  <div className="text-xs text-[#475569] dark:text-[#A8B2BE] truncate mt-0.5">
                    {user?.email || profile.officer}
                  </div>
                  <div className="mt-1.5 font-mono text-xs text-[#334155] dark:text-[#D4DBE4] flex items-center justify-between">
                    <span className="truncate max-w-[140px] font-semibold">{profile.businessName}</span>
                    <span className="text-emerald-700 dark:text-emerald-400 font-bold shrink-0">
                      ● {t("common.active")}
                    </span>
                  </div>
                </div>

                <div className="py-1">
                  <div className="px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[#475569] dark:text-[#A8B2BE] flex items-center justify-between">
                    <span>{t("navigation.switchEnterprise")}</span>
                    <span className="font-mono text-xs text-slate-500 dark:text-slate-400 font-normal">
                      {userBusinesses && userBusinesses.length > 0
                        ? `${userBusinesses.length} Registered`
                        : "10 Registered"}
                    </span>
                  </div>
                  <div className="max-h-56 overflow-y-auto space-y-0.5">
                    {(userBusinesses && userBusinesses.length > 0
                      ? userBusinesses
                      : availableProfiles
                    ).map((b) => {
                      const isActive =
                        profile.id === b.id ||
                        profile.businessName === (b as any).name ||
                        profile.businessName === (b as any).businessName;
                      const displayName = (b as any).name || (b as any).businessName;
                      return (
                        <button
                          key={b.id}
                          onClick={async () => {
                            await switchProfile(b.id);
                            setProfileDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between gap-2 transition-colors cursor-pointer ${isActive
                              ? "bg-emerald-50 text-emerald-950 dark:bg-emerald-500/15 dark:text-emerald-300 font-semibold"
                              : "hover:bg-[#F8FAFD] dark:hover:bg-white/10 text-[#334155] dark:text-[#D4DBE4] hover:text-[#0B1220] dark:hover:text-white"
                            }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <Building2
                              className={`h-3.5 w-3.5 shrink-0 ${isActive
                                  ? "text-emerald-600 dark:text-emerald-400"
                                  : "text-[#475569] dark:text-[#A8B2BE]"
                                }`}
                            />
                            <span className="truncate font-medium">{displayName}</span>
                          </div>
                          {isActive && (
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400 ring-2 ring-emerald-200 dark:ring-emerald-800 shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-1 border-t border-[#F1F5F9] dark:border-white/10 space-y-0.5">
                  <button
                    onClick={() => {
                      onNavigateToView("profile");
                      setProfileDropdownOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-medium text-[#334155] dark:text-[#D4DBE4] hover:text-[#0B1220] dark:hover:text-white hover:bg-[#F8FAFD] dark:hover:bg-white/10 flex items-center gap-2.5 cursor-pointer transition-colors"
                  >
                    <User className="h-3.5 w-3.5 text-[#475569] dark:text-[#A8B2BE]" />
                    <span>{t("navigation.profile")}</span>
                  </button>

                  <button
                    onClick={() => {
                      onNavigateToView("settings");
                      setProfileDropdownOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-medium text-[#334155] dark:text-[#D4DBE4] hover:text-[#0B1220] dark:hover:text-white hover:bg-[#F8FAFD] dark:hover:bg-white/10 flex items-center gap-2.5 cursor-pointer transition-colors"
                  >
                    <Settings className="h-3.5 w-3.5 text-[#475569] dark:text-[#A8B2BE]" />
                    <span>{t("navigation.settings")}</span>
                  </button>

                  <Link
                    href="/onboarding?new=true"
                    onClick={() => setProfileDropdownOpen(false)}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 flex items-center gap-2.5 font-medium transition-colors"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                    <span>{t("topBar.runOnboarding")}</span>
                  </Link>

                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/15 flex items-center gap-2.5 font-medium transition-colors cursor-pointer border-t border-[#F1F5F9] dark:border-white/10 mt-1"
                  >
                    <LogOut className="h-3.5 w-3.5 text-rose-700 dark:text-rose-400" />
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
