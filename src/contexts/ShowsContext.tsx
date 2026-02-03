import React, { createContext, useContext, useState, useCallback, useMemo, useRef } from 'react';
import { ShowsByYear, ShowDetail } from '../types/show.types';
import { archiveApi } from '../services/archiveApi';
import showsData from '../data/shows.json';
import { getClassicTier } from '../data/classicShowsTiers';

interface ShowsContextType {
  showsByYear: ShowsByYear;
  isLoading: boolean;
  error: string | null;
  showDetailsCache: Map<string, ShowDetail>;
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
  // Use ref for cache - stable reference, mutated directly, no re-renders needed
  const showDetailsCacheRef = useRef(new Map<string, ShowDetail>());
  // Track in-flight requests to prevent duplicate concurrent API calls
  const inFlightRequestsRef = useRef(new Map<string, Promise<ShowDetail>>());

  const getShowDetail = useCallback(async (identifier: string): Promise<ShowDetail> => {
    // Check cache first
    if (showDetailsCacheRef.current.has(identifier)) {
      return showDetailsCacheRef.current.get(identifier)!;
    }

    // Check if request is already in-flight
    if (inFlightRequestsRef.current.has(identifier)) {
      return inFlightRequestsRef.current.get(identifier)!;
    }

    // Create new request and track it
    const requestPromise = archiveApi.getShowDetail(identifier)
      .then(detail => {
        showDetailsCacheRef.current.set(identifier, detail);
        return detail;
      })
      .finally(() => {
        inFlightRequestsRef.current.delete(identifier);
      });

    inFlightRequestsRef.current.set(identifier, requestPromise);
    return requestPromise;
  }, []); // Empty deps - ref is stable

  return (
    <ShowsContext.Provider
      value={{
        showsByYear,
        isLoading,
        error,
        showDetailsCache: showDetailsCacheRef.current,
        getShowDetail
      }}
    >
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
