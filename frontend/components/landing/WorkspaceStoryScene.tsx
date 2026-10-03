"use client";

import React, { useState, useRef, useLayoutEffect } from "react";
import gsap from "gsap";
import Link from "next/link";
import {
  ShieldCheck,
  FileText,
  GitBranch,
  Calendar,
  Award,
  Layers,
  ArrowUpRight,
  CheckCircle2,
  Clock,
} from "lucide-react";

export function WorkspaceStoryScene() {
  const [activeTab, setActiveTab] = useState<
    "overview" | "compliance" | "documents" | "workflows" | "calendar" | "schemes" | "standards"
  >("overview");
  const panelRef = useRef<HTMLDivElement>(null);
  const tabListRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(panelRef.current, { opacity: 0, x: 12 }, { opacity: 1, x: 0, duration: 0.45, ease: "power3.out" });
    });
    return () => ctx.revert();
  }, [activeTab]);

  const selectTab = (id: typeof activeTab) => {
    if (id === activeTab) return;
    gsap.killTweensOf(panelRef.current);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setActiveTab(id);
      return;
    }
    gsap.to(panelRef.current, { opacity: 0, x: -12, duration: 0.18, ease: "power2.in", onComplete: () => setActiveTab(id) });
  };

  const tabs = [
    { id: "overview", label: "Overview", icon: Layers },
    { id: "compliance", label: "Compliance", icon: ShieldCheck },
    { id: "documents", label: "Documents", icon: FileText },
    { id: "workflows", label: "Workflows", icon: GitBranch },
    { id: "calendar", label: "Calendar", icon: Calendar },
    { id: "schemes", label: "Schemes", icon: Award },
    { id: "standards", label: "Standards", icon: Layers },
  ] as const;

  return (
    <section
      id="workspace"
      className="py-32 md:py-48 bg-[#EFEEE7] border-t border-[rgba(23,23,20,0.06)]"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Chapter Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="max-w-2xl space-y-4">
            <div className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-[#96938A] px-3.5 py-1 rounded-full bg-[#F7F5EF] border border-[rgba(23,23,20,0.06)]">
              <Layers className="h-3.5 w-3.5 text-[#557D6B]" />
              <span>CHAPTER 06 &bull; WORKSPACE</span>
            </div>

            <h2 className="text-[clamp(2.4rem,5vw,4.2rem)] font-serif text-[#171714] leading-[1.06] tracking-[-0.02em]">
              Turn requirements into <span className="italic font-light text-[#557D6B]">next steps.</span>
            </h2>

            <p className="text-base text-[#6F6D66] font-light leading-relaxed">
              Keep requirements, documents, workflows and important dates together.
            </p>
          </div>

          <Link
            href="/dashboard"
            className="group inline-flex items-center gap-2 rounded-full bg-[#171714] hover:bg-[#557D6B] text-[#F7F5EF] px-6 py-3 text-xs font-medium transition-all duration-500 shadow-sm active:scale-[0.98] w-max"
          >
            <span>Explore Workspace</span>
            <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </div>

        {/* Real Interactive React Workspace Window Frame */}
        <div className="rounded-[32px] bg-[#F7F5EF] border border-[rgba(23,23,20,0.1)] p-6 sm:p-9 shadow-[0_28px_80px_rgba(23,23,20,0.06)] space-y-8">
          {/* Workspace Shell Top Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[rgba(23,23,20,0.08)] pb-5">
            <div className="flex items-center gap-3">
              <div className="flex gap-1.5">
                <span className="h-3 w-3 rounded-full bg-[rgba(23,23,20,0.12)]" />
                <span className="h-3 w-3 rounded-full bg-[rgba(23,23,20,0.12)]" />
                <span className="h-3 w-3 rounded-full bg-[rgba(23,23,20,0.12)]" />
              </div>
              <span className="font-mono text-xs font-semibold text-[#171714] pl-2 border-l border-[rgba(23,23,20,0.1)]">
                Your business &bull; Maharashtra
              </span>
            </div>

            <div className="flex items-center gap-2 font-mono text-[11px] text-[#557D6B]">
              <span className="h-2 w-2 rounded-full bg-[#7FAF9A] " />
              <span>ILLUSTRATIVE WORKSPACE</span>
            </div>
          </div>

          {/* Interactive Navigation Tabs */}
          <div ref={tabListRef} role="tablist" aria-label="Workspace preview" className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => selectTab(tab.id)}
                  role="tab"
                  id={`workspace-tab-${tab.id}`}
                  aria-selected={isActive}
                  aria-controls="workspace-panel"
                  tabIndex={isActive ? 0 : -1}
                  onKeyDown={(event) => {
                    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
                    event.preventDefault();
                    const index = tabs.findIndex((item) => item.id === tab.id);
                    const next = event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1 : (index + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
                    selectTab(tabs[next].id);
                    (tabListRef.current?.children[next] as HTMLButtonElement)?.focus();
                  }}
                  className={`workspace-tab flex items-center gap-2 px-4 py-2 rounded-full text-xs font-mono transition-all duration-300 cursor-pointer whitespace-nowrap ${
                    isActive
                      ? "bg-[#171714] text-[#F7F5EF] shadow-xs"
                      : "bg-[#EFEEE7] text-[#6F6D66] hover:text-[#171714] hover:bg-[#E7EEE9]"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab Views */}
          <div ref={panelRef} id="workspace-panel" role="tabpanel" aria-labelledby={`workspace-tab-${activeTab}`} tabIndex={0} className="workspace-panel min-h-[280px]">
            {activeTab === "overview" && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { label: "REQUIREMENT", title: "See what needs attention", detail: "Keep the result and its reason together." },
                  { label: "EVIDENCE", title: "Keep the source close", detail: "Review the relevant passage and supporting documents." },
                  { label: "NEXT STEP", title: "Give the task an owner", detail: "Track progress and set a team reminder." },
                ].map((item) => (
                  <article key={item.label} tabIndex={0} className="workspace-item p-5 rounded-2xl bg-[#EFEEE7] border border-[rgba(23,23,20,0.06)] space-y-3">
                    <span className="font-mono text-[11px] text-[#557D6B]">{item.label}</span>
                    <h3 className="font-serif text-lg">{item.title}</h3>
                    <p className="text-xs text-[#6F6D66] leading-relaxed">{item.detail}</p>
                    <span className="story-metadata text-[10px] font-mono text-[#557D6B]">SOURCE → REASON → NEXT STEP</span>
                  </article>
                ))}
              </div>
            )}
            {/* 1. Compliance View */}
            {activeTab === "compliance" && (
              <div className="space-y-4 animate-in fade-in duration-300">
                <div className="flex flex-wrap gap-3 items-center justify-between text-xs font-mono text-[#96938A]">
                  <span>REQUIREMENTS (2)</span>
                  <span>REVIEW &amp; ACT</span>
                </div>

                <div tabIndex={0} className="workspace-item p-5 rounded-2xl bg-[#EFEEE7] border border-[rgba(23,23,20,0.06)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 font-mono text-[11px]">
                      <span className="px-2 py-0.5 rounded bg-[#DCEAE2] text-[#557D6B] font-semibold">
                        RULE-014
                      </span>
                      <span className="text-[#6F6D66]">SOURCE LINKED &bull; EXAMPLE</span>
                    </div>
                    <h3 className="font-serif text-lg text-[#171714]">
                      Review the requirement and supporting document
                    </h3>
                    <span className="story-metadata font-mono text-[10px] text-[#557D6B]">Source · reason · supporting document ↗</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 rounded-full bg-[#DCEAE2] text-[#557D6B] font-mono text-xs font-semibold">
                      APPLICABLE
                    </span>
                    <Link
                      aria-label="Review compliance requirements"
                      href="/compliance"
                      className="p-3 rounded-full bg-[#F7F5EF] text-[#171714] hover:bg-[#171714] hover:text-white transition-colors"
                    >
                      <ArrowUpRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>

                <div tabIndex={0} className="workspace-item p-5 rounded-2xl bg-[#EFEEE7] border border-[rgba(23,23,20,0.06)] flex flex-col sm:flex-row sm:items-center justify-between gap-4 opacity-80">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 font-mono text-[11px]">
                      <span className="px-2 py-0.5 rounded bg-[#F7F5EF] text-[#6F6D66] font-semibold">
                        RULE-028
                      </span>
                      <span className="text-[#6F6D66]">EVIDENCE &bull; EXAMPLE</span>
                    </div>
                    <h3 className="font-serif text-lg text-[#171714]">
                      Assign an owner for the next step
                    </h3>
                    <span className="story-metadata font-mono text-[10px] text-[#557D6B]">Source · reason · supporting document ↗</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 rounded-full bg-[#EFEEE7] text-[#6F6D66] font-mono text-xs font-semibold border border-[rgba(23,23,20,0.1)]">
                      NEEDS ATTENTION
                    </span>
                    <Link
                      aria-label="Review compliance requirements"
                      href="/compliance"
                      className="p-3 rounded-full bg-[#F7F5EF] text-[#171714] hover:bg-[#171714] hover:text-white transition-colors"
                    >
                      <ArrowUpRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* 2. Documents View */}
            {activeTab === "documents" && (
              <div className="space-y-4 animate-in fade-in duration-300">
                <div className="flex flex-wrap gap-3 items-center justify-between text-xs font-mono text-[#96938A]">
                  <span>DOCUMENTS (3)</span>
                  <span>REVIEW STATUS</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div tabIndex={0} className="workspace-item p-5 rounded-2xl bg-[#EFEEE7] border border-[rgba(23,23,20,0.06)] space-y-3">
                    <div className="flex flex-wrap gap-3 items-center justify-between text-[11px] font-mono">
                      <span className="text-[#557D6B] font-semibold">BUSINESS DOCUMENT</span>
                      <span className="text-[#557D6B]">VERIFIED</span>
                    </div>
                    <h3 className="font-serif text-base text-[#171714]">
                      Business profile &amp; workshop layout
                    </h3>
                    <p className="text-xs text-[#6F6D66]">
                      Keep business details with the requirement.
                    </p>
                  </div>

                  <div tabIndex={0} className="workspace-item p-5 rounded-2xl bg-[#EFEEE7] border border-[rgba(23,23,20,0.06)] space-y-3">
                    <div className="flex flex-wrap gap-3 items-center justify-between text-[11px] font-mono">
                      <span className="text-[#557D6B] font-semibold">SUPPORTING FILE</span>
                      <span className="text-[#557D6B]">REVIEWED</span>
                    </div>
                    <h3 className="font-serif text-base text-[#171714]">
                      Supporting records
                    </h3>
                    <p className="text-xs text-[#6F6D66]">
                      Documents connected to the relevant task.
                    </p>
                  </div>

                  <div tabIndex={0} className="workspace-item p-5 rounded-2xl bg-[#EFEEE7] border border-[rgba(23,23,20,0.06)] space-y-3">
                    <div className="flex flex-wrap gap-3 items-center justify-between text-[11px] font-mono">
                      <span className="text-[#A6625B] font-semibold">TEAM REVIEW</span>
                      <span className="text-[#A6625B]">NEEDS ATTENTION</span>
                    </div>
                    <h3 className="font-serif text-base text-[#171714]">
                      Document review
                    </h3>
                    <p className="text-xs text-[#6F6D66]">
                      Ready for your team to check and approve.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 3. Workflows View */}
            {activeTab === "workflows" && (
              <div className="space-y-4 animate-in fade-in duration-300">
                <div className="flex flex-wrap gap-3 items-center justify-between text-xs font-mono text-[#96938A]">
                  <span>ACTIVE COMPLIANCE WORKFLOWS</span>
                  <span>EXAMPLE WORKFLOW</span>
                </div>

                <div tabIndex={0} className="workspace-item p-6 rounded-2xl bg-[#EFEEE7] border border-[rgba(23,23,20,0.06)] space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[rgba(23,23,20,0.08)] pb-4">
                    <h3 className="font-serif text-lg text-[#171714]">
                      From requirement to completed task
                    </h3>
                    <span className="font-mono text-xs text-[#557D6B]">STEP 2 OF 3 IN PROGRESS</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
                    <div className="p-4 rounded-xl bg-[#DCEAE2] border border-[#7FAF9A]/50 space-y-1">
                      <div className="flex items-center gap-2 text-[#557D6B] font-bold">
                        <CheckCircle2 className="h-4 w-4" />
                        <span>1. REVIEW REQUIREMENT</span>
                      </div>
                      <p className="font-sans text-[11px] text-[#557D6B]">Source and conditions reviewed</p>
                    </div>

                    <div className="p-4 rounded-xl bg-[#F7F5EF] border border-[#557D6B] space-y-1">
                      <div className="flex items-center gap-2 text-[#171714] font-bold">
                        <Clock className="h-4 w-4 text-[#557D6B]" />
                        <span>2. GATHER DOCUMENTS</span>
                      </div>
                      <p className="font-sans text-[11px] text-[#6F6D66]">Assigned to your team</p>
                    </div>

                    <div className="p-4 rounded-xl bg-[#F7F5EF] border border-[rgba(23,23,20,0.06)] opacity-60 space-y-1">
                      <div className="flex items-center gap-2 text-[#96938A] font-bold">
                        <span>3. COMPLETE REVIEW</span>
                      </div>
                      <p className="font-sans text-[11px] text-[#96938A]">Waiting for supporting documents</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 4. Calendar View */}
            {activeTab === "calendar" && (
              <div className="space-y-4 animate-in fade-in duration-300">
                <div className="flex flex-wrap gap-3 items-center justify-between text-xs font-mono text-[#96938A]">
                  <span>IMPORTANT DATES</span>
                  <span>ILLUSTRATIVE REMINDERS</span>
                </div>

                <div className="space-y-3">
                  <div tabIndex={0} className="workspace-item workspace-calendar-item p-4 rounded-2xl bg-[#EFEEE7] flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="workspace-date h-10 w-10 rounded-xl bg-[#171714] text-[#F7F5EF] font-mono text-center flex flex-col justify-center text-[10px]">
                        <span className="font-bold text-xs">15</span>
                        <span>MAY</span>
                      </div>
                      <div>
                        <h3 className="font-serif text-base text-[#171714]">
                          Review supporting documents
                        </h3>
                        <span className="story-metadata font-mono text-xs text-[#6F6D66]">Team reminder • example date</span>
                      </div>
                    </div>
                    <span className="workspace-calendar-status font-mono text-xs text-[#557D6B] font-semibold">UPCOMING</span>
                  </div>

                  <div tabIndex={0} className="workspace-item workspace-calendar-item p-4 rounded-2xl bg-[#EFEEE7] flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="workspace-date h-10 w-10 rounded-xl bg-[#F7F5EF] text-[#171714] font-mono text-center flex flex-col justify-center text-[10px]">
                        <span className="font-bold text-xs">30</span>
                        <span>JUN</span>
                      </div>
                      <div>
                        <h3 className="font-serif text-base text-[#171714]">
                          Check progress with your team
                        </h3>
                        <span className="font-mono text-xs text-[#6F6D66]">Internal review • example date</span>
                      </div>
                    </div>
                    <span className="workspace-calendar-status font-mono text-xs text-[#6F6D66]">UPCOMING</span>
                  </div>
                </div>
              </div>
            )}

            {/* 5. Schemes View */}
            {activeTab === "schemes" && (
              <div className="space-y-4 animate-in fade-in duration-300">
                <div className="flex flex-wrap gap-3 items-center justify-between text-xs font-mono text-[#96938A]">
                  <span>SCHEMES TO REVIEW</span>
                  <span>CHECK ELIGIBILITY</span>
                </div>

                <div tabIndex={0} className="workspace-item p-6 rounded-2xl bg-[#EFEEE7] border border-[rgba(23,23,20,0.06)] space-y-3">
                  <div className="flex flex-wrap gap-3 items-center justify-between font-mono text-xs">
                    <span className="text-[#557D6B] font-bold">BUSINESS SUPPORT SCHEME</span>
                    <span className="px-2.5 py-0.5 rounded-full bg-[#DCEAE2] text-[#557D6B]">
                      REVIEW CONDITIONS
                    </span>
                  </div>
                  <h3 className="font-serif text-xl text-[#171714]">
                    See the conditions before you apply
                  </h3>
                  <p className="text-xs text-[#6F6D66] font-light leading-relaxed">
                    Review the source and eligibility conditions alongside your business details.
                  </p>
                </div>
              </div>
            )}

            {/* 6. Standards View */}
            {activeTab === "standards" && (
              <div className="space-y-4 animate-in fade-in duration-300">
                <div className="flex flex-wrap gap-3 items-center justify-between text-xs font-mono text-[#96938A]">
                  <span>RELEVANT STANDARDS</span>
                  <span>SOURCE &amp; VERSION</span>
                </div>

                <div tabIndex={0} className="workspace-item p-6 rounded-2xl bg-[#EFEEE7] border border-[rgba(23,23,20,0.06)] space-y-3">
                  <div className="flex flex-wrap gap-3 items-center justify-between font-mono text-xs">
                    <span className="text-[#171714] font-bold">PRODUCT STANDARD</span>
                    <span className="text-[#557D6B]">EXAMPLE RECORD</span>
                  </div>
                  <h3 className="font-serif text-xl text-[#171714]">
                    Understand the standard behind a requirement
                  </h3>
                  <p className="text-xs text-[#6F6D66] font-light leading-relaxed">
                    Keep the relevant standard and its source connected to the requirement you are reviewing.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export default WorkspaceStoryScene;
