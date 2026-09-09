"use client";

import React, { useState } from "react";
import { Search, Bell, Shield, ChevronDown, CheckCircle2, ExternalLink } from "lucide-react";

interface HeaderProps {
  onOpenSearch: () => void;
  onOpenNewQuery: () => void;
  unreadCount?: number;
}

export function Header({ onOpenSearch, onOpenNewQuery, unreadCount = 2 }: HeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <header className="h-14 bg-white border-b border-slate-200/90 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Left: Breadcrumb & Context */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium truncate">
          <span className="text-slate-900 font-semibold">Apex Industrial Electro-Mechanicals Ltd.</span>
          <span className="text-slate-300">/</span>
          <span className="inline-flex items-center gap-1 font-mono text-[11px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200">
            <Shield className="h-3 w-3 text-blue-600" />
            BIS CM/L-8492019
          </span>
          <span className="hidden md:inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[11px] font-medium border border-emerald-200/60">
            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
            Deterministic Engine Active
          </span>
        </div>
      </div>

      {/* Center/Right: Global Search & Compact Controls */}
      <div className="flex items-center gap-2.5">
        {/* Global Search Bar (Trigger) */}
        <button
          onClick={onOpenSearch}
          type="button"
          className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 rounded-lg px-3 py-1.5 text-xs text-slate-400 hover:text-slate-600 transition-colors w-64 md:w-80 justify-between text-left group"
        >
          <div className="flex items-center gap-2 truncate">
            <Search className="h-3.5 w-3.5 text-slate-400 group-hover:text-slate-600" />
            <span className="truncate">Search standards, clauses, documents...</span>
          </div>
          <kbd className="hidden sm:inline-block text-[10px] font-mono bg-white border border-slate-200 text-slate-500 px-1.5 py-0.5 rounded shadow-2xs">
            ⌘K
          </kbd>
        </button>

        {/* Primary Action: New Query Button */}
        <button
          onClick={onOpenNewQuery}
          type="button"
          className="inline-flex items-center gap-1.5 bg-blue-900 hover:bg-blue-950 text-white rounded-lg px-3 py-1.5 text-xs font-semibold shadow-xs transition-colors"
        >
          <span>+ New Query</span>
        </button>

        <div className="h-4 w-px bg-slate-200 mx-1 hidden sm:block" />

        {/* Notifications Popover Trigger */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            type="button"
            aria-label="Notifications"
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-50 relative transition-colors"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-slate-200 p-3 z-50 text-xs animate-in fade-in slide-in-from-top-1">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 font-semibold text-slate-900">
                <span>Regulatory Alerts</span>
                <span className="text-[10px] font-mono text-slate-400">2 New</span>
              </div>
              <div className="divide-y divide-slate-100">
                <div className="py-2 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800">QCO S.O. 1421(E)</span>
                    <span className="text-[10px] text-amber-600 font-medium">Action Required</span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    Mandatory 3-pin plug certification deadline scheduled for 14 May 2026.
                  </p>
                </div>
                <div className="py-2 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800">IS 302-1:2024</span>
                    <span className="text-[10px] text-blue-600 font-medium">Harmonized</span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    IEC 60335-1 Ed 6.0 testing circular issued by BIS CMD-III.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowNotifications(false)}
                className="w-full mt-2 pt-2 border-t border-slate-100 text-center text-slate-500 hover:text-slate-900 font-medium text-[11px]"
              >
                Close Alerts
              </button>
            </div>
          )}
        </div>

        {/* User Profile / Status */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            type="button"
            className="flex items-center gap-1.5 p-1 rounded-lg hover:bg-slate-50 text-xs font-medium text-slate-700 transition-colors"
          >
            <div className="h-7 w-7 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center">
              VS
            </div>
            <ChevronDown className="h-3 w-3 text-slate-400" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-200 p-2 z-50 text-xs">
              <div className="px-2 py-1.5 border-b border-slate-100">
                <div className="font-semibold text-slate-900">Dr. Vikramaditya Sharma</div>
                <div className="text-[11px] text-slate-500">vikram@apex-industrial.in</div>
              </div>
              <div className="py-1">
                <div className="px-2 py-1 text-[11px] text-slate-500 font-mono">
                  Role: Compliance Director
                </div>
                <div className="px-2 py-1 text-[11px] text-slate-500 font-mono">
                  Tenant ID: BIS-TEN-4921
                </div>
              </div>
              <div className="pt-1 border-t border-slate-100">
                <button
                  onClick={() => setShowUserMenu(false)}
                  className="w-full text-left px-2 py-1.5 text-slate-700 hover:bg-slate-50 rounded font-medium"
                >
                  Close Menu
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;
