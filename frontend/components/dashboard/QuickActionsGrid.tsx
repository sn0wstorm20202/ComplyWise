"use client";

import React from "react";
import {
  Sparkles,
  Upload,
  FlaskConical,
  BookOpen,
  Target,
  Gift,
  ArrowUpRight,
} from "lucide-react";

interface QuickActionsGridProps {
  onNavigateToView: (view: string) => void;
  onOpenUploadDrawer?: () => void;
}

export function QuickActionsGrid({
  onNavigateToView,
  onOpenUploadDrawer,
}: QuickActionsGridProps) {
  const actions = [
    {
      id: "ai-assistant",
      title: "Ask AI Assistant",
      description: "Get answers instantly",
      icon: Sparkles,
      onClick: () => onNavigateToView("assistant"),
      color: "text-[#cc9166]",
      bg: "bg-[#cc9166]/10",
      border: "hover:border-[#cc9166]/40",
    },
    {
      id: "upload-doc",
      title: "Upload Document",
      description: "Upload & validate",
      icon: Upload,
      onClick: () => {
        if (onOpenUploadDrawer) onOpenUploadDrawer();
        else onNavigateToView("documents");
      },
      color: "text-[#82a8f8]",
      bg: "bg-[#82a8f8]/10",
      border: "hover:border-[#82a8f8]/40",
    },
    {
      id: "find-lab",
      title: "Find Laboratory",
      description: "Search BIS recognized labs",
      icon: FlaskConical,
      onClick: () => onNavigateToView("standards"),
      color: "text-[#75d69c]",
      bg: "bg-[#75d69c]/10",
      border: "hover:border-[#75d69c]/40",
    },
    {
      id: "check-standards",
      title: "Check Standards",
      description: "Find applicable IS",
      icon: BookOpen,
      onClick: () => onNavigateToView("standards"),
      color: "text-[#f2c96d]",
      bg: "bg-[#f2c96d]/10",
      border: "hover:border-[#f2c96d]/40",
    },
    {
      id: "track-apps",
      title: "Track Applications",
      description: "Track status & progress",
      icon: Target,
      onClick: () => onNavigateToView("workflows"),
      color: "text-[#cc9166]",
      bg: "bg-[#cc9166]/10",
      border: "hover:border-[#cc9166]/40",
    },
    {
      id: "schemes",
      title: "Schemes & Incentives",
      description: "View benefits",
      icon: Gift,
      onClick: () => onNavigateToView("schemes"),
      color: "text-[#e2e3e9]",
      bg: "bg-white/[0.06]",
      border: "hover:border-white/30",
    },
  ];

  return (
    <div className="slash-card p-5 flex flex-col justify-between select-none">
      <div>
        <h2 className="text-sm font-semibold text-[#ffffff] tracking-tight pb-3.5 border-b border-[#1c1d22]">
          Quick Actions
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-2 gap-2.5 mt-3.5">
          {actions.map((act) => {
            const Icon = act.icon;
            return (
              <button
                key={act.id}
                type="button"
                onClick={act.onClick}
                className={`p-3 rounded-[10px] bg-[#121317] border border-[#1c1d22] ${act.border} transition-all text-left group cursor-pointer flex flex-col justify-between min-h-[76px]`}
              >
                <div className="flex items-center justify-between w-full">
                  <div
                    className={`h-7 w-7 rounded-[8px] ${act.bg} flex items-center justify-center ${act.color}`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <ArrowUpRight className="h-3 w-3 text-[#5e616e] group-hover:text-[#ffffff] transition-colors" />
                </div>

                <div className="mt-2 min-w-0">
                  <div className="font-semibold text-xs text-[#ffffff] group-hover:text-[#cc9166] transition-colors truncate">
                    {act.title}
                  </div>
                  <div className="text-[10px] text-[#777a88] truncate mt-0.5">
                    {act.description}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default QuickActionsGrid;
