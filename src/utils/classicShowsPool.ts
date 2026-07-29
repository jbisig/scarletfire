import { GratefulDeadShow } from '../types/show.types';
import { resolveShowRating } from '../services/ratingResolver';

/** True when the show's RESOLVED rating (user override > system) is > 0 stars. */
export function isResolvedClassic(date: string): boolean {
  const resolved = resolveShowRating(date);
  return !!resolved && resolved.stars > 0;
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
