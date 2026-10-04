"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import StatusBadge from "@/components/StatusBadge";
import MetricCard from "@/components/MetricCard";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import ErrorState from "@/components/ErrorState";
import { api } from "@/lib/api";
import { Business, AssessmentSummary, BusinessProfileData } from "@/types";
import { useLanguage } from "@/context/LanguageContext";

export default function BusinessDetailPage() {
  const { t } = useLanguage();
  const params = useParams();
  const router = useRouter();
  const businessId = params.id as string;

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [profile, setProfile] = useState<BusinessProfileData | null>(null);
  const [assessments, setAssessments] = useState<AssessmentSummary[]>([]);
  const [creatingAssessment, setCreatingAssessment] = useState<boolean>(false);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const [bizData, profileData, assData] = await Promise.all([
        api.businesses.get(businessId),
        api.businesses.getProfile(businessId).catch(() => null),
        api.businesses.getAssessments(businessId).catch(() => []),
      ]);
      setBusiness(bizData);
      setProfile(profileData);
      setAssessments(assData);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load business details.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (businessId) {
      loadData();
    }
  }, [businessId]);

  async function handleStartNewAssessment() {
    if (!business) return;
    setCreatingAssessment(true);
    try {
      const nextNum = assessments.length + 1;
      const newAssessment = await api.businesses.createAssessment(business.id, {
        title: `Assessment #${nextNum} — ${new Date().toLocaleDateString("en-US", { month: "short", year: "numeric" })} Cycle`,
        duplicate_from_latest: true,
      });
      localStorage.setItem("complywise_active_business_id", business.id);
      localStorage.setItem("complywise_active_assessment_id", newAssessment.id);
      router.push(`/onboarding?business_id=${business.id}&assessment_id=${newAssessment.id}&new_assessment=true`);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to start new assessment.");
    } finally {
      setCreatingAssessment(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--ui-bg)]">
        <Navbar />
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <LoadingSkeleton />
        </main>
      </div>
    );
  }

  if (error || !business) {
    return (
      <div className="min-h-screen bg-[var(--ui-bg)]">
        <Navbar />
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <ErrorState
            title="Business Not Found"
            message={error || "Could not retrieve business information."}
            onRetry={loadData}
          />
        </main>
      </div>
    );
  }

  const completedAssessments = assessments.filter((a) => a.status === "COMPLETED");
  const inProgressAssessments = assessments.filter((a) => a.status === "IN_PROGRESS" || a.status === "DRAFT");
  const latestCompleted = completedAssessments[0];

  return (
    <div className="min-h-screen bg-[var(--ui-bg)]">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <div className="mb-4 flex items-center gap-2 text-xs text-[var(--ui-secondary)]">
          <Link href="/profile" className="hover:text-[var(--ui-sage)]">
            {t("navigation.profile")}
          </Link>
          <span>/</span>
          <span className="font-semibold text-[var(--ui-secondary)]">{business.name}</span>
        </div>

        {/* Business Header Card */}
        <div className="mb-8 rounded-2xl border border-[var(--ui-border)] bg-white p-6 shadow-xs sm:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight text-[var(--ui-text)]">
                  {business.name}
                </h1>
                <span className="rounded-full bg-[var(--ui-inset)] px-3 py-1 text-xs font-semibold text-[var(--ui-secondary)]">
                  ID: {business.id.slice(0, 8)}
                </span>
              </div>
              <p className="mt-1 text-xs text-[var(--ui-secondary)]">
                Created on {new Date(business.created_at).toLocaleDateString()} · Immutable Profile Versions: {profile?.current_version?.version || 0}
              </p>
            </div>

            <div className="flex items-center gap-3">
              {latestCompleted ? (
                <Link
                  href={`/dashboard?business_id=${business.id}&assessment_id=${latestCompleted.id}`}
                  className="rounded-xl border border-[var(--ui-border)] bg-white px-4 py-2.5 text-xs font-semibold text-[var(--ui-secondary)] hover:bg-[var(--ui-bg)] transition-colors"
                >
                  {t("navigation.dashboard")}
                </Link>
              ) : null}

              <button
                type="button"
                onClick={handleStartNewAssessment}
                disabled={creatingAssessment}
                className="inline-flex items-center gap-2 rounded-xl bg-[var(--ui-sage)] px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-[var(--ui-sage)] transition-colors disabled:opacity-50 cursor-pointer"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                {creatingAssessment ? t("common.loading") : `${t("navigation.onboarding")} (#${assessments.length + 1})`}
              </button>
            </div>
          </div>

          {/* Business Metrics Grid */}
          <div className="mt-6 grid grid-cols-2 gap-4 border-t border-[var(--ui-border)] pt-6 sm:grid-cols-4">
            <MetricCard
              label="Total Assessments"
              value={assessments.length}
              description="Historical assessment records"
              variant="default"
            />
            <MetricCard
              label="Completed Reports"
              value={completedAssessments.length}
              description="Evaluated compliance roadmaps"
              variant="success"
            />
            <MetricCard
              label="In-Progress Intakes"
              value={inProgressAssessments.length}
              description="Unfinished sessions"
              variant="warning"
            />
            <MetricCard
              label="Profile Version"
              value={`v${profile?.current_version?.version || 1}`}
              description="Active profile baseline"
              variant="info"
            />
          </div>
        </div>

        {/* Assessment History Table */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold tracking-tight text-[var(--ui-text)]">
                Assessment History
              </h2>
              <p className="text-xs text-[var(--ui-secondary)]">
                Each assessment session isolates its questions, profile version, and decision runs without mutating past results.
              </p>
            </div>
            <span className="text-xs font-medium text-[var(--ui-secondary)]">
              {assessments.length} Assessment{assessments.length === 1 ? "" : "s"}
            </span>
          </div>

          {assessments.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[var(--ui-border-strong)] bg-white p-12 text-center">
              <h3 className="text-base font-semibold text-[var(--ui-text)]">No assessments found for this business</h3>
              <p className="mt-1 text-xs text-[var(--ui-secondary)] max-w-sm mx-auto">
                Begin by starting an assessment session. You can re-assess the business whenever products or capacities change.
              </p>
              <button
                type="button"
                onClick={handleStartNewAssessment}
                className="mt-4 rounded-xl bg-[var(--ui-sage)] px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[var(--ui-sage)] cursor-pointer"
              >
                + Start Assessment #1
              </button>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-[var(--ui-border)] bg-white shadow-xs">
              <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                <thead className="bg-[var(--ui-bg)] text-xs font-semibold text-[var(--ui-secondary)] uppercase tracking-wider">
                  <tr>
                    <th scope="col" className="px-6 py-3.5">Assessment</th>
                    <th scope="col" className="px-6 py-3.5">Status</th>
                    <th scope="col" className="px-6 py-3.5">Progress</th>
                    <th scope="col" className="px-6 py-3.5">Created</th>
                    <th scope="col" className="px-6 py-3.5">Completed</th>
                    <th scope="col" className="px-6 py-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {assessments.map((ass) => {
                    const isCompleted = ass.status === "COMPLETED";
                    return (
                      <tr key={ass.id} className="hover:bg-[var(--ui-bg)]/80 transition-colors">
                        <td className="px-6 py-4 font-medium text-[var(--ui-text)]">
                          <div className="flex items-center gap-2.5">
                            <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-[var(--ui-sage-faint)] text-xs font-bold text-[var(--ui-sage)]">
                              #{ass.assessment_number}
                            </span>
                            <div>
                              <div className="font-semibold text-[var(--ui-text)]">
                                Assessment #{ass.assessment_number}{ass.title && !ass.title.startsWith(`Assessment #${ass.assessment_number}`) ? ` · ${ass.title}` : (ass.title ? ` · ${ass.title}` : "")}
                              </div>
                              <span className="text-[11px] text-[var(--ui-muted)] font-mono">
                                ID: {ass.id.slice(0, 8)}...
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={ass.status} size="sm" />
                        </td>
                        <td className="px-6 py-4 text-xs text-[var(--ui-secondary)]">
                          {isCompleted ? (
                            <span className="inline-flex items-center gap-1 font-semibold text-[var(--ui-sage)]">
                              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              Completed (Step 5/5)
                            </span>
                          ) : (
                            <span>Step {ass.current_step} of 5</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-xs text-[var(--ui-secondary)]">
                          {new Date(ass.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-xs text-[var(--ui-secondary)]">
                          {ass.completed_at ? new Date(ass.completed_at).toLocaleDateString() : "—"}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {isCompleted ? (
                            <Link
                              href={`/dashboard?business_id=${business.id}&assessment_id=${ass.id}`}
                              className="inline-flex items-center gap-1 rounded-lg bg-[var(--ui-text)] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[var(--ui-text)] transition-colors"
                            >
                              Open Dashboard
                              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </Link>
                          ) : (
                            <Link
                              href={`/onboarding?business_id=${business.id}&assessment_id=${ass.id}`}
                              className="inline-flex items-center gap-1 rounded-lg bg-[var(--ui-sage)] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[var(--ui-sage)] transition-colors"
                            >
                              Resume Intake
                              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                              </svg>
                            </Link>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
