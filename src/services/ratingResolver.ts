// src/services/ratingResolver.ts
/**
 * Single source of truth for "what rating does this show/performance have,
 * and whose is it?". User overrides (userRatingsStore) win over system
 * ratings; a 0-star override suppresses the system rating entirely.
 */
import { getClassicTier } from '../data/classicShowsTiers';
import { getCompendiumTier } from '../data/compendiumRatings';
import { getSongPerformanceRating } from '../data/songPerformanceRatings';
import { findSongByTitle } from '../utils/songLookup';
import { getCompendiumPerformanceTier } from './compendiumPerformances';
import { getActiveShowRating, getActivePerformanceRating } from './userRatingsStore';

export interface ResolvedRating {
  stars: 0 | 1 | 2 | 3;
  isUserRating: boolean;
}

export function tierToStars(tier: 1 | 2 | 3): 1 | 2 | 3 {
  return (4 - tier) as 1 | 2 | 3;
}

/**
 * System-only (non-user) rating for a show, as stars. Used both by
 * resolveShowRating (once a user override has been ruled out) and by
 * surfaces that want to display the community rating without regard to
 * any user override, e.g. RatingOverlay's "Community rating" row.
 */
export function resolveSystemShowStars(date: string): 1 | 2 | 3 | null {
  // classicShowsTiers is multi-source community consensus (tapers' polls,
  // official releases, Deadcast) and stays authoritative. The Compendium is a
  // single book, so it only fills in shows consensus has nothing to say about —
  // it never overrides a curated tier. Where the two genuinely disagree, the
  // date is listed in CURATED_TIER_DISPUTES for review rather than demoted here.
  const tier = getClassicTier(date) ?? getCompendiumTier(date);
  return tier ? tierToStars(tier) : null;
}

/**
 * System-only (non-user) rating for a performance, as stars. Falls back to
 * the baked catalog (songs.generated.ts) — some surfaces (ShowDetail track
 * rows, usePerformanceRating) historically read this source — so callers
 * see the same rating ShowDetail's track rows would show.
 */
export function resolveSystemPerformanceStars(songTitle: string, showDate: string): 1 | 2 | 3 | null {
  const tier = getSongPerformanceRating(songTitle, showDate);
  if (tier) return tierToStars(tier);

  const dateOnly = showDate.split('T')[0];
  const catalogTier = findSongByTitle(songTitle)?.performances.find(
    p => p.date.split('T')[0] === dateOnly
  )?.rating;
  if (catalogTier) return tierToStars(catalogTier);

  // Last: the Taping Compendium's own highlights. Both sources above are the
  // same vote-based lineage (the catalog is baked from songPerformanceRatings),
  // so this only ever fills a gap neither of them covers — the large majority
  // of the highlights name a performance nothing else rates.
  const compendiumTier = getCompendiumPerformanceTier(songTitle, showDate);
  return compendiumTier ? tierToStars(compendiumTier) : null;
}

export function resolveShowRating(date: string): ResolvedRating | null {
  const user = getActiveShowRating(date);
  if (user) return { stars: user.stars, isUserRating: true };
  const stars = resolveSystemShowStars(date);
  return stars !== null ? { stars, isUserRating: false } : null;
}

export function resolvePerformanceRating(songTitle: string, showDate: string): ResolvedRating | null {
  const user = getActivePerformanceRating(songTitle, showDate);
  if (user) return { stars: user.stars, isUserRating: true };

  const stars = resolveSystemPerformanceStars(songTitle, showDate);
  return stars !== null ? { stars, isUserRating: false } : null;
}
