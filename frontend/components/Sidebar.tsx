"use client";

import React from "react";
import {
  LayoutDashboard,
  ShieldCheck,
  FileText,
  GitFork,
  Calendar,
  Target,
  Award,
  Info,
  Sparkles,
  FileSpreadsheet,
  Settings,
  Headphones,
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
  isMobile?: boolean;
}

interface NavItem {
  id: NavView;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

export function Sidebar({ activeView, onSelectView, isMobile = false }: SidebarProps) {
  const primaryItems: NavItem[] = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "compliance", label: "Compliance", icon: ShieldCheck },
    { id: "documents", label: "Documents", icon: FileText },
    { id: "workflows", label: "Workflows", icon: GitFork },
    { id: "calendar", label: "Calendar", icon: Calendar },
    { id: "standards", label: "Standards", icon: Target },
    { id: "schemes", label: "Schemes & Benefits", icon: Award },
    { id: "updates", label: "Regulatory Updates", icon: Info },
    { id: "assistant", label: "AI Assistant", icon: Sparkles },
  ];

  const secondaryItems: NavItem[] = [
    { id: "profile", label: "Business Profile", icon: FileSpreadsheet },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <aside className={`w-[240px] shrink-0 px-3.5 py-4 flex flex-col justify-between select-none bg-[#070709] ${isMobile ? "flex w-full" : "hidden lg:flex border-r border-white/[0.06]"}`}>
      {/* Primary Navigation List */}
      <nav aria-label="Main Navigation" className="space-y-1">
        {primaryItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSelectView(item.id)}
              type="button"
              className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-[8px] text-[13px] font-medium transition-all text-left cursor-pointer ${
                isActive
                  ? "bg-white/[0.055] border border-white/[0.06] text-[#ECECE9]"
                  : "text-[#777982] hover:text-[#ECECE9] hover:bg-white/[0.025] border border-transparent"
              }`}
            >
              <Icon className={`h-4 w-4 shrink-0 transition-colors ${isActive ? "text-[#ECECE9]" : "text-[#777982]"}`} />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Secondary & Support Section */}
      <div className="pt-4 border-t border-white/[0.06] space-y-1">
        {secondaryItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSelectView(item.id)}
              type="button"
              className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-[8px] text-[13px] font-medium transition-all text-left cursor-pointer ${
                isActive
                  ? "bg-white/[0.055] border border-white/[0.06] text-[#ECECE9]"
                  : "text-[#777982] hover:text-[#ECECE9] hover:bg-white/[0.025] border border-transparent"
              }`}
            >
              <Icon className={`h-4 w-4 shrink-0 transition-colors ${isActive ? "text-[#ECECE9]" : "text-[#777982]"}`} />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}

        {/* Support Button */}
        <div className="pt-2 pl-1">
          <button
            type="button"
            aria-label="Help & Support"
            className="h-7 w-7 rounded-[8px] bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] flex items-center justify-center text-[#777982] hover:text-[#ECECE9] transition-colors cursor-pointer"
          >
            <Headphones className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
