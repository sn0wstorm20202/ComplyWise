"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar, { NavView } from "./Sidebar";
import TopBar from "./TopBar";
import SearchModal from "./SearchModal";
import NewQueryModal from "./NewQueryModal";

interface AppShellProps {
  children?: React.ReactNode;
  activeView?: NavView;
  onSelectView?: (view: NavView) => void;
  renderViewContent?: (view: NavView) => React.ReactNode;
}

export function AppShell({
  children,
  activeView: controlledActiveView,
  onSelectView: controlledOnSelectView,
  renderViewContent,
}: AppShellProps) {
  const router = useRouter();
  const [internalActiveView, setInternalActiveView] = useState<NavView>("dashboard");
  const [searchOpen, setSearchOpen] = useState(false);
  const [newQueryOpen, setNewQueryOpen] = useState(false);

  function handleSelectView(view: NavView) {
    if (controlledOnSelectView) {
      controlledOnSelectView(view);
    } else {
      setInternalActiveView(view);
      const targetPath =
        view === "dashboard"
          ? "/dashboard"
          : view === "updates"
          ? "/regulatory-updates"
          : view === "assistant"
          ? "/ai-assistant"
          : view === "profile"
          ? "/business-profile"
          : view === "settings"
          ? "/settings"
          : `/${view}`;
      router.push(targetPath);
    }
  }

  const activeView = controlledActiveView || internalActiveView;

  // Derive top bar pill state from activeView
  const activePill =
    activeView === "dashboard"
      ? "dashboard"
      : activeView === "compliance"
      ? "compliance"
      : activeView === "updates"
      ? "reports"
      : "dashboard";

  return (
    <div className="min-h-screen bg-[#09090B] p-2 sm:p-4 lg:p-6 flex flex-col justify-center relative overflow-x-hidden">
      {/* Subtle Environmental Radial Light */}
      <div className="absolute top-0 right-1/4 w-[700px] h-[700px] bg-[radial-gradient(circle,rgba(109,140,255,0.04)_0%,transparent_65%)] pointer-events-none blur-3xl -z-0" />

      {/* Floating Application Window Container */}
      <div className="w-full max-w-[1440px] mx-auto bg-[#0D0E10] rounded-[16px] border border-white/[0.08] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col min-h-[900px] relative z-10">
        {/* Top Header Navigation */}
        <TopBar
          activePill={activePill}
          onSelectPill={(pill) => {
            if (pill === "dashboard") handleSelectView("dashboard");
            if (pill === "compliance") handleSelectView("compliance");
            if (pill === "reports") handleSelectView("updates");
          }}
          onNavigateToView={handleSelectView}
          onAddMember={() => {}}
        />

        {/* Main Body: Left Sidebar + Right Content Area */}
        <div className="flex flex-1 min-h-0">
          {/* Left Navigation Sidebar */}
          <Sidebar
            activeView={activeView}
            onSelectView={handleSelectView}
          />

          {/* Right Scrollable Content Canvas */}
          <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 overflow-y-auto min-w-0 bg-[#09090B]/30">
            {renderViewContent ? renderViewContent(activeView) : children}
          </main>
        </div>
      </div>

      {/* Global Search Command Palette */}
      <SearchModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        onNavigateTo={(target) => {
          handleSelectView(target as NavView);
          setSearchOpen(false);
        }}
      />

      {/* Primary Action Modal */}
      <NewQueryModal
        isOpen={newQueryOpen}
        onClose={() => setNewQueryOpen(false)}
        onViewStandard={() => {
          handleSelectView("standards");
          setNewQueryOpen(false);
        }}
      />
    </div>
  );
}

export default AppShell;
