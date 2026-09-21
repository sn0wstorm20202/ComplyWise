"use client";

import React, { useState } from "react";
import LandingNavbar from "./LandingNavbar";
import HeroSection from "./HeroSection";
import ValueStrip from "./ValueStrip";
import ValueProposition from "./ValueProposition";
import StandardsHierarchySection from "./StandardsHierarchySection";
import AgentSection from "./AgentSection";
import PlatformOverviewSection from "./PlatformOverviewSection";
import WhatsNextSection from "./WhatsNextSection";
import FinalCTA from "./FinalCTA";
import LandingFooter from "./LandingFooter";
import RequestDemoModal from "./RequestDemoModal";

export function LandingPage() {
  const [demoModalOpen, setDemoModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#06080A] text-slate-100 font-sans selection:bg-blue-500/30 selection:text-white flex flex-col">
      {/* Top Compact Navigation */}
      <LandingNavbar onRequestDemo={() => setDemoModalOpen(true)} />

      {/* Hero Section with Framed Product Preview */}
      <main className="flex-1">
        <HeroSection onRequestDemo={() => setDemoModalOpen(true)} />

        {/* Value Strip */}
        <ValueStrip />

        {/* Core Value Proposition (01 Understand, 02 Analyse, 03 Act) */}
        <ValueProposition />

        {/* Technical Standards Hierarchy (STANDARD -> VERSION -> CLAUSE -> REQUIREMENT -> EVIDENCE) */}
        <StandardsHierarchySection />

        {/* BIS Agent Section */}
        <AgentSection />

        {/* Operational Product Overview */}
        <PlatformOverviewSection />

        {/* What's Being Built Next (Development Roadmap) */}
        <WhatsNextSection />

        {/* Final Understated CTA */}
        <FinalCTA onRequestDemo={() => setDemoModalOpen(true)} />
      </main>

      {/* Minimal Footer */}
      <LandingFooter onRequestDemo={() => setDemoModalOpen(true)} />

      {/* Interactive Request Demo Modal */}
      <RequestDemoModal
        isOpen={demoModalOpen}
        onClose={() => setDemoModalOpen(false)}
      />
    </div>
  );
}

export default LandingPage;
