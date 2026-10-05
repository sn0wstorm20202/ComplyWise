import Link from "next/link";
import StatusBadge from "@/components/StatusBadge";
import MetricCard from "@/components/MetricCard";
import { useLanguage } from "@/context/LanguageContext";
import type { Business, Assessment, DecisionRun, DiscoveryRunResult, ApplicabilityStatus } from "@/types";

interface AssessmentDecisionResultsProps {
  business: Business | null;
  assessment: Assessment | null;
  registeredState: string;
  decisionRun: DecisionRun | null;
  discoveryResult: DiscoveryRunResult | null;
  executiveSummary: any;
  showNotApplicable: boolean;
  onToggleNotApplicable: () => void;
  onRefineQuestions: () => void;
  openWhyModal: (requirement: any) => void;
}

export default function AssessmentDecisionResults({ business, assessment,
  registeredState, decisionRun, discoveryResult, executiveSummary,
  showNotApplicable, onToggleNotApplicable, onRefineQuestions, openWhyModal,
}: AssessmentDecisionResultsProps) {
  const { t } = useLanguage();
  const results = decisionRun?.results || [];
  const applicableCount = results.filter((r) => r.status === "APPLICABLE").length;
  const needsInfoCount = results.filter((r) => r.status === "NEEDS_INFORMATION").length;
  const unverifiedCount = results.filter((r) => r.status === "UNVERIFIED" || r.status === "CONFLICT_REVIEW").length;
  return (
            <div className="space-y-6">
              {/* Executive Summary Hero Card */}
              <div className="bg-white border border-[var(--ui-border)] rounded-2xl p-6 sm:p-8 text-[var(--ui-text)] shadow-2xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--ui-border)] pb-6">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-[var(--ui-sage-faint)] px-3 py-1 text-xs font-semibold text-[var(--ui-sage)] border border-[var(--ui-sage-soft)] mb-2">
                    <span>✓</span>
                    <span>Compliance Plan Generated</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-sans font-bold tracking-tight text-[var(--ui-text)]">
                    Compliance Plan for {business?.name || "Your Enterprise"}
                  </h2>
                  <p className="text-xs text-[var(--ui-secondary)] mt-1 max-w-xl">
                    Evaluated across Central Acts, {registeredState || "State"} statutory notifications, and official regulatory requirements.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <Link
                    href={`/compliance?business_id=${business?.id}${assessment ? `&assessment_id=${assessment.id}` : ""}`}
                    className="inline-flex items-center gap-2 rounded-full bg-[var(--ui-text)] px-5 py-2.5 text-xs font-semibold text-white shadow-2xs hover:bg-[var(--ui-text)] transition-colors cursor-pointer"
                  >
                    <span>View Compliance Plan</span>
                    <span>→</span>
                  </Link>
                  <Link
                    href={`/dashboard?business_id=${business?.id}${assessment ? `&assessment_id=${assessment.id}` : ""}`}
                    className="inline-flex items-center gap-2 rounded-full bg-white border border-[var(--ui-border)] px-5 py-2.5 text-xs font-semibold text-[var(--ui-text)] hover:bg-[var(--ui-bg)] transition-colors cursor-pointer shadow-2xs"
                  >
                    <span>Founder Dashboard</span>
                  </Link>
                </div>
              </div>

              {/* 4 Headline Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                <div className="bg-[var(--ui-bg)] rounded-xl p-4 border border-[var(--ui-border)]">
                  <span className="text-[var(--ui-secondary)] text-xs font-semibold block">Applicable Mandates</span>
                  <span className="text-2xl sm:text-3xl font-sans font-bold text-[var(--ui-text)] mt-1 block">
                    {applicableCount}
                  </span>
                  <span className="text-[11px] text-amber-800 font-medium mt-1 block">Obligations Required</span>
                </div>
                <div className="bg-[var(--ui-bg)] rounded-xl p-4 border border-[var(--ui-border)]">
                  <span className="text-[var(--ui-secondary)] text-xs font-semibold block">Required Documents</span>
                  <span className="text-2xl sm:text-3xl font-sans font-bold text-[var(--ui-text)] mt-1 block">
                    {executiveSummary?.documents_count ?? "Not recorded"}
                  </span>
                  <span className="text-[11px] text-amber-800 font-medium mt-1 block">Statutory Proofs</span>
                </div>
                <div className="bg-[var(--ui-bg)] rounded-xl p-4 border border-[var(--ui-border)]">
                  <span className="text-[var(--ui-secondary)] text-xs font-semibold block">Clearance Workflows</span>
                  <span className="text-2xl sm:text-3xl font-sans font-bold text-[var(--ui-text)] mt-1 block">
                    {executiveSummary?.workflows_count ?? "Not recorded"}
                  </span>
                  <span className="text-[11px] text-amber-800 font-medium mt-1 block">Approval Procedures</span>
                </div>
                <div className="bg-[var(--ui-bg)] rounded-xl p-4 border border-[var(--ui-border)]">
                  <span className="text-[var(--ui-secondary)] text-xs font-semibold block">Statutory Deadlines</span>
                  <span className="text-2xl sm:text-3xl font-sans font-bold text-[var(--ui-text)] mt-1 block">
                    {executiveSummary?.deadlines_count ?? "Not recorded"}
                  </span>
                  <span className="text-[11px] text-amber-800 font-medium mt-1 block">Filings &amp; Renewals</span>
                </div>
              </div>
            </div>

            {/* Audit metrics row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard
                label="Applicable Mandates"
                value={applicableCount}
                subtext="Direct statutory obligations"
                badge={{ text: "Active", variant: "warning" }}
              />
              <MetricCard
                label="Unresolved / Info Needed"
                value={needsInfoCount + unverifiedCount}
                subtext="Requires profile clarification"
                badge={{ text: "3-Valued Logic", variant: "warning" }}
              />
              <MetricCard
                label="Official Sources Reviewed"
                value={discoveryResult?.official_sources_count ?? 0}
                subtext={discoveryResult?.ran ? "Official-source discovery" : "Local Knowledge Pack"}
                badge={{ text: "Discovery", variant: "info" }}
              />
              <MetricCard
                label="Evaluation Run"
                value="COMPLETED"
                subtext={decisionRun ? `ID: ${decisionRun.id.slice(0, 8)}` : "Verified"}
                badge={{ text: "Audit Ready", variant: "success" }}
              />
            </div>

            {/* Live Discovery Audit Summary (Part L) */}
            <div className="bg-white rounded-2xl border border-[var(--ui-border)] p-5 shadow-2xs space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--ui-border)] pb-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-white text-xs font-bold">
                    ✓
                  </span>
                  <div>
                    <h3 className="text-sm font-sans font-bold text-[var(--ui-text)]">
                      Regulatory Discovery Complete
                    </h3>
                    <p className="text-xs text-[var(--ui-secondary)]">
                      Real web discovery executed for {business?.name || "enterprise"} with official source prioritization.
                    </p>
                  </div>
                </div>
                <span className="inline-flex items-center rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-xs font-bold text-amber-800">
                  {discoveryResult?.ran ? "Live Web Discovery Active" : "Knowledge Base Only"}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1 text-xs">
                <div className="bg-[var(--ui-bg)] p-3 rounded-xl border border-[var(--ui-border)]">
                  <span className="text-[var(--ui-secondary)] block text-[11px]">Queries Planned</span>
                  <span className="font-sans font-bold text-[var(--ui-text)] text-base">{discoveryResult?.queries?.length || 0}</span>
                </div>
                <div className="bg-[var(--ui-bg)] p-3 rounded-xl border border-[var(--ui-border)]">
                  <span className="text-[var(--ui-secondary)] block text-[11px]">Sources Reviewed</span>
                  <span className="font-sans font-bold text-[var(--ui-text)] text-base">{discoveryResult?.candidate_urls_count || 0}</span>
                </div>
                <div className="bg-[var(--ui-bg)] p-3 rounded-xl border border-[var(--ui-border)]">
                  <span className="text-[var(--ui-secondary)] block text-[11px]">Official Portals</span>
                  <span className="font-sans font-bold text-[var(--ui-text)] text-base">{discoveryResult?.official_sources_count || 0}</span>
                </div>
                <div className="bg-[var(--ui-bg)] p-3 rounded-xl border border-[var(--ui-border)]">
                  <span className="text-[var(--ui-secondary)] block text-[11px]">Claims Quarantined</span>
                  <span className="font-sans font-bold text-[var(--ui-text)] text-base">{discoveryResult?.candidate_requirements_count || 0}</span>
                </div>
              </div>
            </div>

            {/* Quarantined Candidate Regulatory Claims (Part D, E, F) */}
            {discoveryResult?.candidate_requirements && discoveryResult.candidate_requirements.length > 0 && (
              <div className="bg-amber-50/50 border border-amber-200 rounded-2xl p-6 shadow-2xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-200 pb-3">
                  <div>
                    <h3 className="text-sm font-sans font-bold text-amber-900 flex items-center gap-2">
                      <span>⚠ Quarantined Discovered Sources &amp; Claims ({discoveryResult.candidate_requirements.length})</span>
                    </h3>
                    <p className="text-xs text-amber-800 mt-0.5">
                      Candidate statutory claims scraped from official portals. Quarantined as UNVERIFIED until statutory review; cannot produce APPLICABLE decisions.
                    </p>
                  </div>
                  <span className="text-[11px] font-mono font-bold uppercase bg-amber-100 text-amber-900 px-3 py-1 rounded-full border border-amber-300">
                    Governance Active
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {discoveryResult.candidate_requirements.map((cr, crIdx) => (
                    <div
                      key={cr.id || `${cr.name}-${crIdx}`}
                      className="p-3.5 bg-white border border-amber-200 rounded-xl space-y-1.5 shadow-2xs"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-bold text-xs text-[var(--ui-text)] leading-snug">
                          {cr.name}
                        </span>
                        <span className="shrink-0 text-[10px] font-bold uppercase bg-amber-50 text-amber-800 px-2 py-0.5 rounded-full border border-amber-200">
                          Quarantined
                        </span>
                      </div>
                      <p className="text-[11px] text-[var(--ui-secondary)] line-clamp-2 leading-relaxed">
                        {cr.applicability_statement}
                      </p>
                      <div className="text-[10px] text-[var(--ui-secondary)] font-mono flex items-center justify-between pt-1">
                        <span>Authority: {cr.authority}</span>
                        <span className="text-amber-800 font-semibold">Evidence Extracted</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Categorized Requirements List (Part N — Filtered presentation) */}
            <div className="bg-white rounded-2xl border border-[var(--ui-border)] p-6 shadow-2xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--ui-border)] pb-4">
                <div>
                  <h2 className="text-base font-sans font-bold text-[var(--ui-text)]">
                    Statutory Applicability Results
                  </h2>
                  <p className="text-xs text-[var(--ui-secondary)]">
                    Evaluated deterministically against Central Acts and {registeredState} state notifications.
                  </p>
                </div>

                <Link
                  href={`/dashboard?business_id=${business?.id}`}
                  className="inline-flex items-center gap-2 rounded-full bg-[var(--ui-text)] px-5 py-2 text-xs font-semibold text-white hover:bg-[var(--ui-text)] transition-colors cursor-pointer shadow-2xs"
                >
                  {t("onboarding.enterDashboard")}
                </Link>
              </div>

              {results.length === 0 ? (
                <div className="py-8 text-center text-[var(--ui-secondary)] text-xs">
                  No decision rules were triggered for the current profile parameters.
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Action Required: APPLICABLE & NEEDS_INFORMATION */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-[var(--ui-secondary)]">
                        Action Required ({results.filter((r) => r.status === "APPLICABLE" || r.status === "NEEDS_INFORMATION").length})
                      </span>
                    </div>

                    {results
                      .filter((r) => r.status === "APPLICABLE" || r.status === "NEEDS_INFORMATION")
                      .map((r, idx) => (
                        <div
                          key={r.id || `${r.requirement_id}-${idx}`}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-[var(--ui-border)] bg-[var(--ui-bg)] hover:bg-white hover:border-[var(--ui-border-strong)] hover:shadow-2xs transition-colors"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-bold text-amber-800">
                                {r.requirement_id}
                              </span>
                              <span className="text-[var(--ui-muted)]">·</span>
                              <span className="text-xs font-sans font-bold text-[var(--ui-text)]">
                                {r.requirement_name}
                              </span>
                            </div>
                            <div className="text-[11px] text-[var(--ui-secondary)] flex items-center gap-2">
                              <span>
                                Evidence: {r.evidence_refs ? r.evidence_refs.length : 0} statutory citation(s)
                              </span>
                              {Boolean(r.explanation_trace?.reason) && (
                                <>
                                  <span>·</span>
                                  <span className="italic text-[var(--ui-secondary)]">
                                    {String(r.explanation_trace.reason)}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => openWhyModal(r)}
                              className="text-xs font-semibold text-amber-800 hover:underline cursor-pointer"
                            >
                              Why do I need this?
                            </button>
                            <StatusBadge status={r.status as ApplicabilityStatus} size="sm" />
                            <Link
                              href={`/compliance/${r.requirement_id}?business_id=${business?.id}`}
                              className="text-xs font-semibold text-[var(--ui-secondary)] hover:text-[var(--ui-text)]"
                            >
                              Details →
                            </Link>
                          </div>
                        </div>
                      ))}
                  </div>

                  {/* Verification Required: UNVERIFIED & CONFLICT_REVIEW */}
                  {results.filter((r) => r.status === "UNVERIFIED" || r.status === "CONFLICT_REVIEW").length > 0 && (
                    <div className="space-y-3 pt-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-amber-800">
                          Verification Required ({results.filter((r) => r.status === "UNVERIFIED" || r.status === "CONFLICT_REVIEW").length})
                        </span>
                      </div>

                      {results
                        .filter((r) => r.status === "UNVERIFIED" || r.status === "CONFLICT_REVIEW")
                        .map((r, idx) => (
                          <div
                            key={r.id || `${r.requirement_id}-${idx}`}
                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-amber-300 bg-amber-50/40 hover:bg-amber-50/70 transition-colors"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs font-bold text-amber-800">
                                  {r.requirement_id}
                                </span>
                                <span className="text-[var(--ui-muted)]">·</span>
                                <span className="text-xs font-sans font-bold text-[var(--ui-text)]">
                                  {r.requirement_name}
                                </span>
                              </div>
                              <div className="text-[11px] text-[var(--ui-secondary)]">
                                {String(r.explanation_trace?.reason || "Verification required")}
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              <StatusBadge status={r.status as ApplicabilityStatus} size="sm" />
                              <Link
                                href={`/compliance/${r.requirement_id}?business_id=${business?.id}`}
                                className="text-xs font-semibold text-amber-800 hover:underline"
                              >
                                View Detail →
                              </Link>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}

                  {/* Not Applicable Requirements: Collapsible / Hidden by default (Part N) */}
                  {results.filter((r) => r.status === "NOT_APPLICABLE").length > 0 && (
                    <div className="pt-2 border-t border-[var(--ui-border)]">
                      <button
                        type="button"
                        onClick={() => onToggleNotApplicable()}
                        className="flex items-center justify-between w-full py-2 text-xs font-semibold text-[var(--ui-secondary)] hover:text-[var(--ui-text)] transition-colors cursor-pointer"
                      >
                        <span>
                          {showNotApplicable ? "▾ Hide" : "▸ Show"} Not Applicable Requirements ({results.filter((r) => r.status === "NOT_APPLICABLE").length} hidden by default)
                        </span>
                        <span className="text-[11px] text-[var(--ui-muted)]">
                          {showNotApplicable ? "Click to collapse" : "Click to view full audit trail"}
                        </span>
                      </button>

                      {showNotApplicable && (
                        <div className="space-y-2 pt-2">
                          {results
                            .filter((r) => r.status === "NOT_APPLICABLE")
                            .map((r, idx) => (
                              <div
                                key={r.id || `${r.requirement_id}-${idx}`}
                                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-[var(--ui-border)] bg-[var(--ui-bg)] opacity-75"
                              >
                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono text-[11px] font-bold text-[var(--ui-secondary)]">
                                      {r.requirement_id}
                                    </span>
                                    <span className="text-[var(--ui-border-strong)]">·</span>
                                    <span className="text-xs font-medium text-[var(--ui-secondary)]">
                                      {r.requirement_name}
                                    </span>
                                  </div>
                                  <div className="text-[10px] text-[var(--ui-muted)]">
                                    Reason: {String(r.explanation_trace?.reason || "Not triggered by business profile parameters")}
                                  </div>
                                </div>
                                <StatusBadge status="NOT_APPLICABLE" size="sm" />
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Bottom CTAs */}
              <div className="pt-4 border-t border-[var(--ui-border)] flex flex-col sm:flex-row items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => onRefineQuestions()}
                  className="text-xs font-semibold text-[var(--ui-secondary)] hover:text-[var(--ui-text)] cursor-pointer"
                >
                  ← Refine Smart Questions
                </button>

                <div className="flex items-center gap-3">
                  <Link
                    href={`/schemes?business_id=${business?.id}`}
                    className="rounded-full border border-[var(--ui-sage-soft)] bg-[var(--ui-sage-faint)] px-5 py-2 text-xs font-semibold text-[var(--ui-sage)] hover:bg-[var(--ui-sage-soft)] transition-colors shadow-2xs"
                  >
                    View Matched Schemes
                  </Link>

                  <Link
                    href={`/compliance?business_id=${business?.id}${assessment ? `&assessment_id=${assessment.id}` : ""}`}
                    className="rounded-full border border-[var(--ui-border)] bg-white px-5 py-2 text-xs font-semibold text-[var(--ui-text)] hover:bg-[var(--ui-bg)] transition-colors shadow-2xs"
                  >
                    {t("onboarding.viewAllMandates")}
                  </Link>

                  <Link
                    href={`/dashboard?business_id=${business?.id}${assessment ? `&assessment_id=${assessment.id}` : ""}`}
                    className="inline-flex items-center gap-2 rounded-full bg-[var(--ui-text)] px-6 py-2 text-xs font-semibold text-white hover:bg-[var(--ui-text)] transition-colors shadow-2xs"
                  >
                    {t("onboarding.enterDashboard")}
                  </Link>
                </div>
              </div>
            </div>
            </div>
  );
}
