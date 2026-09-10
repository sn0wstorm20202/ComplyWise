"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
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

function DashboardContent() {
  const searchParams = useSearchParams();
  const initialView = (searchParams.get("view") as NavView) || "dashboard";
  const [activeView, setActiveView] = useState<NavView>(initialView);
  const [_newQueryOpen, setNewQueryOpen] = useState<boolean>(false);

  useEffect(() => {
    const qView = searchParams.get("view") as NavView;
    if (qView) {
      setActiveView(qView);
    }
  }, [searchParams]);

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

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#edf0f6]" />}>
      <DashboardContent />
    </Suspense>
  );
}
