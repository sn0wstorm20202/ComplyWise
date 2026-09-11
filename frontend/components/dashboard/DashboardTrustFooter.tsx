"use client";

import React from "react";
import { ShieldCheck, BookOpen, Clock, Award } from "lucide-react";

export function DashboardTrustFooter() {
  const badges = [
    {
      icon: ShieldCheck,
      title: "100% Secure",
      description: "Your data is protected",
      color: "text-[#75d69c]",
    },
    {
      icon: BookOpen,
      title: "Source Backed",
      description: "All answers with references",
      color: "text-[#82a8f8]",
    },
    {
      icon: Clock,
      title: "Always Updated",
      description: "Real-time regulatory updates",
      color: "text-[#cc9166]",
    },
    {
      icon: Award,
      title: "Expert Approved",
      description: "Verified by domain experts",
      color: "text-[#f2c96d]",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2 select-none">
      {badges.map((b) => {
        const Icon = b.icon;
        return (
          <div
            key={b.title}
            className="slash-card px-4 py-3 flex items-center gap-3 border border-[#1c1d22] bg-[#040406] hover:border-[#2e3038] transition-colors"
          >
            <div className={`h-8 w-8 rounded-[8px] bg-[#121317] border border-[#1c1d22] flex items-center justify-center shrink-0 ${b.color}`}>
              <Icon className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-[#ffffff] truncate">
                {b.title}
              </div>
              <div className="text-[10px] text-[#777a88] truncate">
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
