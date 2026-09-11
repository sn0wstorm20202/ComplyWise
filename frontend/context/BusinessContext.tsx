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
import { DashboardSummary, Business } from "@/types";
import { getAuthToken } from "@/lib/api/client";

interface BusinessContextValue {
  profile: BusinessProfile;
  dashboardData: DashboardData;
  liveDashboardSummary: DashboardSummary | null;
  activeBusinessId: string | null;
  isDemoMode: boolean;
  dataSource: "LIVE_BACKEND" | "DEMO_ADAPTER";
  availableProfiles: BusinessProfile[];
  setProfile: (profile: BusinessProfile) => void;
  updateProfile: (partial: Partial<BusinessProfile>) => void;
  switchProfile: (profileId: string) => void;
  resetToDefault: () => void;
  refreshDashboardData: () => Promise<void>;
}

const BusinessContext = createContext<BusinessContextValue | null>(null);

const STORAGE_KEY = "complywise_business_profile_v2";

export function BusinessProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfileState] = useState<BusinessProfile>(DEFAULT_BUSINESS_PROFILE);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [liveDashboardSummary, setLiveDashboardSummary] = useState<DashboardSummary | null>(null);
  const [activeBusinessId, setActiveBusinessId] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(true);

  // Fetch live data from backend if authenticated
  const fetchBackendData = useCallback(async (preferredBizId?: string | null) => {
    const token = getAuthToken();
    if (!token) {
      setIsDemoMode(true);
      return;
    }

    try {
      let bizId = preferredBizId || localStorage.getItem("complywise_active_business_id");
      if (!bizId) {
        const list = await api.businesses.list();
        if (list.length > 0) {
          bizId = list[0].id;
        }
      }

      if (!bizId) {
        setIsDemoMode(true);
        return;
      }

      setActiveBusinessId(bizId);
      localStorage.setItem("complywise_active_business_id", bizId);

      // Fetch live dashboard summary
      const summary = await api.dashboard.get(bizId);
      if (summary && summary.business_id) {
        setLiveDashboardSummary(summary);
        setIsDemoMode(false);

        // Fetch current profile version to sync business context
        try {
          const profileResp = await api.businesses.getProfile(bizId);
          const cv = profileResp.current_version?.variables;
          if (cv) {
            setProfileState((prev) => ({
              ...prev,
              id: bizId,
              businessName: summary.business_name || prev.businessName,
              businessType: String(cv.legal_constitution?.value || prev.businessType),
              state: String(cv.state?.value || prev.state),
              district: String(cv.district?.value || prev.district),
              location: `${String(cv.district?.value || "Bengaluru")}, ${String(cv.state?.value || "Karnataka")}`,
              industrialZoneStatus: String(cv.industrial_zone_status?.value || prev.industrialZoneStatus),
              lifecycleStage: String(cv.lifecycle_stage?.value || prev.lifecycleStage),
              lastSync: "Live from API",
            }));
          }
        } catch {
          // Profile variables fetch failed, retain summary
        }
      }
    } catch {
      // Backend request failed, fall back to demo mode explicitly
      setIsDemoMode(true);
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

  function switchProfile(profileId: string) {
    const found = DEMO_PROFILES.find((p) => p.id === profileId);
    if (found) {
      setProfileState(found);
      setIsDemoMode(true);
      setLiveDashboardSummary(null);
      localStorage.setItem("complywise_active_business_id", found.id);
    }
  }

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
    isDemoMode,
    dataSource: isDemoMode ? "DEMO_ADAPTER" : "LIVE_BACKEND",
    availableProfiles: DEMO_PROFILES,
    setProfile,
    updateProfile,
    switchProfile,
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
