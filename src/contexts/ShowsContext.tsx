import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
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
  const [showDetailsCache] = useState(new Map<string, ShowDetail>());

  const getShowDetail = useCallback(async (identifier: string): Promise<ShowDetail> => {
    // Check cache first
    if (showDetailsCache.has(identifier)) {
      return showDetailsCache.get(identifier)!;
    }

    // Fetch from API
    const detail = await archiveApi.getShowDetail(identifier);
    showDetailsCache.set(identifier, detail);
    return detail;
  }, [showDetailsCache]);

  return (
    <ShowsContext.Provider
      value={{
        showsByYear,
        isLoading,
        error,
        showDetailsCache,
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
