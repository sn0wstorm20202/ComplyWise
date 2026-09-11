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
}

interface NavItem {
  id: NavView;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

export function Sidebar({ activeView, onSelectView }: SidebarProps) {
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
    <aside className="w-60 shrink-0 px-3 py-4 flex flex-col justify-between select-none bg-[#040406] border-r border-[#1c1d22]">
      {/* Primary Navigation List */}
      <nav aria-label="Main Navigation" className="space-y-1">
        {primaryItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;

          if (isActive) {
            return (
              <button
                key={item.id}
                onClick={() => onSelectView(item.id)}
                type="button"
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-[10px] bg-[#121317] border border-[#1c1d22] text-[#ffffff] font-medium text-[13px] transition-colors group text-left cursor-pointer relative"
              >
                <div className="absolute left-1 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-[#cc9166] rounded-[2px]" />
                <div className="h-4 w-4 flex items-center justify-center shrink-0 ml-1">
                  <Icon className="h-4 w-4 text-[#ffffff]" />
                </div>
                <span className="truncate">{item.label}</span>
              </button>
            );
          }

          return (
            <button
              key={item.id}
              onClick={() => onSelectView(item.id)}
              type="button"
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-[10px] text-[#9194a1] hover:text-[#e2e3e9] hover:bg-white/[0.02] text-[13px] font-normal transition-colors group text-left cursor-pointer"
            >
              <div className="h-4 w-4 flex items-center justify-center shrink-0 ml-1">
                <Icon className="h-4 w-4 text-[#777a88] group-hover:text-[#e2e3e9] transition-colors" />
              </div>
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Bottom Section */}
      <div className="pt-4 mt-4 border-t border-[#1c1d22] space-y-1">
        {secondaryItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;

          if (isActive) {
            return (
              <button
                key={item.id}
                onClick={() => onSelectView(item.id)}
                type="button"
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-[10px] bg-[#121317] border border-[#1c1d22] text-[#ffffff] font-medium text-[13px] transition-colors group text-left cursor-pointer relative"
              >
                <div className="absolute left-1 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-[#cc9166] rounded-[2px]" />
                <div className="h-4 w-4 flex items-center justify-center shrink-0 ml-1">
                  <Icon className="h-4 w-4 text-[#ffffff]" />
                </div>
                <span className="truncate">{item.label}</span>
              </button>
            );
          }

          return (
            <button
              key={item.id}
              onClick={() => onSelectView(item.id)}
              type="button"
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-[10px] text-[#9194a1] hover:text-[#e2e3e9] hover:bg-white/[0.02] text-[13px] font-normal transition-colors group text-left cursor-pointer"
            >
              <div className="h-4 w-4 flex items-center justify-center shrink-0 ml-1">
                <Icon className="h-4 w-4 text-[#777a88] group-hover:text-[#e2e3e9] transition-colors" />
              </div>
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}

        {/* Support Button at bottom */}
        <div className="pt-2 pl-1">
          <button
            type="button"
            aria-label="Help & Support"
            className="h-8 w-8 rounded-[10px] bg-[#121317] border border-[#1c1d22] hover:bg-[#1c1d22] flex items-center justify-center text-[#777a88] hover:text-[#ffffff] transition-colors cursor-pointer"
          >
            <Headphones className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
