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
    <aside className="w-60 shrink-0 px-3 py-4 flex flex-col justify-between select-none bg-[#0D0E10] border-r border-white/[0.07]">
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
                className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-[8px] bg-white/[0.06] border border-white/[0.07] text-[#F5F5F3] font-medium text-[13px] transition-colors group text-left cursor-pointer"
              >
                <div className="h-4 w-4 flex items-center justify-center shrink-0">
                  <Icon className="h-4 w-4 text-[#F5F5F3]" />
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
              className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-[8px] text-[#71717A] hover:text-[#A1A1AA] hover:bg-white/[0.03] text-[13px] font-normal transition-colors group text-left cursor-pointer"
            >
              <div className="h-4 w-4 flex items-center justify-center shrink-0">
                <Icon className="h-4 w-4 text-[#71717A] group-hover:text-[#A1A1AA] transition-colors" />
              </div>
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Bottom Section */}
      <div className="pt-4 mt-4 border-t border-white/[0.07] space-y-1">
        {secondaryItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;

          if (isActive) {
            return (
              <button
                key={item.id}
                onClick={() => onSelectView(item.id)}
                type="button"
                className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-[8px] bg-white/[0.06] border border-white/[0.07] text-[#F5F5F3] font-medium text-[13px] transition-colors group text-left cursor-pointer"
              >
                <div className="h-4 w-4 flex items-center justify-center shrink-0">
                  <Icon className="h-4 w-4 text-[#F5F5F3]" />
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
              className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-[8px] text-[#71717A] hover:text-[#A1A1AA] hover:bg-white/[0.03] text-[13px] font-normal transition-colors group text-left cursor-pointer"
            >
              <div className="h-4 w-4 flex items-center justify-center shrink-0">
                <Icon className="h-4 w-4 text-[#71717A] group-hover:text-[#A1A1AA] transition-colors" />
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
            className="h-8 w-8 rounded-[8px] bg-[#17191C] border border-white/[0.08] hover:bg-white/[0.06] flex items-center justify-center text-[#71717A] hover:text-[#F5F5F3] transition-colors cursor-pointer"
          >
            <Headphones className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
