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
import { INITIAL_DATABASE_BUSINESSES } from '../../data/userProfileHomeData';

const SELECTED_BIZ_KEY = 'complywise_selected_business_id';

export interface BusinessContextValue {
  businesses: BusinessSummary[];
  currentBusiness: BusinessSummary | null;
  isLoading: boolean;
  isLoaded: boolean;
  error: string | null;
  selectBusiness: (businessId: string) => Promise<void>;
  refreshBusinesses: () => Promise<void>;
  createBusiness: (name: string) => Promise<Business>;
}

const BusinessContext = createContext<BusinessContextValue | null>(null);

export function BusinessProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [businesses, setBusinesses] = useState<BusinessSummary[]>(INITIAL_DATABASE_BUSINESSES);
  const [currentBusiness, setCurrentBusiness] = useState<BusinessSummary | null>(
    INITIAL_DATABASE_BUSINESSES[0] || null
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadBusinesses = useCallback(async () => {
    if (!isAuthenticated) {
      setBusinesses(INITIAL_DATABASE_BUSINESSES);
      setCurrentBusiness(INITIAL_DATABASE_BUSINESSES[0] || null);
      setIsLoading(false);
      setIsLoaded(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
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

      // If still empty, fall back to canonical Supabase database profiles (same as web)
      if (list.length === 0) {
        list = INITIAL_DATABASE_BUSINESSES;
      }

      setBusinesses(list);

      // Check saved preference or default to first business
      const savedId = await storage.getItem(SELECTED_BIZ_KEY);
      const found = list.find((b) => b.id === savedId) || list[0] || null;
      setCurrentBusiness(found);
      if (found && found.id !== savedId) {
        await storage.setItem(SELECTED_BIZ_KEY, found.id);
      }
    } catch (err: unknown) {
      setBusinesses(INITIAL_DATABASE_BUSINESSES);
      setCurrentBusiness(INITIAL_DATABASE_BUSINESSES[0] || null);
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
    async (businessId: string) => {
      const found = businesses.find((b) => b.id === businessId);
      if (found) {
        setCurrentBusiness(found);
        await storage.setItem(SELECTED_BIZ_KEY, found.id);
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
