"use client";

import React, { useEffect, useState, useMemo, Suspense, useCallback } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import ErrorState from "@/components/ErrorState";
import { api } from "@/lib/api";
import type { SchemeVersionHistoryResponse } from "@/lib/api/schemes";
import type { SchemeItem, SchemePipelineStatus, SchemeVersionRecord } from "@/types";
import { useLanguage } from "@/context/LanguageContext";
import { useBusinessContext } from "@/context/BusinessContext";

// Filter Level 1: Jurisdiction
type JurisdictionFilter = "ALL" | "CENTRAL" | "STATE";

// Filter Level 2: Scope & Applicability
type ScopeFilter = "ALL" | "UNIVERSAL" | "TARGETED";

// Filter Level 3: Benefit Offering Type
type BenefitTypeFilter =
  | "ALL"
  | "CAPITAL_SUBSIDY"
  | "INTEREST_SUBSIDY"
  | "POWER_TARIFF"
  | "CREDIT_GUARANTEE"
  | "DUTY_REMISSION";

function SchemesContent() {
  const { t } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const paramBusinessId = searchParams.get("business_id");

  const {
    profile,
    activeBusinessId,
    activeAssessmentId,
    userBusinesses,
    switchProfile,
  } = useBusinessContext();

  // Dynamically loaded real onboarded businesses from backend
  const [dynamicBusinesses, setDynamicBusinesses] = useState<any[]>([]);

  useEffect(() => {
    let active = true;
    async function loadRealBusinesses() {
      try {
        const home = await api.businesses.getProfileHome().catch(() => null);
        if (active && home && home.businesses && home.businesses.length > 0) {
          setDynamicBusinesses(home.businesses);
          return;
        }
        const list = await api.businesses.list().catch(() => null);
        if (active && Array.isArray(list) && list.length > 0) {
          setDynamicBusinesses(
            list.map((b: any) => ({
              id: b.id,
              name: b.name,
              is_active: b.is_active ?? true,
              profile_version: b.profile_version ?? 1,
              state: b.state || "",
              district: b.district || "",
              industry: b.industry || null,
              product_description: b.product_description || "",
              assessment_count: b.assessment_count ?? 1,
              created_at: b.created_at || new Date().toISOString(),
              updated_at: b.updated_at || new Date().toISOString(),
            }))
          );
          return;
        }
      } catch (err) {
        console.warn("Could not fetch real businesses for schemes:", err);
      }
    }
    loadRealBusinesses();
    return () => {
      active = false;
    };
  }, []);

  const allBusinesses = useMemo(() => {
    if (dynamicBusinesses.length > 0) return dynamicBusinesses;
    return userBusinesses;
  }, [dynamicBusinesses, userBusinesses]);

  // Effective business ID from URL, active context, localStorage, or latest dynamic business
  const effectiveBusinessId = useMemo(() => {
    if (paramBusinessId) return paramBusinessId;
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("complywise_active_business_id");
      if (stored) return stored;
    }
    if (activeBusinessId) return activeBusinessId;
    if (allBusinesses.length > 0) return allBusinesses[0].id;
    return "active";
  }, [paramBusinessId, activeBusinessId, allBusinesses]);

  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMasterCatalog, setViewMasterCatalog] = useState<boolean>(false);

  // Two-level filters + benefit type + search
  const [jurisdictionFilter, setJurisdictionFilter] = useState<JurisdictionFilter>("ALL");
  const [scopeFilter, setScopeFilter] = useState<ScopeFilter>("ALL");
  const [benefitTypeFilter, setBenefitTypeFilter] = useState<BenefitTypeFilter>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Version Provenance & Diff Modal
  const [selectedSchemeForHistory, setSelectedSchemeForHistory] = useState<string | null>(null);
  const [historyData, setHistoryData] = useState<SchemeVersionHistoryResponse | null>(null);
  const [historyLoading, setHistoryLoading] = useState<boolean>(false);

  // Pipeline Status Modal
  const [pipelineModalOpen, setPipelineModalOpen] = useState<boolean>(false);
  const [pipelineStatus, setPipelineStatus] = useState<SchemePipelineStatus | null>(null);
  const [pipelineLoading, setPipelineLoading] = useState<boolean>(false);

  // Dynamic Scheme Edit / Gazette Simulation Modal
  const [editSchemeModalOpen, setEditSchemeModalOpen] = useState<boolean>(false);
  const [schemeToEdit, setSchemeToEdit] = useState<SchemeItem | null>(null);
  const [editBenefitSummary, setEditBenefitSummary] = useState<string>("");
  const [editRatePercent, setEditRatePercent] = useState<string>("");
  const [editChangeReason, setEditChangeReason] = useState<string>("");
  const [updatingScheme, setUpdatingScheme] = useState<boolean>(false);

  // Action Notice Toast
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Fetch schemes based on the real onboarded business profile version
  const loadSchemes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (viewMasterCatalog || !effectiveBusinessId) {
        // Load master government catalogue of all 36 schemes
        const cat = await api.schemes.catalog();
        setResponse({
          available: true,
          business_id: effectiveBusinessId || "catalog",
          business_name: profile?.businessName || "Master Government Schemes Catalogue",
          state: "ALL",
          state_name: "All Jurisdictions (National & State)",
          msme_scale: profile?.scale || "ALL MSME",
          product_description: profile?.productDescription || "All industrial activities and services",
          count: cat.count,
          total_schemes_found: cat.count,
          universal_schemes_count: cat.schemes.filter((s: any) => s.is_universal).length,
          sector_specific_schemes_count: cat.schemes.filter((s: any) => !s.is_universal).length,
          maharashtra_schemes_count: cat.schemes.filter((s: any) => s.is_state_specific || s.jurisdiction_code === "MH").length,
          central_schemes_count: cat.schemes.filter((s: any) => !s.is_state_specific && s.jurisdiction_code !== "MH").length,
          schemes: cat.schemes,
        });
      } else {
        // Load context-driven schemes matching the onboarded business's profile version
        const res = await api.schemes.list(effectiveBusinessId, activeAssessmentId || undefined);
        setResponse(res);
      }
    } catch (err: any) {
      console.error("Error loading schemes:", err);
      setError(err.message || "Failed to load government schemes.");
    } finally {
      setLoading(false);
    }
  }, [effectiveBusinessId, activeAssessmentId, viewMasterCatalog, profile]);

  useEffect(() => {
    loadSchemes();
  }, [loadSchemes]);

  // Handle switching business
  async function handleBusinessSelect(newBizId: string) {
    if (!newBizId) return;
    if (newBizId === "MASTER_CATALOG") {
      setViewMasterCatalog(true);
      return;
    }
    setViewMasterCatalog(false);
    if (typeof window !== "undefined") {
      localStorage.setItem("complywise_active_business_id", newBizId);
    }
    await switchProfile(newBizId);
    router.replace(`/schemes?business_id=${newBizId}`);
  }

  // Trigger live crawler
  async function handleTriggerPipeline() {
    setRefreshing(true);
    setActionNotice("Crawling live official portals (MSME, CHAMPIONS, DPIIT, MCED) and computing content hashes...");
    try {
      await api.schemes.runPipeline({ force: true });
      await loadSchemes();
      setActionNotice("Pipeline successfully completed: official portal metadata verified & synced.");
      setTimeout(() => setActionNotice(null), 5000);
    } catch (err: any) {
      setActionNotice("Pipeline refresh failed: " + (err.message || "Network error"));
    } finally {
      setRefreshing(false);
    }
  }

  // Handle opening Version Provenance Modal
  async function handleOpenVersionHistory(schemeCode: string) {
    setSelectedSchemeForHistory(schemeCode);
    setHistoryLoading(true);
    try {
      const hist = await api.schemes.versions(schemeCode);
      setHistoryData(hist);
    } catch (err) {
      console.error("Failed to load version history:", err);
    } finally {
      setHistoryLoading(false);
    }
  }

  // Handle opening Pipeline Status Modal
  async function handleOpenPipelineStatus() {
    setPipelineModalOpen(true);
    setPipelineLoading(true);
    try {
      const stat = await api.schemes.pipelineStatus();
      setPipelineStatus(stat);
    } catch (err) {
      console.error("Failed to load pipeline status:", err);
    } finally {
      setPipelineLoading(false);
    }
  }

  // Handle Rollback
  async function handleRollback(schemeCode: string, targetVersion: number) {
    if (!confirm(`Are you sure you want to revert ${schemeCode} to Version ${targetVersion}?`)) return;
    try {
      await api.schemes.rollback(schemeCode, targetVersion, "User rollback via audit UI");
      setActionNotice(`Scheme ${schemeCode} successfully rolled back to Version ${targetVersion}.`);
      setSelectedSchemeForHistory(null);
      await loadSchemes();
      setTimeout(() => setActionNotice(null), 4000);
    } catch (err: any) {
      alert("Rollback failed: " + (err.message || "Error"));
    }
  }

  // Open dynamic scheme edit / policy update simulation
  function handleOpenEditScheme(sc: SchemeItem) {
    setSchemeToEdit(sc);
    setEditBenefitSummary(sc.benefit_summary || "");
    setEditRatePercent((sc.benefit_details as any)?.rate_percent ? String((sc.benefit_details as any).rate_percent) : "");
    setEditChangeReason("Gazette Revision 2026: Official enhancement of subsidy and incentive caps");
    setEditSchemeModalOpen(true);
  }

  // Publish dynamic scheme update
  async function handlePublishSchemeUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!schemeToEdit) return;
    setUpdatingScheme(true);
    try {
      const res = await api.schemes.updateScheme(schemeToEdit.scheme_code || schemeToEdit.id, {
        benefit_summary: editBenefitSummary.trim(),
        rate_percent: editRatePercent ? parseFloat(editRatePercent) : undefined,
        change_reason: editChangeReason.trim(),
      });

      if (res && res.updated) {
        setActionNotice(
          `Official Update Published: ${schemeToEdit.scheme_code} bumped to Version ${res.new_version} with new SHA-256 fingerprint.`
        );
        setEditSchemeModalOpen(false);
        setSchemeToEdit(null);
        await loadSchemes();
        setTimeout(() => setActionNotice(null), 6000);
      } else {
        alert(res.message || "No content changes detected.");
      }
    } catch (err: any) {
      alert("Update failed: " + (err.message || "Error"));
    } finally {
      setUpdatingScheme(false);
    }
  }

  const rawSchemes: SchemeItem[] = useMemo(() => {
    if (!response || !response.available) return [];
    return response.schemes || [];
  }, [response]);

  // Two-Level Filter Pipeline + Benefit Type + Search Query
  const filteredSchemes = useMemo(() => {
    return rawSchemes.filter((sc) => {
      const isMH = sc.is_state_specific || sc.jurisdiction_code === "MH" || sc.jurisdiction?.includes("Maharashtra");
      const isUniversal = Boolean(sc.is_universal);

      // Level 1: Jurisdiction Filter
      if (jurisdictionFilter === "CENTRAL" && isMH) return false;
      if (jurisdictionFilter === "STATE" && !isMH) return false;

      // Level 2: Scope & Applicability Filter
      if (scopeFilter === "UNIVERSAL" && !isUniversal) return false;
      if (scopeFilter === "TARGETED" && isUniversal) return false;

      // Benefit Type Filter
      if (benefitTypeFilter !== "ALL") {
        const bType = (sc.benefit_type || "").toUpperCase();
        if (benefitTypeFilter === "CAPITAL_SUBSIDY" && !bType.includes("CAPITAL") && !bType.includes("SUBSIDY")) {
          return false;
        }
        if (benefitTypeFilter === "INTEREST_SUBSIDY" && !bType.includes("INTEREST")) {
          return false;
        }
        if (benefitTypeFilter === "POWER_TARIFF" && !bType.includes("POWER") && !bType.includes("TARIFF")) {
          return false;
        }
        if (benefitTypeFilter === "CREDIT_GUARANTEE" && !bType.includes("CREDIT") && !bType.includes("GUARANTEE")) {
          return false;
        }
        if (benefitTypeFilter === "DUTY_REMISSION" && !bType.includes("DUTY") && !bType.includes("REMISSION")) {
          return false;
        }
      }

      // Text Search Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = (sc.title || "").toLowerCase().includes(q);
        const matchesAuth = (sc.authority || "").toLowerCase().includes(q);
        const matchesSummary = (sc.benefit_summary || "").toLowerCase().includes(q);
        const matchesCode = (sc.scheme_code || sc.id || "").toLowerCase().includes(q);
        const matchesRationale = (sc.relevance_rationale || "").toLowerCase().includes(q);
        const matchesSector = ((sc as any).sector_category || "").toLowerCase().includes(q);
        if (!matchesTitle && !matchesAuth && !matchesSummary && !matchesCode && !matchesRationale && !matchesSector) {
          return false;
        }
      }

      return true;
    });
  }, [rawSchemes, jurisdictionFilter, scopeFilter, benefitTypeFilter, searchQuery]);

  // Counts for badge filters
  const counts = useMemo(() => {
    const total = rawSchemes.length;
    const central = rawSchemes.filter((s) => !s.is_state_specific && s.jurisdiction_code !== "MH").length;
    const state = rawSchemes.filter((s) => s.is_state_specific || s.jurisdiction_code === "MH").length;
    const universal = rawSchemes.filter((s) => s.is_universal).length;
    const targeted = total - universal;
    return { total, central, state, universal, targeted };
  }, [rawSchemes]);

  // Active business display info
  const businessDisplayName = response?.business_name || profile?.businessName || "Your Business Profile";
  const businessStateName = response?.state_name || (profile?.state ? profile.state.toUpperCase() : "Maharashtra");
  const businessScale = response?.msme_scale || profile?.scale || "MICRO";
  const businessProductDesc =
    response?.product_description ||
    profile?.productDescription ||
    "Manufacturing, agro-processing, engineering and industrial operations.";

  return (
    <AppShell activeView="schemes" requireAuth={false}>
      <div className="space-y-6 max-w-7xl mx-auto pb-12">
        {/* Action Notice Toast */}
        {actionNotice && (
          <div className="rounded-[12px] bg-blue-50 border border-blue-200 p-4 text-blue-900 text-xs flex items-center justify-between shadow-sm animate-fade-in">
            <div className="flex items-center gap-2">
              <span className="text-base">⚡</span>
              <span className="font-medium">{actionNotice}</span>
            </div>
            <button
              onClick={() => setActionNotice(null)}
              className="text-blue-600 hover:text-blue-800 text-xs font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {/* Top Header Card */}
        <div className="bg-white rounded-[16px] border border-[#E2E8F0] p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-2xs">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-200 bg-indigo-50 text-indigo-800 text-[11px] font-semibold tracking-wider uppercase mb-2.5">
              <span>🏛️</span>
              <span>Central &amp; Maharashtra Government Schemes Pipeline</span>
            </div>
            <h1 className="font-sans text-2xl sm:text-3xl text-[#0F172A] font-extrabold tracking-tight">
              Schemes &amp; Financial Incentives
            </h1>
            <p className="text-xs sm:text-sm text-[#64748B] mt-1.5 max-w-3xl leading-relaxed">
              Real-time business context discovery. Verified schemes from Central MSME, CHAMPIONS, DPIIT, and
              Maharashtra MCED portals dynamically matched to your registered business profile.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={handleOpenPipelineStatus}
              className="rounded-full border border-[#CBD5E1] bg-white px-4 py-2 text-xs font-semibold text-[#334155] hover:bg-[#F8FAFC] transition-colors inline-flex items-center gap-2 shadow-2xs"
            >
              <span>🔍</span>
              <span>Registry &amp; Audit Trail</span>
            </button>
            <button
              onClick={handleTriggerPipeline}
              disabled={refreshing}
              className="rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:from-blue-700 hover:to-indigo-700 transition-all inline-flex items-center gap-2 shadow-sm disabled:opacity-60"
            >
              <span className={refreshing ? "animate-spin" : ""}>🔄</span>
              <span>{refreshing ? "Crawling Portals..." : "Refresh from Portals"}</span>
            </button>
            <Link
              href="/dashboard"
              className="rounded-full border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-2 text-xs font-semibold text-[#0F172A] hover:bg-[#F1F5F9] transition-colors"
            >
              ← Dashboard
            </Link>
          </div>
        </div>

        {/* Real Onboarded Business Profile Context Card */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-[16px] p-6 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-2xl shrink-0 text-blue-300">
              🏢
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                  Active Business Context
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2 py-0.5 rounded-full font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Dynamic Matching Active
                </span>
              </div>
              <div className="text-lg font-bold text-white flex items-center gap-2.5 flex-wrap">
                <span>{businessDisplayName}</span>
                <span className="text-[10px] bg-blue-500/30 text-blue-200 border border-blue-400/40 px-2.5 py-0.5 rounded-full font-mono font-medium">
                  {businessScale} SCALE
                </span>
              </div>
              <div className="text-xs text-slate-300 mt-1 max-w-2xl line-clamp-1">
                {businessProductDesc}
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-4 shrink-0 border-t sm:border-t-0 sm:border-l border-white/10 pt-4 sm:pt-0 sm:pl-5">
            <div>
              <div className="text-[10px] uppercase text-slate-400 font-semibold">Registered State</div>
              <div className="text-sm font-bold text-white mt-0.5">{businessStateName}</div>
            </div>

            {/* Business switcher dropdown if user has businesses */}
            {allBusinesses && allBusinesses.length > 0 && (
              <div className="space-y-1">
                <label className="text-[10px] uppercase text-slate-400 font-semibold block">
                  Switch Business Profile:
                </label>
                <select
                  value={viewMasterCatalog ? "MASTER_CATALOG" : effectiveBusinessId || ""}
                  onChange={(e) => handleBusinessSelect(e.target.value)}
                  className="bg-slate-800 border border-slate-600 text-white text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-blue-400"
                >
                  {allBusinesses.map((b: any) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.state || "State"})
                    </option>
                  ))}
                  <option value="MASTER_CATALOG">🌐 View Master Catalog (All 36 Schemes)</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
          <div className="bg-white rounded-[16px] border border-[#E2E8F0] p-4 shadow-2xs">
            <div className="text-[10px] font-semibold text-[#64748B] uppercase tracking-wider">
              Total Applicable
            </div>
            <div className="text-2xl font-black text-[#0F172A] mt-1">{counts.total}</div>
            <div className="text-[11px] text-[#64748B] mt-0.5">Matched for this profile</div>
          </div>

          <div className="bg-white rounded-[16px] border border-blue-100 bg-blue-50/20 p-4 shadow-2xs">
            <div className="text-[10px] font-semibold text-blue-700 uppercase tracking-wider">
              Central Govt (National)
            </div>
            <div className="text-2xl font-black text-blue-900 mt-1">{counts.central}</div>
            <div className="text-[11px] text-blue-700/80 mt-0.5">MSME Ministry &amp; DPIIT</div>
          </div>

          <div className="bg-white rounded-[16px] border border-amber-100 bg-amber-50/20 p-4 shadow-2xs">
            <div className="text-[10px] font-semibold text-amber-800 uppercase tracking-wider">
              State Specific (MH)
            </div>
            <div className="text-2xl font-black text-amber-900 mt-1">{counts.state}</div>
            <div className="text-[11px] text-amber-800/80 mt-0.5">Maharashtra MCED &amp; PSI</div>
          </div>

          <div className="bg-white rounded-[16px] border border-emerald-100 bg-emerald-50/20 p-4 shadow-2xs">
            <div className="text-[10px] font-semibold text-emerald-800 uppercase tracking-wider">
              Universal Support
            </div>
            <div className="text-2xl font-black text-emerald-900 mt-1">{counts.universal}</div>
            <div className="text-[11px] text-emerald-800/80 mt-0.5">Open to all industries</div>
          </div>

          <div className="bg-white rounded-[16px] border border-indigo-100 bg-indigo-50/20 p-4 shadow-2xs col-span-2 md:col-span-1">
            <div className="text-[10px] font-semibold text-indigo-800 uppercase tracking-wider">
              Targeted Sectoral
            </div>
            <div className="text-2xl font-black text-indigo-900 mt-1">{counts.targeted}</div>
            <div className="text-[11px] text-indigo-800/80 mt-0.5">Strict activity match</div>
          </div>
        </div>

        {/* Filter Controls (Both Levels + Benefit Type + Search) */}
        <div className="bg-white rounded-[16px] border border-[#E2E8F0] p-5 shadow-2xs space-y-4">
          {/* Level 1: Jurisdiction Level Filter */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#F1F5F9] pb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#0F172A]">
                Level 1: Jurisdiction
              </span>
              <span className="text-[11px] text-[#64748B]">(National vs State Portals)</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setJurisdictionFilter("ALL")}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  jurisdictionFilter === "ALL"
                    ? "bg-[#0F172A] text-white shadow-2xs"
                    : "bg-[#F8FAFC] text-[#475569] border border-[#E2E8F0] hover:bg-[#F1F5F9]"
                }`}
              >
                All Jurisdictions ({counts.total})
              </button>
              <button
                onClick={() => setJurisdictionFilter("CENTRAL")}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  jurisdictionFilter === "CENTRAL"
                    ? "bg-blue-600 text-white shadow-2xs"
                    : "bg-blue-50 text-blue-800 border border-blue-200 hover:bg-blue-100"
                }`}
              >
                🇮🇳 Central Government ({counts.central})
              </button>
              <button
                onClick={() => setJurisdictionFilter("STATE")}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  jurisdictionFilter === "STATE"
                    ? "bg-amber-600 text-white shadow-2xs"
                    : "bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100"
                }`}
              >
                🏛️ Maharashtra State ({counts.state})
              </button>
            </div>
          </div>

          {/* Level 2: Scope & Applicability Filter */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#F1F5F9] pb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#0F172A]">
                Level 2: Scope &amp; Applicability
              </span>
              <span className="text-[11px] text-[#64748B]">(Universal MSME vs Targeted Sector)</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setScopeFilter("ALL")}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  scopeFilter === "ALL"
                    ? "bg-[#0F172A] text-white shadow-2xs"
                    : "bg-[#F8FAFC] text-[#475569] border border-[#E2E8F0] hover:bg-[#F1F5F9]"
                }`}
              >
                All Scopes ({counts.total})
              </button>
              <button
                onClick={() => setScopeFilter("UNIVERSAL")}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  scopeFilter === "UNIVERSAL"
                    ? "bg-emerald-600 text-white shadow-2xs"
                    : "bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100"
                }`}
              >
                🌐 Universal Incentives ({counts.universal})
              </button>
              <button
                onClick={() => setScopeFilter("TARGETED")}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  scopeFilter === "TARGETED"
                    ? "bg-indigo-600 text-white shadow-2xs"
                    : "bg-indigo-50 text-indigo-800 border border-indigo-200 hover:bg-indigo-100"
                }`}
              >
                🎯 Sector-Specific ({counts.targeted})
              </button>
            </div>
          </div>

          {/* Search and Benefit Type Pills */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-semibold text-[#64748B] mr-1">Benefit Type:</span>
              {(
                [
                  ["ALL", "All Types"],
                  ["CAPITAL_SUBSIDY", "Capital Subsidy"],
                  ["INTEREST_SUBSIDY", "Interest Subvention"],
                  ["POWER_TARIFF", "Power Tariff Rebate"],
                  ["CREDIT_GUARANTEE", "Credit Guarantee"],
                  ["DUTY_REMISSION", "Duty & Tax Exemption"],
                ] as const
              ).map(([val, label]) => (
                <button
                  key={val}
                  onClick={() => setBenefitTypeFilter(val)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-colors ${
                    benefitTypeFilter === val
                      ? "bg-blue-600 text-white shadow-2xs"
                      : "bg-[#F1F5F9] text-[#475569] hover:bg-[#E2E8F0]"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="w-full md:w-72">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search schemes, sectors, benefits..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-full border border-[#E2E8F0] bg-[#F8FAFC] pl-9 pr-4 py-1.5 text-xs text-[#0F172A] placeholder-[#94A3B8] focus:bg-white focus:border-blue-500 focus:outline-none transition-all"
                />
                <span className="absolute left-3 top-2 text-xs text-[#94A3B8]">🔍</span>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1.5 text-xs text-[#94A3B8] hover:text-[#475569]"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Error Notice */}
        {error && (
          <ErrorState
            title="Schemes Service Notice"
            message={error}
            onRetry={loadSchemes}
          />
        )}

        {/* Results Counter Bar */}
        <div className="flex items-center justify-between text-xs text-[#64748B] px-1">
          <div>
            Showing <span className="font-bold text-[#0F172A]">{filteredSchemes.length}</span> of{" "}
            <span className="font-bold text-[#0F172A]">{counts.total}</span> applicable schemes for{" "}
            <span className="font-bold text-[#0F172A]">{businessDisplayName}</span>
          </div>
          {(jurisdictionFilter !== "ALL" || scopeFilter !== "ALL" || benefitTypeFilter !== "ALL" || searchQuery) && (
            <button
              onClick={() => {
                setJurisdictionFilter("ALL");
                setScopeFilter("ALL");
                setBenefitTypeFilter("ALL");
                setSearchQuery("");
              }}
              className="text-blue-600 hover:underline font-semibold"
            >
              Reset All Filters
            </button>
          )}
        </div>

        {/* Loading Skeleton */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <LoadingSkeleton count={6} className="h-64 w-full rounded-[16px]" />
          </div>
        ) : filteredSchemes.length === 0 ? (
          <div className="bg-white rounded-[16px] border border-[#E2E8F0] p-12 text-center shadow-2xs">
            <div className="text-4xl mb-3">🔍</div>
            <h3 className="font-sans font-bold text-lg text-[#0F172A]">
              No schemes matched your current filter
            </h3>
            <p className="text-xs text-[#64748B] mt-2 max-w-md mx-auto leading-relaxed">
              Try adjusting the Jurisdiction or Scope filter options above, or search for another term.
            </p>
            <div className="mt-5 flex items-center justify-center gap-3">
              <button
                onClick={() => {
                  setJurisdictionFilter("ALL");
                  setScopeFilter("ALL");
                  setBenefitTypeFilter("ALL");
                  setSearchQuery("");
                }}
                className="px-4 py-2 rounded-full text-xs font-semibold bg-[#F1F5F9] text-[#0F172A] hover:bg-[#E2E8F0]"
              >
                Clear Filters
              </button>
              <button
                onClick={() => setViewMasterCatalog(true)}
                className="px-4 py-2 rounded-full text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700"
              >
                Browse Master Catalog (All 36 Schemes)
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSchemes.map((sc) => {
              const isMH = sc.is_state_specific || sc.jurisdiction_code === "MH" || sc.jurisdiction?.includes("Maharashtra");
              const isUniversal = Boolean(sc.is_universal);
              const sectorCategory = (sc as any).sector_category;

              return (
                <div
                  key={sc.id || sc.scheme_code}
                  className="bg-white rounded-[16px] border border-[#E2E8F0] p-6 shadow-2xs hover:border-[#CBD5E1] hover:shadow-sm transition-all flex flex-col justify-between space-y-4 relative"
                >
                  <div className="space-y-3.5">
                    {/* Top Badges */}
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <span className="font-mono text-[10px] font-semibold text-[#0F172A] bg-[#F1F5F9] border border-[#E2E8F0] px-2.5 py-0.5 rounded-full">
                        {sc.scheme_code || sc.id}
                      </span>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {/* Scope badge */}
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                            isUniversal
                              ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                              : "bg-indigo-50 text-indigo-800 border-indigo-300"
                          }`}
                        >
                          {isUniversal ? "🌐 Universal" : `🎯 ${sectorCategory || "Sector-Specific"}`}
                        </span>

                        {/* Jurisdiction Badge */}
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase border ${
                            isMH
                              ? "bg-amber-50 text-amber-800 border-amber-300"
                              : "bg-blue-50 text-blue-800 border-blue-300"
                          }`}
                        >
                          {isMH ? "🏛️ Maharashtra" : "🇮🇳 Central"}
                        </span>
                      </div>
                    </div>

                    {/* Scheme Title */}
                    <h3 className="font-sans text-base text-[#0F172A] font-bold leading-snug">
                      {sc.title}
                    </h3>

                    {/* Authority */}
                    <div className="text-xs text-[#2563EB] font-semibold flex items-center gap-1.5">
                      <span>🏛️</span>
                      <span className="line-clamp-1">{sc.authority}</span>
                    </div>

                    {/* Benefit Box */}
                    <div className="bg-[#F8FAFC] rounded-[12px] p-3 border border-[#E2E8F0] space-y-1.5">
                      <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-[#64748B]">
                        <span>Benefit Offering</span>
                        <span className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                          {(sc.benefit_type || "INCENTIVE").replace(/_/g, " ")}
                        </span>
                      </div>
                      <p className="text-xs text-[#334155] leading-relaxed font-medium">
                        {sc.benefit_summary}
                      </p>
                    </div>

                    {/* Relevance Rationale Box */}
                    {sc.relevance_rationale && (
                      <div
                        className={`rounded-[12px] p-3 text-[11px] leading-relaxed border ${
                          isUniversal
                            ? "bg-emerald-50/70 border-emerald-200/80 text-emerald-900"
                            : "bg-indigo-50/70 border-indigo-200/80 text-indigo-900"
                        }`}
                      >
                        <div className="font-semibold flex items-center gap-1.5 mb-1">
                          <span>{isUniversal ? "🌐" : "🎯"}</span>
                          <span>{isUniversal ? "Universal MSME Eligibility:" : "Why Your Business Qualifies:"}</span>
                        </div>
                        <p>{sc.relevance_rationale}</p>
                      </div>
                    )}

                    {/* Evidence & Citation */}
                    {sc.evidence_snippet && (
                      <div className="text-[11px] text-[#64748B] italic bg-[#F1F5F9]/50 rounded-lg p-2.5 border border-[#E2E8F0]/60 line-clamp-2">
                        “{sc.evidence_snippet}”
                      </div>
                    )}
                  </div>

                  {/* Footer Info & Actions */}
                  <div className="pt-4 border-t border-[#E2E8F0] space-y-2.5">
                    <div className="flex items-center justify-between text-[10px] text-[#64748B]">
                      <span>Verified: {sc.last_verified_at || "Recent"}</span>
                      <span className="font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        {sc.version || `v${sc.version_number || 1}.0`}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-1">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleOpenVersionHistory(sc.scheme_code || sc.id)}
                          className="text-[11px] font-semibold text-[#475569] hover:text-[#0F172A] inline-flex items-center gap-1 transition-colors"
                          title="View immutable version audit trail and SHA-256 fingerprint"
                        >
                          <span>📜</span>
                          <span>History</span>
                        </button>
                        <button
                          onClick={() => handleOpenEditScheme(sc)}
                          className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1 transition-colors"
                          title="Simulate official gazette policy update and trigger version bump"
                        >
                          <span>✏️</span>
                          <span>Simulate Update</span>
                        </button>
                      </div>

                      {sc.action_url && (
                        <a
                          href={sc.action_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors"
                        >
                          <span>Official Portal</span>
                          <span className="text-sm">↗</span>
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Dynamic Scheme Policy Update / Gazette Simulation Modal */}
        {editSchemeModalOpen && schemeToEdit && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-[20px] max-w-xl w-full p-6 sm:p-8 shadow-xl space-y-5">
              <div className="flex items-start justify-between border-b border-[#E2E8F0] pb-3.5">
                <div>
                  <div className="text-[10px] uppercase font-bold tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full inline-block mb-1 border border-indigo-200">
                    Dynamic Scheme Management &amp; Gazette Revision
                  </div>
                  <h2 className="text-lg font-bold text-[#0F172A]">
                    Simulate Official Policy Revision ({schemeToEdit.scheme_code})
                  </h2>
                </div>
                <button
                  onClick={() => setEditSchemeModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-[#F1F5F9] text-[#475569] hover:bg-[#E2E8F0] flex items-center justify-center font-bold"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handlePublishSchemeUpdate} className="space-y-4">
                <div className="text-xs text-[#64748B] bg-slate-50 p-3 rounded-[12px] border border-[#E2E8F0]">
                  This demonstrates that scheme records are <strong>fully dynamic and database-driven</strong>. Modifying
                  benefit parameters will calculate a new SHA-256 content hash, compute a field-by-field diff against the
                  previous immutable version, and bump the version number.
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#0F172A] block mb-1">
                    Scheme Title:
                  </label>
                  <input
                    type="text"
                    defaultValue={schemeToEdit.title}
                    disabled
                    className="w-full text-xs rounded-lg border border-[#E2E8F0] bg-[#F1F5F9] p-2.5 text-[#64748B]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#0F172A] block mb-1">
                    Benefit Summary &amp; Subsidy Terms:
                  </label>
                  <textarea
                    rows={3}
                    value={editBenefitSummary}
                    onChange={(e) => setEditBenefitSummary(e.target.value)}
                    required
                    className="w-full text-xs rounded-lg border border-[#CBD5E1] p-2.5 text-[#0F172A] focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#0F172A] block mb-1">
                    Subsidy Rate Percentage (%):
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="e.g. 35.0"
                    value={editRatePercent}
                    onChange={(e) => setEditRatePercent(e.target.value)}
                    className="w-full text-xs rounded-lg border border-[#CBD5E1] p-2.5 text-[#0F172A] focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#0F172A] block mb-1">
                    Gazette Revision Note / Justification:
                  </label>
                  <input
                    type="text"
                    value={editChangeReason}
                    onChange={(e) => setEditChangeReason(e.target.value)}
                    required
                    className="w-full text-xs rounded-lg border border-[#CBD5E1] p-2.5 text-[#0F172A] focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E2E8F0]">
                  <button
                    type="button"
                    onClick={() => setEditSchemeModalOpen(false)}
                    className="px-4 py-2 rounded-full text-xs font-semibold text-[#475569] hover:bg-[#F1F5F9]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updatingScheme}
                    className="px-5 py-2 rounded-full text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors disabled:opacity-60"
                  >
                    {updatingScheme ? "Publishing New Version..." : "Publish Updated Version"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Version Provenance & Diff Modal */}
        {selectedSchemeForHistory && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-[20px] max-w-2xl w-full p-6 sm:p-8 shadow-xl max-h-[85vh] overflow-y-auto space-y-6">
              <div className="flex items-start justify-between border-b border-[#E2E8F0] pb-4">
                <div>
                  <div className="text-[10px] uppercase font-bold tracking-wider text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full inline-block mb-1 border border-blue-200">
                    Immutable Version Audit Trail
                  </div>
                  <h2 className="text-lg font-bold text-[#0F172A]">
                    {selectedSchemeForHistory} — Version History
                  </h2>
                </div>
                <button
                  onClick={() => setSelectedSchemeForHistory(null)}
                  className="w-8 h-8 rounded-full bg-[#F1F5F9] text-[#475569] hover:bg-[#E2E8F0] flex items-center justify-center font-bold"
                >
                  ✕
                </button>
              </div>

              {historyLoading ? (
                <div className="py-8 text-center text-xs text-[#64748B]">
                  Loading version records and cryptographic hashes...
                </div>
              ) : !historyData || historyData.versions.length === 0 ? (
                <div className="py-8 text-center text-xs text-[#64748B]">
                  No version history records found.
                </div>
              ) : (
                <div className="space-y-4">
                  {historyData.versions.map((v: SchemeVersionRecord) => (
                    <div
                      key={v.version_number}
                      className={`p-4 rounded-[14px] border ${
                        v.is_active
                          ? "border-emerald-300 bg-emerald-50/20 shadow-2xs"
                          : "border-[#E2E8F0] bg-[#F8FAFC] opacity-80"
                      } space-y-3`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-[#0F172A]">
                            Version {v.version_number}.0
                          </span>
                          {v.is_active ? (
                            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-300">
                              ACTIVE PUBLISHED
                            </span>
                          ) : (
                            <span className="bg-gray-100 text-gray-600 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                              ARCHIVED
                            </span>
                          )}
                        </div>

                        {!v.is_active && (
                          <button
                            onClick={() => handleRollback(historyData.scheme_code, v.version_number)}
                            className="text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-300 px-3 py-1 rounded-full transition-colors"
                          >
                            ↩ Rollback to v{v.version_number}
                          </button>
                        )}
                      </div>

                      <div className="text-xs text-[#0F172A] font-semibold">
                        {v.title}
                      </div>

                      <p className="text-xs text-[#475569] leading-relaxed">
                        {v.benefit_summary}
                      </p>

                      <div className="bg-white rounded-lg p-2.5 border border-[#E2E8F0] text-[11px] font-mono text-[#475569] space-y-1">
                        <div className="text-[10px] uppercase font-sans font-bold text-[#64748B]">
                          SHA-256 Content Fingerprint:
                        </div>
                        <div className="truncate text-blue-700 font-semibold">{v.content_hash}</div>
                      </div>

                      {v.diff_summary && v.diff_summary.has_changes && (
                        <div className="bg-amber-50/60 rounded-lg p-3 border border-amber-200 text-xs text-amber-900 space-y-1">
                          <div className="font-bold text-[11px] uppercase tracking-wider text-amber-950">
                            Diff Highlights from v{v.diff_summary.previous_version}:
                          </div>
                          <div className="text-[11px]">
                            Modified Fields:{" "}
                            <span className="font-semibold">
                              {(v.diff_summary.changed_fields || []).join(", ")}
                            </span>
                          </div>
                        </div>
                      )}

                      <div className="text-[10px] text-[#64748B] flex items-center justify-between pt-1">
                        <span>Created: {new Date(v.created_at).toLocaleDateString()}</span>
                        <span>Source: {v.source_url}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Pipeline & Ingestion Status Modal */}
        {pipelineModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-[20px] max-w-3xl w-full p-6 sm:p-8 shadow-xl max-h-[85vh] overflow-y-auto space-y-6">
              <div className="flex items-start justify-between border-b border-[#E2E8F0] pb-4">
                <div>
                  <div className="text-[10px] uppercase font-bold tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full inline-block mb-1 border border-indigo-200">
                    Live Portal Crawl &amp; Verification Audit
                  </div>
                  <h2 className="text-xl font-bold text-[#0F172A]">
                    Official Sources &amp; Ingestion Registry (36 Schemes)
                  </h2>
                </div>
                <button
                  onClick={() => setPipelineModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-[#F1F5F9] text-[#475569] hover:bg-[#E2E8F0] flex items-center justify-center font-bold"
                >
                  ✕
                </button>
              </div>

              {pipelineLoading ? (
                <div className="py-8 text-center text-xs text-[#64748B]">
                  Loading pipeline status...
                </div>
              ) : !pipelineStatus ? (
                <div className="py-8 text-center text-xs text-[#64748B]">
                  No pipeline status available.
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Summary Stats */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-[12px] p-3 text-center">
                      <div className="text-[10px] uppercase text-[#64748B] font-bold">Total Ingested Schemes</div>
                      <div className="text-2xl font-bold text-[#0F172A] mt-1">{pipelineStatus.total_schemes}</div>
                    </div>
                    <div className="bg-amber-50/40 border border-amber-200 rounded-[12px] p-3 text-center">
                      <div className="text-[10px] uppercase text-amber-800 font-bold">Maharashtra Schemes</div>
                      <div className="text-2xl font-bold text-amber-900 mt-1">{pipelineStatus.maharashtra_schemes_count}</div>
                    </div>
                    <div className="bg-blue-50/40 border border-blue-200 rounded-[12px] p-3 text-center">
                      <div className="text-[10px] uppercase text-blue-800 font-bold">Central Schemes</div>
                      <div className="text-2xl font-bold text-blue-900 mt-1">{pipelineStatus.central_schemes_count}</div>
                    </div>
                  </div>

                  {/* Registered Sources */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#475569]">
                      Authoritative Government Portals
                    </h3>
                    <div className="space-y-2">
                      {pipelineStatus.registered_sources.map((src) => (
                        <div
                          key={src.key}
                          className="p-3 rounded-[12px] border border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between text-xs"
                        >
                          <div>
                            <div className="font-bold text-[#0F172A] flex items-center gap-2">
                              <span>{src.name}</span>
                              <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-mono font-medium">
                                {src.jurisdiction}
                              </span>
                            </div>
                            <div className="text-[11px] text-[#64748B] mt-0.5 font-mono">
                              Domain: {src.domain}
                            </div>
                          </div>
                          <a
                            href={src.primary_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:underline font-semibold"
                          >
                            Visit Source ↗
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recent Snapshots & Hashes */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#475569]">
                      Recent Cryptographic Snapshots
                    </h3>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {pipelineStatus.recent_snapshots.map((snap) => (
                        <div
                          key={snap.id}
                          className="p-3 rounded-[12px] border border-[#E2E8F0] bg-white text-xs space-y-1.5"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-[#0F172A]">{snap.source_key}</span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                snap.status === "SUCCESS"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-blue-100 text-blue-800"
                              }`}
                            >
                              {snap.status} ({snap.scheme_count} schemes)
                            </span>
                          </div>
                          <div className="text-[10px] font-mono text-[#64748B] truncate">
                            SHA-256: {snap.content_hash}
                          </div>
                          <div className="text-[10px] text-[#94A3B8]">
                            Fetched: {new Date(snap.fetched_at).toLocaleString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

export default function SchemesPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#EDEFF2] flex items-center justify-center text-xs text-[#64748B]">
          Loading government schemes pipeline...
        </div>
      }
    >
      <SchemesContent />
    </Suspense>
  );
}
