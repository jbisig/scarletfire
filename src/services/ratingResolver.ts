// src/services/ratingResolver.ts
/**
 * Single source of truth for "what rating does this show/performance have,
 * and whose is it?". User overrides (userRatingsStore) win over system
 * ratings; a 0-star override suppresses the system rating entirely.
 */
import { getClassicTier } from '../data/classicShowsTiers';
import { getSongPerformanceRating } from '../data/songPerformanceRatings';
import { findSongByTitle } from '../utils/songLookup';
import { getActiveShowRating, getActivePerformanceRating } from './userRatingsStore';

export interface ResolvedRating {
  stars: 0 | 1 | 2 | 3;
  isUserRating: boolean;
}

export function tierToStars(tier: 1 | 2 | 3): 1 | 2 | 3 {
  return (4 - tier) as 1 | 2 | 3;
}

export function resolveShowRating(date: string): ResolvedRating | null {
  const user = getActiveShowRating(date);
  if (user) return { stars: user.stars, isUserRating: true };
  const tier = getClassicTier(date);
  return tier ? { stars: tierToStars(tier), isUserRating: false } : null;
}

export function resolvePerformanceRating(songTitle: string, showDate: string): ResolvedRating | null {
  const user = getActivePerformanceRating(songTitle, showDate);
  if (user) return { stars: user.stars, isUserRating: true };

  const tier = getSongPerformanceRating(songTitle, showDate);
  if (tier) return { stars: tierToStars(tier), isUserRating: false };

  // Baked catalog fallback (songs.generated.ts) — some surfaces (ShowDetail
  // track rows, usePerformanceRating) historically read this source.
  const dateOnly = showDate.split('T')[0];
  const catalogTier = findSongByTitle(songTitle)?.performances.find(
    p => p.date.split('T')[0] === dateOnly
  )?.rating;
  return catalogTier ? { stars: tierToStars(catalogTier), isUserRating: false } : null;
}
