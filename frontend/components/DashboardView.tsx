"use client";
import Link from "next/link";
import { useState } from "react";
import LoadingSkeleton from "./LoadingSkeleton";
import ErrorState from "./ErrorState";
import Overlay from "./product/Overlay";
import { ComplianceActivityCard } from "./dashboard/ComplianceActivityCard";
import { DocumentsCard } from "./dashboard/DocumentsCard";
import { ComplianceStatusCard } from "./dashboard/ComplianceStatusCard";
import { ArrowRight, FileText, GitFork, ShieldCheck, Calendar, Sparkles } from "lucide-react";
import { useBusinessContext } from "@/context/BusinessContext";
import { useAuth } from "@/context/AuthContext";
import type { NavView } from "./Sidebar";
import StatusBadge from "./StatusBadge";
import Disclosure from "./product/Disclosure";
interface DashboardViewProps { onNavigateToView: (view: NavView) => void; onOpenNewQuery?: () => void }
export default function DashboardView({ onNavigateToView }: DashboardViewProps) {
  const [activityOpen, setActivityOpen] = useState(false);
  const { profile, activeBusinessId, activeAssessmentId, isLoading, loadError, refreshDashboardData, dashboardData, liveDashboardSummary: summary, isDemoMode } = useBusinessContext();
  const { user } = useAuth();
  const hasBusiness = Boolean(activeBusinessId);
  const name = hasBusiness || isDemoMode ? profile.businessName : "Your compliance workspace";
  const actions = summary?.priority_actions || [];
  const deadlines = summary?.upcoming_deadlines || [];
  const assessed = Boolean(summary?.has_evaluation || isDemoMode);
  const actionCount = assessed ? summary?.metrics.action_required_count ?? "—" : "—";
  const needsInfo = summary?.metrics?.needs_information_count ?? "—";
  const readiness = summary?.compliance_readiness;
  const query = activeBusinessId ? "?business_id=" + encodeURIComponent(activeBusinessId) + (activeAssessmentId ? "&assessment_id=" + encodeURIComponent(activeAssessmentId) : "") : "";
  if (isLoading) return <LoadingSkeleton count={6} />;
  if (loadError) return <ErrorState message={loadError} onRetry={() => void refreshDashboardData()} />;
  return <div className="space-y-8">
    <header className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
      <div><p className="ui-eyebrow mb-3">Your workspace{isDemoMode ? " · Sample business" : ""}</p>
        <p className="text-sm text-[var(--ui-secondary)] mb-2">Welcome back{user?.full_name ? ", " + user.full_name.split(" ")[0] : ""}.</p>
        <h1 className="text-3xl sm:text-4xl max-w-2xl">{name}</h1>
        {hasBusiness && <p className="text-sm text-[var(--ui-secondary)] mt-3">{profile.state} · {profile.sector}</p>}
      </div>
      <Link href={hasBusiness ? "/compliance" + query : "/onboarding?new=true"} className="ui-button ui-button-primary">{hasBusiness ? "View requirements" : "Understand your business"}<ArrowRight size={16} /></Link>
    </header>
    <nav className="ui-attention" aria-label="Needs attention">
      <Link href={"/compliance" + query}><strong>{actionCount}</strong><span>actions to review</span></Link>
      <Link href={"/calendar" + query}><strong>{assessed ? deadlines.length : "—"}</strong><span>upcoming deadlines</span></Link>
      <Link href={"/compliance" + query + (query ? "&" : "?") + "tab=action_required"}><strong>{needsInfo}</strong><span>need information</span></Link>
    </nav>
    {summary?.widgets && <section aria-label="Business workspace overview" className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <ComplianceActivityCard activityData={summary.widgets.activity} onExpand={() => setActivityOpen(true)} />
      <DocumentsCard documentsData={summary.widgets.documents} onOpen={() => onNavigateToView("documents")} />
      <ComplianceStatusCard categoryBreakdown={summary.widgets.cases} onExpand={() => onNavigateToView("workflows")} />
    </section>}
    <Overlay open={activityOpen} onClose={() => setActivityOpen(false)} title="Recent workspace activity" drawer>
      {summary?.widgets?.recent_activity.length ? summary.widgets.recent_activity.map(event => <article key={event.id} className="ui-object"><p className="ui-eyebrow">{new Date(event.recorded_at).toLocaleString()}</p><h3 className="mt-2">{event.event.replaceAll("_", " ")}</h3><p className="text-xs mt-2">{event.case}</p></article>) : <p className="text-sm text-[var(--ui-secondary)]">Your saved workflow actions and reviewer decisions will appear here.</p>}
    </Overlay>
    <div className="grid gap-8 xl:grid-cols-[1.6fr_1fr]">
      <section><div className="ui-section-heading"><h2>Needs your attention</h2><button className="text-xs text-[var(--ui-sage)]" onClick={() => onNavigateToView("compliance")}>View all →</button></div>
        {actions.length ? actions.slice(0,4).map(action => <article key={action.requirement_id} className="ui-object">
          <div className="flex justify-between gap-4 mb-3"><span className="ui-eyebrow">{action.authority}</span><StatusBadge status={action.status} /></div>
          <h3 className="text-base font-medium">{action.requirement_name}</h3>
          <div className="flex justify-between gap-4 mt-4"><span className="text-xs text-[var(--ui-secondary)]">{action.action_type?.replaceAll("_"," ")}</span><Link className="text-xs font-medium text-[var(--ui-sage)]" href={"/compliance/" + encodeURIComponent(action.requirement_id) + query}>Review requirement →</Link></div>
        </article>) : <div className="ui-object ui-empty"><ShieldCheck className="mx-auto mb-4 text-[var(--ui-sage)]" size={28} /><h3>{hasBusiness ? "A clear place to start." : "Let's understand your business."}</h3><p>{hasBusiness ? "Your assessment will bring relevant requirements and next steps here." : "Describe what you do to build your first compliance assessment."}</p><Link className="ui-button mt-6" href="/onboarding?new=true">{hasBusiness ? "Start an assessment" : "Set up your business"}<ArrowRight size={16} /></Link></div>}
      </section>
      <section><div className="ui-section-heading"><h2>Coming up</h2><Calendar size={16} className="text-[var(--ui-muted)]" /></div>
        <div className="ui-object">{deadlines.length ? deadlines.slice(0,3).map(deadline => <Link key={deadline.requirement_id} href={"/calendar" + query} className="block py-4 border-b border-[var(--ui-border)] last:border-0">
          <p className="ui-eyebrow mb-1">{deadline.due_date} · {deadline.days_remaining < 0 ? "Overdue" : deadline.days_remaining + " days remaining"}</p><h3 className="font-medium text-sm">{deadline.title}</h3>
        </Link>) : <><p className="font-medium">No deadlines recorded yet.</p><p className="text-xs text-[var(--ui-secondary)] mt-2">Dates appear when a requirement has a supported renewal or filing schedule.</p></>}
        </div>
        <div className="ui-object mt-4"><div className="flex justify-between mb-3"><h3 className="font-medium">{summary?.readiness_label || "Assessment completeness"}</h3><span className="text-[var(--ui-sage)]">{readiness == null ? "—" : Math.round(readiness) + "%"}</span></div>
          <div role="progressbar" aria-label="Assessment completeness" aria-valuemin={0} aria-valuemax={100} aria-valuenow={readiness ?? 0} className="h-1.5 rounded-full bg-[var(--ui-inset)] overflow-hidden"><div className="h-full bg-[var(--ui-sage)] transition-[width] duration-500" style={{width:Math.max(0,Math.min(100,readiness || 0))+"%"}} /></div>
          <p className="text-xs text-[var(--ui-secondary)] mt-3">{summary?.readiness_basis || "How much the assessment can determine from your business information."}</p>
        </div>
      </section>
    </div>
    <section><div className="ui-section-heading"><h2>Keep work moving</h2></div><div className="grid gap-4 md:grid-cols-3">
      {[{id:"documents",title:"Document vault",detail:"Upload, check and review your evidence.",icon:FileText},{id:"workflows",title:"Your workflows",detail:"Manage the steps behind each requirement.",icon:GitFork},{id:"assistant",title:"BIS Copilot",detail:"Explore standards with source-linked answers.",icon:Sparkles}].map(item => <button key={item.id} type="button" className="ui-object !mt-0 text-left hover:-translate-y-0.5" onClick={() => onNavigateToView(item.id as NavView)}><item.icon size={20} className="text-[var(--ui-sage)] mb-5" /><h3 className="font-medium">{item.title}</h3><p className="text-xs text-[var(--ui-secondary)] mt-2">{item.detail}</p><ArrowRight size={16} className="mt-4" /></button>)}
    </div></section>
    <Disclosure title="Business intelligence">
      <div className="grid gap-4 sm:grid-cols-2"><div><h3 className="font-medium">Matched schemes</h3>{summary?.schemes_preview?.length ? summary.schemes_preview.slice(0,3).map(item => <p className="text-sm mt-2" key={item.id}>{item.title || item.name}</p>) : <p className="text-xs mt-2 text-[var(--ui-secondary)]">Explore benefits as your business context develops.</p>}<Link className="text-xs text-[var(--ui-sage)] inline-block mt-3" href={"/schemes" + query}>Explore schemes →</Link></div><div><h3 className="font-medium">Regulatory changes</h3><p className="text-xs text-[var(--ui-secondary)] mt-2">{summary?.recent_updates_available ? "Review changes relevant to your business." : "Live regulatory change monitoring is not available yet."}</p><Link className="text-xs text-[var(--ui-sage)] inline-block mt-3" href="/regulatory-updates">View updates →</Link></div></div>
    </Disclosure>
  </div>;
}
export { DashboardView };

