"use client";

import React, { useState } from "react";
import "./landing-interactions.css";
import ScrollManager from "./ScrollManager";
import CustomCursor from "./CustomCursor";
import FloatingNav from "./FloatingNav";
import HeroStory from "./HeroStory";
import BusinessStoryScene from "./BusinessStoryScene";
import AdaptiveQuestionScene from "./AdaptiveQuestionScene";
import RegulatoryDiscoveryScene from "./RegulatoryDiscoveryScene";
import RuleDecisionScene from "./RuleDecisionScene";
import EvidenceStoryScene from "./EvidenceStoryScene";
import TrustPrincipleScene from "./TrustPrincipleScene";
import WorkspaceStoryScene from "./WorkspaceStoryScene";
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
        {/* 4. Hero Section: "Behind every business is a rulebook." + Living State Preview */}
        <HeroStory />

        {/* 5. Chapter 01: Business description → details → missing fact */}
        <BusinessStoryScene />

        {/* 6. Chapter 02: Adaptive Question -> Answer Recorded -> Rule Path Updated */}
        <AdaptiveQuestionScene />

        {/* 7. Chapter 03: Sources → relevant requirements */}
        <RegulatoryDiscoveryScene />

        {/* 8. Chapter 04: Conditions → result */}
        <RuleDecisionScene />

        {/* 9. Chapter 05: Source → reason → next step */}
        <EvidenceStoryScene />

        {/* 10. Trust principle ("The rules decide. The AI explains.") */}
        <TrustPrincipleScene />

        {/* 11. Chapter 06: Interactive workspace */}
        <WorkspaceStoryScene />

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
