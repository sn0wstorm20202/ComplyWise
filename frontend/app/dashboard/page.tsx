"use client";

import React, { useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import { NavView } from "@/components/Sidebar";
import DashboardView from "@/components/DashboardView";

function DashboardContent() {
  const router = useRouter();
  const [_newQueryOpen, setNewQueryOpen] = useState<boolean>(false);

  function handleNavigate(target: string) {
    const targetPath =
      target === "dashboard"
        ? "/dashboard"
        : target === "updates"
        ? "/regulatory-updates"
        : target === "assistant"
        ? "/ai-assistant"
        : target === "profile"
        ? "/business-profile"
        : target === "settings"
        ? "/settings"
        : `/${target}`;
    router.push(targetPath);
  }

  return (
    <AppShell activeView="dashboard">
      <DashboardView
        onNavigateToView={(target) => handleNavigate(target)}
        onOpenNewQuery={() => setNewQueryOpen(true)}
      />
    </AppShell>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#08080a]" />}>
      <DashboardContent />
    </Suspense>
  );
}
