import React, { createContext, useContext, useState, useCallback, useMemo, useRef } from 'react';
import { ShowsByYear, ShowDetail } from '../types/show.types';
import { archiveApi } from '../services/archiveApi';
import { networkPriority } from '../services/networkPriority';
import showsData from '../data/shows.json';
import { getClassicTier } from '../data/classicShowsTiers';

interface ShowsContextType {
  showsByYear: ShowsByYear;
  isLoading: boolean;
  error: string | null;
  getShowDetail: (identifier: string) => Promise<ShowDetail>;
}

const ShowsContext = createContext<ShowsContextType | undefined>(undefined);

export function ShowsProvider({ children }: { children: React.ReactNode }) {
  // Load shows from static data and enrich with classic tier data
  const showsByYear = useMemo(() => {
    const rawShowsByYear = showsData as ShowsByYear;
    const enrichedShowsByYear: ShowsByYear = {};

    Object.keys(rawShowsByYear).forEach(year => {
      enrichedShowsByYear[year] = rawShowsByYear[year].map(show => {
        const tier = getClassicTier(show.date);
        return tier ? { ...show, classicTier: tier } : show;
      });
    });

    return enrichedShowsByYear;
  }, []);

  const [isLoading] = useState(false);
  const [error] = useState<string | null>(null);
  // Session-permanent cache — show details are historical and never change
  const sessionCacheRef = useRef(new Map<string, ShowDetail>());
  // Track in-flight requests to prevent duplicate concurrent API calls
  const inFlightRequestsRef = useRef(new Map<string, Promise<ShowDetail>>());

  const getShowDetail = useCallback(async (identifier: string): Promise<ShowDetail> => {
    // Check session cache first (permanent, no TTL)
    const cached = sessionCacheRef.current.get(identifier);
    if (cached) return cached;

    // Check if request is already in-flight
    if (inFlightRequestsRef.current.has(identifier)) {
      return inFlightRequestsRef.current.get(identifier)!;
    }

    // Mark this as a user-initiated fetch so background prefetches yield to it.
    networkPriority.beginUserFetch();

    // Delegate to archiveApi (which has its own TTL-based cache as a secondary layer)
    const requestPromise = archiveApi.getShowDetail(identifier)
      .then(detail => {
        sessionCacheRef.current.set(identifier, detail);
        return detail;
      })
      .finally(() => {
        inFlightRequestsRef.current.delete(identifier);
        networkPriority.endUserFetch();
      });

    inFlightRequestsRef.current.set(identifier, requestPromise);
    return requestPromise;
  }, []);

  // Memoize the provider value so consumers only re-render when one of these
  // (already-stable) members actually changes, instead of on every render of
  // ShowsProvider (e.g. when something above it in the tree re-renders).
  const contextValue = useMemo<ShowsContextType>(() => ({
    showsByYear,
    isLoading,
    error,
    getShowDetail,
  }), [showsByYear, isLoading, error, getShowDetail]);

  return (
    <ShowsContext.Provider value={contextValue}>
      {children}
    </ShowsContext.Provider>
  );
}

export function useShows() {
  const context = useContext(ShowsContext);
  if (!context) {
    throw new Error('useShows must be used within ShowsProvider');
  }
  return context;
}

/**
 * Optional variant for consumers that may be mounted without a ShowsProvider
 * ancestor (e.g. PlayerProvider unit tests that isolate it from the rest of
 * the provider tree — mirrors `useOptionalToast` in ToastContext).
 */
export function useOptionalShows() {
  return useContext(ShowsContext);
}
