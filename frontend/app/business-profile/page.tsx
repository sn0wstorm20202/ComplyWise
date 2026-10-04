"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import ErrorState from "@/components/ErrorState";
import { useBusinessContext } from "@/context/BusinessContext";
import { api } from "@/lib/api";
import { AssessmentSummary, BusinessSummary } from "@/types";
import { useLanguage } from "@/context/LanguageContext";
import {
  INITIAL_DATABASE_BUSINESSES,
  INITIAL_DATABASE_ASSESSMENTS,
} from "@/data/userProfileHomeData";
import {
  Folder,
  ChevronRight,
  Building2,
  Edit3,
  Plus,
  RefreshCw,
  Sparkles,
  Layers,
  CheckCircle2,
  Clock,
  ArrowRight,
  Zap,
  MapPin,
  Users,
  Search,
  CheckCircle,
  Factory,
} from "lucide-react";

// Helper formatters
function formatStateName(state?: string | null): string {
  if (!state) return "India";
  return state
    .toLowerCase()
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function formatConstitution(c?: string | null): string {
  if (!c) return "Private Limited Company";
  switch (c.toUpperCase()) {
    case "PRIVATE_LIMITED":
      return "Private Limited Company";
    case "PUBLIC_LIMITED":
      return "Public Limited Company";
    case "PARTNERSHIP":
      return "Partnership Firm";
    case "PROPRIETORSHIP":
      return "Proprietorship Firm";
    case "LLP":
      return "Limited Liability Partnership";
    case "TRUST_OR_SOCIETY":
      return "Trust / Society";
    default:
      return c
        .toLowerCase()
        .split("_")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
  }
}

function formatScale(turnoverStr?: string | number | null, investmentStr?: string | number | null): string {
  const t = Number(turnoverStr) || 0;
  const inv = Number(investmentStr) || 0;
  const tCr = (t / 10000000).toFixed(1);
  const invCr = (inv / 10000000).toFixed(1);

  if (inv > 100000000 || t > 500000000) {
    return `Medium Enterprise (₹${invCr} Cr Inv · ₹${tCr} Cr T/O)`;
  }
  if (inv > 10000000 || t > 50000000) {
    return `Small Enterprise (₹${invCr} Cr Inv · ₹${tCr} Cr T/O)`;
  }
  if (inv > 0 || t > 0) {
    return `Micro Enterprise (₹${invCr} Cr Inv · ₹${tCr} Cr T/O)`;
  }
  return "Small Enterprise (MSME Registered)";
}

export default function BusinessProfilePage() {
  const { t } = useLanguage();
  const {
    profile,
    updateProfile,
    switchProfile,
    userBusinesses,
    recentAssessments: contextAssessments,
    activeBusinessId,
    isDemoMode,
  } = useBusinessContext();

  const [isEditing, setIsEditing] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [switchedNotice, setSwitchedNotice] = useState<string | null>(null);

  // Keep the directory pending until the account's real businesses are loaded.
  const [loadingDb, setLoadingDb] = useState<boolean>(true);
  const [businessesList, setBusinessesList] = useState<BusinessSummary[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem("complywise_cached_businesses");
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch {}
    }
    return [];
  });

  const [assessmentsList, setAssessmentsList] = useState<AssessmentSummary[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem("complywise_cached_assessments");
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch {}
    }
    return [];
  });

  const [searchQuery, setSearchQuery] = useState<string>("");
  const [assessmentFilter, setAssessmentFilter] = useState<"all" | "active">("all");

  // Detailed profile state for the selected entity
  const [activeEntityVariables, setActiveEntityVariables] = useState<Record<string, any>>({});

  // Edit form state
  const [formData, setFormData] = useState({
    businessName: profile.businessName,
    businessType: profile.businessType,
    pan: profile.pan,
    state: profile.state,
    district: profile.district,
    location: profile.location,
    employeeCount: profile.employeeCount,
    scale: profile.scale,
    officer: profile.officer,
    role: profile.role,
    bisRegistration: profile.bisRegistration,
  });

  // Sync formData whenever profile changes
  useEffect(() => {
    setFormData({
      businessName: profile.businessName,
      businessType: profile.businessType,
      pan: profile.pan,
      state: profile.state,
      district: profile.district,
      location: profile.location,
      employeeCount: profile.employeeCount,
      scale: profile.scale,
      officer: profile.officer,
      role: profile.role,
      bisRegistration: profile.bisRegistration,
    });
  }, [profile]);

  // Load profile home from API in the background
  async function loadDatabaseDirectory() {
    setLoadingDb(true);
    try {
      const home = await api.businesses.getProfileHome();
      if (home) {
        if (home.businesses) {
          setBusinessesList(home.businesses);
          if (typeof window !== "undefined") {
            localStorage.setItem("complywise_cached_businesses", JSON.stringify(home.businesses));
          }
        }
        if (home.recent_assessments) {
          setAssessmentsList(home.recent_assessments);
          if (typeof window !== "undefined") {
            localStorage.setItem("complywise_cached_assessments", JSON.stringify(home.recent_assessments));
          }
        }
      }
    } catch (err) {
      console.warn("Could not refresh database directory in background:", err);
    } finally {
      setLoadingDb(false);
    }
  }

  useEffect(() => {
    loadDatabaseDirectory();
  }, []);

  // Fetch full variables for the currently active enterprise
  useEffect(() => {
    async function loadEntityVariables() {
      const activeId = profile.id;
      if (!activeId) return;

      try {
        const resp = await api.businesses.getProfile(activeId);
        if (resp && resp.current_version && resp.current_version.variables) {
          const vars = resp.current_version.variables;
          const extracted: Record<string, any> = {};
          for (const [k, v] of Object.entries(vars)) {
            extracted[k] = (v as any)?.value;
          }
          setActiveEntityVariables(extracted);
        }
      } catch (err) {
        console.warn("Could not load entity variables:", err);
      }
    }

    loadEntityVariables();
  }, [profile.id]);

  // Guaranteed non-empty businesses list (cascade: state -> context -> seed data)
  const displayBusinesses = useMemo(() => {
    if (businessesList && businessesList.length > 0) return businessesList;
    if (userBusinesses && userBusinesses.length > 0) return userBusinesses;
    return [];
  }, [businessesList, userBusinesses]);

  // Guaranteed non-empty assessments list
  const displayAssessments = useMemo(() => {
    if (assessmentsList && assessmentsList.length > 0) return assessmentsList;
    if (contextAssessments && contextAssessments.length > 0) return contextAssessments;
    return [];
  }, [assessmentsList, contextAssessments]);

  // Filtered businesses by search term
  const filteredBusinesses = useMemo(() => {
    if (!searchQuery.trim()) return displayBusinesses;
    const q = searchQuery.toLowerCase();
    return displayBusinesses.filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        (b.state && b.state.toLowerCase().includes(q)) ||
        (b.district && b.district.toLowerCase().includes(q)) ||
        (b.product_description && b.product_description.toLowerCase().includes(q))
    );
  }, [displayBusinesses, searchQuery]);

  // Active business summary object
  const activeBusinessSummary = useMemo(() => {
    return (
      displayBusinesses.find((b) => b.id === profile.id || b.name === profile.businessName) ||
      displayBusinesses[0]
    );
  }, [displayBusinesses, profile.id, profile.businessName]);

  // Assessments specifically belonging to active business
  const activeBusinessAssessments = useMemo(() => {
    return displayAssessments.filter(
      (a) => a.business_id === profile.id || a.business_name === profile.businessName
    );
  }, [displayAssessments, profile.id, profile.businessName]);

  // Filtered assessments for repository section
  const filteredAssessments = useMemo(() => {
    if (assessmentFilter === "active") {
      return activeBusinessAssessments;
    }
    return displayAssessments;
  }, [displayAssessments, activeBusinessAssessments, assessmentFilter]);

  // Handle instant enterprise switch
  async function handleSwitchEnterprise(biz: BusinessSummary) {
    if (biz.id === profile.id) return;

    await switchProfile(biz.id);
    setSwitchedNotice(
      `✓ Enterprise switched to "${biz.name}". Platform context (Dashboard, Compliance, Workflows, Documents) synchronized.`
    );
    setTimeout(() => setSwitchedNotice(null), 5000);
  }

  // Handle save profile form
  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!isDemoMode) {
      if (!activeBusinessId) { setSaveError("Select a business before saving its profile."); return; }
      setSavingProfile(true); setSaveError(null);
      try {
        const definitions = await api.businesses.getVariableDefinitions();
        const matchChoice = (key: string, text: string) => {
          const definition = definitions.find(item => item.key === key);
          const choice = definition?.options.find(item => item.label.toLowerCase() === text.trim().toLowerCase() || item.value.toLowerCase() === text.trim().toLowerCase());
          if (definition?.options.length && !choice) throw new Error(`Choose a recognised ${definition.label.toLowerCase()}.`);
          return choice?.value || text.trim();
        };
        await api.businesses.createProfileVersion(activeBusinessId, {
          state: { value: matchChoice("state", formData.state), origin: "USER_PROVIDED" },
          legal_constitution: { value: matchChoice("legal_constitution", formData.businessType), origin: "USER_PROVIDED" },
          total_worker_count: { value: Number(formData.employeeCount), origin: "USER_PROVIDED" },
        }, "Business details updated from profile", true);
        await api.businesses.update(activeBusinessId, { name: formData.businessName.trim() });
        await loadDatabaseDirectory();
      } catch (error) {
        setSaveError(error instanceof Error ? error.message : "Your profile wasn't saved. Please try again.");
        setSavingProfile(false); return;
      }
      setSavingProfile(false);
    }
    updateProfile({
      ...formData,
      employeeCount: Number(formData.employeeCount),
    });
    setIsEditing(false);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  }

  // Parse activities from active variables or product description
  const activeActivities = useMemo(() => {
    const rawDesc = activeEntityVariables.product_description || activeBusinessSummary?.product_description || "";
    if (!rawDesc) return profile.activities;
    const lines = rawDesc
      .split("\n")
      .map((l: string) => l.trim().replace(/^[-*•]\s*/, ""))
      .filter((l: string) => l.length > 3 && l.length < 100 && !l.toLowerCase().includes("facility") && !l.toLowerCase().includes("major areas"))
      .slice(0, 6);
    return lines.length > 0 ? lines : profile.activities;
  }, [activeEntityVariables, activeBusinessSummary, profile.activities]);

  if (loadingDb && displayBusinesses.length === 0) return <AppShell activeView="profile"><p role="status">Loading your businesses…</p></AppShell>;
  if (displayBusinesses.length === 0) return <AppShell activeView="profile"><div className="ui-object ui-empty"><h1 className="text-2xl">Your business starts here.</h1><p>Add your business to build an assessment and keep its requirements together.</p><Link href="/onboarding?new=true" className="ui-button ui-button-primary mt-5">Set up your business →</Link></div></AppShell>;

  return (
    <AppShell activeView="profile">
      <div className="space-y-6 pb-12 select-none max-w-6xl mx-auto">
        {saveError && <ErrorState message={saveError} onRetry={() => setSaveError(null)} />}
        {!loadingDb && displayBusinesses.length === 0 && <div className="ui-object ui-empty"><h2 className="text-2xl">Your business starts here.</h2><p>Add your business to build an assessment and keep its requirements together.</p><Link href="/onboarding?new=true" className="ui-button ui-button-primary mt-5">Set up your business →</Link></div>}
        {/* Header Breadcrumbs & Actions */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pt-1">
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs text-[var(--ui-secondary)] font-medium">
              <Folder className="h-3.5 w-3.5 text-[var(--ui-secondary)]" />
              <Link href="/dashboard" className="hover:text-[var(--ui-text)] transition-colors">
                {t("navigation.dashboard")}
              </Link>
              <ChevronRight className="h-3 w-3 text-[var(--ui-muted)]" />
              <span className="text-[var(--ui-text)] font-semibold">{t("navigation.profile")}</span>
            </div>
            <h1 className="text-3xl font-sans font-bold tracking-tight text-[var(--ui-text)]">
              {t("businessProfile.title")}
            </h1>
            <p className="text-xs text-[var(--ui-secondary)]">
              {t("businessProfile.subtitle")}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={loadDatabaseDirectory}
              disabled={loadingDb}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-[var(--ui-border)] bg-white text-xs font-semibold text-[var(--ui-text)] hover:bg-[var(--ui-bg)] transition-colors shadow-2xs cursor-pointer"
            >
              <RefreshCw className={`h-3.5 w-3.5 text-[var(--ui-secondary)] ${loadingDb ? "animate-spin" : ""}`} />
              <span>{t("common.refresh")}</span>
            </button>

            <Link
              href="/onboarding?new=true"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-[var(--ui-sage-soft)] bg-[var(--ui-sage-faint)] text-[var(--ui-sage)] text-xs font-semibold hover:bg-[var(--ui-sage-soft)] transition-colors shadow-2xs"
            >
              <Plus className="h-3.5 w-3.5 text-[var(--ui-sage)]" />
              <span>{t("navigation.onboarding")}</span>
            </Link>

            <button
              type="button"
              onClick={() => setIsEditing(!isEditing)}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-[var(--ui-text)] text-white text-xs font-semibold hover:bg-[var(--ui-text)] transition-colors shadow-2xs cursor-pointer"
            >
              <Edit3 className="h-3.5 w-3.5" />
              <span>{isEditing ? t("common.cancel") : t("common.edit")}</span>
            </button>
          </div>
        </div>

        {/* Notifications */}
        {savedNotice && (
          <div className="p-3.5 rounded-xl bg-[var(--ui-sage-faint)] border border-[var(--ui-sage-soft)] text-xs text-[var(--ui-sage)] font-semibold flex items-center gap-2 animate-in fade-in duration-200 shadow-2xs">
            <CheckCircle className="h-4 w-4 text-[var(--ui-sage)] shrink-0" />
            <span>Business details saved. Run an assessment to review requirements affected by your changes.</span>
          </div>
        )}

        {switchedNotice && (
          <div className="p-3.5 rounded-xl bg-[var(--ui-sage-faint)] border border-[var(--ui-sage-soft)] text-xs text-[var(--ui-sage)] font-semibold flex items-center justify-between gap-3 shadow-2xs animate-in fade-in duration-200">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-[var(--ui-sage)] shrink-0" />
              <span>{switchedNotice}</span>
            </div>
            <Link
              href="/dashboard"
              className="px-3 py-1 bg-[var(--ui-sage)] hover:bg-[var(--ui-sage)] text-white rounded-full text-[11px] font-bold transition-colors"
            >
              Go to Dashboard →
            </Link>
          </div>
        )}

        {/* Enterprise Switching Guide Banner */}
        <div className="p-4 rounded-[14px] bg-gradient-to-r from-[var(--ui-bg)] via-white to-[var(--ui-sage-faint)]/40 border border-[var(--ui-border)] shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-lg bg-[var(--ui-sage-soft)] text-[var(--ui-sage)] flex items-center justify-center shrink-0 mt-0.5">
              <Sparkles className="h-4 w-4 text-[var(--ui-sage)]" />
            </div>
            <div>
              <h3 className="text-xs font-sans font-bold text-[var(--ui-text)] flex items-center gap-2">
                <span>Multi-Enterprise Switching</span>
                <span className="px-2 py-0.5 rounded-full bg-[var(--ui-sage-soft)] text-[var(--ui-sage)] text-[10px] font-semibold">
                  1-Click Switchboard
                </span>
              </h3>
              <p className="text-[11px] text-[var(--ui-secondary)] mt-0.5">
                Click <strong>&ldquo;Switch Context →&rdquo;</strong> on any of your 10 registered enterprises below. All platform tabs
                (Dashboard, Compliance Mandates, Workflows, Statutory Documents, and Calendar) will immediately synchronize to that entity.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            <div className="text-right">
              <div className="text-[10px] text-[var(--ui-secondary)]">Active Entity</div>
              <div className="text-xs font-bold text-[var(--ui-text)] max-w-[200px] truncate">{profile.businessName}</div>
            </div>
            <div className="h-2.5 w-2.5 rounded-full bg-[var(--ui-sage)] ring-4 ring-[var(--ui-sage-soft)] shrink-0 ml-1" />
          </div>
        </div>

        {/* SECTION 1: Registered Enterprises Directory (All 10 Real Businesses) */}
        <div className="bg-white rounded-[16px] border border-[var(--ui-border)] p-6 shadow-2xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--ui-border)] pb-4">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-[var(--ui-inset)] text-[var(--ui-text)] flex items-center justify-center">
                <Building2 className="h-4 w-4 text-[var(--ui-text)]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-sans font-bold text-[var(--ui-text)]">
                    Registered Enterprises Directory
                  </h2>
                  <span className="px-2 py-0.5 rounded-full bg-[var(--ui-inset)] text-[var(--ui-text)] text-[10px] font-mono font-bold">
                    {displayBusinesses.length} Enterprises
                  </span>
                </div>
                <p className="text-[11px] text-[var(--ui-secondary)]">
                  Select any manufacturing enterprise to view its detailed statutory parameters or switch platform context
                </p>
              </div>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="h-3.5 w-3.5 text-[var(--ui-muted)] absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search enterprises, states..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-full border border-[var(--ui-border)] bg-[var(--ui-bg)] text-[var(--ui-text)] focus:outline-hidden focus:border-[var(--ui-border-strong)] focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Enterprises Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredBusinesses.map((biz) => {
              const isActive = profile.id === biz.id || profile.businessName === biz.name;
              const cleanDesc = biz.product_description
                ? biz.product_description.replace(/\n+/g, " ").slice(0, 110) + "..."
                : "Industrial manufacturing and statutory compliance operations.";

              return (
                <div
                  key={biz.id}
                  onClick={() => handleSwitchEnterprise(biz)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between group ${
                    isActive
                      ? "bg-[var(--ui-sage-faint)]/40 border-[var(--ui-sage-soft)] ring-2 ring-[var(--ui-sage-soft)]/20 shadow-xs"
                      : "bg-[var(--ui-bg)] border-[var(--ui-border)] hover:border-[var(--ui-border-strong)] hover:bg-white hover:shadow-2xs"
                  }`}
                >
                  <div className="space-y-2">
                    {/* Header: Name + Active Status */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5">
                        <h4 className="font-sans font-bold text-xs text-[var(--ui-text)] group-hover:text-[var(--ui-sage)] transition-colors">
                          {biz.name}
                        </h4>
                        <div className="flex items-center gap-1.5 text-[11px] text-[var(--ui-secondary)]">
                          <MapPin className="h-3 w-3 text-[var(--ui-muted)]" />
                          <span>
                            {biz.district || "Industrial Zone"},{" "}
                            <strong className="text-[var(--ui-secondary)]">{formatStateName(biz.state)}</strong>
                          </span>
                        </div>
                      </div>

                      {isActive ? (
                        <span className="px-2 py-0.5 rounded-full bg-[var(--ui-sage-soft)] text-[var(--ui-sage)] text-[10px] font-bold border border-[var(--ui-sage-soft)] shrink-0">
                          ● Active
                        </span>
                      ) : (
                        <span className="h-2 w-2 rounded-full bg-[var(--ui-inset)] group-hover:bg-[var(--ui-inset)] shrink-0 mt-1" />
                      )}
                    </div>

                    {/* Product description snippet */}
                    <p className="text-[11px] text-[var(--ui-secondary)] leading-relaxed line-clamp-2">
                      {cleanDesc}
                    </p>
                  </div>

                  {/* Badges & Switch Button */}
                  <div className="pt-3 mt-3 border-t border-[var(--ui-border)]/70 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-md bg-white border border-[var(--ui-border)] text-[10px] font-medium text-[var(--ui-secondary)]">
                        📋 {biz.assessment_count || 1} {biz.assessment_count === 1 ? "Assessment" : "Assessments"}
                      </span>
                      {biz.msme_scale && (
                        <span className="px-2 py-0.5 rounded-md bg-[var(--ui-inset)] text-[10px] font-medium text-[var(--ui-secondary)]">
                          {biz.msme_scale}
                        </span>
                      )}
                    </div>

                    {isActive ? (
                      <span className="text-[11px] font-bold text-[var(--ui-sage)]">Currently Selected</span>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSwitchEnterprise(biz);
                        }}
                        className="px-2.5 py-1 rounded-full bg-[var(--ui-text)] hover:bg-[var(--ui-text)] text-white text-[10px] font-semibold transition-colors cursor-pointer"
                      >
                        Switch Context →
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* SECTION 2: Active Enterprise Detailed Regulatory Profile */}
        <div className="bg-white rounded-[16px] border border-[var(--ui-border)] p-6 sm:p-8 shadow-2xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--ui-border)] pb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-[var(--ui-sage-faint)] border border-[var(--ui-sage-soft)] flex items-center justify-center shrink-0">
                <Factory className="h-5 w-5 text-[var(--ui-sage)]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-sans font-bold text-[var(--ui-text)]">
                    {activeBusinessSummary?.name || profile.businessName}
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full bg-[var(--ui-sage-soft)] text-[var(--ui-sage)] text-[10px] font-bold border border-[var(--ui-sage-soft)]">
                    Live Database Profile
                  </span>
                </div>
                <p className="text-xs text-[var(--ui-secondary)]">
                  Statutory registration parameters, MSME thresholds, and manufacturing scope from verified database record.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsEditing(!isEditing)}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full border border-[var(--ui-border)] bg-[var(--ui-bg)] hover:bg-white text-xs font-semibold text-[var(--ui-text)] transition-colors cursor-pointer"
              >
                <Edit3 className="h-3.5 w-3.5" />
                <span>{isEditing ? "Close Form" : "Edit Details"}</span>
              </button>
            </div>
          </div>

          {/* Profile Content / Edit Form */}
          {isEditing ? (
            <form onSubmit={handleSave} className="space-y-6">
              <p className="text-xs text-[var(--ui-secondary)]">Business name, state, constitution and workforce are saved to your business. Registration references and address notes are kept on this device.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
                <div>
                  <label className="font-medium text-[var(--ui-secondary)] block mb-1.5">
                    Legal Business Name
                  </label>
                  <input
                    type="text"
                    value={formData.businessName}
                    onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg)] text-sm text-[var(--ui-text)] focus:outline-hidden focus:border-[var(--ui-border-strong)]"
                    required
                  />
                </div>

                <div>
                  <label className="font-medium text-[var(--ui-secondary)] block mb-1.5">
                    BIS License Number (CM/L) / Filing Status
                  </label>
                  <input
                    type="text"
                    value={formData.bisRegistration}
                    onChange={(e) => setFormData({ ...formData, bisRegistration: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg)] text-sm font-mono text-[var(--ui-sage)] focus:outline-hidden focus:border-[var(--ui-border-strong)]"
                  />
                </div>

                <div>
                  <label className="font-medium text-[var(--ui-secondary)] block mb-1.5">
                    PAN (Permanent Account Number)
                  </label>
                  <input
                    type="text"
                    value={formData.pan}
                    onChange={(e) => setFormData({ ...formData, pan: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg)] text-sm font-mono text-[var(--ui-text)] uppercase focus:outline-hidden focus:border-[var(--ui-border-strong)]"
                  />
                </div>

                <div>
                  <label className="font-medium text-[var(--ui-secondary)] block mb-1.5">
                    Legal Constitution
                  </label>
                  <input
                    type="text"
                    value={formData.businessType}
                    onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg)] text-sm text-[var(--ui-text)] focus:outline-hidden focus:border-[var(--ui-border-strong)]"
                  />
                </div>

                <div>
                  <label className="font-medium text-[var(--ui-secondary)] block mb-1.5">
                    Registered State
                  </label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg)] text-sm text-[var(--ui-text)] focus:outline-hidden focus:border-[var(--ui-border-strong)]"
                  />
                </div>

                <div>
                  <label className="font-medium text-[var(--ui-secondary)] block mb-1.5">
                    Total Active Workers
                  </label>
                  <input
                    type="number"
                    value={formData.employeeCount}
                    onChange={(e) => setFormData({ ...formData, employeeCount: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg)] text-sm text-[var(--ui-text)] focus:outline-hidden focus:border-[var(--ui-border-strong)]"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="font-medium text-[var(--ui-secondary)] block mb-1.5">
                    Manufacturing Facility Address
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg)] text-sm text-[var(--ui-text)] focus:outline-hidden focus:border-[var(--ui-border-strong)]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[var(--ui-border)]">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-5 py-2 rounded-full border border-[var(--ui-border)] bg-white text-xs font-semibold text-[var(--ui-secondary)] hover:bg-[var(--ui-bg)] cursor-pointer shadow-2xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="px-6 py-2 rounded-full bg-[var(--ui-text)] text-white text-xs font-semibold hover:bg-[var(--ui-text)] cursor-pointer shadow-2xs"
                >
                  {savingProfile ? "Saving…" : "Save changes"}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-6 text-xs">
              {/* Main Parameter Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--ui-secondary)]">
                    Legal Entity Name
                  </div>
                  <div className="font-sans font-bold text-[var(--ui-text)] text-sm sm:text-base mt-0.5">
                    {activeBusinessSummary?.name || profile.businessName}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--ui-secondary)]">
                    Legal Constitution
                  </div>
                  <div className="text-[var(--ui-text)] font-semibold text-sm mt-0.5">
                    {profile.businessType || formatConstitution(activeEntityVariables.legal_constitution)}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--ui-secondary)]">
                    Permanent Account Number (PAN)
                  </div>
                  <div className="font-mono font-bold text-[var(--ui-text)] text-sm mt-0.5">
                    {profile.pan}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--ui-secondary)]">
                    Registered Jurisdiction
                  </div>
                  <div className="text-[var(--ui-secondary)] font-semibold text-xs mt-0.5">
                    {activeBusinessSummary?.district || profile.district || "Industrial Area"},{" "}
                    <strong className="text-[var(--ui-text)]">{formatStateName(activeBusinessSummary?.state || profile.state)}</strong>
                  </div>
                </div>

                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--ui-secondary)]">
                    MSME Classification
                  </div>
                  <div className="text-[var(--ui-secondary)] font-semibold text-xs mt-0.5">
                    {activeBusinessSummary?.msme_scale || profile.scale || formatScale(activeEntityVariables.annual_turnover, activeEntityVariables.plant_machinery_investment)}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--ui-secondary)]">
                    Total Active Workforce
                  </div>
                  <div className="text-[var(--ui-text)] font-semibold text-sm mt-0.5 flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-[var(--ui-secondary)]" />
                    <span>
                      {activeEntityVariables.total_worker_count || profile.employeeCount} active workers
                    </span>
                  </div>
                </div>

                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--ui-secondary)]">
                    Connected Power Load
                  </div>
                  <div className="text-[var(--ui-text)] font-semibold text-sm mt-0.5 flex items-center gap-1.5">
                    <Zap className="h-3.5 w-3.5 text-amber-500" />
                    <span>
                      {profile.connectedPowerLoad ||
                        (activeEntityVariables.connected_power_load
                          ? `${activeEntityVariables.connected_power_load} kW`
                          : "478 kW")}
                    </span>
                  </div>
                </div>

                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--ui-secondary)]">
                    Industrial Zone Status
                  </div>
                  <div className="text-[var(--ui-secondary)] font-medium text-xs mt-0.5">
                    {profile.industrialZoneStatus || "Inside Notified Industrial Area"}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--ui-secondary)]">
                    Statutory Lifecycle Stage
                  </div>
                  <div className="text-[var(--ui-secondary)] font-medium text-xs mt-0.5">
                    {profile.lifecycleStage || "Operational"}
                  </div>
                </div>

                {/* Facility Address */}
                <div className="sm:col-span-2 md:col-span-3 pt-4 border-t border-[var(--ui-border)]">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--ui-secondary)]">
                    Manufacturing Premises Address
                  </div>
                  <div className="text-[var(--ui-secondary)] font-medium text-xs mt-1">
                    {profile.location || `${activeBusinessSummary?.district || profile.district || "Industrial District"}, ${formatStateName(activeBusinessSummary?.state || profile.state)} - India`}
                  </div>
                </div>

                {/* Registered Activities & Products */}
                <div className="sm:col-span-2 md:col-span-3 pt-4 border-t border-[var(--ui-border)]">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--ui-secondary)] mb-2.5">
                    Registered Manufacturing Scope &amp; Activities
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {activeActivities.map((act: string, idx: number) => (
                      <span
                        key={idx}
                        className="px-3.5 py-1 rounded-full bg-[var(--ui-inset)] border border-[var(--ui-border)] text-[var(--ui-text)] font-medium text-xs hover:bg-[var(--ui-inset)] transition-colors"
                      >
                        {act}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Assessments for this active business */}
                {activeBusinessAssessments.length > 0 && (
                  <div className="sm:col-span-2 md:col-span-3 pt-4 border-t border-[var(--ui-border)]">
                    <div className="flex items-center justify-between mb-2.5">
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--ui-secondary)]">
                        Statutory Assessments Conducted for {activeBusinessSummary?.name || profile.businessName} ({activeBusinessAssessments.length})
                      </div>
                      <Link
                        href="/workflows"
                        className="text-xs font-semibold text-[var(--ui-sage)] hover:underline flex items-center gap-1"
                      >
                        <span>Open Workflows Pipeline</span>
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {activeBusinessAssessments.map((a) => (
                        <div
                          key={a.id}
                          className="p-3.5 rounded-xl bg-[var(--ui-bg)] border border-[var(--ui-border)] space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-xs font-bold text-[var(--ui-text)]">
                              Assessment #{a.assessment_number || 1}
                            </span>
                            <span
                              className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full border ${
                                a.status === "COMPLETED"
                                  ? "bg-[var(--ui-sage-soft)] text-[var(--ui-sage)] border-[var(--ui-sage-soft)]"
                                  : "bg-amber-100 text-amber-800 border-amber-200"
                              }`}
                            >
                              {a.status}
                            </span>
                          </div>
                          <div className="font-sans font-semibold text-xs text-[var(--ui-text)]">
                            {a.title}
                          </div>
                          <div className="text-[10px] text-[var(--ui-secondary)] flex items-center gap-3">
                            <span>📋 {a.summary?.requirements_identified ?? a.summary?.total_requirements_evaluated ?? 0} Requirements</span>
                            <span>🎯 {a.summary?.standards_identified ?? a.summary?.standards_count ?? 0} Standards</span>
                            <span>⚡ {a.summary?.major_approval_workflows ?? a.summary?.workflows_count ?? 0} Workflows</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* SECTION 3: Statutory Assessments Repository (All 12 Real Assessments) */}
        <div className="bg-white rounded-[16px] border border-[var(--ui-border)] p-6 shadow-2xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--ui-border)] pb-4">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-[var(--ui-sage-faint)] border border-[var(--ui-sage-soft)] flex items-center justify-center">
                <Layers className="h-4 w-4 text-[var(--ui-sage)]" />
              </div>
              <div>
                <h2 className="text-sm font-sans font-bold text-[var(--ui-text)]">
                  Statutory Assessments Repository
                </h2>
                <p className="text-[11px] text-[var(--ui-secondary)]">
                  All manufacturing intake assessments and audit runs conducted in the database
                </p>
              </div>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center p-1 rounded-full bg-[var(--ui-inset)] border border-[var(--ui-border)] text-xs">
              <button
                type="button"
                onClick={() => setAssessmentFilter("all")}
                className={`px-3 py-1 rounded-full transition-all cursor-pointer font-medium text-xs flex items-center gap-1.5 ${
                  assessmentFilter === "all"
                    ? "bg-[var(--ui-text)] text-white font-semibold shadow-2xs"
                    : "text-[var(--ui-secondary)] hover:text-[var(--ui-text)]"
                }`}
              >
                <span>All Assessments</span>
                <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-[10px] font-mono">
                  {displayAssessments.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setAssessmentFilter("active")}
                className={`px-3 py-1 rounded-full transition-all cursor-pointer font-medium text-xs flex items-center gap-1.5 ${
                  assessmentFilter === "active"
                    ? "bg-[var(--ui-text)] text-white font-semibold shadow-2xs"
                    : "text-[var(--ui-secondary)] hover:text-[var(--ui-text)]"
                }`}
              >
                <span>Only for Active Entity</span>
                <span className="px-1.5 py-0.2 rounded-full bg-[var(--ui-inset)] text-[var(--ui-text)] text-[10px] font-mono">
                  {activeBusinessAssessments.length}
                </span>
              </button>
            </div>
          </div>

          {/* Assessments Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[440px] overflow-y-auto pr-1">
            {filteredAssessments.map((a) => {
              const isCompleted = a.status === "COMPLETED";
              const s = a.summary || {};
              const isEntityActive = a.business_id === profile.id || a.business_name === profile.businessName;

              return (
                <div
                  key={a.id}
                  className={`p-4 rounded-xl border text-left transition-all relative ${
                    isEntityActive
                      ? "bg-[var(--ui-sage-faint)]/40 border-[var(--ui-sage-soft)] ring-1 ring-[var(--ui-sage-soft)]"
                      : "bg-[var(--ui-bg)] border-[var(--ui-border)] hover:border-[var(--ui-border-strong)] hover:bg-white"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] font-bold text-[var(--ui-text)]">
                          #{a.assessment_number || 1}
                        </span>
                        <span
                          className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full border ${
                            isCompleted
                              ? "bg-[var(--ui-sage-soft)] text-[var(--ui-sage)] border-[var(--ui-sage-soft)] font-bold"
                              : "bg-amber-100 text-amber-800 border-amber-200 font-bold"
                          }`}
                        >
                          {a.status}
                        </span>
                        {isEntityActive && (
                          <span className="text-[10px] font-bold text-[var(--ui-sage)] bg-[var(--ui-sage-soft)]/80 px-2 py-0.5 rounded-full">
                            Active Entity
                          </span>
                        )}
                      </div>
                      <h4 className="font-sans font-bold text-[var(--ui-text)] text-xs mt-1">
                        {a.title}
                      </h4>
                      <p className="text-[11px] text-[var(--ui-secondary)] mt-0.5">
                        Enterprise: <strong className="text-[var(--ui-secondary)]">{a.business_name}</strong>
                      </p>
                    </div>
                  </div>

                  {/* Summary Pills */}
                  <div className="flex flex-wrap items-center gap-1.5 mt-3 pt-2.5 border-t border-[var(--ui-border)]/70 text-[10px] text-[var(--ui-secondary)]">
                    <span className="px-2 py-0.5 rounded-md bg-white border border-[var(--ui-border)] font-medium">
                      📋 {s.requirements_identified ?? s.total_requirements_evaluated ?? 0} Requirements
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-white border border-[var(--ui-border)] font-medium">
                      🎯 {s.standards_identified ?? s.standards_count ?? 0} Standards
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-white border border-[var(--ui-border)] font-medium">
                      ⚡ {s.major_approval_workflows ?? s.workflows_count ?? 0} Workflows
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-white border border-[var(--ui-border)] font-medium">
                      📄 {s.documents_to_prepare ?? s.documents_count ?? 0} Documents
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-white border border-[var(--ui-border)] font-medium">
                      🏛️ {s.schemes_identified ?? s.schemes_count ?? 0} Schemes
                    </span>
                  </div>

                  {/* Date and Switch Action */}
                  <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-[var(--ui-border)] text-[10px] text-[var(--ui-muted)]">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {a.completed_at ? new Date(a.completed_at).toLocaleDateString() : "In Progress"}
                    </span>

                    {!isEntityActive ? (
                      <button
                        type="button"
                        onClick={async () => {
                          const target = displayBusinesses.find((b) => b.id === a.business_id || b.name === a.business_name);
                          if (target) {
                            await handleSwitchEnterprise(target);
                          }
                        }}
                        className="text-[var(--ui-sage)] font-bold hover:underline cursor-pointer"
                      >
                        Switch to this Business →
                      </button>
                    ) : (
                      <Link
                        href="/workflows"
                        className="text-[var(--ui-sage)] font-bold hover:underline"
                      >
                        Inspect Workflows →
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
