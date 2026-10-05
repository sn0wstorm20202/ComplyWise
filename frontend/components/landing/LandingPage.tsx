"use client";

import React, { useState } from "react";
import "./landing-interactions.css";
import ScrollManager from "./ScrollManager";
import CustomCursor from "./CustomCursor";
import FloatingNav from "./FloatingNav";
import PhysicalProductStory from "./PhysicalProductStory";
import CoverageScene from "./CoverageScene";
import VerificationScene from "./VerificationScene";
import FAQSection from "./FAQSection";
import FinalCTA from "./FinalCTA";
import LandingFooter from "./LandingFooter";
import RequestDemoModal from "./RequestDemoModal";

export function LandingPage() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="landing-story relative min-h-screen w-full bg-[#F7F5EF] text-[#171714] font-sans selection:bg-[#DCEAE2] selection:text-[#171714] overflow-x-hidden">
      {/* 1. Smooth Scroll Engine (Lenis + GSAP ScrollTrigger) */}
      <ScrollManager />

      {/* 2. Interactive Desktop Custom Cursor */}
      <CustomCursor />

      {/* 3. Detached Floating Capsule Navigation */}
      <FloatingNav onSeeWhatApplies={() => setModalOpen(true)} />

      <a className="story-skip-link" href="#story-main">Skip to content</a>
      <main id="story-main" tabIndex={-1}>
        {/* One persistent world: business → source → rule → evidence → action. */}
        <PhysicalProductStory />

        {/* 12. Chapter 08: Jurisdictions and business context */}
        <CoverageScene />

        {/* 13. Chapter 09: Source review sequence */}
        <VerificationScene />

        {/* 14. Editorial FAQ Accordion */}
        <FAQSection />

        {/* 15. Final Statement & Signature Expanding Circular CTA */}
        <FinalCTA onSeeWhatApplies={() => setModalOpen(true)} />

      </main>
      {/* 16. Sparse Editorial Footer */}
      <LandingFooter onSeeWhatApplies={() => setModalOpen(true)} />

      {/* 17. Business preview dialog */}
      <RequestDemoModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
}

export default LandingPage;
