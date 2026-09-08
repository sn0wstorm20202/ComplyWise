"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import StatusBadge from "@/components/StatusBadge";
import MetricCard from "@/components/MetricCard";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import ErrorState from "@/components/ErrorState";
import { api } from "@/lib/api";
import { UserProfileHome, BusinessSummary, AssessmentSummary } from "@/types";

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [profileData, setProfileData] = useState<UserProfileHome | null>(null);

  // New business form state
  const [showNewBizModal, setShowNewBizModal] = useState<boolean>(false);
  const [newBizName, setNewBizName] = useState<string>("");
  const [creatingBiz, setCreatingBiz] = useState<boolean>(false);

  // Creating assessment state
  const [creatingAssessmentFor, setCreatingAssessmentFor] = useState<string | null>(null);

  async function loadProfileHome() {
    setLoading(true);
    setError(null);
    try {
      const data = await api.businesses.getProfileHome();
      setProfileData(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load user profile data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProfileHome();
  }, []);

  async function handleCreateBusiness(e: React.FormEvent) {
    e.preventDefault();
    if (!newBizName.trim()) return;

    setCreatingBiz(true);
    try {
      const newBiz = await api.businesses.create({ name: newBizName.trim() });
      // Create initial assessment for this new business
      const assessment = await api.businesses.createAssessment(newBiz.id, {
        title: "Initial Intake Assessment",
      });
      localStorage.setItem("complywise_active_business_id", newBiz.id);
      localStorage.setItem("complywise_active_assessment_id", assessment.id);
      setShowNewBizModal(false);
      setNewBizName("");
      // Navigate to onboarding with the newly created business and assessment
      router.push(`/onboarding?business_id=${newBiz.id}&assessment_id=${assessment.id}`);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to create business.");
    } finally {
      setCreatingBiz(false);
    }
  }

  async function handleStartNewAssessment(biz: BusinessSummary) {
    setCreatingAssessmentFor(biz.id);
    try {
      const nextNum = (biz.assessment_count || 0) + 1;
      const newAssessment = await api.businesses.createAssessment(biz.id, {
        title: `Assessment #${nextNum} — ${new Date().toLocaleDateString("en-US", { month: "short", year: "numeric" })} Review`,
        duplicate_from_latest: true,
      });
      localStorage.setItem("complywise_active_business_id", biz.id);
      localStorage.setItem("complywise_active_assessment_id", newAssessment.id);
      router.push(`/onboarding?business_id=${biz.id}&assessment_id=${newAssessment.id}&new_assessment=true`);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to create new assessment.");
    } finally {
      setCreatingAssessmentFor(null);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <LoadingSkeleton />
        </main>
      </div>
    );
  }

  if (error || !profileData) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <ErrorState
            title="Unable to load Profile Home"
            message={error || "Profile data could not be retrieved."}
            onRetry={loadProfileHome}
          />
        </main>
      </div>
    );
  }

  const { user, businesses, recent_assessments, total_businesses, total_assessments } = profileData;
  const completedCount = recent_assessments.filter((a) => a.status === "COMPLETED").length;
  const inProgressCount = recent_assessments.filter((a) => a.status === "IN_PROGRESS" || a.status === "DRAFT").length;

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* User Greeting & Header Banner */}
        <div className="mb-8 rounded-2xl bg-white p-6 shadow-xs border border-slate-200/80 sm:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-white font-bold text-2xl shadow-sm">
                {(user.full_name || user.email).charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                    Welcome back, {user.full_name || user.email}
                  </h1>
                  <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
                    Active Account
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-500">
                  {user.email} · Registered Founder Profile · Persistent Cross-Business Assessments
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowNewBizModal(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-indigo-700 transition-colors cursor-pointer"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Register New Business
              </button>
            </div>
          </div>

          {/* Account Metrics Strip */}
          <div className="mt-6 grid grid-cols-2 gap-4 border-t border-slate-100 pt-6 sm:grid-cols-4">
            <MetricCard
              label="Registered Businesses"
              value={total_businesses}
              description="Enterprises under this account"
              variant="default"
            />
            <MetricCard
              label="Total Assessments"
              value={total_assessments}
              description="Persistent evaluation sessions"
              variant="info"
            />
            <MetricCard
              label="Completed Reports"
              value={completedCount}
              description="Fully evaluated compliance plans"
              variant="success"
            />
            <MetricCard
              label="In-Progress Sessions"
              value={inProgressCount}
              description="Ready to resume intake"
              variant="warning"
            />
          </div>
        </div>

        {/* Section 1: User Businesses */}
        <section className="mb-10">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold tracking-tight text-slate-900">My Businesses & Enterprises</h2>
              <p className="text-xs text-slate-500">Manage statutory profiles, facilities, and start new assessment cycles.</p>
            </div>
            <span className="text-xs font-medium text-slate-500">{businesses.length} Total</span>
          </div>

          {businesses.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="mt-3 text-base font-semibold text-slate-900">No businesses added yet</h3>
              <p className="mt-1 text-sm text-slate-500 max-w-md mx-auto">
                Get started by registering your enterprise. You will be guided through dynamic intake questions tailored to your exact manufacturing or operating reality.
              </p>
              <button
                type="button"
                onClick={() => setShowNewBizModal(true)}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-xs hover:bg-indigo-700"
              >
                + Register First Business
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {businesses.map((biz) => {
                const latest = biz.latest_assessment;
                return (
                  <div
                    key={biz.id}
                    className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-xs hover:shadow-md transition-shadow"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-base font-bold text-slate-900 leading-tight">
                            {biz.name}
                          </h3>
                          <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                            {biz.state_name && (
                              <span className="rounded-md bg-slate-100 px-2 py-0.5 font-medium text-slate-700">
                                {biz.state_name} ({biz.state})
                              </span>
                            )}
                            {biz.msme_scale && (
                              <span className="rounded-md bg-indigo-50 px-2 py-0.5 font-medium text-indigo-700">
                                {biz.msme_scale} Scale
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
                            {biz.assessment_count} {biz.assessment_count === 1 ? "Assessment" : "Assessments"}
                          </span>
                        </div>
                      </div>

                      {biz.industry && (
                        <p className="mt-3 text-xs text-slate-600 line-clamp-2">
                          <span className="font-semibold text-slate-700">Operations:</span> {biz.industry}
                        </p>
                      )}

                      {/* Latest Assessment Status Box */}
                      <div className="mt-4 rounded-xl bg-slate-50 p-3 border border-slate-100">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                            Latest Assessment
                          </span>
                          {latest ? (
                            <StatusBadge status={latest.status} size="sm" />
                          ) : (
                            <span className="text-xs text-slate-400">None yet</span>
                          )}
                        </div>
                        {latest ? (
                          <div className="mt-1 flex items-center justify-between text-xs">
                            <span className="font-medium text-slate-700 truncate max-w-[170px]">
                              {latest.title || `Assessment #${latest.assessment_number}`}
                            </span>
                            <span className="text-slate-400 text-[11px]">
                              {new Date(latest.updated_at).toLocaleDateString()}
                            </span>
                          </div>
                        ) : null}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-6 flex flex-col gap-2 border-t border-slate-100 pt-4">
                      <div className="flex items-center gap-2">
                        {latest?.status === "COMPLETED" ? (
                          <Link
                            href={`/dashboard?business_id=${biz.id}&assessment_id=${latest.id}`}
                            className="flex-1 rounded-xl bg-slate-900 px-3 py-2 text-center text-xs font-semibold text-white hover:bg-slate-800 transition-colors"
                          >
                            Open Dashboard
                          </Link>
                        ) : latest ? (
                          <Link
                            href={`/onboarding?business_id=${biz.id}&assessment_id=${latest.id}`}
                            className="flex-1 rounded-xl bg-indigo-600 px-3 py-2 text-center text-xs font-semibold text-white hover:bg-indigo-700 transition-colors"
                          >
                            Resume Assessment #{latest.assessment_number}
                          </Link>
                        ) : null}

                        <Link
                          href={`/businesses/${biz.id}`}
                          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-center text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                          History
                        </Link>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleStartNewAssessment(biz)}
                        disabled={creatingAssessmentFor === biz.id}
                        className="w-full rounded-xl border border-indigo-200 bg-indigo-50/60 px-3 py-2 text-center text-xs font-semibold text-indigo-700 hover:bg-indigo-100/60 transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {creatingAssessmentFor === biz.id ? "Creating..." : "+ Start New Assessment Cycle"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Section 2: Recent Assessments History */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold tracking-tight text-slate-900">Recent Assessments</h2>
              <p className="text-xs text-slate-500">Every assessment preserves an immutable snapshot of rules, profile inputs, and discovery claims.</p>
            </div>
            <span className="text-xs font-medium text-slate-500">{recent_assessments.length} Logged</span>
          </div>

          {recent_assessments.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
              No assessments recorded yet. Start an intake above to run your first evaluation.
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
              <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th scope="col" className="px-6 py-3.5">Assessment</th>
                    <th scope="col" className="px-6 py-3.5">Enterprise</th>
                    <th scope="col" className="px-6 py-3.5">Status</th>
                    <th scope="col" className="px-6 py-3.5">Progress</th>
                    <th scope="col" className="px-6 py-3.5">Last Updated</th>
                    <th scope="col" className="px-6 py-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recent_assessments.map((ass) => {
                    const isCompleted = ass.status === "COMPLETED";
                    return (
                      <tr key={ass.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-6 py-4 font-medium text-slate-900">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-indigo-50 text-xs font-bold text-indigo-700">
                              #{ass.assessment_number}
                            </span>
                            <span>{ass.title || `Assessment #${ass.assessment_number}`}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-600 font-medium">
                          {ass.business_name}
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={ass.status} size="sm" />
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-500">
                          {isCompleted ? (
                            <span className="inline-flex items-center gap-1 font-semibold text-emerald-600">
                              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              Complete · 100%
                            </span>
                          ) : (
                            <span>Step {ass.current_step} of 5</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-500">
                          {new Date(ass.updated_at).toLocaleString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {isCompleted ? (
                            <Link
                              href={`/dashboard?business_id=${ass.business_id}&assessment_id=${ass.id}`}
                              className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                            >
                              View Results
                              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </Link>
                          ) : (
                            <Link
                              href={`/onboarding?business_id=${ass.business_id}&assessment_id=${ass.id}`}
                              className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition-colors"
                            >
                              Continue Intake
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

        {/* Modal: Register New Business */}
        {showNewBizModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-slate-200">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <h3 className="text-lg font-bold text-slate-900">Register New Business</h3>
                <button
                  type="button"
                  onClick={() => setShowNewBizModal(false)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleCreateBusiness} className="mt-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    Enterprise / Company Legal Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newBizName}
                    onChange={(e) => setNewBizName(e.target.value)}
                    placeholder="e.g. Acme MedTech Solutions Pvt Ltd"
                    className="mt-1.5 block w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 shadow-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <p className="mt-1.5 text-xs text-slate-500">
                    A dedicated assessment workspace will be created. You can evaluate multiple facilities or expansion cycles under this business.
                  </p>
                </div>

                <div className="mt-6 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowNewBizModal(false)}
                    className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creatingBiz || !newBizName.trim()}
                    className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {creatingBiz ? "Registering..." : "Create & Start Intake"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
