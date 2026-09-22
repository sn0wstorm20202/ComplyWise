"use client";

import React, { useState } from "react";
import {
  LayoutDashboard,
  ShieldCheck,
  FileText,
  GitFork,
  Calendar,
  Bell,
  Target,
  Award,
  Info,
  Sparkles,
  FileSpreadsheet,
  Settings,
  Headphones,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export type NavView =
  | "dashboard"
  | "compliance"
  | "documents"
  | "workflows"
  | "calendar"
  | "notifications"
  | "standards"
  | "schemes"
  | "updates"
  | "assistant"
  | "profile"
  | "settings";

interface SidebarProps {
  activeView: NavView;
  onSelectView: (view: NavView) => void;
  isMobile?: boolean;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

interface NavItem {
  id: NavView;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

export function Sidebar({
  activeView,
  onSelectView,
  isMobile = false,
  isCollapsed = false,
  onToggleCollapse,
}: SidebarProps) {
  const { t } = useLanguage();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const primaryItems: NavItem[] = [
    { id: "dashboard", label: t("navigation.dashboard"), icon: LayoutDashboard },
    { id: "compliance", label: t("navigation.compliance"), icon: ShieldCheck },
    { id: "documents", label: t("navigation.documents"), icon: FileText },
    { id: "workflows", label: t("navigation.workflows"), icon: GitFork },
    { id: "calendar", label: t("navigation.calendar"), icon: Calendar },
    { id: "notifications", label: "Alerts & Notifications", icon: Bell },
    { id: "standards", label: t("navigation.standards"), icon: Target },
    { id: "schemes", label: t("navigation.schemes"), icon: Award },
    { id: "updates", label: t("navigation.updates"), icon: Info },
    { id: "assistant", label: t("navigation.assistant"), icon: Sparkles },
  ];

  const secondaryItems: NavItem[] = [
    { id: "profile", label: t("navigation.profile"), icon: FileSpreadsheet },
    { id: "settings", label: t("navigation.settings"), icon: Settings },
  ];

  const widthClass = isMobile
    ? "w-full"
    : isCollapsed
      ? "w-[76px]"
      : "w-[240px]";

  return (
    <aside
      className={`${widthClass} shrink-0 px-2.5 py-4 flex flex-col justify-between select-none bg-white dark:bg-[#0E1318] transition-[width] duration-300 ease-in-out relative ${isMobile
          ? "flex w-full"
          : "hidden lg:flex border-r border-[#E2E8F0] dark:border-white/12"
        }`}
    >
      {/* Top Section: Collapse toggle header & Navigation list */}
      <div className="space-y-4">
        {/* Collapse trigger for desktop */}
        {!isMobile && onToggleCollapse && (
          <div className="flex items-center justify-end px-1 pb-1">
            <button
              type="button"
              onClick={onToggleCollapse}
              aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              className="h-8 w-8 rounded-lg flex items-center justify-center text-[#475569] dark:text-[#A8B2BE] hover:text-[#0B1220] dark:hover:text-[#F7F9FC] hover:bg-[#F1F5F9] dark:hover:bg-white/10 transition-colors cursor-pointer border border-transparent hover:border-[#E2E8F0] dark:hover:border-white/12"
            >
              {isCollapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </button>
          </div>
        )}

        {/* Primary Navigation List */}
        <nav aria-label="Main Navigation" className="space-y-1">
          {primaryItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;

            return (
              <div
                key={item.id}
                className="relative"
                onMouseEnter={() => setHoveredItem(item.id)}
                onMouseLeave={() => setHoveredItem(null)}
              >
                <button
                  onClick={() => onSelectView(item.id)}
                  type="button"
                  aria-label={item.label}
                  className={`w-full flex items-center ${isCollapsed ? "justify-center px-2" : "gap-3 px-3"
                    } py-2.5 rounded-xl text-sm transition-all text-left cursor-pointer group ${isActive
                      ? "bg-blue-50 text-blue-900 dark:bg-blue-600/20 dark:text-blue-300 font-semibold border border-blue-200 dark:border-blue-500/35 shadow-2xs"
                      : "text-[#334155] dark:text-[#D4DBE4] hover:text-[#0B1220] dark:hover:text-[#F7F9FC] hover:bg-[#F1F5F9] dark:hover:bg-white/10 font-medium"
                    }`}
                >
                  <div
                    className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${isActive
                        ? "bg-blue-600 dark:bg-blue-500 text-white"
                        : "text-[#475569] dark:text-[#A8B2BE] group-hover:text-[#0B1220] dark:group-hover:text-[#F7F9FC]"
                      }`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  {!isCollapsed && (
                    <span className="truncate text-sm font-semibold tracking-tight">
                      {item.label}
                    </span>
                  )}
                </button>

                {/* Floating Tooltip in Collapsed Mode */}
                {isCollapsed && !isMobile && hoveredItem === item.id && (
                  <div className="absolute left-full ml-2.5 top-1/2 -translate-y-1/2 z-50 px-3 py-1.5 rounded-lg bg-[#0B1220] dark:bg-[#141A21] text-white text-xs font-semibold whitespace-nowrap shadow-xl border border-white/10 pointer-events-none animate-in fade-in zoom-in-95 duration-150">
                    {item.label}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>

      {/* Secondary Navigation Section */}
      <div className="pt-4 border-t border-[#E2E8F0] dark:border-white/12 space-y-1">
        {secondaryItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;

          return (
            <div
              key={item.id}
              className="relative"
              onMouseEnter={() => setHoveredItem(item.id)}
              onMouseLeave={() => setHoveredItem(null)}
            >
              <button
                onClick={() => onSelectView(item.id)}
                type="button"
                aria-label={item.label}
                className={`w-full flex items-center ${isCollapsed ? "justify-center px-2" : "gap-3 px-3"
                  } py-2.5 rounded-xl text-sm transition-all text-left cursor-pointer group ${isActive
                    ? "bg-blue-50 text-blue-900 dark:bg-blue-600/20 dark:text-blue-300 font-semibold border border-blue-200 dark:border-blue-500/35 shadow-2xs"
                    : "text-[#334155] dark:text-[#D4DBE4] hover:text-[#0B1220] dark:hover:text-[#F7F9FC] hover:bg-[#F1F5F9] dark:hover:bg-white/10 font-medium"
                  }`}
              >
                <div
                  className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${isActive
                      ? "bg-blue-600 dark:bg-blue-500 text-white"
                      : "text-[#475569] dark:text-[#A8B2BE] group-hover:text-[#0B1220] dark:group-hover:text-[#F7F9FC]"
                    }`}
                >
                  <Icon className="h-4 w-4" />
                </div>
                {!isCollapsed && (
                  <span className="truncate text-sm font-semibold tracking-tight">
                    {item.label}
                  </span>
                )}
              </button>

              {/* Floating Tooltip in Collapsed Mode */}
              {isCollapsed && !isMobile && hoveredItem === item.id && (
                <div className="absolute left-full ml-2.5 top-1/2 -translate-y-1/2 z-50 px-3 py-1.5 rounded-lg bg-[#0B1220] dark:bg-[#141A21] text-white text-xs font-semibold whitespace-nowrap shadow-xl border border-white/10 pointer-events-none animate-in fade-in zoom-in-95 duration-150">
                  {item.label}
                </div>
              )}
            </div>
          );
        })}

        {/* Compact Support Help Box (Expanded Only) */}
        {!isCollapsed && (
          <div className="mt-4 p-3 rounded-xl bg-[#F8FAFD] dark:bg-[#141A21] border border-[#E2E8F0] dark:border-white/12 text-xs">
            <div className="flex items-center gap-2 font-semibold text-[#0B1220] dark:text-[#F7F9FC]">
              <Headphones className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
              <span>BIS Officer Support</span>
            </div>
            <p className="mt-1 text-xs text-[#475569] dark:text-[#A8B2BE] leading-relaxed">
              Statutory compliance desk online.
            </p>
          </div>
        )}
      </div>
    </aside>
  );
}

export default Sidebar;
