"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AppShell from "@/components/AppShell";
import { NavView } from "@/components/Sidebar";
import DashboardView from "@/components/DashboardView";
import { useBusinessContext } from "@/context/BusinessContext";

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const businessIdFromUrl = searchParams?.get("business_id");
  const { switchProfile, activeBusinessId } = useBusinessContext();
  const [_newQueryOpen, setNewQueryOpen] = useState<boolean>(false);

  useEffect(() => {
    if (businessIdFromUrl && businessIdFromUrl !== activeBusinessId) {
      switchProfile(businessIdFromUrl);
    }
  }, [businessIdFromUrl, activeBusinessId, switchProfile]);

  function handleNavigate(target: string) {
    const currentBizId =
      businessIdFromUrl ||
      activeBusinessId ||
      (typeof window !== "undefined" ? localStorage.getItem("complywise_active_business_id") : null);
    const queryString = currentBizId ? `?business_id=${currentBizId}` : "";
    const targetPath =
      target === "dashboard"
        ? `/dashboard${queryString}`
        : target === "updates"
        ? `/regulatory-updates${queryString}`
        : target === "assistant"
        ? `/ai-assistant${queryString}`
        : target === "profile"
        ? `/business-profile${queryString}`
        : target === "settings"
        ? "/settings"
        : `/${target}${queryString}`;
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
    <Suspense fallback={<div className="min-h-screen bg-[#F8FAFC]" />}>
      <DashboardContent />
    </Suspense>
  );
}
