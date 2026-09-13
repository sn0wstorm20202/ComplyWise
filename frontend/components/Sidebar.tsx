"use client";

import React from "react";
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
}

interface NavItem {
  id: NavView;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

export function Sidebar({ activeView, onSelectView, isMobile = false }: SidebarProps) {
  const { t } = useLanguage();

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

  return (
    <aside className={`w-[240px] shrink-0 px-3.5 py-4 flex flex-col justify-between select-none bg-white ${isMobile ? "flex w-full" : "hidden lg:flex border-r border-[#F0F2F5]"}`}>
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
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-[10px] text-[13px] font-medium transition-all text-left cursor-pointer ${
                isActive
                  ? "bg-[#EAECEF] text-[#0F172A] font-semibold shadow-2xs"
                  : "text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC]"
              }`}
            >
              <div className={`h-6 w-6 rounded-[6px] flex items-center justify-center shrink-0 transition-colors ${
                isActive ? "bg-[#18181B] text-white" : "text-[#64748B]"
              }`}>
                <Icon className="h-3.5 w-3.5" />
              </div>
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Secondary & Support Section */}
      <div className="pt-4 border-t border-[#F0F2F5] space-y-1">
        {secondaryItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSelectView(item.id)}
              type="button"
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-[10px] text-[13px] font-medium transition-all text-left cursor-pointer ${
                isActive
                  ? "bg-[#EAECEF] text-[#0F172A] font-semibold shadow-2xs"
                  : "text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC]"
              }`}
            >
              <div className={`h-6 w-6 rounded-[6px] flex items-center justify-center shrink-0 transition-colors ${
                isActive ? "bg-[#18181B] text-white" : "text-[#64748B]"
              }`}>
                <Icon className="h-3.5 w-3.5" />
              </div>
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}

        {/* Support Button */}
        <div className="pt-2 pl-1">
          <button
            type="button"
            aria-label="Help & Support"
            className="h-8 w-8 rounded-full bg-[#F8FAFC] border border-[#E2E8F0] hover:bg-[#F1F5F9] flex items-center justify-center text-[#64748B] hover:text-[#0F172A] shadow-2xs transition-colors cursor-pointer"
          >
            <Headphones className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
