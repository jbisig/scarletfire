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
 *
 * Relies on the invariant that a *system* rating (no user override) never
 * resolves to 0 stars — otherwise this would also eject shows the user
 * never touched.
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

/**
 * Merges a curated list of dates (e.g. the Grateful Dead 101) into an
 * existing list of classic shows, deduped by primaryIdentifier. Skips any
 * date the user has explicitly 0-star-ejected (see `isUserEjectedShow`).
 * Returns a new array — does not mutate `base`.
 */
export function mergeCuratedClassics(
  showsByYear: Record<string, GratefulDeadShow[]>,
  curatedDates: readonly string[],
  base: GratefulDeadShow[],
): GratefulDeadShow[] {
  const result = [...base];
  const seen = new Set<string>(result.map(s => s.primaryIdentifier));
  for (const date of curatedDates) {
    if (isUserEjectedShow(date)) continue;
    for (const yearShows of Object.values(showsByYear)) {
      const found = yearShows.find(s => s.date.substring(0, 10) === date);
      if (found && !seen.has(found.primaryIdentifier)) {
        result.push(found);
        seen.add(found.primaryIdentifier);
        break;
      }
    }
  }
  return result;
}
