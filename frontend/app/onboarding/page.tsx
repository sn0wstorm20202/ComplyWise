"use client";

import { Suspense } from "react";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import OnboardingFlow from "@/features/onboarding/OnboardingFlow";

export default function OnboardingPage() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <OnboardingFlow />
    </Suspense>
  );
}
