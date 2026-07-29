import { GratefulDeadShow } from '../types/show.types';
import { resolveShowRating } from '../services/ratingResolver';

/** True when the show's RESOLVED rating (user override > system) is > 0 stars. */
export function isResolvedClassic(date: string): boolean {
  const resolved = resolveShowRating(date);
  return !!resolved && resolved.stars > 0;
}

/**
 * True when the user has explicitly rated this show 0 stars. Curated lists
 * (e.g. the Grateful Dead 101 dates) are merged in unconditionally alongside
 * resolved classics, so this check lets callers still honor an explicit
 * 0-star override and keep the show ejected.
 */
export function isUserEjectedShow(date: string): boolean {
  const resolved = resolveShowRating(date);
  return !!resolved && resolved.isUserRating && resolved.stars === 0;
}

/** All shows whose resolved rating is > 0 stars, deduped by primaryIdentifier. */
export function collectResolvedClassics(
  showsByYear: Record<string, GratefulDeadShow[]>,
): GratefulDeadShow[] {
  const result: GratefulDeadShow[] = [];
  const seen = new Set<string>();
  for (const yearShows of Object.values(showsByYear)) {
    for (const s of yearShows) {
      if (!seen.has(s.primaryIdentifier) && isResolvedClassic(s.date)) {
        result.push(s);
        seen.add(s.primaryIdentifier);
      }
    }
  }
  return result;
}
