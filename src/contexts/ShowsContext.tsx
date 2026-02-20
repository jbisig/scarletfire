import React, { createContext, useContext, useState, useCallback, useMemo, useRef } from 'react';
import { ShowsByYear, ShowDetail, RecordingVersion } from '../types/show.types';
import { archiveApi } from '../services/archiveApi';
import showsData from '../data/shows.json';
import { getClassicTier } from '../data/classicShowsTiers';

interface ShowsContextType {
  showsByYear: ShowsByYear;
  isLoading: boolean;
  error: string | null;
  getShowDetail: (identifier: string) => Promise<ShowDetail>;
  getShowVersions: (date: string) => Promise<RecordingVersion[]>;
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
  // Track in-flight requests to prevent duplicate concurrent API calls
  const inFlightRequestsRef = useRef(new Map<string, Promise<ShowDetail>>());

  const getShowDetail = useCallback(async (identifier: string): Promise<ShowDetail> => {
    // Check if request is already in-flight (archiveApi handles its own cache)
    if (inFlightRequestsRef.current.has(identifier)) {
      return inFlightRequestsRef.current.get(identifier)!;
    }

    // Delegate to archiveApi which has its own TTL-based cache
    const requestPromise = archiveApi.getShowDetail(identifier)
      .finally(() => {
        inFlightRequestsRef.current.delete(identifier);
      });

    inFlightRequestsRef.current.set(identifier, requestPromise);
    return requestPromise;
  }, []);

  const getShowVersions = useCallback(async (date: string): Promise<RecordingVersion[]> => {
    return archiveApi.getShowVersions(date);
  }, []);

  return (
    <ShowsContext.Provider
      value={{
        showsByYear,
        isLoading,
        error,
        getShowDetail,
        getShowVersions,
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
