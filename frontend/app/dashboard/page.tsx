"use client";

import React, { useState } from "react";
import AppShell from "@/components/AppShell";
import { NavView } from "@/components/Sidebar";
import DashboardView from "@/components/DashboardView";
import {
  ComplianceView,
  DocumentsView,
  WorkflowsView,
  CalendarView,
  StandardsView,
  SchemesView,
  UpdatesView,
  AssistantView,
  ProfileView,
  SettingsView,
} from "@/components/ComplianceViews";

export default function DashboardPage() {
  const [activeView, setActiveView] = useState<NavView>("dashboard");
  const [newQueryOpen, setNewQueryOpen] = useState<boolean>(false);

  function renderView(view: NavView) {
    switch (view) {
      case "dashboard":
        return (
          <DashboardView
            onNavigateToView={(target) => setActiveView(target)}
            onOpenNewQuery={() => setNewQueryOpen(true)}
          />
        );
      case "compliance":
        return <ComplianceView />;
      case "documents":
        return <DocumentsView />;
      case "workflows":
        return <WorkflowsView />;
      case "calendar":
        return <CalendarView />;
      case "standards":
        return <StandardsView />;
      case "schemes":
        return <SchemesView />;
      case "updates":
        return <UpdatesView />;
      case "assistant":
        return <AssistantView />;
      case "profile":
        return <ProfileView />;
      case "settings":
        return <SettingsView />;
      default:
        return (
          <DashboardView
            onNavigateToView={(target) => setActiveView(target)}
            onOpenNewQuery={() => setNewQueryOpen(true)}
          />
        );
    }
  }

  return (
    <AppShell
      activeView={activeView}
      onSelectView={(view) => setActiveView(view)}
      renderViewContent={renderView}
    />
  );
}
