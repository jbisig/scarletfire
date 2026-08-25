import showsData from '../data/shows.json';
import { ShowsByYear, GratefulDeadShow } from '../types/show.types';
import { getVenueFromShow } from './formatters';

// Static catalog data — cheap to reference, but the derived structures below
// (the date index and the sorted array) are NOT built until first use. This
// keeps module import free of any O(n) work, which matters for consumers
// that may never need a lookup at all.
const allShowsByYear = showsData as ShowsByYear;

function normalizeDate(date: string): string {
  return date.substring(0, 10); // YYYY-MM-DD
}

// Lazily-built Map<normalizedDate, Show> index. Built once, on first lookup.
let dateIndex: Map<string, GratefulDeadShow> | null = null;

function getDateIndex(): Map<string, GratefulDeadShow> {
  if (dateIndex) return dateIndex;
  const index = new Map<string, GratefulDeadShow>();
  Object.values(allShowsByYear).forEach(yearShows => {
    yearShows.forEach(show => {
      index.set(normalizeDate(show.date), show);
    });
  });
  dateIndex = index;
  return index;
}

// Lazily-built, pre-sorted (ascending, chronological) full catalog. Built
// once, on first access via getAllShowsSorted().
let allShowsSorted: GratefulDeadShow[] | null = null;

/**
 * The full show catalog, sorted ascending by date. Built lazily on first
 * call and memoized thereafter — nothing is materialized at module import
 * time.
 */
export function getAllShowsSorted(): GratefulDeadShow[] {
  if (allShowsSorted) return allShowsSorted;
  allShowsSorted = Object.values(allShowsByYear)
    .flat()
    .sort((a, b) => normalizeDate(a.date).localeCompare(normalizeDate(b.date)));
  return allShowsSorted;
}

/**
 * O(1) (after first-use index build) lookup of a show by date. Accepts
 * either a "YYYY-MM-DD" date or a full ISO timestamp — only the date
 * portion is used.
 */
export function findShowByDate(date: string): GratefulDeadShow | undefined {
  return getDateIndex().get(normalizeDate(date));
}

/**
 * Look up the "correct" venue name for a show date (title-derived, falling
 * back to the venue field — see getVenueFromShow). Returns undefined when
 * there's no show on that date.
 */
export function getCorrectVenue(date: string): string | undefined {
  const show = findShowByDate(date);
  return show ? getVenueFromShow(show) : undefined;
}

/**
 * Archive.org popularity (primary recording's download count) for the show
 * on `date`, or 0 when the date isn't in the catalog. Lets saved/favorite
 * item shapes — which carry only a date, not the full catalog record — sort
 * by the same popularity signal HomeScreen uses.
 */
export function getShowDownloadsByDate(date: string): number {
  const show = findShowByDate(date);
  if (!show) return 0;
  const primaryVersion = show.versions.find(v => v.identifier === show.primaryIdentifier);
  return primaryVersion?.downloads ?? 0;
}

/**
 * If `id` looks like a "YYYY-MM-DD" date, resolve it to that show's
 * primaryIdentifier. Otherwise (or if there's no matching show), return
 * `id` unchanged.
 */
export function resolveIdentifierFromDate(id: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(id)) {
    const show = findShowByDate(id);
    if (show) return show.primaryIdentifier;
  }
  return id;
}

/**
 * Binary search over the sorted catalog for the index of the first show
 * whose (normalized) date is strictly greater than `date` — i.e. an
 * "upper bound" search. Returns `getAllShowsSorted().length` if every show
 * is on or before `date` (including when `date` is absent from the
 * catalog entirely).
 */
export function findShowIndexByDate(date: string): number {
  const shows = getAllShowsSorted();
  const target = normalizeDate(date);
  let low = 0;
  let high = shows.length - 1;

  while (low <= high) {
    const mid = (low + high) >>> 1;
    const midDate = normalizeDate(shows[mid].date);
    if (midDate <= target) {
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  return low;
}

/**
 * Find the chronologically next show after `currentDate` (binary search).
 * Returns null if `currentDate` is on or after the last show in the
 * catalog.
 */
export function findNextShow(currentDate: string): GratefulDeadShow | null {
  const shows = getAllShowsSorted();
  const idx = findShowIndexByDate(currentDate);
  return idx < shows.length ? shows[idx] : null;
}
