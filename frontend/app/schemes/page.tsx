"use client";
import Overlay from "@/components/product/Overlay";

import React, { useEffect, useState, useMemo, useRef, Suspense, useCallback } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import Disclosure from "@/components/product/Disclosure";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import ErrorState from "@/components/ErrorState";
import { api } from "@/lib/api";
import type { SchemeVersionHistoryResponse } from "@/lib/api/schemes";
import type { SchemeItem, SchemePipelineStatus, SchemeVersionRecord } from "@/types";
import { useLanguage } from "@/context/LanguageContext";
import { useBusinessContext } from "@/context/BusinessContext";
import { useAuth } from "@/context/AuthContext";
import SourceProvenance from "@/components/product/SourceProvenance";
import { schemeClassification } from "@/lib/sourceProvenance";
import { sanitizeExternalUrl } from "@/lib/url";

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
  const { user } = useAuth();
  const canManageSources = Boolean(user?.is_staff || user?.is_superuser);
  const router = useRouter();
  const searchParams = useSearchParams();
  const paramBusinessId = searchParams.get("business_id");
  const paramAssessmentId = searchParams.get("assessment_id");

  const {
    profile,
    activeBusinessId,
    activeAssessmentId,
    userBusinesses,
    switchProfile,
  } = useBusinessContext();

  // BusinessProvider already loads the tenant's business list and reports failures.
  const allBusinesses = userBusinesses;

  // URL selection overrides the authenticated workspace, never an unscoped cache.
  const effectiveBusinessId = useMemo(() => {
    if (paramBusinessId) return paramBusinessId;
    if (activeBusinessId) return activeBusinessId;
    if (allBusinesses.length > 0) return allBusinesses[0].id;
    return "";
  }, [paramBusinessId, activeBusinessId, allBusinesses]);
  const effectiveAssessmentId = paramAssessmentId || (effectiveBusinessId === activeBusinessId ? activeAssessmentId : undefined);
  const requestVersion = useRef(0);

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
    const version = ++requestVersion.current;
    setLoading(true);
    setError(null);
    setResponse(null);
    try {
      if (viewMasterCatalog || !effectiveBusinessId) {
        // Load the persisted government scheme catalogue
        const cat = await api.schemes.catalog();
        if (version !== requestVersion.current) return;
        setResponse({
          available: true,
          business_id: effectiveBusinessId || "catalog",
          business_name: "Government Schemes Catalogue",
          state: "ALL",
          state_name: "All Jurisdictions (National & State)",
          msme_scale: "All enterprise sizes",
          product_description: "Catalogue candidates — eligibility is assessed against your saved business profile.",
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
        const res = await api.schemes.list(effectiveBusinessId, effectiveAssessmentId || undefined);
        if (version !== requestVersion.current) return;
        setResponse(res);
      }
    } catch (err: any) {
      if (version !== requestVersion.current) return;
      console.error("Error loading schemes:", err);
      setError(err.message || "Failed to load government schemes.");
    } finally {
      if (version === requestVersion.current) setLoading(false);
    }
  }, [effectiveBusinessId, effectiveAssessmentId, viewMasterCatalog]);

  useEffect(() => {
    loadSchemes();
    return () => { ++requestVersion.current; };
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
    setEditChangeReason("");
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
  const profileMatchesScope = effectiveBusinessId === profile?.id;
  const businessDisplayName = response?.business_name || (profileMatchesScope ? profile?.businessName : "Selected business");
  const businessStateName = response?.state_name || (profileMatchesScope ? profile?.state : "Location not recorded");
  const businessScale = response?.msme_scale || (profileMatchesScope ? profile?.scale : "Enterprise size not recorded");
  const businessProductDesc =
    response?.product_description ||
    (profileMatchesScope ? profile?.productDescription : "") ||
    "Add your business context to see matched benefits.";

  return (
    <AppShell activeView="schemes">
      <div className="space-y-6 max-w-7xl mx-auto pb-12">
        {/* Action Notice Toast */}
        {actionNotice && (
          <div className="rounded-[12px] bg-[var(--ui-info-soft)] border border-[var(--ui-sage-soft)] p-4 text-[var(--ui-info)] text-xs flex items-center justify-between shadow-sm animate-fade-in">
            <div className="flex items-center gap-2">
              <span className="text-base">⚡</span>
              <span className="font-medium">{actionNotice}</span>
            </div>
            <button
              onClick={() => setActionNotice(null)}
              className="text-[var(--ui-info)] hover:text-[var(--ui-info)] text-xs font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {/* Top Header Card */}
        <div className="bg-white rounded-[16px] border border-[var(--ui-border)] p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-2xs">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[var(--ui-sage-soft)] bg-[var(--ui-sage-faint)] text-[var(--ui-sage)] text-[11px] font-semibold tracking-wider uppercase mb-2.5">
              <span>🏛️</span>
              <span>Business benefits</span>
            </div>
            <h1 className="font-sans text-2xl sm:text-3xl text-[var(--ui-text)] font-extrabold tracking-tight">
              Schemes &amp; Financial Incentives
            </h1>
            <p className="text-xs sm:text-sm text-[var(--ui-secondary)] mt-1.5 max-w-3xl leading-relaxed">
              Explore benefits matched to your business, then review the eligibility and source before applying.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={handleOpenPipelineStatus}
              className="rounded-full border border-[var(--ui-border-strong)] bg-white px-4 py-2 text-xs font-semibold text-[var(--ui-secondary)] hover:bg-[var(--ui-bg)] transition-colors inline-flex items-center gap-2 shadow-2xs"
            >
              <span>🔍</span>
              <span>Registry &amp; Audit Trail</span>
            </button>
            <button
              onClick={canManageSources ? handleTriggerPipeline : () => void loadSchemes()}
              disabled={refreshing}
              className="rounded-full bg-gradient-to-r from-[var(--ui-text)] to-[var(--ui-sage)] px-4 py-2 text-xs font-semibold text-white hover:from-[var(--ui-text)] hover:to-[var(--ui-sage)] transition-all inline-flex items-center gap-2 shadow-sm disabled:opacity-60"
            >
              <span className={refreshing ? "animate-spin" : ""}>🔄</span>
              <span>{refreshing ? "Refreshing…" : canManageSources ? "Refresh sources" : "Refresh matches"}</span>
            </button>
            <Link
              href="/dashboard"
              className="rounded-full border border-[var(--ui-border)] bg-[var(--ui-bg)] px-4 py-2 text-xs font-semibold text-[var(--ui-text)] hover:bg-[var(--ui-inset)] transition-colors"
            >
              ← Dashboard
            </Link>
          </div>
        </div>

        {/* Real Onboarded Business Profile Context Card */}
        <div className="ui-business-context bg-white border border-[var(--ui-border)] rounded-[16px] p-6 text-[var(--ui-text)] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[var(--ui-text)]/20 border border-[var(--ui-sage-soft)]/30 flex items-center justify-center text-2xl shrink-0 text-[var(--ui-info)]">
              🏢
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="text-[10px] uppercase tracking-wider text-[var(--ui-muted)] font-bold">
                  Active Business Context
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] bg-[var(--ui-sage)]/20 text-[var(--ui-sage)] border border-[var(--ui-sage-soft)]/30 px-2 py-0.5 rounded-full font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--ui-sage)]" />
                  {effectiveBusinessId ? "Matched business context" : "Browse catalogue"}
                </span>
              </div>
              <div className="text-lg font-bold text-[var(--ui-text)] flex items-center gap-2.5 flex-wrap">
                <span>{businessDisplayName}</span>
                <span className="text-[10px] bg-[var(--ui-sage-faint)]/30 text-[var(--ui-sage)] border border-[var(--ui-sage-soft)]/40 px-2.5 py-0.5 rounded-full font-mono font-medium">
                  {businessScale}
                </span>
              </div>
              <div className="text-xs text-[var(--ui-muted)] mt-1 max-w-2xl line-clamp-1">
                {businessProductDesc}
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-4 shrink-0 border-t sm:border-t-0 sm:border-l border-[var(--ui-border)] pt-4 sm:pt-0 sm:pl-5">
            <div>
              <div className="text-[10px] uppercase text-[var(--ui-muted)] font-semibold">Registered State</div>
              <div className="text-sm font-bold text-[var(--ui-text)] mt-0.5">{businessStateName}</div>
            </div>

            {/* Business switcher dropdown if user has businesses */}
            {allBusinesses && allBusinesses.length > 0 && (
              <div className="space-y-1">
                <label className="text-[10px] uppercase text-[var(--ui-muted)] font-semibold block">
                  Switch Business Profile:
                </label>
                <select
                  value={viewMasterCatalog ? "MASTER_CATALOG" : effectiveBusinessId || ""}
                  onChange={(e) => handleBusinessSelect(e.target.value)}
                  className="bg-[var(--ui-sage-faint)] border border-[var(--ui-border-strong)] text-[var(--ui-text)] text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-[var(--ui-sage-soft)]"
                >
                  {allBusinesses.map((b: any) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.state || "State"})
                    </option>
                  ))}
                  <option value="MASTER_CATALOG">View scheme catalogue</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
          <div className="bg-white rounded-[16px] border border-[var(--ui-border)] p-4 shadow-2xs">
            <div className="text-[10px] font-semibold text-[var(--ui-secondary)] uppercase tracking-wider">
              Matched support areas
            </div>
            <div className="text-2xl font-black text-[var(--ui-text)] mt-1">{counts.total}</div>
            <div className="text-[11px] text-[var(--ui-secondary)] mt-0.5">Matched for this profile</div>
          </div>

          <div className="bg-white rounded-[16px] border border-[var(--ui-sage-soft)] bg-[var(--ui-info-soft)]/20 p-4 shadow-2xs">
            <div className="text-[10px] font-semibold text-[var(--ui-info)] uppercase tracking-wider">
              Central Govt (National)
            </div>
            <div className="text-2xl font-black text-[var(--ui-info)] mt-1">{counts.central}</div>
            <div className="text-[11px] text-[var(--ui-info)]/80 mt-0.5">MSME Ministry &amp; DPIIT</div>
          </div>

          <div className="bg-white rounded-[16px] border border-amber-100 bg-amber-50/20 p-4 shadow-2xs">
            <div className="text-[10px] font-semibold text-amber-800 uppercase tracking-wider">
              State Specific (MH)
            </div>
            <div className="text-2xl font-black text-amber-900 mt-1">{counts.state}</div>
            <div className="text-[11px] text-amber-800/80 mt-0.5">Maharashtra MCED &amp; PSI</div>
          </div>

          <div className="bg-white rounded-[16px] border border-[var(--ui-sage-soft)] bg-[var(--ui-sage-faint)]/20 p-4 shadow-2xs">
            <div className="text-[10px] font-semibold text-[var(--ui-sage)] uppercase tracking-wider">
              Cross-sector support
            </div>
            <div className="text-2xl font-black text-[var(--ui-sage)] mt-1">{counts.universal}</div>
            <div className="text-[11px] text-[var(--ui-sage)]/80 mt-0.5">Open to all industries</div>
          </div>

          <div className="bg-white rounded-[16px] border border-[var(--ui-sage-soft)] bg-[var(--ui-sage-faint)]/20 p-4 shadow-2xs col-span-2 md:col-span-1">
            <div className="text-[10px] font-semibold text-[var(--ui-sage)] uppercase tracking-wider">
              Targeted Sectoral
            </div>
            <div className="text-2xl font-black text-[var(--ui-sage)] mt-1">{counts.targeted}</div>
            <div className="text-[11px] text-[var(--ui-sage)]/80 mt-0.5">Strict activity match</div>
          </div>
        </div>

        {/* Filter Controls (Both Levels + Benefit Type + Search) */}
        <div className="bg-white rounded-[16px] border border-[var(--ui-border)] p-5 shadow-2xs space-y-4">
          {/* Level 1: Jurisdiction Level Filter */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--ui-inset)] pb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--ui-text)]">
                Level 1: Jurisdiction
              </span>
              <span className="text-[11px] text-[var(--ui-secondary)]">(National vs State Portals)</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setJurisdictionFilter("ALL")}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  jurisdictionFilter === "ALL"
                    ? "bg-[var(--ui-text)] text-white shadow-2xs"
                    : "bg-[var(--ui-bg)] text-[var(--ui-secondary)] border border-[var(--ui-border)] hover:bg-[var(--ui-inset)]"
                }`}
              >
                All Jurisdictions ({counts.total})
              </button>
              <button
                onClick={() => setJurisdictionFilter("CENTRAL")}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  jurisdictionFilter === "CENTRAL"
                    ? "bg-[var(--ui-text)] text-white shadow-2xs"
                    : "bg-[var(--ui-info-soft)] text-[var(--ui-info)] border border-[var(--ui-sage-soft)] hover:bg-[var(--ui-info-soft)]"
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--ui-inset)] pb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--ui-text)]">
                Level 2: Scope &amp; Applicability
              </span>
              <span className="text-[11px] text-[var(--ui-secondary)]">(Cross-sector vs sector-specific candidates)</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setScopeFilter("ALL")}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  scopeFilter === "ALL"
                    ? "bg-[var(--ui-text)] text-white shadow-2xs"
                    : "bg-[var(--ui-bg)] text-[var(--ui-secondary)] border border-[var(--ui-border)] hover:bg-[var(--ui-inset)]"
                }`}
              >
                All Scopes ({counts.total})
              </button>
              <button
                onClick={() => setScopeFilter("UNIVERSAL")}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  scopeFilter === "UNIVERSAL"
                    ? "bg-[var(--ui-sage)] text-white shadow-2xs"
                    : "bg-[var(--ui-sage-faint)] text-[var(--ui-sage)] border border-[var(--ui-sage-soft)] hover:bg-[var(--ui-sage-soft)]"
                }`}
              >
                🌐 Cross-sector support ({counts.universal})
              </button>
              <button
                onClick={() => setScopeFilter("TARGETED")}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  scopeFilter === "TARGETED"
                    ? "bg-[var(--ui-sage)] text-white shadow-2xs"
                    : "bg-[var(--ui-sage-faint)] text-[var(--ui-sage)] border border-[var(--ui-sage-soft)] hover:bg-[var(--ui-sage-soft)]"
                }`}
              >
                🎯 Sector-Specific ({counts.targeted})
              </button>
            </div>
          </div>

          {/* Search and Benefit Type Pills */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-semibold text-[var(--ui-secondary)] mr-1">Benefit Type:</span>
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
                      ? "bg-[var(--ui-text)] text-white shadow-2xs"
                      : "bg-[var(--ui-inset)] text-[var(--ui-secondary)] hover:bg-[var(--ui-border)]"
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
                  className="w-full rounded-full border border-[var(--ui-border)] bg-[var(--ui-bg)] pl-9 pr-4 py-1.5 text-xs text-[var(--ui-text)] placeholder-[var(--ui-muted)] focus:bg-white focus:border-[var(--ui-sage-soft)] focus:outline-none transition-all"
                />
                <span className="absolute left-3 top-2 text-xs text-[var(--ui-muted)]">🔍</span>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1.5 text-xs text-[var(--ui-muted)] hover:text-[var(--ui-secondary)]"
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
        <div className="flex items-center justify-between text-xs text-[var(--ui-secondary)] px-1">
          <div>
            Showing <span className="font-bold text-[var(--ui-text)]">{filteredSchemes.length}</span> of{" "}
            <span className="font-bold text-[var(--ui-text)]">{counts.total}</span> scheme and support areas for{" "}
            <span className="font-bold text-[var(--ui-text)]">{businessDisplayName}</span>
          </div>
          {(jurisdictionFilter !== "ALL" || scopeFilter !== "ALL" || benefitTypeFilter !== "ALL" || searchQuery) && (
            <button
              onClick={() => {
                setJurisdictionFilter("ALL");
                setScopeFilter("ALL");
                setBenefitTypeFilter("ALL");
                setSearchQuery("");
              }}
              className="text-[var(--ui-info)] hover:underline font-semibold"
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
        ) : error ? null : filteredSchemes.length === 0 ? (
          <div className="bg-white rounded-[16px] border border-[var(--ui-border)] p-12 text-center shadow-2xs">
            <div className="text-4xl mb-3">🔍</div>
            <h3 className="font-sans font-bold text-lg text-[var(--ui-text)]">
              No schemes matched your current filter
            </h3>
            <p className="text-xs text-[var(--ui-secondary)] mt-2 max-w-md mx-auto leading-relaxed">
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
                className="px-4 py-2 rounded-full text-xs font-semibold bg-[var(--ui-inset)] text-[var(--ui-text)] hover:bg-[var(--ui-border)]"
              >
                Clear Filters
              </button>
              <button
                onClick={() => setViewMasterCatalog(true)}
                className="px-4 py-2 rounded-full text-xs font-semibold bg-[var(--ui-text)] text-white hover:bg-[var(--ui-text)]"
              >
                Browse scheme catalogue
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSchemes.map((sc) => {
              const isMH = sc.is_state_specific || sc.jurisdiction_code === "MH" || sc.jurisdiction?.includes("Maharashtra");
              const isUniversal = Boolean(sc.is_universal);
              const sectorCategory = (sc as any).sector_category;
              const actionUrl = sanitizeExternalUrl(sc.action_url);

              return (
                <div
                  key={sc.id || sc.scheme_code}
                  className="bg-white rounded-[16px] border border-[var(--ui-border)] p-6 shadow-2xs hover:border-[var(--ui-border-strong)] hover:shadow-sm transition-all flex flex-col justify-between space-y-4 relative"
                >
                  <div className="space-y-3.5">
                    {/* Top Badges */}
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <span className="font-mono text-[10px] font-semibold text-[var(--ui-text)] bg-[var(--ui-inset)] border border-[var(--ui-border)] px-2.5 py-0.5 rounded-full">
                        {sc.scheme_code || sc.id}
                      </span>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {/* Scope badge */}
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                            isUniversal
                              ? "bg-[var(--ui-sage-faint)] text-[var(--ui-sage)] border-[var(--ui-sage-soft)]"
                              : "bg-[var(--ui-sage-faint)] text-[var(--ui-sage)] border-[var(--ui-sage-soft)]"
                          }`}
                        >
                          {isUniversal ? "🌐 Across sectors" : `🎯 ${sectorCategory || "Sector-Specific"}`}
                        </span>

                        {/* Jurisdiction Badge */}
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase border ${
                            isMH
                              ? "bg-amber-50 text-amber-800 border-amber-300"
                              : "bg-[var(--ui-info-soft)] text-[var(--ui-info)] border-[var(--ui-sage-soft)]"
                          }`}
                        >
                          {isMH ? "🏛️ Maharashtra" : "🇮🇳 Central"}
                        </span>
                      </div>
                    </div>

                    {/* Scheme Title */}
                    <h3 className="font-sans text-base text-[var(--ui-text)] font-bold leading-snug">
                      {sc.title}
                    </h3>
                    <p className="text-xs font-semibold text-[var(--ui-secondary)]">{schemeClassification(sc.eligibility_status, sc.result_origin)}</p>

                    {/* Authority */}
                    <div className="text-xs text-[var(--ui-sage)] font-semibold flex items-center gap-1.5">
                      <span>🏛️</span>
                      <span className="line-clamp-1">{sc.authority}</span>
                    </div>

                    {/* Benefit Box */}
                    <div className="bg-[var(--ui-bg)] rounded-[12px] p-3 border border-[var(--ui-border)] space-y-1.5">
                      <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-[var(--ui-secondary)]">
                        <span>Benefit Offering</span>
                        <span className="text-[var(--ui-sage)] bg-[var(--ui-sage-faint)] px-2 py-0.5 rounded border border-[var(--ui-sage-soft)]">
                          {(sc.benefit_type || "INCENTIVE").replace(/_/g, " ")}
                        </span>
                      </div>
                      <p className="text-xs text-[var(--ui-secondary)] leading-relaxed font-medium">
                        {sc.benefit_summary}
                      </p>
                    </div>

                    {/* Relevance Rationale Box */}
                    {sc.relevance_rationale && (
                      <div
                        className={`rounded-[12px] p-3 text-[11px] leading-relaxed border ${
                          isUniversal
                            ? "bg-[var(--ui-sage-faint)]/70 border-[var(--ui-sage-soft)]/80 text-[var(--ui-sage)]"
                            : "bg-[var(--ui-sage-faint)]/70 border-[var(--ui-sage-soft)]/80 text-[var(--ui-sage)]"
                        }`}
                      >
                        <div className="font-semibold flex items-center gap-1.5 mb-1">
                          <span>{isUniversal ? "🌐" : "🎯"}</span>
                          <span>Why this was considered:</span>
                        </div>
                        <p className="line-clamp-2">{sc.relevance_rationale}</p>
                      </div>
                    )}

                    <Disclosure title="Eligibility & source evidence">
                    {sc.relevance_rationale && <p className="text-sm mb-3">{sc.relevance_rationale}</p>}
                    {sc.matched_facts?.length ? <p className="text-xs mb-3">Matched profile facts: {sc.matched_facts.map(fact => fact.replaceAll('_', ' ')).join(', ')}</p> : null}
                    </Disclosure>
                    <SourceProvenance source={sc.source} evidence={sc.evidence} />
                  </div>

                  {/* Footer Info & Actions */}
                  <div className="pt-4 border-t border-[var(--ui-border)] space-y-2.5">
                    <div className="flex items-center justify-between text-[10px] text-[var(--ui-secondary)]">
                      <span>{sc.result_origin === "LLM_FALLBACK_RESULT" ? "Support area to explore" : `Source checked: ${sc.last_verified_at || "Date not recorded"}`}</span>
                      <span className="font-semibold text-[var(--ui-info)] bg-[var(--ui-info-soft)] px-2 py-0.5 rounded border border-[var(--ui-sage-soft)]">
                        {sc.result_origin === "LLM_FALLBACK_RESULT" ? "Suggested" : sc.version || (sc.version_number ? `v${sc.version_number}` : "")}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-1">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleOpenVersionHistory(sc.scheme_code || sc.id)}
                          className="text-[11px] font-semibold text-[var(--ui-secondary)] hover:text-[var(--ui-text)] inline-flex items-center gap-1 transition-colors"
                          title="View immutable version audit trail and SHA-256 fingerprint"
                        >
                          <span>📜</span>
                          <span>History</span>
                        </button>
                        {canManageSources && <button
                          onClick={() => handleOpenEditScheme(sc)}
                          className="text-[11px] font-semibold text-[var(--ui-sage)] hover:text-[var(--ui-sage)] inline-flex items-center gap-1 transition-colors"
                          title="Review and publish a scheme record revision"
                        >
                          <span>✏️</span>
                          <span>Edit record</span>
                        </button>}
                      </div>

                      {actionUrl && (
                        <a
                          href={actionUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-bold text-[var(--ui-info)] hover:text-[var(--ui-info)] transition-colors"
                        >
                          <span>Application information</span>
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
          <Overlay open onClose={() => setEditSchemeModalOpen(false)} title="Review scheme update">
            <div className="bg-white rounded-[20px] max-w-xl w-full p-6 sm:p-8 shadow-xl space-y-5">
              <div className="flex items-start justify-between border-b border-[var(--ui-border)] pb-3.5">
                <div>
                  <div className="text-[10px] uppercase font-bold tracking-wider text-[var(--ui-sage)] bg-[var(--ui-sage-faint)] px-2.5 py-0.5 rounded-full inline-block mb-1 border border-[var(--ui-sage-soft)]">
                    Dynamic Scheme Management &amp; Gazette Revision
                  </div>
                  <h2 className="text-lg font-bold text-[var(--ui-text)]">
                    Simulate Official Policy Revision ({schemeToEdit.scheme_code})
                  </h2>
                </div>
                <button
                  onClick={() => setEditSchemeModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-[var(--ui-inset)] text-[var(--ui-secondary)] hover:bg-[var(--ui-border)] flex items-center justify-center font-bold"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handlePublishSchemeUpdate} className="space-y-4">
                <div className="text-xs text-[var(--ui-secondary)] bg-[var(--ui-bg)] p-3 rounded-[12px] border border-[var(--ui-border)]">
                  This demonstrates that scheme records are <strong>fully dynamic and database-driven</strong>. Modifying
                  benefit parameters will calculate a new SHA-256 content hash, compute a field-by-field diff against the
                  previous immutable version, and bump the version number.
                </div>

                <div>
                  <label className="text-xs font-semibold text-[var(--ui-text)] block mb-1">
                    Scheme Title:
                  </label>
                  <input
                    type="text"
                    defaultValue={schemeToEdit.title}
                    disabled
                    className="w-full text-xs rounded-lg border border-[var(--ui-border)] bg-[var(--ui-inset)] p-2.5 text-[var(--ui-secondary)]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[var(--ui-text)] block mb-1">
                    Benefit Summary &amp; Subsidy Terms:
                  </label>
                  <textarea
                    rows={3}
                    value={editBenefitSummary}
                    onChange={(e) => setEditBenefitSummary(e.target.value)}
                    required
                    className="w-full text-xs rounded-lg border border-[var(--ui-border-strong)] p-2.5 text-[var(--ui-text)] focus:outline-none focus:border-[var(--ui-sage-soft)]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[var(--ui-text)] block mb-1">
                    Subsidy Rate Percentage (%):
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="e.g. 35.0"
                    value={editRatePercent}
                    onChange={(e) => setEditRatePercent(e.target.value)}
                    className="w-full text-xs rounded-lg border border-[var(--ui-border-strong)] p-2.5 text-[var(--ui-text)] focus:outline-none focus:border-[var(--ui-sage-soft)]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[var(--ui-text)] block mb-1">
                    Gazette Revision Note / Justification:
                  </label>
                  <input
                    type="text"
                    value={editChangeReason}
                    onChange={(e) => setEditChangeReason(e.target.value)}
                    required
                    className="w-full text-xs rounded-lg border border-[var(--ui-border-strong)] p-2.5 text-[var(--ui-text)] focus:outline-none focus:border-[var(--ui-sage-soft)]"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--ui-border)]">
                  <button
                    type="button"
                    onClick={() => setEditSchemeModalOpen(false)}
                    className="px-4 py-2 rounded-full text-xs font-semibold text-[var(--ui-secondary)] hover:bg-[var(--ui-inset)]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updatingScheme}
                    className="px-5 py-2 rounded-full text-xs font-semibold text-white bg-[var(--ui-sage)] hover:bg-[var(--ui-sage)] transition-colors disabled:opacity-60"
                  >
                    {updatingScheme ? "Publishing New Version..." : "Publish Updated Version"}
                  </button>
                </div>
              </form>
            </div>
          </Overlay>
        )}

        {/* Version Provenance & Diff Modal */}
        {selectedSchemeForHistory && (
          <Overlay open onClose={() => setSelectedSchemeForHistory(null)} title="Scheme version history">
            <div className="bg-white rounded-[20px] max-w-2xl w-full p-6 sm:p-8 shadow-xl max-h-[85vh] overflow-y-auto space-y-6">
              <div className="flex items-start justify-between border-b border-[var(--ui-border)] pb-4">
                <div>
                  <div className="text-[10px] uppercase font-bold tracking-wider text-[var(--ui-info)] bg-[var(--ui-info-soft)] px-2.5 py-0.5 rounded-full inline-block mb-1 border border-[var(--ui-sage-soft)]">
                    Immutable Version Audit Trail
                  </div>
                  <h2 className="text-lg font-bold text-[var(--ui-text)]">
                    {selectedSchemeForHistory} — Version History
                  </h2>
                </div>
                <button
                  onClick={() => setSelectedSchemeForHistory(null)}
                  className="w-8 h-8 rounded-full bg-[var(--ui-inset)] text-[var(--ui-secondary)] hover:bg-[var(--ui-border)] flex items-center justify-center font-bold"
                >
                  ✕
                </button>
              </div>

              {historyLoading ? (
                <div className="py-8 text-center text-xs text-[var(--ui-secondary)]">
                  Loading version records and cryptographic hashes...
                </div>
              ) : !historyData || historyData.versions.length === 0 ? (
                <div className="py-8 text-center text-xs text-[var(--ui-secondary)]">
                  No version history records found.
                </div>
              ) : (
                <div className="space-y-4">
                  {historyData.versions.map((v: SchemeVersionRecord) => (
                    <div
                      key={v.version_number}
                      className={`p-4 rounded-[14px] border ${
                        v.is_active
                          ? "border-[var(--ui-sage-soft)] bg-[var(--ui-sage-faint)]/20 shadow-2xs"
                          : "border-[var(--ui-border)] bg-[var(--ui-bg)] opacity-80"
                      } space-y-3`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-[var(--ui-text)]">
                            Version {v.version_number}.0
                          </span>
                          {v.is_active ? (
                            <span className="bg-[var(--ui-sage-soft)] text-[var(--ui-sage)] text-[10px] font-bold px-2 py-0.5 rounded-full border border-[var(--ui-sage-soft)]">
                              ACTIVE PUBLISHED
                            </span>
                          ) : (
                            <span className="bg-[var(--ui-inset)] text-[var(--ui-secondary)] text-[10px] font-semibold px-2 py-0.5 rounded-full">
                              ARCHIVED
                            </span>
                          )}
                        </div>

                        {canManageSources && !v.is_active && (
                          <button
                            onClick={() => handleRollback(historyData.scheme_code, v.version_number)}
                            className="text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-300 px-3 py-1 rounded-full transition-colors"
                          >
                            ↩ Rollback to v{v.version_number}
                          </button>
                        )}
                      </div>

                      <div className="text-xs text-[var(--ui-text)] font-semibold">
                        {v.title}
                      </div>

                      <p className="text-xs text-[var(--ui-secondary)] leading-relaxed">
                        {v.benefit_summary}
                      </p>

                      <div className="bg-white rounded-lg p-2.5 border border-[var(--ui-border)] text-[11px] font-mono text-[var(--ui-secondary)] space-y-1">
                        <div className="text-[10px] uppercase font-sans font-bold text-[var(--ui-secondary)]">
                          SHA-256 Content Fingerprint:
                        </div>
                        <div className="truncate text-[var(--ui-info)] font-semibold">{v.content_hash}</div>
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

                      <div className="text-[10px] text-[var(--ui-secondary)] flex items-center justify-between pt-1">
                        <span>Created: {new Date(v.created_at).toLocaleDateString()}</span>
                        <span>Source: {v.source_url}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Overlay>
        )}

        {/* Pipeline & Ingestion Status Modal */}
        {pipelineModalOpen && (
          <Overlay open onClose={() => setPipelineModalOpen(false)} title="Source registry">
            <div className="bg-white rounded-[20px] max-w-3xl w-full p-6 sm:p-8 shadow-xl max-h-[85vh] overflow-y-auto space-y-6">
              <div className="flex items-start justify-between border-b border-[var(--ui-border)] pb-4">
                <div>
                  <div className="text-[10px] uppercase font-bold tracking-wider text-[var(--ui-sage)] bg-[var(--ui-sage-faint)] px-2.5 py-0.5 rounded-full inline-block mb-1 border border-[var(--ui-sage-soft)]">
                    Live Portal Crawl &amp; Verification Audit
                  </div>
                  <h2 className="text-xl font-bold text-[var(--ui-text)]">
                    Official sources &amp; ingestion registry
                  </h2>
                </div>
                <button
                  onClick={() => setPipelineModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-[var(--ui-inset)] text-[var(--ui-secondary)] hover:bg-[var(--ui-border)] flex items-center justify-center font-bold"
                >
                  ✕
                </button>
              </div>

              {pipelineLoading ? (
                <div className="py-8 text-center text-xs text-[var(--ui-secondary)]">
                  Loading pipeline status...
                </div>
              ) : !pipelineStatus ? (
                <div className="py-8 text-center text-xs text-[var(--ui-secondary)]">
                  No pipeline status available.
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Summary Stats */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-[var(--ui-bg)] border border-[var(--ui-border)] rounded-[12px] p-3 text-center">
                      <div className="text-[10px] uppercase text-[var(--ui-secondary)] font-bold">Total Ingested Schemes</div>
                      <div className="text-2xl font-bold text-[var(--ui-text)] mt-1">{pipelineStatus.total_schemes}</div>
                    </div>
                    <div className="bg-amber-50/40 border border-amber-200 rounded-[12px] p-3 text-center">
                      <div className="text-[10px] uppercase text-amber-800 font-bold">Maharashtra Schemes</div>
                      <div className="text-2xl font-bold text-amber-900 mt-1">{pipelineStatus.maharashtra_schemes_count}</div>
                    </div>
                    <div className="bg-[var(--ui-info-soft)]/40 border border-[var(--ui-sage-soft)] rounded-[12px] p-3 text-center">
                      <div className="text-[10px] uppercase text-[var(--ui-info)] font-bold">Central Schemes</div>
                      <div className="text-2xl font-bold text-[var(--ui-info)] mt-1">{pipelineStatus.central_schemes_count}</div>
                    </div>
                  </div>

                  {/* Registered Sources */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--ui-secondary)]">
                      Authoritative Government Portals
                    </h3>
                    <div className="space-y-2">
                      {pipelineStatus.registered_sources.map((src) => (
                        <div
                          key={src.key}
                          className="p-3 rounded-[12px] border border-[var(--ui-border)] bg-[var(--ui-bg)] flex items-center justify-between text-xs"
                        >
                          <div>
                            <div className="font-bold text-[var(--ui-text)] flex items-center gap-2">
                              <span>{src.name}</span>
                              <span className="text-[10px] bg-[var(--ui-inset)] text-[var(--ui-secondary)] px-2 py-0.5 rounded font-mono font-medium">
                                {src.jurisdiction}
                              </span>
                            </div>
                            <div className="text-[11px] text-[var(--ui-secondary)] mt-0.5 font-mono">
                              Domain: {src.domain}
                            </div>
                          </div>
                          <a
                            href={src.primary_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-[var(--ui-info)] hover:underline font-semibold"
                          >
                            Visit Source ↗
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recent Snapshots & Hashes */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--ui-secondary)]">
                      Recent Cryptographic Snapshots
                    </h3>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {pipelineStatus.recent_snapshots.map((snap) => (
                        <div
                          key={snap.id}
                          className="p-3 rounded-[12px] border border-[var(--ui-border)] bg-white text-xs space-y-1.5"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-[var(--ui-text)]">{snap.source_key}</span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                snap.status === "SUCCESS"
                                  ? "bg-[var(--ui-sage-soft)] text-[var(--ui-sage)]"
                                  : "bg-[var(--ui-info-soft)] text-[var(--ui-info)]"
                              }`}
                            >
                              {snap.status} ({snap.scheme_count} schemes)
                            </span>
                          </div>
                          <div className="text-[10px] font-mono text-[var(--ui-secondary)] truncate">
                            SHA-256: {snap.content_hash}
                          </div>
                          <div className="text-[10px] text-[var(--ui-muted)]">
                            Fetched: {new Date(snap.fetched_at).toLocaleString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Overlay>
        )}
      </div>
    </AppShell>
  );
}

export default function SchemesPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[var(--ui-bg)] flex items-center justify-center text-xs text-[var(--ui-secondary)]">
          Loading government schemes pipeline...
        </div>
      }
    >
      <SchemesContent />
    </Suspense>
  );
}
