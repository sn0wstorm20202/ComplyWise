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
    <aside className="w-56 lg:w-60 shrink-0 px-4 py-4 flex flex-col justify-between select-none">
      {/* Primary Navigation List */}
      <nav aria-label="Main Navigation" className="space-y-1.5">
        {primaryItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;

          if (isActive) {
            return (
              <button
                key={item.id}
                onClick={() => onSelectView(item.id)}
                type="button"
                className="w-full flex items-center gap-3 px-2.5 py-2 rounded-2xl bg-[#eceff3] text-[#0f172a] font-semibold text-xs transition-colors group text-left"
              >
                <div className="h-8 w-8 rounded-xl bg-[#0f172a] text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Icon className="h-4 w-4 text-white" />
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
              className="w-full flex items-center gap-3.5 px-3 py-2 rounded-2xl text-slate-500 hover:text-slate-900 hover:bg-black/[0.03] text-xs font-medium transition-colors group text-left cursor-pointer"
            >
              <div className="h-8 w-8 flex items-center justify-center shrink-0">
                <Icon className="h-4 w-4 text-slate-500 group-hover:text-slate-800 transition-colors" />
              </div>
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Bottom Section */}
      <div className="pt-6 mt-6 border-t border-slate-200/60 space-y-1.5">
        {secondaryItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;

          if (isActive) {
            return (
              <button
                key={item.id}
                onClick={() => onSelectView(item.id)}
                type="button"
                className="w-full flex items-center gap-3 px-2.5 py-2 rounded-2xl bg-[#eceff3] text-[#0f172a] font-semibold text-xs transition-colors group text-left cursor-pointer"
              >
                <div className="h-8 w-8 rounded-xl bg-[#0f172a] text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Icon className="h-4 w-4 text-white" />
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
              className="w-full flex items-center gap-3.5 px-3 py-2 rounded-2xl text-slate-500 hover:text-slate-900 hover:bg-black/[0.03] text-xs font-medium transition-colors group text-left cursor-pointer"
            >
              <div className="h-8 w-8 flex items-center justify-center shrink-0">
                <Icon className="h-4 w-4 text-slate-500 group-hover:text-slate-800 transition-colors" />
              </div>
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}

        {/* Floating Support Button at bottom */}
        <div className="pt-3 pl-2.5">
          <button
            type="button"
            aria-label="Help & Support"
            className="h-9 w-9 rounded-full bg-white border border-slate-200/80 hover:bg-slate-50 flex items-center justify-center text-slate-600 transition-colors shadow-2xs"
          >
            <Headphones className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
