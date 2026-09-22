"use client";

import React from "react";
import { ShieldCheck, BookOpen, Clock, Award } from "lucide-react";

export function DashboardTrustFooter() {
  const badges = [
    {
      icon: ShieldCheck,
      title: "100% Secure",
      description: "Your data is protected",
      color: "text-emerald-600 dark:text-emerald-400",
    },
    {
      icon: BookOpen,
      title: "Source Backed",
      description: "All answers with references",
      color: "text-blue-600 dark:text-blue-400",
    },
    {
      icon: Clock,
      title: "Always Updated",
      description: "Real-time regulatory updates",
      color: "text-amber-600 dark:text-amber-400",
    },
    {
      icon: Award,
      title: "Expert Approved",
      description: "Verified by domain experts",
      color: "text-purple-600 dark:text-purple-400",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2 select-none">
      {badges.map((b) => {
        const Icon = b.icon;
        return (
          <div
            key={b.title}
            className="slash-card px-4 py-3 flex items-center gap-3 border border-[#E2E8F0] dark:border-white/12 bg-white dark:bg-[#0E1318] hover:border-slate-300 dark:hover:border-white/20 transition-colors shadow-2xs rounded-xl"
          >
            <div className={`h-9 w-9 rounded-xl bg-[#F8FAFD] dark:bg-[#141A21] border border-[#E2E8F0] dark:border-white/15 flex items-center justify-center shrink-0 ${b.color}`}>
              <Icon className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-[#0B1220] dark:text-[#F7F9FC] truncate">
                {b.title}
              </div>
              <div className="text-xs text-[#475569] dark:text-[#A8B2BE] truncate mt-0.5">
                {b.description}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default DashboardTrustFooter;
