import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { GratefulDeadShow } from '../types/show.types';
import { useShows } from './ShowsContext';
import { isResolvedClassic } from '../utils/classicShowsPool';
import { useShowRatingsVersion } from './UserRatingsContext';

interface ShowOfTheDayContextValue {
  show: GratefulDeadShow | null;
  isLoading: boolean;
  error: string | null;
  refreshShow: () => void;
}

const ShowOfTheDayContext = createContext<ShowOfTheDayContextValue | undefined>(undefined);

interface ShowOfTheDayProviderProps {
  children: ReactNode;
}

export function ShowOfTheDayProvider({ children }: ShowOfTheDayProviderProps) {
  const { showsByYear, isLoading: showsLoading } = useShows();
  const [show, setShow] = useState<GratefulDeadShow | null>(null);
  const [classicShows, setClassicShows] = useState<GratefulDeadShow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const ratingsVersion = useShowRatingsVersion();

  // Build classic shows list when showsByYear is loaded (or ratings change)
  useEffect(() => {
    if (!showsByYear || showsLoading) return;

    const matchedShows: GratefulDeadShow[] = [];
    Object.values(showsByYear).forEach(yearShows => {
      yearShows.forEach(show => {
        if (isResolvedClassic(show.date)) {
          matchedShows.push(show);
        }
      });
    });

    if (matchedShows.length === 0) {
      setError('No classic shows available');
      setIsLoading(false);
      return;
    }

    setClassicShows(matchedShows);

    // Keep the current pick if it's still in the pool (don't churn SOTD on
    // every rating change); otherwise select a random one.
    setShow(prev => {
      if (prev && matchedShows.some(s => s.primaryIdentifier === prev.primaryIdentifier)) {
        return prev;
      }
      return matchedShows[Math.floor(Math.random() * matchedShows.length)];
    });
    setIsLoading(false);
  }, [showsByYear, showsLoading, ratingsVersion]);

  // Refresh: pick a different random show from classic shows
  const refreshShow = useCallback(() => {
    if (classicShows.length === 0) return;

    // Pick a different show than current
    let randomIndex = Math.floor(Math.random() * classicShows.length);

    // Ensure we pick a different show if possible
    if (classicShows.length > 1 && show) {
      let newShow = classicShows[randomIndex];
      let attempts = 0;
      while (newShow.primaryIdentifier === show.primaryIdentifier && attempts < 10) {
        randomIndex = Math.floor(Math.random() * classicShows.length);
        newShow = classicShows[randomIndex];
        attempts++;
      }
      setShow(newShow);
    } else {
      setShow(classicShows[randomIndex]);
    }
  }, [classicShows, show]);

  const value: ShowOfTheDayContextValue = {
    show,
    isLoading: isLoading || showsLoading,
    error,
    refreshShow,
  };

  return (
    <ShowOfTheDayContext.Provider value={value}>
      {children}
    </ShowOfTheDayContext.Provider>
  );
}

export function useShowOfTheDay(): ShowOfTheDayContextValue {
  const context = useContext(ShowOfTheDayContext);
  if (context === undefined) {
    throw new Error('useShowOfTheDay must be used within a ShowOfTheDayProvider');
  }
  return context;
}
