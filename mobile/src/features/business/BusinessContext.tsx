/**
 * Business Context & Provider
 * Manages user's businesses, currently selected business, and switching.
 * Authority: TRD_v2.0 §31, §32
 */

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import { Business, BusinessSummary } from '../../types/business';
import { businessApi } from './api';
import { storage } from '../../storage';
import { useAuth } from '../auth/useAuth';

const SELECTED_BIZ_KEY = 'complywise_selected_business_id';

export interface BusinessContextValue {
  businesses: BusinessSummary[];
  currentBusiness: BusinessSummary | null;
  activeAssessmentId: string | null;
  workspaceRedirectTarget: 'DASHBOARD' | 'ONBOARDING' | null;
  isLoading: boolean;
  isLoaded: boolean;
  error: string | null;
  selectBusiness: (businessId: string, assessmentId?: string) => Promise<void>;
  refreshBusinesses: () => Promise<void>;
  createBusiness: (name: string) => Promise<Business>;
}

const BusinessContext = createContext<BusinessContextValue | null>(null);

export function BusinessProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [businesses, setBusinesses] = useState<BusinessSummary[]>([]);
  const [currentBusiness, setCurrentBusiness] = useState<BusinessSummary | null>(null);
  const [activeAssessmentId, setActiveAssessmentId] = useState<string | null>(null);
  const [workspaceRedirectTarget, setWorkspaceRedirectTarget] = useState<'DASHBOARD' | 'ONBOARDING' | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadBusinesses = useCallback(async () => {
    if (!isAuthenticated) {
      setBusinesses([]);
      setCurrentBusiness(null);
      setActiveAssessmentId(null);
      setWorkspaceRedirectTarget(null);
      setIsLoading(false);
      setIsLoaded(true);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // 1. Fetch authoritative server workspace state (PRD §30 Boundary 1.3)
      let authoritativeBizId: string | null = null;
      let authoritativeBizName: string | null = null;
      try {
        const ws = await businessApi.getWorkspace();
        if (ws) {
          if (ws.active_assessment_id) {
            setActiveAssessmentId(ws.active_assessment_id);
          }
          if (ws.redirect_target) {
            setWorkspaceRedirectTarget(ws.redirect_target);
          }
          if (ws.has_workspace && ws.active_business_id) {
            authoritativeBizId = ws.active_business_id;
            authoritativeBizName = ws.active_business_name || null;
          }
        }
      } catch (wsErr) {
        console.warn('Workspace state fetch notice:', wsErr);
      }

      // 2. Fetch user's registered businesses
      let list: BusinessSummary[] = [];

      try {
        const homeData = await businessApi.getUserHome();
        if (homeData && Array.isArray(homeData.businesses) && homeData.businesses.length > 0) {
          list = homeData.businesses;
        }
      } catch (e) {
        console.warn('Could not fetch user profile home:', e);
      }

      // If user/profile returns empty, try listing accessible businesses directly
      if (list.length === 0) {
        try {
          const directList = await businessApi.listBusinesses();
          if (Array.isArray(directList) && directList.length > 0) {
            list = directList as BusinessSummary[];
          }
        } catch {
          // ignore
        }
      }

      // If authoritative business is not in list but user owns it, inject it
      if (authoritativeBizId && !list.find((b) => b.id === authoritativeBizId)) {
        list.unshift({
          id: authoritativeBizId,
          name: authoritativeBizName || 'Active Enterprise',
          is_active: true,
          assessment_count: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }

      setBusinesses(list);

      // Select authoritative business or fallback to saved preference
      const savedId = await storage.getItem(SELECTED_BIZ_KEY);
      const targetId = authoritativeBizId || savedId;
      const found = list.find((b) => b.id === targetId) || list[0] || null;
      setCurrentBusiness(found);

      if (found && found.id !== savedId) {
        await storage.setItem(SELECTED_BIZ_KEY, found.id);
      } else if (!found) {
        await storage.removeItem(SELECTED_BIZ_KEY);
      }
    } catch (err: unknown) {
      setBusinesses([]);
      setCurrentBusiness(null);
      const msg = err instanceof Error ? err.message : 'Failed to load business profile.';
      setError(msg);
    } finally {
      setIsLoading(false);
      setIsLoaded(true);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    loadBusinesses();
  }, [loadBusinesses]);

  const selectBusiness = useCallback(
    async (businessId: string, assessmentId?: string) => {
      const found = businesses.find((b) => b.id === businessId);
      if (found) {
        setCurrentBusiness(found);
        await storage.setItem(SELECTED_BIZ_KEY, found.id);
        // Persist switch to backend workspace state asynchronously
        businessApi.updateWorkspace(businessId, assessmentId).catch(() => {});
      }
    },
    [businesses]
  );

  const createBusiness = useCallback(
    async (name: string): Promise<Business> => {
      setIsLoading(true);
      try {
        const created = await businessApi.createBusiness(name);
        await loadBusinesses();
        await storage.setItem(SELECTED_BIZ_KEY, created.id);
        return created;
      } finally {
        setIsLoading(false);
      }
    },
    [loadBusinesses]
  );

  return (
    <BusinessContext.Provider
      value={{
        businesses,
        currentBusiness,
        activeAssessmentId,
        workspaceRedirectTarget,
        isLoading,
        isLoaded,
        error,
        selectBusiness,
        refreshBusinesses: loadBusinesses,
        createBusiness,
      }}
    >
      {children}
    </BusinessContext.Provider>
  );
}

export function useBusiness(): BusinessContextValue {
  const ctx = useContext(BusinessContext);
  if (!ctx) {
    throw new Error('useBusiness must be used within a BusinessProvider');
  }
  return ctx;
}
