"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
  useCallback,
  useRef,
} from "react";
import {
  BusinessProfile,
  DEMO_PROFILES,
  DEFAULT_BUSINESS_PROFILE,
  DashboardData,
  getDashboardData,
} from "@/data/demo";
import { api } from "@/lib/api";
import { DashboardSummary, Business, BusinessSummary, AssessmentSummary } from "@/types";
import { getAuthToken } from "@/lib/api/client";
import { useAuth } from "./AuthContext";
import { INITIAL_DATABASE_BUSINESSES, INITIAL_DATABASE_ASSESSMENTS } from "@/data/userProfileHomeData";

interface BusinessContextValue {
  isLoading: boolean;
  loadError: string | null;
  profile: BusinessProfile;
  dashboardData: DashboardData;
  liveDashboardSummary: DashboardSummary | null;
  activeBusinessId: string | null;
  activeAssessmentId: string | null;
  isDemoMode: boolean;
  dataSource: "LIVE_BACKEND" | "DEMO_ADAPTER";
  availableProfiles: BusinessProfile[];
  userBusinesses: BusinessSummary[];
  recentAssessments: AssessmentSummary[];
  setProfile: (profile: BusinessProfile) => void;
  updateProfile: (partial: Partial<BusinessProfile>) => void;
  switchProfile: (profileId: string) => Promise<void>;
  setActiveAssessmentId: (assessmentId: string | null) => void;
  resetToDefault: () => void;
  refreshDashboardData: () => Promise<void>;
}

const BusinessContext = createContext<BusinessContextValue | null>(null);

const STORAGE_KEY = "complywise_business_profile_v2";

const EMPTY_PROFILE: BusinessProfile = {
  id: "", businessName: "Your business", businessType: "Not provided", pan: "Not provided",
  state: "", district: "", location: "", activities: [], employeeCount: 0,
  manufacturing: false, exports: false, hazardousMaterials: false, bisRegistration: "Not provided",
  sector: "", scale: "Not provided", officer: "", role: "", lastSync: "",
  annualTurnoverLakhs: 0, plantInvestmentLakhs: 0, industrialZoneStatus: "Not provided", lifecycleStage: "Not provided",
};

// Helper formatters for database variables
function formatStateName(state: string): string {
  if (!state) return "Location not provided";
  return state
    .toLowerCase()
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function formatConstitution(c: string): string {
  if (!c) return "Not provided";
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

function formatScale(turnoverStr: string | number, investmentStr: string | number): string {
  const t = Number(turnoverStr) || 0;
  const inv = Number(investmentStr) || 0;
  if (!t && !inv) return "Scale not provided";
  const tCr = (t / 10000000).toFixed(1);
  const invCr = (inv / 10000000).toFixed(1);

  return `₹${invCr} Cr investment · ₹${tCr} Cr turnover`;
}

function formatZoneStatus(z: string): string {
  if (!z) return "Not provided";
  switch (z.toUpperCase()) {
    case "INSIDE_NOTIFIED_INDUSTRIAL_AREA":
      return "Inside Notified Industrial Area";
    case "OUTSIDE_NOTIFIED_INDUSTRIAL_AREA":
      return "Outside Notified Industrial Area";
    case "SPECIAL_ECONOMIC_ZONE":
      return "Special Economic Zone (SEZ)";
    default:
      return z;
  }
}

function formatLifecycle(l: string): string {
  if (!l) return "Not provided";
  switch (l.toUpperCase()) {
    case "UNDER_SETUP":
      return "Under Setup";
    case "OPERATIONAL":
      return "Operational";
    case "PLANNED":
      return "Planned — Setup Pending";
    case "EXPANDING":
      return "Expanding";
    default:
      return l;
  }
}

export function BusinessProvider({ children }: { children: React.ReactNode }) {
  const { token, loading: authLoading } = useAuth();
  const [profile, setProfileState] = useState<BusinessProfile>(EMPTY_PROFILE);
  const requestVersion = useRef(0);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [liveDashboardSummary, setLiveDashboardSummary] = useState<DashboardSummary | null>(null);
  const [activeBusinessId, setActiveBusinessId] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("complywise_active_business_id");
    }
    return null;
  });
  const [activeAssessmentId, setActiveAssessmentIdState] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("complywise_active_assessment_id");
    }
    return null;
  });
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);
  const [userBusinesses, setUserBusinesses] = useState<BusinessSummary[]>(() => {
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

  const [recentAssessments, setRecentAssessments] = useState<AssessmentSummary[]>(() => {
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

  const fetchBackendData = useCallback(async (preferredBizId?: string | null) => {
    const version = ++requestVersion.current;
    const current = () => requestVersion.current === version;
    setLoadError(null);
    setLiveDashboardSummary(null);
    if (!getAuthToken()) {
      setActiveBusinessId(null); setActiveAssessmentIdState(null);
      setUserBusinesses([]); setRecentAssessments([]); setProfileState(EMPTY_PROFILE);
      setIsLoading(false); return;
    }
    setIsLoading(true);
    try {
      const home = await api.businesses.getProfileHome();
      if (!current()) return;
      const homeBusinesses = home.businesses || [];
      setUserBusinesses(homeBusinesses);
      setRecentAssessments(home.recent_assessments || []);
      if (!homeBusinesses.length) {
        setActiveBusinessId(null); setActiveAssessmentIdState(null); setProfileState(EMPTY_PROFILE);
        localStorage.removeItem("complywise_active_business_id");
        localStorage.removeItem("complywise_active_assessment_id");
        return;
      }
      const serverWs = await api.businesses.getWorkspace();
      if (!current()) return;
      const preferred = preferredBizId || localStorage.getItem("complywise_active_business_id") || serverWs?.active_business_id;
      const selected = homeBusinesses.find(b => b.id === preferred) || homeBusinesses[0];
      const bizId = selected.id;
      const cachedAssessment = localStorage.getItem("complywise_active_assessment_id");
      const assessments = await api.businesses.getAssessments(bizId);
      if (!current()) return;
      const requested = serverWs?.active_business_id === bizId ? serverWs.active_assessment_id : cachedAssessment;
      const effectiveAssId = assessments.find(a => a.id === requested)?.id || assessments[0]?.id || null;
      setActiveBusinessId(bizId); setActiveAssessmentIdState(effectiveAssId);
      localStorage.setItem("complywise_active_business_id", bizId);
      if (effectiveAssId) localStorage.setItem("complywise_active_assessment_id", effectiveAssId);
      else localStorage.removeItem("complywise_active_assessment_id");
      const [profileResp, bizDetail, summary, selectedAssessment] = await Promise.all([
        api.businesses.getProfile(bizId), api.businesses.get(bizId), api.dashboard.get(bizId, effectiveAssId),
        effectiveAssId ? api.businesses.getAssessment(bizId, effectiveAssId) : Promise.resolve(null),
      ]);
      if (!current()) return;
      const matchedSummary = selected;
      const bizName = bizDetail.name;
      const cv = selectedAssessment?.profile_variables ?? profileResp.current_version?.variables;
        const rawState = String(cv?.state?.value || (selectedAssessment ? "" : matchedSummary?.state) || "");
        const stateFormatted = formatStateName(rawState);
        const district = String(cv?.district?.value || (selectedAssessment ? "" : matchedSummary?.district) || "");
        const constitution = formatConstitution(String(cv?.legal_constitution?.value || ""));
        const workerCount = Number(cv?.total_worker_count?.value ?? 0);
        const turnover = cv?.annual_turnover?.value ?? 0;
        const investment = cv?.plant_machinery_investment?.value ?? 0;
        const scaleFormatted = formatScale(String(turnover), String(investment));
        const productDesc = String(cv?.product_description?.value || (selectedAssessment ? "" : matchedSummary?.product_description) || "");
        const powerLoad = String(cv?.connected_power_load?.value || "");
        const turnoverLakhs = Math.round((Number(turnover) || 0) / 100000);
        const invLakhs = Math.round((Number(investment) || 0) / 100000);

        // Split product description into activities or clean lines
        const activities = productDesc
          ? productDesc
              .split("\n")
              .map((l) => l.trim().replace(/^[-*•]\s*/, ""))
              .filter((l) => l.length > 3 && l.length < 120 && !l.toLowerCase().includes("facility") && !l.toLowerCase().includes("major areas"))
              .slice(0, 6)
          : [];

        const panNumber = String(cv?.pan?.value || "Not provided");

        setProfileState((prev) => ({
          ...EMPTY_PROFILE,
          id: bizId,
          manufacturing: cv?.is_manufacturing?.value === true,
          exports: ["EXPORT_ONLY", "IMPORT_AND_EXPORT"].includes(String(cv?.import_export_intent?.value)),
          hazardousMaterials: cv?.hazardous_waste_generation?.value === true,
          businessName: bizName || "Your business",
          businessType: constitution || "Not provided",
          pan: panNumber,
          state: stateFormatted,
          district: district,
          location: district && stateFormatted ? `${district}, ${stateFormatted}` : "Not provided",
          employeeCount: workerCount,
          scale: scaleFormatted || matchedSummary?.msme_scale || "Not provided",
          activities,
          annualTurnoverLakhs: turnoverLakhs,
          plantInvestmentLakhs: invLakhs,
          industrialZoneStatus: formatZoneStatus(String(cv?.industrial_zone_status?.value || "")) || "Not provided",
          lifecycleStage: formatLifecycle(String(cv?.lifecycle_stage?.value || "")) || "Not provided",
          connectedPowerLoad: powerLoad ? `${powerLoad} HP` : undefined,
          productDescription: productDesc,
          sector: activities[0] || "Business activities not provided",
          bisRegistration: String(cv?.bis_registration?.value || "Not provided"),
          lastSync: "Live from Database",
        }));
        setIsDemoMode(false);
      setLiveDashboardSummary(summary);
    } catch (err: any) {
      if (current()) {
        setLiveDashboardSummary(null);
        setLoadError(err?.message || "We couldn't load your workspace. Please retry.");
      }
    } finally { if (current()) setIsLoading(false); }
  }, []);

  const setActiveAssessmentId = useCallback((id: string | null) => {
    if (!activeBusinessId) return;
    const switchVersion = ++requestVersion.current;
    setLiveDashboardSummary(null);
    setIsLoading(true);
    api.businesses.setWorkspace({ business_id: activeBusinessId, assessment_id: id })
      .then(() => {
        if (requestVersion.current !== switchVersion) return;
        setActiveAssessmentIdState(id);
        if (id) localStorage.setItem("complywise_active_assessment_id", id);
        else localStorage.removeItem("complywise_active_assessment_id");
        return fetchBackendData(activeBusinessId);
      })
      .catch((err) => {
        if (requestVersion.current !== switchVersion) return;
        setLoadError(err?.message || "We couldn't switch assessments. Please retry.");
        setIsLoading(false);
      });
  }, [activeBusinessId, fetchBackendData]);

  // Load persisted profile from localStorage on mount and check live backend
  useEffect(() => {
    setIsLoaded(true);
    if (authLoading) return;
    fetchBackendData();
  }, [fetchBackendData, token, authLoading]);

  // Persist whenever profile changes after initial load
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
        if (profile.id && activeBusinessId === profile.id) {
          localStorage.setItem("complywise_active_business_id", profile.id);
        }
        localStorage.setItem("complywise_active_business_name", profile.businessName);
      } catch {
        // ignore storage error
      }
    }
  }, [profile, isLoaded, activeBusinessId]);

  function setProfile(newProfile: BusinessProfile) {
    setProfileState(newProfile);
  }

  function updateProfile(partial: Partial<BusinessProfile>) {
    setProfileState((prev) => ({
      ...prev,
      ...partial,
      lastSync: "Just now",
    }));
  }

  const switchProfile = useCallback(async (profileId: string) => {
    // It's a real database business ID!
    // CRITICAL: Clear stale assessment ID from old business before switching.
    // Without this, compliance/documents/schemes pages show data from the previous business.
    localStorage.removeItem("complywise_active_assessment_id");
    setActiveAssessmentIdState(null);
    // Clear any cached per-business data
    localStorage.removeItem("complywise_compliance_cache");
    localStorage.removeItem("complywise_documents_cache");
    localStorage.setItem("complywise_active_business_id", profileId);
    setActiveBusinessId(profileId);
    ++requestVersion.current;
    setLiveDashboardSummary(null);
    setIsLoading(true);
    try {
      await api.businesses.setWorkspace({ business_id: profileId });
      await fetchBackendData(profileId);
    } catch (err: any) {
      setLoadError(err?.message || "We couldn't switch businesses. Please retry.");
      setIsLoading(false);
      return;
    }
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("complywise_business_switched", { detail: { businessId: profileId } }));
    }
  }, [fetchBackendData]);

  function resetToDefault() {
    setProfileState(EMPTY_PROFILE);
    setIsDemoMode(false);
    setLiveDashboardSummary(null);
  }

  // Derive reactive dashboard data whenever the active profile updates
  const dashboardData = useMemo(() => {
    return getDashboardData(profile);
  }, [profile]);

  const value: BusinessContextValue = {
    profile,
    isLoading, loadError,
    dashboardData,
    liveDashboardSummary,
    activeBusinessId,
    activeAssessmentId,
    isDemoMode,
    dataSource: isDemoMode ? "DEMO_ADAPTER" : "LIVE_BACKEND",
    availableProfiles: [],
    userBusinesses,
    recentAssessments,
    setProfile,
    updateProfile,
    switchProfile,
    setActiveAssessmentId,
    resetToDefault,
    refreshDashboardData: () => fetchBackendData(activeBusinessId),
  };

  return (
    <BusinessContext.Provider value={value}>
      {children}
    </BusinessContext.Provider>
  );
}

export function useBusinessContext(): BusinessContextValue {
  const ctx = useContext(BusinessContext);
  if (!ctx) {
    throw new Error("useBusinessContext must be used within a BusinessProvider");
  }
  return ctx;
}
