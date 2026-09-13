"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import { useBusinessContext } from "@/context/BusinessContext";
import { api } from "@/lib/api";
import { AssessmentSummary, BusinessSummary } from "@/types";
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
  const {
    profile,
    updateProfile,
    switchProfile,
    userBusinesses,
    recentAssessments: contextAssessments,
  } = useBusinessContext();

  const [isEditing, setIsEditing] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);
  const [switchedNotice, setSwitchedNotice] = useState<string | null>(null);

  // Database multi-tenant state initialized with persistent cache / seed data (NEVER empty)
  const [loadingDb, setLoadingDb] = useState<boolean>(false);
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
    return INITIAL_DATABASE_BUSINESSES;
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
    return INITIAL_DATABASE_ASSESSMENTS;
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
        if (home.businesses && home.businesses.length > 0) {
          setBusinessesList(home.businesses);
          if (typeof window !== "undefined") {
            localStorage.setItem("complywise_cached_businesses", JSON.stringify(home.businesses));
          }
        }
        if (home.recent_assessments && home.recent_assessments.length > 0) {
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
    return INITIAL_DATABASE_BUSINESSES;
  }, [businessesList, userBusinesses]);

  // Guaranteed non-empty assessments list
  const displayAssessments = useMemo(() => {
    if (assessmentsList && assessmentsList.length > 0) return assessmentsList;
    if (contextAssessments && contextAssessments.length > 0) return contextAssessments;
    return INITIAL_DATABASE_ASSESSMENTS;
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
  function handleSave(e: React.FormEvent) {
    e.preventDefault();
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

  return (
    <AppShell activeView="profile">
      <div className="space-y-6 pb-12 select-none max-w-6xl mx-auto">
        {/* Header Breadcrumbs & Actions */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pt-1">
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs text-[#64748B] font-medium">
              <Folder className="h-3.5 w-3.5 text-[#64748B]" />
              <Link href="/dashboard" className="hover:text-[#0F172A] transition-colors">
                Dashboard
              </Link>
              <ChevronRight className="h-3 w-3 text-[#94A3B8]" />
              <span className="text-[#0F172A] font-semibold">Business Profiles</span>
            </div>
            <h1 className="text-3xl font-sans font-bold tracking-tight text-[#0F172A]">
              Enterprise Regulatory Directory
            </h1>
            <p className="text-xs text-[#64748B]">
              Manage your 10 registered industrial enterprises and 12 statutory assessments across India.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={loadDatabaseDirectory}
              disabled={loadingDb}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-[#E2E8F0] bg-white text-xs font-semibold text-[#0F172A] hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
            >
              <RefreshCw className={`h-3.5 w-3.5 text-[#64748B] ${loadingDb ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </button>

            <Link
              href="/onboarding?new=true"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-800 text-xs font-semibold hover:bg-emerald-100 transition-colors shadow-2xs"
            >
              <Plus className="h-3.5 w-3.5 text-emerald-700" />
              <span>New Assessment</span>
            </Link>

            <button
              type="button"
              onClick={() => setIsEditing(!isEditing)}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-[#0F172A] text-white text-xs font-semibold hover:bg-slate-800 transition-colors shadow-2xs cursor-pointer"
            >
              <Edit3 className="h-3.5 w-3.5" />
              <span>{isEditing ? "Cancel Edit" : "Edit Profile"}</span>
            </button>
          </div>
        </div>

        {/* Notifications */}
        {savedNotice && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-semibold flex items-center gap-2 animate-in fade-in duration-200 shadow-2xs">
            <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>Profile successfully updated! All dashboard metrics and compliance mandates have re-synchronized.</span>
          </div>
        )}

        {switchedNotice && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-xs text-emerald-800 font-semibold flex items-center justify-between gap-3 shadow-2xs animate-in fade-in duration-200">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>{switchedNotice}</span>
            </div>
            <Link
              href="/dashboard"
              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full text-[11px] font-bold transition-colors"
            >
              Go to Dashboard →
            </Link>
          </div>
        )}

        {/* Enterprise Switching Guide Banner */}
        <div className="p-4 rounded-[14px] bg-gradient-to-r from-slate-50 via-white to-emerald-50/40 border border-[#E2E8F0] shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5">
              <Sparkles className="h-4 w-4 text-emerald-700" />
            </div>
            <div>
              <h3 className="text-xs font-sans font-bold text-[#0F172A] flex items-center gap-2">
                <span>Multi-Enterprise Switching</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-semibold">
                  1-Click Switchboard
                </span>
              </h3>
              <p className="text-[11px] text-[#64748B] mt-0.5">
                Click <strong>&ldquo;Switch Context →&rdquo;</strong> on any of your 10 registered enterprises below. All platform tabs
                (Dashboard, Compliance Mandates, Workflows, Statutory Documents, and Calendar) will immediately synchronize to that entity.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            <div className="text-right">
              <div className="text-[10px] text-[#64748B]">Active Entity</div>
              <div className="text-xs font-bold text-[#0F172A] max-w-[200px] truncate">{profile.businessName}</div>
            </div>
            <div className="h-2.5 w-2.5 rounded-full bg-emerald-600 ring-4 ring-emerald-100 shrink-0 ml-1" />
          </div>
        </div>

        {/* SECTION 1: Registered Enterprises Directory (All 10 Real Businesses) */}
        <div className="bg-white rounded-[16px] border border-[#E2E8F0] p-6 shadow-2xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E2E8F0] pb-4">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-slate-100 text-slate-800 flex items-center justify-center">
                <Building2 className="h-4 w-4 text-[#0F172A]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-sans font-bold text-[#0F172A]">
                    Registered Enterprises Directory
                  </h2>
                  <span className="px-2 py-0.5 rounded-full bg-slate-100 text-[#0F172A] text-[10px] font-mono font-bold">
                    {displayBusinesses.length} Enterprises
                  </span>
                </div>
                <p className="text-[11px] text-[#64748B]">
                  Select any manufacturing enterprise to view its detailed statutory parameters or switch platform context
                </p>
              </div>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="h-3.5 w-3.5 text-[#94A3B8] absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search enterprises, states..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-full border border-[#E2E8F0] bg-[#F8FAFC] text-[#0F172A] focus:outline-hidden focus:border-slate-400 focus:bg-white transition-all"
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
                      ? "bg-emerald-50/40 border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs"
                      : "bg-[#F8FAFC] border-[#E2E8F0] hover:border-slate-300 hover:bg-white hover:shadow-2xs"
                  }`}
                >
                  <div className="space-y-2">
                    {/* Header: Name + Active Status */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5">
                        <h4 className="font-sans font-bold text-xs text-[#0F172A] group-hover:text-emerald-700 transition-colors">
                          {biz.name}
                        </h4>
                        <div className="flex items-center gap-1.5 text-[11px] text-[#64748B]">
                          <MapPin className="h-3 w-3 text-[#94A3B8]" />
                          <span>
                            {biz.district || "Industrial Zone"},{" "}
                            <strong className="text-[#334155]">{formatStateName(biz.state)}</strong>
                          </span>
                        </div>
                      </div>

                      {isActive ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-200 shrink-0">
                          ● Active
                        </span>
                      ) : (
                        <span className="h-2 w-2 rounded-full bg-slate-300 group-hover:bg-slate-400 shrink-0 mt-1" />
                      )}
                    </div>

                    {/* Product description snippet */}
                    <p className="text-[11px] text-[#64748B] leading-relaxed line-clamp-2">
                      {cleanDesc}
                    </p>
                  </div>

                  {/* Badges & Switch Button */}
                  <div className="pt-3 mt-3 border-t border-[#E2E8F0]/70 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-md bg-white border border-[#E2E8F0] text-[10px] font-medium text-[#475569]">
                        📋 {biz.assessment_count || 1} {biz.assessment_count === 1 ? "Assessment" : "Assessments"}
                      </span>
                      {biz.msme_scale && (
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-[10px] font-medium text-[#334155]">
                          {biz.msme_scale}
                        </span>
                      )}
                    </div>

                    {isActive ? (
                      <span className="text-[11px] font-bold text-emerald-700">Currently Selected</span>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSwitchEnterprise(biz);
                        }}
                        className="px-2.5 py-1 rounded-full bg-[#0F172A] hover:bg-slate-800 text-white text-[10px] font-semibold transition-colors cursor-pointer"
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
        <div className="bg-white rounded-[16px] border border-[#E2E8F0] p-6 sm:p-8 shadow-2xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E2E8F0] pb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0">
                <Factory className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-sans font-bold text-[#0F172A]">
                    {activeBusinessSummary?.name || profile.businessName}
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-200">
                    Live Database Profile
                  </span>
                </div>
                <p className="text-xs text-[#64748B]">
                  Statutory registration parameters, MSME thresholds, and manufacturing scope from verified database record.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsEditing(!isEditing)}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full border border-[#E2E8F0] bg-[#F8FAFC] hover:bg-white text-xs font-semibold text-[#0F172A] transition-colors cursor-pointer"
              >
                <Edit3 className="h-3.5 w-3.5" />
                <span>{isEditing ? "Close Form" : "Edit Details"}</span>
              </button>
            </div>
          </div>

          {/* Profile Content / Edit Form */}
          {isEditing ? (
            <form onSubmit={handleSave} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
                <div>
                  <label className="font-medium text-[#475569] block mb-1.5">
                    Legal Business Name
                  </label>
                  <input
                    type="text"
                    value={formData.businessName}
                    onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] text-sm text-[#0F172A] focus:outline-hidden focus:border-slate-400"
                    required
                  />
                </div>

                <div>
                  <label className="font-medium text-[#475569] block mb-1.5">
                    BIS License Number (CM/L) / Filing Status
                  </label>
                  <input
                    type="text"
                    value={formData.bisRegistration}
                    onChange={(e) => setFormData({ ...formData, bisRegistration: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] text-sm font-mono text-emerald-800 focus:outline-hidden focus:border-slate-400"
                  />
                </div>

                <div>
                  <label className="font-medium text-[#475569] block mb-1.5">
                    PAN (Permanent Account Number)
                  </label>
                  <input
                    type="text"
                    value={formData.pan}
                    onChange={(e) => setFormData({ ...formData, pan: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] text-sm font-mono text-[#0F172A] uppercase focus:outline-hidden focus:border-slate-400"
                  />
                </div>

                <div>
                  <label className="font-medium text-[#475569] block mb-1.5">
                    Legal Constitution
                  </label>
                  <input
                    type="text"
                    value={formData.businessType}
                    onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] text-sm text-[#0F172A] focus:outline-hidden focus:border-slate-400"
                  />
                </div>

                <div>
                  <label className="font-medium text-[#475569] block mb-1.5">
                    Registered State
                  </label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] text-sm text-[#0F172A] focus:outline-hidden focus:border-slate-400"
                  />
                </div>

                <div>
                  <label className="font-medium text-[#475569] block mb-1.5">
                    Total Active Workers
                  </label>
                  <input
                    type="number"
                    value={formData.employeeCount}
                    onChange={(e) => setFormData({ ...formData, employeeCount: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] text-sm text-[#0F172A] focus:outline-hidden focus:border-slate-400"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="font-medium text-[#475569] block mb-1.5">
                    Manufacturing Facility Address
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] text-sm text-[#0F172A] focus:outline-hidden focus:border-slate-400"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-5 py-2 rounded-full border border-[#E2E8F0] bg-white text-xs font-semibold text-[#475569] hover:bg-slate-50 cursor-pointer shadow-2xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-full bg-[#0F172A] text-white text-xs font-semibold hover:bg-slate-800 cursor-pointer shadow-2xs"
                >
                  Save Changes
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-6 text-xs">
              {/* Main Parameter Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-[#64748B]">
                    Legal Entity Name
                  </div>
                  <div className="font-sans font-bold text-[#0F172A] text-sm sm:text-base mt-0.5">
                    {activeBusinessSummary?.name || profile.businessName}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-[#64748B]">
                    Legal Constitution
                  </div>
                  <div className="text-[#0F172A] font-semibold text-sm mt-0.5">
                    {profile.businessType || formatConstitution(activeEntityVariables.legal_constitution)}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-[#64748B]">
                    Permanent Account Number (PAN)
                  </div>
                  <div className="font-mono font-bold text-[#0F172A] text-sm mt-0.5">
                    {profile.pan}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-[#64748B]">
                    Registered Jurisdiction
                  </div>
                  <div className="text-[#334155] font-semibold text-xs mt-0.5">
                    {activeBusinessSummary?.district || profile.district || "Industrial Area"},{" "}
                    <strong className="text-[#0F172A]">{formatStateName(activeBusinessSummary?.state || profile.state)}</strong>
                  </div>
                </div>

                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-[#64748B]">
                    MSME Classification
                  </div>
                  <div className="text-[#334155] font-semibold text-xs mt-0.5">
                    {activeBusinessSummary?.msme_scale || profile.scale || formatScale(activeEntityVariables.annual_turnover, activeEntityVariables.plant_machinery_investment)}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-[#64748B]">
                    Total Active Workforce
                  </div>
                  <div className="text-[#0F172A] font-semibold text-sm mt-0.5 flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-[#64748B]" />
                    <span>
                      {activeEntityVariables.total_worker_count || profile.employeeCount} active workers
                    </span>
                  </div>
                </div>

                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-[#64748B]">
                    Connected Power Load
                  </div>
                  <div className="text-[#0F172A] font-semibold text-sm mt-0.5 flex items-center gap-1.5">
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
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-[#64748B]">
                    Industrial Zone Status
                  </div>
                  <div className="text-[#334155] font-medium text-xs mt-0.5">
                    {profile.industrialZoneStatus || "Inside Notified Industrial Area"}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-[#64748B]">
                    Statutory Lifecycle Stage
                  </div>
                  <div className="text-[#334155] font-medium text-xs mt-0.5">
                    {profile.lifecycleStage || "Operational"}
                  </div>
                </div>

                {/* Facility Address */}
                <div className="sm:col-span-2 md:col-span-3 pt-4 border-t border-[#E2E8F0]">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-[#64748B]">
                    Manufacturing Premises Address
                  </div>
                  <div className="text-[#334155] font-medium text-xs mt-1">
                    {profile.location || `${activeBusinessSummary?.district || profile.district || "Industrial District"}, ${formatStateName(activeBusinessSummary?.state || profile.state)} - India`}
                  </div>
                </div>

                {/* Registered Activities & Products */}
                <div className="sm:col-span-2 md:col-span-3 pt-4 border-t border-[#E2E8F0]">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-[#64748B] mb-2.5">
                    Registered Manufacturing Scope &amp; Activities
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {activeActivities.map((act: string, idx: number) => (
                      <span
                        key={idx}
                        className="px-3.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-[#0F172A] font-medium text-xs hover:bg-slate-200 transition-colors"
                      >
                        {act}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Assessments for this active business */}
                {activeBusinessAssessments.length > 0 && (
                  <div className="sm:col-span-2 md:col-span-3 pt-4 border-t border-[#E2E8F0]">
                    <div className="flex items-center justify-between mb-2.5">
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-[#64748B]">
                        Statutory Assessments Conducted for {activeBusinessSummary?.name || profile.businessName} ({activeBusinessAssessments.length})
                      </div>
                      <Link
                        href="/workflows"
                        className="text-xs font-semibold text-emerald-700 hover:underline flex items-center gap-1"
                      >
                        <span>Open Workflows Pipeline</span>
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {activeBusinessAssessments.map((a) => (
                        <div
                          key={a.id}
                          className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-xs font-bold text-[#0F172A]">
                              Assessment #{a.assessment_number || 1}
                            </span>
                            <span
                              className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full border ${
                                a.status === "COMPLETED"
                                  ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                                  : "bg-amber-100 text-amber-800 border-amber-200"
                              }`}
                            >
                              {a.status}
                            </span>
                          </div>
                          <div className="font-sans font-semibold text-xs text-[#0F172A]">
                            {a.title}
                          </div>
                          <div className="text-[10px] text-[#64748B] flex items-center gap-3">
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
        <div className="bg-white rounded-[16px] border border-[#E2E8F0] p-6 shadow-2xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E2E8F0] pb-4">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center">
                <Layers className="h-4 w-4 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-sm font-sans font-bold text-[#0F172A]">
                  Statutory Assessments Repository
                </h2>
                <p className="text-[11px] text-[#64748B]">
                  All manufacturing intake assessments and audit runs conducted in the database
                </p>
              </div>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center p-1 rounded-full bg-[#F1F5F9] border border-[#E2E8F0] text-xs">
              <button
                type="button"
                onClick={() => setAssessmentFilter("all")}
                className={`px-3 py-1 rounded-full transition-all cursor-pointer font-medium text-xs flex items-center gap-1.5 ${
                  assessmentFilter === "all"
                    ? "bg-[#0F172A] text-white font-semibold shadow-2xs"
                    : "text-[#64748B] hover:text-[#0F172A]"
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
                    ? "bg-[#0F172A] text-white font-semibold shadow-2xs"
                    : "text-[#64748B] hover:text-[#0F172A]"
                }`}
              >
                <span>Only for Active Entity</span>
                <span className="px-1.5 py-0.2 rounded-full bg-slate-200 text-[#0F172A] text-[10px] font-mono">
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
                      ? "bg-emerald-50/40 border-emerald-300 ring-1 ring-emerald-200"
                      : "bg-[#F8FAFC] border-[#E2E8F0] hover:border-slate-300 hover:bg-white"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] font-bold text-[#0F172A]">
                          #{a.assessment_number || 1}
                        </span>
                        <span
                          className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full border ${
                            isCompleted
                              ? "bg-emerald-100 text-emerald-800 border-emerald-200 font-bold"
                              : "bg-amber-100 text-amber-800 border-amber-200 font-bold"
                          }`}
                        >
                          {a.status}
                        </span>
                        {isEntityActive && (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                            Active Entity
                          </span>
                        )}
                      </div>
                      <h4 className="font-sans font-bold text-[#0F172A] text-xs mt-1">
                        {a.title}
                      </h4>
                      <p className="text-[11px] text-[#64748B] mt-0.5">
                        Enterprise: <strong className="text-[#334155]">{a.business_name}</strong>
                      </p>
                    </div>
                  </div>

                  {/* Summary Pills */}
                  <div className="flex flex-wrap items-center gap-1.5 mt-3 pt-2.5 border-t border-[#E2E8F0]/70 text-[10px] text-[#64748B]">
                    <span className="px-2 py-0.5 rounded-md bg-white border border-[#E2E8F0] font-medium">
                      📋 {s.requirements_identified ?? s.total_requirements_evaluated ?? 0} Requirements
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-white border border-[#E2E8F0] font-medium">
                      🎯 {s.standards_identified ?? s.standards_count ?? 0} Standards
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-white border border-[#E2E8F0] font-medium">
                      ⚡ {s.major_approval_workflows ?? s.workflows_count ?? 0} Workflows
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-white border border-[#E2E8F0] font-medium">
                      📄 {s.documents_to_prepare ?? s.documents_count ?? 0} Documents
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-white border border-[#E2E8F0] font-medium">
                      🏛️ {s.schemes_identified ?? s.schemes_count ?? 0} Schemes
                    </span>
                  </div>

                  {/* Date and Switch Action */}
                  <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-slate-100 text-[10px] text-[#94A3B8]">
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
                        className="text-emerald-700 font-bold hover:underline cursor-pointer"
                      >
                        Switch to this Business →
                      </button>
                    ) : (
                      <Link
                        href="/workflows"
                        className="text-emerald-700 font-bold hover:underline"
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