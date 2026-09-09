"use client";

import React, { useState } from "react";
import Sidebar, { NavView } from "./Sidebar";
import Header from "./Header";
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
  const [internalActiveView, setInternalActiveView] = useState<NavView>("dashboard");
  const [searchOpen, setSearchOpen] = useState(false);
  const [newQueryOpen, setNewQueryOpen] = useState(false);

  const activeView = controlledActiveView || internalActiveView;

  function handleSelectView(view: NavView) {
    if (controlledOnSelectView) {
      controlledOnSelectView(view);
    } else {
      setInternalActiveView(view);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex">
      {/* Desktop Sidebar */}
      <Sidebar
        activeView={activeView}
        onSelectView={handleSelectView}
        actionRequiredCount={3}
        deadlinesCount={4}
        updatesCount={2}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          onOpenSearch={() => setSearchOpen(true)}
          onOpenNewQuery={() => setNewQueryOpen(true)}
          unreadCount={2}
        />

        <main className="flex-1 p-6 md:p-8 max-w-[1440px] w-full mx-auto">
          {renderViewContent ? renderViewContent(activeView) : children}
        </main>
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
        onViewStandard={(code) => {
          handleSelectView("standards");
          setNewQueryOpen(false);
        }}
      />
    </div>
  );
}

export default AppShell;
