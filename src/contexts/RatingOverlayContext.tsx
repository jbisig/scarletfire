import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { RatingOverlay } from '../components/RatingOverlay';

export type RatingItem =
  | { kind: 'show'; date: string; venue?: string; location?: string }
  | { kind: 'performance'; songTitle: string; date: string; venue?: string; showIdentifier?: string };

interface RatingOverlayContextValue {
  openRatingOverlay: (item: RatingItem) => void;
  closeRatingOverlay: () => void;
}

const RatingOverlayContext = createContext<RatingOverlayContextValue | null>(null);

/**
 * Provider for the global rating overlay. Mount once near the app root
 * (inside UserRatingsProvider) so any detail surface can call
 * openRatingOverlay() — same pattern as ShareSheetContext.
 */
export function RatingOverlayProvider({ children }: { children: React.ReactNode }) {
  const [current, setCurrent] = useState<RatingItem | null>(null);

  const openRatingOverlay = useCallback((item: RatingItem) => setCurrent(item), []);
  const closeRatingOverlay = useCallback(() => setCurrent(null), []);

  const value = useMemo(
    () => ({ openRatingOverlay, closeRatingOverlay }),
    [openRatingOverlay, closeRatingOverlay]
  );

  return (
    <RatingOverlayContext.Provider value={value}>
      {children}
      <RatingOverlay item={current} onClose={closeRatingOverlay} />
    </RatingOverlayContext.Provider>
  );
}

export function useRatingOverlay(): RatingOverlayContextValue {
  const ctx = useContext(RatingOverlayContext);
  if (!ctx) throw new Error('useRatingOverlay must be used inside a <RatingOverlayProvider>');
  return ctx;
}
