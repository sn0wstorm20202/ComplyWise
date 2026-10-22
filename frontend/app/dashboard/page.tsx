"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AppShell from "@/components/AppShell";
import { NavView } from "@/components/Sidebar";
import DashboardView from "@/components/DashboardView";
import { useBusinessContext } from "@/context/BusinessContext";

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const businessIdFromUrl = searchParams?.get("business_id");
  const assessmentIdFromUrl = searchParams?.get("assessment_id");
  const { switchProfile, activeBusinessId, activeAssessmentId, setActiveAssessmentId, isLoading } = useBusinessContext();
  const attemptedSelection = useRef<string | null>(null);
  const [_newQueryOpen, setNewQueryOpen] = useState<boolean>(false);

  useEffect(() => {
    if (!isLoading && businessIdFromUrl && businessIdFromUrl !== activeBusinessId) {
      switchProfile(businessIdFromUrl);
    }
  }, [businessIdFromUrl, activeBusinessId, switchProfile, isLoading]);

  useEffect(() => {
    if (isLoading || !activeBusinessId || !assessmentIdFromUrl ||
        (businessIdFromUrl && businessIdFromUrl !== activeBusinessId) ||
        assessmentIdFromUrl === activeAssessmentId) return;
    const selection = `${activeBusinessId}:${assessmentIdFromUrl}`;
    // A rejected historical selection is displayed once, without retry loops.
    if (attemptedSelection.current === selection) return;
    attemptedSelection.current = selection;
    setActiveAssessmentId(assessmentIdFromUrl);
  }, [businessIdFromUrl, assessmentIdFromUrl, activeBusinessId, activeAssessmentId, isLoading, setActiveAssessmentId]);

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
    <Suspense fallback={<div className="min-h-screen bg-[var(--ui-bg)]" />}>
      <DashboardContent />
    </Suspense>
  );
}
