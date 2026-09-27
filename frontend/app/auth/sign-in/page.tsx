"use client";

import React, { Suspense } from "react";
import SignInPage from "../signin/page";

export default function HyphenatedSignInPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F8FAFC]" />}>
      <SignInPage />
    </Suspense>
  );
}
