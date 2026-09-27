"use client";

import React, { useEffect, useState, useMemo, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import AppShell from "@/components/AppShell";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import ErrorState from "@/components/ErrorState";
import { api } from "@/lib/api";
import type { WorkflowItem, WorkflowStep } from "@/types";
import { resolveAuthorityPortalUrl } from "@/lib/authorityPortals";
import {
  AlertTriangle,
  ArrowRight,
  Award,
  Building2,
  Check,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileText,
  Filter,
  Landmark,
  Layers,
  Loader2,
  RefreshCw,
  Search,
  Shield,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useBusinessContext } from "@/context/BusinessContext";

type CategoryFilter = "ALL" | "COMPLIANCE" | "STANDARD" | "SCHEME";
type StatusFilter = "ALL" | "IN_PROGRESS" | "COMPLETED" | "NOT_STARTED";

function WorkflowsContent() {
  const { t } = useLanguage();
  const { activeBusinessId } = useBusinessContext();
  const searchParams = useSearchParams();
  const paramBusinessId = searchParams.get("business_id");
  const paramWorkflowId = searchParams.get("workflow_id");
  const paramReqId = searchParams.get("requirement_id");

  const [businessId, setBusinessId] = useState<string>("");
  const [businessName, setBusinessName] = useState<string>("Active Enterprise");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [workflows, setWorkflows] = useState<WorkflowItem[]>([]);
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | null>(null);
  const [selectedStepNumber, setSelectedStepNumber] = useState<number>(1);

  // Filters & Search
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("ALL");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Step interaction state
  const [updatingStep, setUpdatingStep] = useState<boolean>(false);
  const [stepUserRef, setStepUserRef] = useState<string>("");
  const [stepNotes, setStepNotes] = useState<string>("");
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    const bizId =
      paramBusinessId ||
      activeBusinessId ||
      (typeof window !== "undefined" ? localStorage.getItem("complywise_active_business_id") : null);

    if (!bizId) return;
    setBusinessId(bizId);
    setWorkflows([]); // clear old business workflows immediately
    loadWorkflows(bizId);
  }, [paramBusinessId, activeBusinessId]);

  async function loadWorkflows(bizId: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await api.workflows.list(bizId);
      if ("available" in res && res.available) {
        if (res.business_name) {
          setBusinessName(res.business_name);
        }
        const wfList = (res.workflows || []).map((w: WorkflowItem) => ({
          ...w,
          portal_url: resolveAuthorityPortalUrl(w.authority, w.title, w.portal_url),
          steps: (w.steps || []).map((s: WorkflowStep) => ({
            ...s,
            portal_url: s.portal_url
              ? resolveAuthorityPortalUrl(w.authority, s.title, s.portal_url)
              : resolveAuthorityPortalUrl(w.authority, w.title, w.portal_url),
          })),
        }));
        setWorkflows(wfList);

        if (wfList.length > 0) {
          let target = wfList[0];
          if (paramWorkflowId) {
            const found = wfList.find(
              (w) => w.id === paramWorkflowId || w.id.toLowerCase() === paramWorkflowId.toLowerCase()
            );
            if (found) target = found;
          } else if (paramReqId) {
            const reqLow = paramReqId.toLowerCase();
            const found = wfList.find(
              (w) =>
                w.requirement_id === paramReqId ||
                (w.requirement_id && w.requirement_id.toLowerCase() === reqLow) ||
                w.id === paramReqId ||
                w.id.toLowerCase() === reqLow ||
                w.id.toLowerCase().includes(reqLow) ||
                (w.title && w.title.toLowerCase().includes(reqLow))
            );
            if (found) target = found;
          } else if (selectedWorkflowId) {
            const found = wfList.find((w) => w.id === selectedWorkflowId);
            if (found) target = found;
          }

          setSelectedWorkflowId(target.id);
          setSelectedStepNumber(target.current_step || 1);
          if (target.category && (paramWorkflowId || paramReqId)) {
            setCategoryFilter(target.category as CategoryFilter);
          }
        }
      } else {
        setWorkflows([]);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load workflows.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  // Reactive URL param selection update
  useEffect(() => {
    if (!workflows.length) return;

    if (paramWorkflowId) {
      const match = workflows.find(
        (w) => w.id === paramWorkflowId || w.id.toLowerCase() === paramWorkflowId.toLowerCase()
      );
      if (match) {
        setSelectedWorkflowId(match.id);
        setSelectedStepNumber(match.current_step || 1);
        if (match.category) setCategoryFilter(match.category as CategoryFilter);
        return;
      }
    }

    if (paramReqId) {
      const reqLow = paramReqId.toLowerCase();
      const match = workflows.find(
        (w) =>
          w.requirement_id === paramReqId ||
          (w.requirement_id && w.requirement_id.toLowerCase() === reqLow) ||
          w.id === paramReqId ||
          w.id.toLowerCase() === reqLow ||
          w.id.toLowerCase().includes(reqLow) ||
          (w.title && w.title.toLowerCase().includes(reqLow))
      );
      if (match) {
        setSelectedWorkflowId(match.id);
        setSelectedStepNumber(match.current_step || 1);
        if (match.category) setCategoryFilter(match.category as CategoryFilter);
      }
    }
  }, [workflows, paramWorkflowId, paramReqId]);

  // Active workflow
  const activeWf = useMemo(() => {
    return workflows.find((w) => w.id === selectedWorkflowId) || workflows[0] || null;
  }, [workflows, selectedWorkflowId]);

  // Active step in active workflow
  const activeStep: WorkflowStep | null = useMemo(() => {
    if (!activeWf || !activeWf.steps) return null;
    return (
      activeWf.steps.find((s) => (s.step_number || s.step) === selectedStepNumber) ||
      activeWf.steps[0] ||
      null
    );
  }, [activeWf, selectedStepNumber]);

  // Sync inputs when active step changes
  useEffect(() => {
    if (activeStep) {
      setStepUserRef(activeStep.user_reference || "");
      setStepNotes(activeStep.notes || "");
      setSaveSuccessMsg(null);
    }
  }, [activeStep]);

  // Filtered workflows
  const filteredWorkflows = useMemo(() => {
    return workflows.filter((w) => {
      // Category filter
      if (categoryFilter !== "ALL") {
        const cat = (w.category || "").toUpperCase();
        if (cat !== categoryFilter) return false;
      }

      // Status filter
      if (statusFilter !== "ALL") {
        if (w.status !== statusFilter) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = (w.title || "").toLowerCase().includes(q);
        const matchAuth = (w.authority || "").toLowerCase().includes(q);
        const matchReq = (w.requirement_id || "").toLowerCase().includes(q);
        const matchPortal = (w.portal_name || "").toLowerCase().includes(q);
        if (!matchTitle && !matchAuth && !matchReq && !matchPortal) return false;
      }

      return true;
    });
  }, [workflows, categoryFilter, statusFilter, searchQuery]);

  // Metrics summary
  const metrics = useMemo(() => {
    const total = workflows.length;
    const compliance = workflows.filter((w) => w.category === "COMPLIANCE").length;
    const standards = workflows.filter((w) => w.category === "STANDARD").length;
    const schemes = workflows.filter((w) => w.category === "SCHEME").length;
    const completed = workflows.filter((w) => w.status === "COMPLETED").length;
    const inProgress = workflows.filter((w) => w.status === "IN_PROGRESS").length;
    const avgProgress = total > 0 ? Math.round(workflows.reduce((acc, w) => acc + (w.progress_percent || 0), 0) / total) : 0;

    return { total, compliance, standards, schemes, completed, inProgress, avgProgress };
  }, [workflows]);

  // Handle Step Status Update (Persists to Database)
  async function handleUpdateStepStatus(newStatus: "COMPLETED" | "IN_PROGRESS" | "NOT_STARTED") {
    if (!activeWf || !activeStep || !businessId) return;
    const stepNum = activeStep.step_number || activeStep.step;

    setUpdatingStep(true);
    setSaveSuccessMsg(null);

    try {
      const resp = await api.workflows.updateStep(businessId, {
        workflow_id: activeWf.id,
        step_number: stepNum,
        status: newStatus,
        user_reference: stepUserRef.trim(),
        notes: stepNotes.trim(),
        total_steps: activeWf.total_steps || activeWf.steps.length,
        title: activeWf.title,
        authority: activeWf.authority,
        category: activeWf.category,
      });

      // Update local workflow state
      setWorkflows((prev) =>
        prev.map((w) => {
          if (w.id !== activeWf.id) return w;

          const updatedSteps = w.steps.map((st) => {
            const num = st.step_number || st.step;
            if (num === stepNum) {
              return {
                ...st,
                status: newStatus,
                user_reference: stepUserRef.trim(),
                notes: stepNotes.trim(),
                completed_at: newStatus === "COMPLETED" ? new Date().toISOString() : st.completed_at,
              };
            }
            return st;
          });

          const completedCount = updatedSteps.filter((s) => s.status === "COMPLETED").length;
          const total = updatedSteps.length;
          const newProgress = Math.round((completedCount / Math.max(total, 1)) * 100);
          const nextActiveStep = newStatus === "COMPLETED" && stepNum < total ? stepNum + 1 : stepNum;
          const overallStatus = completedCount === total ? "COMPLETED" : completedCount > 0 ? "IN_PROGRESS" : "NOT_STARTED";

          return {
            ...w,
            steps: updatedSteps,
            progress_percent: newProgress,
            current_step: nextActiveStep,
            status: overallStatus,
          };
        })
      );

      setSaveSuccessMsg(`Step ${stepNum} updated to ${newStatus === "COMPLETED" ? "Completed" : newStatus} & synced to database.`);

      // If marked completed and has next step, advance stepper to next step
      if (newStatus === "COMPLETED" && stepNum < activeWf.steps.length) {
        setSelectedStepNumber(stepNum + 1);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update step.";
      alert(`Could not save step update: ${msg}`);
    } finally {
      setUpdatingStep(false);
    }
  }

  // Handle saving notes / reference without changing status
  async function handleSaveReferenceOnly() {
    if (!activeWf || !activeStep || !businessId) return;
    const stepNum = activeStep.step_number || activeStep.step;
    setUpdatingStep(true);
    setSaveSuccessMsg(null);

    try {
      await api.workflows.updateStep(businessId, {
        workflow_id: activeWf.id,
        step_number: stepNum,
        status: activeStep.status || "IN_PROGRESS",
        user_reference: stepUserRef.trim(),
        notes: stepNotes.trim(),
        total_steps: activeWf.total_steps || activeWf.steps.length,
      });

      // Update local state
      setWorkflows((prev) =>
        prev.map((w) => {
          if (w.id !== activeWf.id) return w;
          const updatedSteps = w.steps.map((st) => {
            if ((st.step_number || st.step) === stepNum) {
              return {
                ...st,
                user_reference: stepUserRef.trim(),
                notes: stepNotes.trim(),
              };
            }
            return st;
          });
          return { ...w, steps: updatedSteps };
        })
      );

      setSaveSuccessMsg("Reference number & notes saved to database.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save reference.";
      alert(`Error saving reference: ${msg}`);
    } finally {
      setUpdatingStep(false);
    }
  }

  return (
    <AppShell activeView="workflows">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 font-sans">
        {/* Top Header Banner */}
        <div className="bg-white rounded-3xl border border-[#E2E8F0] p-6 sm:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 border border-purple-200 text-purple-800 text-xs font-bold tracking-wide uppercase">
              <Zap className="w-3.5 h-3.5 text-purple-600" />
              <span>Statutory Compliance &bull; Standards &bull; Government Schemes</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0F172A]">
              Compliance &amp; Clearance Process Workflows
            </h1>
            <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed">
              Step-by-step regulatory execution roadmaps for <strong className="text-[#0F172A]">{businessName}</strong>. Complete each procedural step, track government portal filings, and keep clearance progress automatically synchronized in the database.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => loadWorkflows(businessId)}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] hover:bg-slate-100 text-[#0F172A] text-xs font-bold transition-colors disabled:opacity-50 cursor-pointer shadow-2xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-purple-600" : ""}`} />
              <span>Refresh Synced Roadmaps</span>
            </button>
          </div>
        </div>

        {/* Global Loading / Error State */}
        {loading && <LoadingSkeleton count={4} />}
        {error && <ErrorState message={error} onRetry={() => loadWorkflows(businessId)} />}

        {!loading && !error && (
          <>
            {/* Summary Statistics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-white border border-[#E2E8F0] shadow-2xs flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xl font-extrabold text-[#0F172A]">{metrics.total}</div>
                  <div className="text-[11px] font-semibold text-[#64748B]">Total Roadmaps</div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-[#E2E8F0] shadow-2xs flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xl font-extrabold text-[#0F172A]">{metrics.compliance}</div>
                  <div className="text-[11px] font-semibold text-[#64748B]">Statutory Compliance</div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-[#E2E8F0] shadow-2xs flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xl font-extrabold text-[#0F172A]">{metrics.standards}</div>
                  <div className="text-[11px] font-semibold text-[#64748B]">Quality Standards</div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-[#E2E8F0] shadow-2xs flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                  <Landmark className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xl font-extrabold text-[#0F172A]">{metrics.schemes}</div>
                  <div className="text-[11px] font-semibold text-[#64748B]">Government Schemes</div>
                </div>
              </div>
            </div>

            {/* Category Navigation Tabs & Search Controls */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E2E8F0] pb-4">
              {/* Category Pills */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setCategoryFilter("ALL")}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    categoryFilter === "ALL"
                      ? "bg-[#0F172A] text-white shadow-xs"
                      : "bg-[#F1F5F9] text-[#64748B] hover:text-[#0F172A]"
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>All Roadmaps ({metrics.total})</span>
                </button>

                <button
                  onClick={() => setCategoryFilter("COMPLIANCE")}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    categoryFilter === "COMPLIANCE"
                      ? "bg-blue-600 text-white shadow-xs"
                      : "bg-blue-50 text-blue-700 hover:bg-blue-100"
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>1. Statutory Compliance ({metrics.compliance})</span>
                </button>

                <button
                  onClick={() => setCategoryFilter("STANDARD")}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    categoryFilter === "STANDARD"
                      ? "bg-amber-600 text-white shadow-xs"
                      : "bg-amber-50 text-amber-700 hover:bg-amber-100"
                  }`}
                >
                  <Award className="w-3.5 h-3.5" />
                  <span>2. Quality Standards ({metrics.standards})</span>
                </button>

                <button
                  onClick={() => setCategoryFilter("SCHEME")}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    categoryFilter === "SCHEME"
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                  }`}
                >
                  <Landmark className="w-3.5 h-3.5" />
                  <span>3. Government Schemes ({metrics.schemes})</span>
                </button>
              </div>

              {/* Status and Search */}
              <div className="flex items-center gap-3">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                  className="rounded-xl border border-[#E2E8F0] bg-white px-3 py-1.5 text-xs font-semibold text-[#0F172A] focus:outline-none"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="NOT_STARTED">Not Started</option>
                </select>

                <div className="relative w-48 sm:w-60">
                  <Search className="w-3.5 h-3.5 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search workflows..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8.5 pr-3 py-1.5 bg-white border border-[#E2E8F0] rounded-xl text-xs text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:border-purple-600"
                  />
                </div>
              </div>
            </div>

            {/* Empty State */}
            {filteredWorkflows.length === 0 && (
              <div className="bg-white rounded-3xl border border-dashed border-[#E2E8F0] p-12 text-center space-y-3">
                <Layers className="w-12 h-12 text-[#94A3B8] mx-auto" />
                <h3 className="text-base font-bold text-[#0F172A]">No Matching Roadmaps Found</h3>
                <p className="text-xs text-[#64748B] max-w-md mx-auto">
                  Try clearing your search query or selecting &quot;All Roadmaps&quot; to inspect all procedural roadmaps evaluated for this enterprise.
                </p>
                <button
                  onClick={() => {
                    setCategoryFilter("ALL");
                    setStatusFilter("ALL");
                    setSearchQuery("");
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0F172A] text-white text-xs font-bold"
                >
                  Reset Filters
                </button>
              </div>
            )}

            {/* MAIN WORKFLOW EXECUTION STUDIO (Selected Workflow) */}
            {activeWf && (
              <div className="bg-white rounded-3xl border border-[#E2E8F0] p-6 sm:p-8 shadow-xs space-y-6">
                {/* Workflow Header Banner */}
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-[#E2E8F0] pb-6">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                          activeWf.category === "COMPLIANCE"
                            ? "bg-blue-100 text-blue-800 border border-blue-200"
                            : activeWf.category === "STANDARD"
                            ? "bg-amber-100 text-amber-800 border border-amber-200"
                            : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                        }`}
                      >
                        {activeWf.category === "COMPLIANCE"
                          ? "Statutory Compliance"
                          : activeWf.category === "STANDARD"
                          ? "Quality Standard"
                          : "Government Scheme"}
                      </span>

                      <span className="text-[11px] font-semibold text-[#475569] bg-[#F1F5F9] px-2.5 py-0.5 rounded-full border border-[#E2E8F0]">
                        🏛️ {activeWf.authority}
                      </span>

                      {activeWf.case_number && (
                        <span className="font-mono text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                          {activeWf.case_number}
                        </span>
                      )}
                    </div>

                    <h2 className="text-xl sm:text-2xl font-extrabold text-[#0F172A]">
                      {activeWf.title}
                    </h2>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-[#64748B]">
                      <span>Estimated Process Time: <strong className="text-[#0F172A]">{activeWf.estimated_duration || "15-30 Days"}</strong></span>
                      <span>&bull;</span>
                      <span>Total Stages: <strong className="text-[#0F172A]">{activeWf.total_steps || activeWf.steps.length} Steps</strong></span>
                    </div>
                  </div>

                  {/* Right Header: Portal Link & Status Pill */}
                  <div className="flex flex-col sm:items-end gap-2.5 shrink-0">
                    <div className="flex items-center gap-3">
                      {Boolean(activeWf.portal_url || resolveAuthorityPortalUrl(activeWf.authority, activeWf.title)) && (
                        <a
                          href={activeWf.portal_url || resolveAuthorityPortalUrl(activeWf.authority, activeWf.title)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-xs transition-colors"
                          title="Open official government filing portal in new tab"
                        >
                          <span>Launch {activeWf.portal_name || "Official Portal"}</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}

                      <span
                        className={`text-xs font-bold px-3 py-1.5 rounded-full border ${
                          activeWf.status === "COMPLETED"
                            ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                            : activeWf.status === "IN_PROGRESS"
                            ? "bg-purple-50 text-purple-800 border-purple-200"
                            : "bg-slate-50 text-slate-700 border-slate-200"
                        }`}
                      >
                        {activeWf.status === "COMPLETED"
                          ? "✓ Certified & Completed"
                          : activeWf.status === "IN_PROGRESS"
                          ? `In Progress (${activeWf.progress_percent}%)`
                          : "Not Started"}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full sm:w-56 space-y-1">
                      <div className="flex justify-between text-[11px] font-semibold text-[#64748B]">
                        <span>Overall Progress</span>
                        <span className="font-mono text-purple-700 font-bold">{activeWf.progress_percent || 0}%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-[#E2E8F0] overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 rounded-full ${
                            activeWf.status === "COMPLETED" ? "bg-emerald-600" : "bg-purple-600"
                          }`}
                          style={{ width: `${activeWf.progress_percent || 0}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* MULTI-STAGE STEPPER TRACK */}
                <div className="py-2 overflow-x-auto">
                  <div className="min-w-[650px] flex items-center justify-between relative px-6">
                    {/* Connecting line */}
                    <div className="absolute left-8 right-8 top-5 h-1.5 bg-[#E2E8F0] rounded-full overflow-hidden -z-0">
                      <div
                        className="h-full bg-emerald-500 transition-all duration-500 rounded-full"
                        style={{
                          width: `${
                            activeWf.steps.length > 1
                              ? (activeWf.steps.filter((s) => s.status === "COMPLETED").length / (activeWf.steps.length - 1)) * 100
                              : 0
                          }%`,
                        }}
                      />
                    </div>

                    {/* Node Circles */}
                    {activeWf.steps.map((st) => {
                      const num = st.step_number || st.step;
                      const isCompleted = st.status === "COMPLETED";
                      const isInProgress = st.status === "IN_PROGRESS" || st.status === "READY";
                      const isSelected = num === selectedStepNumber;

                      return (
                        <button
                          key={num}
                          type="button"
                          onClick={() => setSelectedStepNumber(num)}
                          className="relative z-10 flex flex-col items-center group cursor-pointer focus:outline-none"
                        >
                          <div
                            className={`h-11 w-11 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                              isSelected
                                ? "ring-4 ring-purple-300 scale-110 shadow-md"
                                : "hover:scale-105"
                            } ${
                              isCompleted
                                ? "bg-emerald-600 text-white shadow-xs"
                                : isInProgress
                                ? "bg-purple-600 text-white shadow-xs ring-2 ring-purple-400"
                                : "bg-white text-[#64748B] border-2 border-[#CBD5E1]"
                            }`}
                          >
                            {isCompleted ? (
                              <Check className="w-5 h-5 stroke-[2.5]" />
                            ) : (
                              <span>{num}</span>
                            )}
                          </div>

                          <div className="text-center mt-2 max-w-[110px]">
                            <span
                              className={`text-[11px] font-bold block leading-tight ${
                                isSelected
                                  ? "text-purple-700 font-extrabold"
                                  : isCompleted
                                  ? "text-[#0F172A]"
                                  : "text-[#64748B]"
                              }`}
                            >
                              {st.title}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* ACTIVE STEP INTERACTIVE DETAIL PANEL */}
                {activeStep && (
                  <div
                    className={`rounded-2xl border p-6 transition-all space-y-5 ${
                      activeStep.status === "COMPLETED"
                        ? "bg-emerald-50/40 border-emerald-300"
                        : "bg-purple-50/30 border-purple-200"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="space-y-1 max-w-2xl">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-white border border-[#E2E8F0] text-[#0F172A]">
                            Stage {activeStep.step_number || activeStep.step} of {activeWf.steps.length}
                          </span>

                          <span
                            className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                              activeStep.status === "COMPLETED"
                                ? "bg-emerald-100 text-emerald-800"
                                : activeStep.status === "IN_PROGRESS"
                                ? "bg-purple-100 text-purple-800"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {activeStep.status === "COMPLETED"
                              ? "✓ Stage Completed"
                              : activeStep.status === "IN_PROGRESS"
                              ? "Active & In Progress"
                              : "Ready to Start"}
                          </span>

                          {activeStep.duration && (
                            <span className="text-[10px] font-semibold text-[#64748B] flex items-center gap-1">
                              <Clock className="w-3 h-3 text-[#94A3B8]" />
                              <span>{activeStep.duration}</span>
                            </span>
                          )}
                        </div>

                        <h3 className="text-lg font-extrabold text-[#0F172A] mt-1">
                          {activeStep.title}
                        </h3>
                        <p className="text-xs sm:text-sm text-[#475569] leading-relaxed">
                          {activeStep.description}
                        </p>
                      </div>

                      {/* Official Portal Filing Action */}
                      {Boolean(activeStep.portal_url || activeWf.portal_url || resolveAuthorityPortalUrl(activeWf.authority, activeStep.title || activeWf.title)) && (
                        <a
                          href={activeStep.portal_url || activeWf.portal_url || resolveAuthorityPortalUrl(activeWf.authority, activeStep.title || activeWf.title)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-[#CBD5E1] hover:border-purple-500 text-[#0F172A] text-xs font-bold transition-all shadow-2xs"
                        >
                          <span>Open Government Portal ↗</span>
                        </a>
                      )}
                    </div>

                    {/* Step Required Documents Checklist */}
                    {((activeStep.documents_required && activeStep.documents_required.length > 0) ||
                      (activeWf.documents_required && activeWf.documents_required.length > 0)) && (
                      <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 space-y-2.5">
                        <div className="text-xs font-bold text-[#0F172A] flex items-center gap-1.5">
                          <FileText className="w-4 h-4 text-purple-600" />
                          <span>Statutory Documents Required for this Stage:</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {(activeStep.documents_required && activeStep.documents_required.length > 0
                            ? activeStep.documents_required
                            : activeWf.documents_required || []
                          ).map((doc, idx) => (
                            <div
                              key={idx}
                              className="flex items-center gap-2 p-2 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] text-xs text-[#334155]"
                            >
                              <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-[10px] shrink-0">
                                ✓
                              </span>
                              <span className="font-medium line-clamp-1">{doc}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Interactive Step Advancement & Persistence Inputs */}
                    <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-[#475569] mb-1">
                            Application ARN / Receipt / Challan Ref No. (Optional):
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. ARN-2026-98124 or Portal Reg ID"
                            value={stepUserRef}
                            onChange={(e) => setStepUserRef(e.target.value)}
                            className="w-full px-3 py-2 text-xs rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] text-[#0F172A] focus:outline-none focus:border-purple-600"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-[#475569] mb-1">
                            Execution Notes &amp; Status Remarks:
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Uploaded all attested certificates, fee paid online"
                            value={stepNotes}
                            onChange={(e) => setStepNotes(e.target.value)}
                            className="w-full px-3 py-2 text-xs rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] text-[#0F172A] focus:outline-none focus:border-purple-600"
                          />
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#E2E8F0]">
                        <div className="flex items-center gap-2">
                          {activeStep.status !== "COMPLETED" ? (
                            <button
                              type="button"
                              onClick={() => handleUpdateStepStatus("COMPLETED")}
                              disabled={updatingStep}
                              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                            >
                              {updatingStep ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              )}
                              <span>Mark Step as Completed ✓</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleUpdateStepStatus("IN_PROGRESS")}
                              disabled={updatingStep}
                              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold transition-colors cursor-pointer"
                            >
                              <span>Reopen Step for Modifications</span>
                            </button>
                          )}

                          {activeStep.status === "NOT_STARTED" && (
                            <button
                              type="button"
                              onClick={() => handleUpdateStepStatus("IN_PROGRESS")}
                              disabled={updatingStep}
                              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-800 text-xs font-bold transition-colors cursor-pointer"
                            >
                              <span>Set In Progress</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={handleSaveReferenceOnly}
                            disabled={updatingStep}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] hover:bg-slate-100 text-[#0F172A] text-xs font-semibold transition-colors cursor-pointer"
                          >
                            <span>Save Reference Notes Only</span>
                          </button>
                        </div>

                        {saveSuccessMsg && (
                          <div className="text-xs font-semibold text-emerald-700 flex items-center gap-1 animate-pulse">
                            <span>✓</span>
                            <span>{saveSuccessMsg}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ALL APPLICABLE ROADMAPS GRID */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-lg font-extrabold text-[#0F172A] flex items-center gap-2">
                    <Layers className="w-5 h-5 text-purple-600" />
                    <span>Applicable Roadmaps ({filteredWorkflows.length})</span>
                  </h3>
                  <p className="text-xs text-[#64748B]">
                    Click any workflow card below to inspect its procedural steps, required documents, and track clearance progress.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredWorkflows.map((wf) => {
                  const isSelected = wf.id === activeWf?.id;
                  const isCompleted = wf.status === "COMPLETED";
                  const isInProgress = wf.status === "IN_PROGRESS";

                  return (
                    <div
                      key={wf.id}
                      onClick={() => {
                        setSelectedWorkflowId(wf.id);
                        setSelectedStepNumber(wf.current_step || 1);
                      }}
                      className={`p-5 rounded-2xl border transition-all cursor-pointer shadow-2xs space-y-4 ${
                        isSelected
                          ? "border-purple-600 bg-purple-50/30 ring-2 ring-purple-600/20 shadow-sm"
                          : "border-[#E2E8F0] bg-white hover:border-purple-300"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          <span
                            className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                              wf.category === "COMPLIANCE"
                                ? "bg-blue-100 text-blue-800"
                                : wf.category === "STANDARD"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-emerald-100 text-emerald-800"
                            }`}
                          >
                            {wf.category === "COMPLIANCE"
                              ? "Statutory Compliance"
                              : wf.category === "STANDARD"
                              ? "Quality Standard"
                              : "Government Scheme"}
                          </span>
                          <h4 className="text-sm font-extrabold text-[#0F172A] line-clamp-2 mt-1">
                            {wf.title}
                          </h4>
                        </div>

                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                            isCompleted
                              ? "bg-emerald-100 text-emerald-800"
                              : isInProgress
                              ? "bg-purple-100 text-purple-800"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {isCompleted ? "✓ Completed" : isInProgress ? `Step ${wf.current_step}` : "Ready"}
                        </span>
                      </div>

                      <div className="text-[11px] text-[#64748B] flex items-center justify-between">
                        <span className="truncate max-w-[180px]">🏛️ {wf.authority}</span>
                        <span>{wf.steps ? wf.steps.length : wf.total_steps} Stages</span>
                      </div>

                      {/* Progress Track */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-semibold text-[#64748B]">
                          <span>Clearance Progress</span>
                          <span className="font-mono text-purple-700 font-bold">{wf.progress_percent || 0}%</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-[#E2E8F0] overflow-hidden">
                          <div
                            className={`h-full transition-all duration-500 rounded-full ${
                              isCompleted ? "bg-emerald-600" : "bg-purple-600"
                            }`}
                            style={{ width: `${wf.progress_percent || 0}%` }}
                          />
                        </div>
                      </div>

                      {/* Card Footer */}
                      <div className="pt-2 border-t border-[#E2E8F0] flex items-center justify-between text-[11px]">
                        <span className="text-[#64748B] truncate max-w-[180px]">
                          {wf.portal_name || "Portal Filing"}
                        </span>

                        <span className="font-bold text-purple-700 hover:text-purple-800 inline-flex items-center gap-1">
                          <span>Open Studio</span>
                          <ArrowRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}

export default function WorkflowsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center text-xs text-[#64748B]">
          Loading compliance &amp; clearance workflows...
        </div>
      }
    >
      <WorkflowsContent />
    </Suspense>
  );
}
