import { useMemo } from 'react';
import { usePlayer } from '../contexts/PlayerContext';
import { ResolvedRating, resolvePerformanceRating, tierToStars } from '../services/ratingResolver';
import { usePerformanceRatingsVersion } from '../contexts/UserRatingsContext';

/**
 * Resolved rating (user override > system) for the currently playing track.
 * Used by FullPlayer; gold vs red is decided by ResolvedRating.isUserRating.
 */
export function usePerformanceRating(): ResolvedRating | null {
  const { state, isRadioMode, currentRadioTrack } = usePlayer();
  const version = usePerformanceRatingsVersion();

  return useMemo(() => {
    if (isRadioMode && currentRadioTrack) {
      const perf = currentRadioTrack.performance;
      return (
        resolvePerformanceRating(perf.songTitle, perf.showDate) ??
        { stars: tierToStars(perf.tier), isUserRating: false }
      );
    }

    if (!state.currentTrack || !state.currentShow) return null;
    return resolvePerformanceRating(state.currentTrack.title, state.currentShow.date);
  }, [state.currentTrack?.id, state.currentShow?.date, isRadioMode, currentRadioTrack, version]);
}
