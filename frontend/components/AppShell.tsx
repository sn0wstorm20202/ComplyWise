"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { X } from "lucide-react";
import Sidebar, { NavView } from "./Sidebar";
import TopBar from "./TopBar";
import SearchModal from "./SearchModal";
import NewQueryModal from "./NewQueryModal";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";

interface AppShellProps {
  children?: React.ReactNode;
  activeView?: NavView;
  onSelectView?: (view: NavView) => void;
  renderViewContent?: (view: NavView) => React.ReactNode;
  requireAuth?: boolean;
}

export function AppShell({
  children,
  activeView: controlledActiveView,
  onSelectView: controlledOnSelectView,
  renderViewContent,
  requireAuth = true,
}: AppShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, loading } = useAuth();
  const { t } = useLanguage();
  const [internalActiveView, setInternalActiveView] = useState<NavView>("dashboard");
  const [searchOpen, setSearchOpen] = useState(false);
  const [newQueryOpen, setNewQueryOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Restore collapsed sidebar preference from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("complywise-sidebar-collapsed");
      if (saved !== null) {
        setSidebarCollapsed(saved === "true");
      }
    } catch {
      // safe fallback
    }
  }, []);

  const handleToggleSidebar = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("complywise-sidebar-collapsed", String(next));
      } catch {
        // safe fallback
      }
      return next;
    });
  };

  // Route protection guard
  useEffect(() => {
    if (requireAuth && !loading && !isAuthenticated) {
      const redirectTarget = pathname ? encodeURIComponent(pathname) : "%2Fdashboard";
      router.push(`/auth/signin?redirect=${redirectTarget}`);
    }
  }, [requireAuth, loading, isAuthenticated, router, pathname]);

  function handleSelectView(view: NavView) {
    if (controlledOnSelectView) {
      controlledOnSelectView(view);
    } else {
      setInternalActiveView(view);
      const targetPath =
        view === "dashboard"
          ? "/dashboard"
          : view === "updates"
            ? "/regulatory-updates"
            : view === "assistant"
              ? "/ai-assistant"
              : view === "profile"
                ? "/business-profile"
                : view === "settings"
                  ? "/settings"
                  : `/${view}`;
      router.push(targetPath);
    }
  }

  const activeView = controlledActiveView || internalActiveView;

  // Derive top bar pill state from activeView
  const activePill =
    activeView === "dashboard"
      ? "dashboard"
      : activeView === "compliance"
        ? "compliance"
        : activeView === "updates"
          ? "reports"
          : "dashboard";

  if (requireAuth && loading) {
    return (
      <div className="min-h-screen bg-[#F4F7FB] dark:bg-[#070A0D] flex flex-col items-center justify-center p-4 transition-colors">
        <div className="flex flex-col items-center gap-3">
          <div className="h-9 w-9 rounded-full border-2 border-blue-600 dark:border-blue-400 border-t-transparent animate-spin" />
          <p className="text-sm font-medium text-[#475569] dark:text-[#A8B2BE] tracking-wide">
            {t("header.verifyingAuth")}
          </p>
        </div>
      </div>
    );
  }

  if (requireAuth && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#F4F7FB] dark:bg-[#070A0D] flex flex-col items-center justify-center p-4 transition-colors">
        <div className="flex flex-col items-center gap-2">
          <div className="h-7 w-7 rounded-full border-2 border-blue-600 dark:border-blue-400 border-t-transparent animate-spin" />
          <p className="text-sm text-[#475569] dark:text-[#A8B2BE]">{t("header.redirectingAuth")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F7FB] dark:bg-[#070A0D] p-2 sm:p-4 lg:p-6 flex flex-col justify-center relative overflow-x-hidden transition-colors duration-200">
      {/* Floating Application Window Container */}
      <div className="w-full max-w-[1440px] mx-auto bg-white dark:bg-[#0E1318] rounded-[24px] border border-[#E2E8F0] dark:border-white/12 overflow-hidden flex flex-col min-h-[900px] shadow-2xl relative z-10 transition-colors duration-200">
        {/* Top Header Navigation */}
        <TopBar
          activePill={activePill}
          onSelectPill={(pill) => {
            if (pill === "dashboard") handleSelectView("dashboard");
            if (pill === "compliance") handleSelectView("compliance");
            if (pill === "reports") handleSelectView("updates");
          }}
          onNavigateToView={handleSelectView}
          onAddMember={() => { }}
          onToggleMobileMenu={() => setMobileMenuOpen((prev) => !prev)}
        />

        {/* Main Body: Left Sidebar + Right Content Area */}
        <div className="flex flex-1 min-h-0">
          {/* Left Navigation Sidebar */}
          <Sidebar
            activeView={activeView}
            onSelectView={handleSelectView}
            isCollapsed={sidebarCollapsed}
            onToggleCollapse={handleToggleSidebar}
          />

          {/* Right Scrollable Content Canvas */}
          <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 overflow-y-auto min-w-0 bg-[#F4F7FB] dark:bg-[#070A0D] text-[#0F172A] dark:text-[#F7F9FC] transition-colors duration-200">
            {renderViewContent ? renderViewContent(activeView) : children}
          </main>
        </div>
      </div>

      {/* Mobile Slide-Over Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />
          {/* Drawer panel */}
          <div className="fixed inset-y-0 left-0 max-w-[280px] w-full bg-white dark:bg-[#0E1318] border-r border-[#E2E8F0] dark:border-white/12 p-4 flex flex-col justify-between shadow-2xl z-10 animate-in slide-in-from-left duration-200 text-[#0F172A] dark:text-[#F7F9FC]">
            <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9] dark:border-white/10">
              <div className="text-sm font-bold text-[#0B1220] dark:text-[#F7F9FC]">Navigation</div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close navigation"
                className="h-8 w-8 rounded-lg bg-[#F1F5F9] dark:bg-white/10 hover:bg-[#E2E8F0] dark:hover:bg-white/15 flex items-center justify-center text-[#475569] dark:text-[#A8B2BE] hover:text-[#0B1220] dark:hover:text-white transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="py-2 flex-1 overflow-y-auto">
              <Sidebar
                activeView={activeView}
                onSelectView={(view) => {
                  handleSelectView(view);
                  setMobileMenuOpen(false);
                }}
                isMobile={true}
              />
            </div>
          </div>
        </div>
      )}

      {/* Global Search Command Palette */}
      <SearchModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        onNavigateTo={(target) => {
          handleSelectView(target as NavView);
          setSearchOpen(false);
        }}
      />

      {/* Primary Action Modal */}
      <NewQueryModal
        isOpen={newQueryOpen}
        onClose={() => setNewQueryOpen(false)}
        onViewStandard={() => {
          handleSelectView("standards");
          setNewQueryOpen(false);
        }}
      />
    </div>
  );
}

export default AppShell;
