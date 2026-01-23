import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { GratefulDeadShow } from '../types/show.types';
import { useShows } from './ShowsContext';
import { ALL_CLASSIC_SHOWS } from '../data/classicShowsTiers';

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

  // Build classic shows list when showsByYear is loaded
  useEffect(() => {
    if (!showsByYear || showsLoading) return;

    // Get all classic show dates
    const classicDates = new Set(ALL_CLASSIC_SHOWS.map(s => s.date));

    // Helper to normalize date to YYYY-MM-DD format
    const normalizeDate = (date: string): string => {
      return date.split('T')[0];
    };

    // Find matching shows from showsByYear
    const matchedShows: GratefulDeadShow[] = [];
    Object.values(showsByYear).forEach(yearShows => {
      yearShows.forEach(show => {
        if (classicDates.has(normalizeDate(show.date))) {
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

    // Select initial random show
    const randomIndex = Math.floor(Math.random() * matchedShows.length);
    setShow(matchedShows[randomIndex]);
    setIsLoading(false);
  }, [showsByYear, showsLoading]);

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
