"use client";

import React, { createContext, useContext, useEffect, useState, useMemo } from "react";
import {
  BusinessProfile,
  DEMO_PROFILES,
  DEFAULT_BUSINESS_PROFILE,
  DashboardData,
  getDashboardData,
} from "@/data/demo";

interface BusinessContextValue {
  profile: BusinessProfile;
  dashboardData: DashboardData;
  setProfile: (profile: BusinessProfile) => void;
  updateProfile: (partial: Partial<BusinessProfile>) => void;
  switchProfile: (profileId: string) => void;
  resetToDefault: () => void;
  isDemoMode: boolean;
  availableProfiles: BusinessProfile[];
}

const BusinessContext = createContext<BusinessContextValue | null>(null);

const STORAGE_KEY = "complywise_business_profile_v2";

export function BusinessProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfileState] = useState<BusinessProfile>(DEFAULT_BUSINESS_PROFILE);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  // Load persisted profile from localStorage on mount
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
  }, []);

  // Persist whenever profile changes after initial load
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
        // Keep active business id in sync for any legacy components
        localStorage.setItem("complywise_active_business_id", profile.id);
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
    }
  }

  function resetToDefault() {
    setProfileState(DEFAULT_BUSINESS_PROFILE);
  }

  // Derive reactive dashboard data whenever the active profile updates
  const dashboardData = useMemo(() => {
    return getDashboardData(profile);
  }, [profile]);

  const value: BusinessContextValue = {
    profile,
    dashboardData,
    setProfile,
    updateProfile,
    switchProfile,
    resetToDefault,
    isDemoMode: true,
    availableProfiles: DEMO_PROFILES,
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
