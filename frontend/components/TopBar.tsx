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
  Search,
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
  activePill: "dashboard" | "compliance" | "reports" | null;
  onSelectPill: (pill: "dashboard" | "compliance" | "reports") => void;
  onNavigateToView: (view: NavView) => void;
  onAddMember?: () => void;
  onToggleMobileMenu?: () => void;
  onOpenSearch?: () => void;
}

export function TopBar({
  activePill,
  onSelectPill,
  onNavigateToView,
  onToggleMobileMenu,
  onOpenSearch,
}: TopBarProps) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { profile, activeBusinessId, availableProfiles, userBusinesses, switchProfile } = useBusinessContext();
  const { t } = useLanguage();

  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  useEffect(() => {
    if (!profileDropdownOpen) return;
    function close(event: KeyboardEvent) { if (event.key === "Escape") setProfileDropdownOpen(false); }
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [profileDropdownOpen]);

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
    <header className="ui-topbar">
      {/* Left: Brand Identity + Primary Nav Pills */}
      <div className="flex items-center gap-3 sm:gap-6 lg:gap-8">
        {/* Mobile Menu Hamburger Button */}
        {onToggleMobileMenu && (
          <button
            type="button"
            onClick={onToggleMobileMenu}
            aria-label="Open mobile navigation"
            className="lg:hidden h-8 w-8 rounded-[8px] bg-[var(--ui-bg)] hover:bg-[var(--ui-inset)] border border-[var(--ui-border)] flex items-center justify-center text-[var(--ui-secondary)] hover:text-[var(--ui-text)] transition-colors cursor-pointer"
          >
            <Menu className="h-4 w-4" />
          </button>
        )}

        {/* Brand Logo & Name */}
        <Link
          href="/dashboard"
          className="flex items-center group cursor-pointer"
        >
          <ComplyWiseLogo className="h-7 w-7 text-[var(--ui-text)] transition-transform group-hover:scale-105" showSubtitle={false} />
        </Link>

        {/* Primary Segmented Navigation Pills */}
        <nav
          aria-label="Primary Navigation"
          className="hidden xl:flex items-center gap-1 text-xs font-medium"
        >
          <button
            type="button"
            onClick={() => onSelectPill("dashboard")}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full transition-all cursor-pointer ${
              activePill === "dashboard"
                ? "bg-[var(--ui-text)] border border-[var(--ui-text)] text-white font-medium shadow-xs"
                : "text-[var(--ui-secondary)] hover:text-[var(--ui-text)] hover:bg-black/[0.03]"
            }`}
          >
            <LayoutDashboard className={`h-3.5 w-3.5 ${activePill === "dashboard" ? "text-white" : "text-[var(--ui-secondary)]"}`} />
            <span>{t("navigation.dashboard")}</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectPill("compliance")}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full transition-all cursor-pointer ${
              activePill === "compliance"
                ? "bg-[var(--ui-text)] border border-[var(--ui-text)] text-white font-medium shadow-xs"
                : "text-[var(--ui-secondary)] hover:text-[var(--ui-text)] hover:bg-black/[0.03]"
            }`}
          >
            <ShieldCheck className={`h-3.5 w-3.5 ${activePill === "compliance" ? "text-white" : "text-[var(--ui-secondary)]"}`} />
            <span>{t("navigation.compliance")}</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectPill("reports")}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full transition-all cursor-pointer ${
              activePill === "reports"
                ? "bg-[var(--ui-text)] border border-[var(--ui-text)] text-white font-medium shadow-xs"
                : "text-[var(--ui-secondary)] hover:text-[var(--ui-text)] hover:bg-black/[0.03]"
            }`}
          >
            <Flag className={`h-3.5 w-3.5 ${activePill === "reports" ? "text-white" : "text-[var(--ui-secondary)]"}`} />
            <span>Updates</span>
          </button>
        </nav>
      </div>

      {/* Right: Utility Actions + Profile */}
      <div className="flex items-center gap-1.5 sm:gap-2.5">
        <button type="button" onClick={onOpenSearch} aria-label="Search workspace" className="ui-icon-button"><Search size={18} /></button>
        {/* Visible Language Selector on sm and up */}
        <div className="hidden sm:block">
          <LanguageSelector />
        </div>

        {/* Action Icons (Alerts, Mail) */}
        <div className="flex items-center gap-1 sm:gap-2 relative">
          {/* Notification Bell */}
          <button
            type="button"
            aria-label={t("header.notificationsAria")}
            aria-expanded={notificationsOpen}
            onClick={() => {
              setNotificationsOpen((prev) => !prev);
            }}
            className="relative h-8 w-8 rounded-full bg-white border border-[var(--ui-border)] hover:bg-[var(--ui-bg)] flex items-center justify-center text-[var(--ui-secondary)] hover:text-[var(--ui-text)] shadow-2xs transition-colors cursor-pointer"
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
            className="hidden sm:flex h-8 w-8 rounded-full bg-white border border-[var(--ui-border)] hover:bg-[var(--ui-bg)] items-center justify-center text-[var(--ui-secondary)] hover:text-[var(--ui-text)] shadow-2xs transition-colors cursor-pointer"
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
              aria-expanded={profileDropdownOpen}
              className="flex items-center gap-1.5 p-0.5 rounded-full hover:bg-[var(--ui-inset)] transition-colors cursor-pointer focus:outline-hidden"
            >
              <div className="h-7 w-7 rounded-full bg-[var(--ui-text)] text-white flex items-center justify-center shrink-0 shadow-2xs">
                <User className="h-3.5 w-3.5 text-white" />
              </div>
              <ChevronDown className="h-3 w-3 text-[var(--ui-secondary)] hidden sm:block" />
            </button>

            {/* Profile Dropdown Menu */}
            {profileDropdownOpen && (
              <div className="absolute right-0 top-10 z-40 w-64 bg-white rounded-[12px] shadow-2xl border border-[var(--ui-border)] p-2 space-y-1 text-xs animate-in fade-in slide-in-from-top-2 duration-150 text-[var(--ui-text)]">
                <div className="px-3 py-2 border-b border-[var(--ui-inset)]">
                  <div className="font-semibold text-[var(--ui-text)] truncate">
                    {user?.full_name || profile.businessName}
                  </div>
                  <div className="text-[11px] text-[var(--ui-secondary)] truncate">
                    {user?.email || profile.officer}
                  </div>
                  <div className="mt-1 font-mono text-[10px] text-[var(--ui-secondary)] flex items-center justify-between">
                    <span>{profile.businessName}</span>
                    <span className="text-[var(--ui-sage)] font-bold">● {t("common.active")}</span>
                  </div>
                </div>

                <div className="py-1">
                  <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--ui-muted)] flex items-center justify-between">
                    <span>{t("navigation.switchEnterprise")}</span>
                    <span className="font-mono text-[9px] text-[var(--ui-muted)] font-normal">
                      {userBusinesses.length} registered
                    </span>
                  </div>
                  <div className="max-h-56 overflow-y-auto space-y-0.5">
                    {userBusinesses.map((b) => {
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
                              ? "bg-[var(--ui-sage-faint)] text-[var(--ui-sage)] font-semibold"
                              : "hover:bg-[var(--ui-bg)] text-[var(--ui-secondary)] hover:text-[var(--ui-text)]"
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <Building2
                              className={`h-3.5 w-3.5 shrink-0 ${
                                isActive ? "text-[var(--ui-sage)]" : "text-[var(--ui-muted)]"
                              }`}
                            />
                            <span className="truncate">{displayName}</span>
                          </div>
                          {isActive && (
                            <span className="h-1.5 w-1.5 rounded-full bg-[var(--ui-sage)] ring-2 ring-[var(--ui-sage-soft)] shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-1 border-t border-[var(--ui-inset)] space-y-0.5">
                  <button
                    onClick={() => {
                      onNavigateToView("profile");
                      setProfileDropdownOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-[8px] text-[var(--ui-secondary)] hover:text-[var(--ui-text)] hover:bg-[var(--ui-bg)] flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <User className="h-3.5 w-3.5 text-[var(--ui-muted)]" />
                    <span>{t("navigation.profile")}</span>
                  </button>

                  <button
                    onClick={() => {
                      onNavigateToView("settings");
                      setProfileDropdownOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-[8px] text-[var(--ui-secondary)] hover:text-[var(--ui-text)] hover:bg-[var(--ui-bg)] flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <Settings className="h-3.5 w-3.5 text-[var(--ui-muted)]" />
                    <span>{t("navigation.settings")}</span>
                  </button>

                  <Link
                    href="/onboarding?new=true"
                    onClick={() => setProfileDropdownOpen(false)}
                    className="w-full text-left px-3 py-2 rounded-[8px] text-[var(--ui-sage)] hover:bg-[var(--ui-sage-faint)] flex items-center gap-2 font-medium transition-colors"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-[var(--ui-sage)]" />
                    <span>{t("topBar.runOnboarding")}</span>
                  </Link>

                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-3 py-2 rounded-[8px] text-rose-600 hover:bg-rose-50 flex items-center gap-2 font-medium transition-colors cursor-pointer border-t border-[var(--ui-inset)] mt-1"
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
