import { GratefulDeadShow } from '../types/show.types';
import { mergeCuratedClassics } from './classicShowsPool';

/**
 * Resolve a curated collection's date list to full show objects.
 *
 * Reuses mergeCuratedClassics with an empty base, which already dedupes by
 * primaryIdentifier, skips dates with no matching show, and honors a user's
 * explicit 0-star ejection. Result is sorted chronologically so carousels
 * read in tour order even if the authored list ever drifts out of order.
 */
export function resolveCollectionShows(
  showsByYear: Record<string, GratefulDeadShow[]>,
  dates: readonly string[],
): GratefulDeadShow[] {
  return mergeCuratedClassics(showsByYear, dates, []).sort((a, b) =>
    a.date.localeCompare(b.date),
  );
}
