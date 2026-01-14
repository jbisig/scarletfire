import React, { createContext, useContext, useState, useCallback } from 'react';
import { ShowsByYear, ShowDetail } from '../types/show.types';
import { archiveApi } from '../services/archiveApi';

interface ShowsContextType {
  showsByYear: ShowsByYear | null;
  isLoading: boolean;
  error: string | null;
  loadShows: () => Promise<void>;
  showDetailsCache: Map<string, ShowDetail>;
  getShowDetail: (identifier: string) => Promise<ShowDetail>;
}

const ShowsContext = createContext<ShowsContextType | undefined>(undefined);

export function ShowsProvider({ children }: { children: React.ReactNode }) {
  const [showsByYear, setShowsByYear] = useState<ShowsByYear | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDetailsCache] = useState(new Map<string, ShowDetail>());

  const loadShows = useCallback(async () => {
    if (showsByYear) return; // Already loaded

    setIsLoading(true);
    setError(null);

    try {
      const shows = await archiveApi.getShowsByYear();
      setShowsByYear(shows);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load shows');
    } finally {
      setIsLoading(false);
    }
  }, [showsByYear]);

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
        loadShows,
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
