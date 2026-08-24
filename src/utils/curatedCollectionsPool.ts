import { GratefulDeadShow } from '../types/show.types';
import { mergeCuratedClassics } from './classicShowsPool';

/**
 * Resolve a curated collection's date list to full show objects, preserving
 * the authored order — used by ranked lists like CLASSIC_SHOWS where the
 * order is editorial, not chronological.
 *
 * Reuses mergeCuratedClassics with an empty base, which already dedupes by
 * primaryIdentifier, skips dates with no matching show, and honors a user's
 * explicit 0-star ejection.
 */
export function resolveCollectionShowsRanked(
  showsByYear: Record<string, GratefulDeadShow[]>,
  dates: readonly string[],
): GratefulDeadShow[] {
  return mergeCuratedClassics(showsByYear, dates, []);
}

/**
 * Chronological variant for tour/run collections: same resolution, sorted by
 * date so carousels read in tour order even if the authored list ever drifts.
 */
export function resolveCollectionShows(
  showsByYear: Record<string, GratefulDeadShow[]>,
  dates: readonly string[],
): GratefulDeadShow[] {
  return resolveCollectionShowsRanked(showsByYear, dates).sort((a, b) =>
    a.date.localeCompare(b.date),
  );
}
