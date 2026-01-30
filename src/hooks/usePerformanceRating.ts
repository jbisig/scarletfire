import { useMemo } from 'react';
import { usePlayer } from '../contexts/PlayerContext';
import { GRATEFUL_DEAD_SONGS } from '../constants/songs.generated';

/**
 * Hook to get the performance rating (1-3 stars) for the current track
 * Shared between MiniPlayer and FullPlayer to avoid code duplication
 */
export function usePerformanceRating(): 1 | 2 | 3 | null {
  const { state, isRadioMode, currentRadioTrack } = usePlayer();

  return useMemo(() => {
    // For radio mode, use the rating from the current radio track
    if (isRadioMode && currentRadioTrack) {
      return currentRadioTrack.performance.tier;
    }

    if (!state.currentTrack || !state.currentShow) return null;

    const song = GRATEFUL_DEAD_SONGS.find(s =>
      s.title.toLowerCase() === state.currentTrack!.title.toLowerCase()
    );

    if (!song) return null;

    const performance = song.performances.find(p => p.date === state.currentShow!.date);

    return performance?.rating || null;
  }, [state.currentTrack?.id, state.currentShow?.date, isRadioMode, currentRadioTrack]);
}
