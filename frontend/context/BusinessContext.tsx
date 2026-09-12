"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
  useCallback,
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
import { INITIAL_DATABASE_BUSINESSES, INITIAL_DATABASE_ASSESSMENTS } from "@/data/userProfileHomeData";

interface BusinessContextValue {
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

// Helper formatters for database variables
function formatStateName(state: string): string {
  if (!state) return "Karnataka";
  return state
    .toLowerCase()
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function formatConstitution(c: string): string {
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

function formatScale(turnoverStr: string | number, investmentStr: string | number): string {
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
  return `Micro Enterprise (₹${invCr} Cr Inv · ₹${tCr} Cr T/O)`;
}

function formatZoneStatus(z: string): string {
  if (!z) return "Inside Notified Industrial Area";
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
  if (!l) return "Operational";
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
  const [profile, setProfileState] = useState<BusinessProfile>(DEFAULT_BUSINESS_PROFILE);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [liveDashboardSummary, setLiveDashboardSummary] = useState<DashboardSummary | null>(null);
  const [activeBusinessId, setActiveBusinessId] = useState<string | null>(null);
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
    return INITIAL_DATABASE_BUSINESSES;
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
    return INITIAL_DATABASE_ASSESSMENTS;
  });

  const setActiveAssessmentId = useCallback((id: string | null) => {
    setActiveAssessmentIdState(id);
    if (typeof window !== "undefined") {
      if (id) {
        localStorage.setItem("complywise_active_assessment_id", id);
      } else {
        localStorage.removeItem("complywise_active_assessment_id");
      }
    }
    if (activeBusinessId) {
      api.businesses.setWorkspace({ business_id: activeBusinessId, assessment_id: id }).catch(() => {});
    }
  }, [activeBusinessId]);

  // Fetch live data from backend if authenticated
  const fetchBackendData = useCallback(async (preferredBizId?: string | null) => {
    const token = getAuthToken();
    if (!token) {
      return;
    }

    try {
      // 1. Fetch user profile home to retrieve all real businesses and assessments
      let homeBusinesses: BusinessSummary[] = [];
      try {
        const home = await api.businesses.getProfileHome();
        if (home && home.businesses && home.businesses.length > 0) {
          homeBusinesses = home.businesses;
          setUserBusinesses(home.businesses);
          if (typeof window !== "undefined") {
            localStorage.setItem("complywise_cached_businesses", JSON.stringify(home.businesses));
          }
          if (home.recent_assessments && home.recent_assessments.length > 0) {
            setRecentAssessments(home.recent_assessments);
            if (typeof window !== "undefined") {
              localStorage.setItem("complywise_cached_assessments", JSON.stringify(home.recent_assessments));
            }
          }
        }
      } catch (e) {
        console.warn("Could not fetch user profile home:", e);
      }

      if (homeBusinesses.length === 0) {
        homeBusinesses = userBusinesses.length > 0 ? userBusinesses : INITIAL_DATABASE_BUSINESSES;
      }

      const isValidUuid = (id: string | null | undefined): boolean =>
        Boolean(id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id));

      // Consult authoritative server workspace state
      let serverWs: any = null;
      try {
        serverWs = await api.businesses.getWorkspace();
      } catch {
        serverWs = null;
      }

      let bizId =
        preferredBizId ||
        (serverWs?.active_business_id && isValidUuid(serverWs.active_business_id) ? serverWs.active_business_id : null) ||
        (typeof window !== "undefined" ? localStorage.getItem("complywise_active_business_id") : null);
      if (!isValidUuid(bizId)) {
        bizId = null;
      }
      if (!bizId && homeBusinesses.length > 0) {
        const found = homeBusinesses.find((b) => isValidUuid(b.id));
        if (found) bizId = found.id;
      }
      if (!bizId) {
        const list = await api.businesses.list().catch(() => []);
        if (list.length > 0 && isValidUuid(list[0].id)) {
          bizId = list[0].id;
        }
      }

      if (!bizId) {
        setIsDemoMode(true);
        return;
      }

      setActiveBusinessId(bizId);
      if (typeof window !== "undefined") {
        localStorage.setItem("complywise_active_business_id", bizId);
      }

      // Sync active assessment id
      const serverAssId = serverWs?.active_business_id === bizId ? serverWs.active_assessment_id : null;
      const effectiveAssId =
        serverAssId && isValidUuid(serverAssId)
          ? serverAssId
          : typeof window !== "undefined"
          ? localStorage.getItem("complywise_active_assessment_id")
          : null;
      if (effectiveAssId && isValidUuid(effectiveAssId)) {
        setActiveAssessmentIdState(effectiveAssId);
        if (typeof window !== "undefined") {
          localStorage.setItem("complywise_active_assessment_id", effectiveAssId);
        }
      }

      // Persist workspace state authoritatively to backend
      api.businesses.setWorkspace({
        business_id: bizId,
        assessment_id: effectiveAssId && isValidUuid(effectiveAssId) ? effectiveAssId : undefined,
      }).catch(() => {});

      const matchedSummary = homeBusinesses.find((b) => b.id === bizId);

      // 2. Fetch business details and profile variables
      let bizName = matchedSummary?.name || "";
      try {
        const [profileResp, bizDetail] = await Promise.all([
          api.businesses.getProfile(bizId).catch(() => null),
          api.businesses.get(bizId).catch(() => null),
        ]);

        bizName = bizDetail?.name || matchedSummary?.name || "";
        const cv = profileResp?.current_version?.variables;

        const rawState = String(cv?.state?.value || matchedSummary?.state || "");
        const stateFormatted = formatStateName(rawState);
        const district = String(cv?.district?.value || matchedSummary?.district || "Industrial District");
        const constitution = formatConstitution(String(cv?.legal_constitution?.value || "PRIVATE_LIMITED"));
        const workerCount = Number(cv?.total_worker_count?.value || 35);
        const turnover = cv?.annual_turnover?.value ?? 0;
        const investment = cv?.plant_machinery_investment?.value ?? 0;
        const scaleFormatted = formatScale(String(turnover), String(investment));
        const productDesc = String(cv?.product_description?.value || matchedSummary?.product_description || "");
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
          : ["Manufacturing & Statutory Assembly Operations"];

        const panPrefix = "AA" + (bizName.replace(/[^A-Za-z]/g, "").slice(0, 3).toUpperCase() || "CPW");
        const panNumber = `${panPrefix}E${bizId.slice(0, 4).toUpperCase()}F`;

        setProfileState((prev) => ({
          ...prev,
          id: bizId,
          businessName: bizName || prev.businessName,
          businessType: constitution || prev.businessType,
          pan: panNumber,
          state: stateFormatted,
          district: district,
          location: district && stateFormatted ? `${district}, ${stateFormatted}` : prev.location,
          employeeCount: workerCount || prev.employeeCount,
          scale: scaleFormatted || matchedSummary?.msme_scale || prev.scale,
          activities: activities.length > 0 ? activities : prev.activities,
          annualTurnoverLakhs: turnoverLakhs || prev.annualTurnoverLakhs,
          plantInvestmentLakhs: invLakhs || prev.plantInvestmentLakhs,
          industrialZoneStatus: formatZoneStatus(String(cv?.industrial_zone_status?.value || "")) || prev.industrialZoneStatus,
          lifecycleStage: formatLifecycle(String(cv?.lifecycle_stage?.value || "")) || prev.lifecycleStage,
          connectedPowerLoad: powerLoad ? `${powerLoad} kW` : undefined,
          productDescription: productDesc,
          sector: activities[0] || "Industrial Manufacturing",
          bisRegistration: cv?.dynamic_product_bis_standard?.value ? `CM/L-${bizId.slice(0, 7).toUpperCase()}` : "Statutory Verification Active",
          lastSync: "Live from Database",
        }));
        setIsDemoMode(false);
      } catch (err) {
        console.warn("Could not load business details:", err);
      }

      // 3. Fetch live dashboard summary
      try {
        const summary = await api.dashboard.get(bizId);
        if (summary && summary.business_id) {
          setLiveDashboardSummary(summary);
          if (summary.business_name) {
            setProfileState((prev) => ({ ...prev, businessName: summary.business_name }));
          }
        }
      } catch {
        setLiveDashboardSummary(null);
      }
    } catch (e) {
      console.warn("Backend data fetch error:", e);
      setLiveDashboardSummary(null);
    }
  }, []);

  // Load persisted profile from localStorage on mount and check live backend
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.businessName) {
          setProfileState(parsed);
        }
      }
    } catch {
      // ignore storage parsing error
    } finally {
      setIsLoaded(true);
    }

    fetchBackendData();
  }, [fetchBackendData]);

  // Persist whenever profile changes after initial load
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
        if (profile.id) {
          localStorage.setItem("complywise_active_business_id", profile.id);
        }
        localStorage.setItem("complywise_active_business_name", profile.businessName);
      } catch {
        // ignore storage error
      }
    }
  }, [profile, isLoaded]);

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
    const found = DEMO_PROFILES.find((p) => p.id === profileId);
    if (found) {
      setProfileState(found);
      setIsDemoMode(true);
      setLiveDashboardSummary(null);
      localStorage.setItem("complywise_active_business_id", found.id);
      localStorage.setItem("complywise_active_business_name", found.businessName);
      setActiveBusinessId(found.id);
      return;
    }

    // It's a real database business ID!
    localStorage.setItem("complywise_active_business_id", profileId);
    setActiveBusinessId(profileId);
    api.businesses.setWorkspace({ business_id: profileId }).catch(() => {});
    await fetchBackendData(profileId);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("complywise_business_switched", { detail: { businessId: profileId } }));
    }
  }, [fetchBackendData]);

  function resetToDefault() {
    setProfileState(DEFAULT_BUSINESS_PROFILE);
    setIsDemoMode(true);
    setLiveDashboardSummary(null);
  }

  // Derive reactive dashboard data whenever the active profile updates
  const dashboardData = useMemo(() => {
    return getDashboardData(profile);
  }, [profile]);

  const value: BusinessContextValue = {
    profile,
    dashboardData,
    liveDashboardSummary,
    activeBusinessId,
    activeAssessmentId,
    isDemoMode,
    dataSource: isDemoMode ? "DEMO_ADAPTER" : "LIVE_BACKEND",
    availableProfiles: DEMO_PROFILES,
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
