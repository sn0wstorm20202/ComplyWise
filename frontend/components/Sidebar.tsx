"use client";

import React from "react";
import {
  LayoutDashboard,
  ShieldCheck,
  FileText,
  GitFork,
  Calendar,
  BookOpen,
  Coins,
  BellRing,
  Sparkles,
  Building2,
  Settings,
  ChevronRight,
} from "lucide-react";

export type NavView =
  | "dashboard"
  | "compliance"
  | "documents"
  | "workflows"
  | "calendar"
  | "standards"
  | "schemes"
  | "updates"
  | "assistant"
  | "profile"
  | "settings";

interface SidebarProps {
  activeView: NavView;
  onSelectView: (view: NavView) => void;
  actionRequiredCount?: number;
  deadlinesCount?: number;
  updatesCount?: number;
}

interface NavItemConfig {
  id: NavView;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number | string;
  badgeVariant?: "warning" | "neutral" | "info";
}

export function Sidebar({
  activeView,
  onSelectView,
  actionRequiredCount = 3,
  deadlinesCount = 4,
  updatesCount = 2,
}: SidebarProps) {
  const primaryNav: NavItemConfig[] = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
    },
    {
      id: "compliance",
      label: "Compliance",
      icon: ShieldCheck,
      badge: actionRequiredCount > 0 ? actionRequiredCount : undefined,
      badgeVariant: "warning",
    },
    {
      id: "documents",
      label: "Documents",
      icon: FileText,
      badge: 11,
      badgeVariant: "neutral",
    },
    {
      id: "workflows",
      label: "Workflows",
      icon: GitFork,
      badge: 3,
      badgeVariant: "neutral",
    },
    {
      id: "calendar",
      label: "Calendar",
      icon: Calendar,
      badge: deadlinesCount > 0 ? deadlinesCount : undefined,
      badgeVariant: "info",
    },
    {
      id: "standards",
      label: "Standards",
      icon: BookOpen,
    },
    {
      id: "schemes",
      label: "Schemes & Benefits",
      icon: Coins,
    },
    {
      id: "updates",
      label: "Regulatory Updates",
      icon: BellRing,
      badge: updatesCount > 0 ? updatesCount : undefined,
      badgeVariant: "info",
    },
    {
      id: "assistant",
      label: "AI Assistant",
      icon: Sparkles,
    },
  ];

  const secondaryNav: NavItemConfig[] = [
    {
      id: "profile",
      label: "Business Profile",
      icon: Building2,
    },
    {
      id: "settings",
      label: "Settings",
      icon: Settings,
    },
  ];

  return (
    <aside className="w-64 shrink-0 bg-white border-r border-slate-200/90 flex flex-col justify-between h-screen sticky top-0 select-none z-30">
      {/* Brand & Organization Identity */}
      <div className="p-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-slate-900 flex items-center justify-center text-white font-bold text-base shadow-xs tracking-tight">
            CW
          </div>
          <div className="leading-tight">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-950 text-base tracking-tight">
                ComplyWise
              </span>
              <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                BIS
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              Compliance Intelligence
            </p>
          </div>
        </div>

        {/* Enterprise Context Mini-Card */}
        <div className="mt-3.5 px-2.5 py-2 rounded-lg bg-slate-50 border border-slate-200/70">
          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            Active Enterprise
          </div>
          <div className="text-xs font-semibold text-slate-900 truncate mt-0.5" title="Apex Industrial Electro-Mechanicals Ltd.">
            Apex Industrial Ltd.
          </div>
          <div className="text-[10px] text-slate-500 font-mono flex items-center justify-between mt-0.5">
            <span>CM/L-8492019</span>
            <span className="text-emerald-600 font-medium">● Verified</span>
          </div>
        </div>
      </div>

      {/* Main Navigation List */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-6">
        <div>
          <div className="px-3 pb-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Workspace
          </div>
          <nav className="space-y-0.5">
            {primaryNav.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectView(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all group ${
                    isActive
                      ? "bg-slate-900 text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon
                      className={`h-4 w-4 shrink-0 transition-colors ${
                        isActive
                          ? "text-white"
                          : "text-slate-400 group-hover:text-slate-700"
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>

                  {item.badge !== undefined && (
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-semibold transition-colors ${
                        isActive
                          ? "bg-slate-800 text-slate-200"
                          : item.badgeVariant === "warning"
                          ? "bg-amber-100 text-amber-800"
                          : item.badgeVariant === "info"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div>
          <div className="px-3 pb-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Management
          </div>
          <nav className="space-y-0.5">
            {secondaryNav.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectView(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all group ${
                    isActive
                      ? "bg-slate-900 text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon
                      className={`h-4 w-4 shrink-0 transition-colors ${
                        isActive
                          ? "text-white"
                          : "text-slate-400 group-hover:text-slate-700"
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>
                  <ChevronRight
                    className={`h-3.5 w-3.5 transition-transform ${
                      isActive ? "text-slate-300" : "text-transparent group-hover:text-slate-400"
                    }`}
                  />
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Footer / User Profile Info */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-2.5 p-1.5 rounded-lg">
          <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-900 border border-blue-200 flex items-center justify-center text-xs font-bold shrink-0">
            VS
          </div>
          <div className="min-w-0 flex-1 leading-tight">
            <div className="text-xs font-semibold text-slate-900 truncate">
              Dr. V. Sharma
            </div>
            <div className="text-[10px] text-slate-500 truncate">
              Head of Quality & Reg
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
