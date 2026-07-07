/**
 * Shared comparator primitives for the sort dropdowns used across
 * FavoritesScreen, PublicProfileScreen, CollectionDetailScreen, HomeScreen,
 * and SongPerformancesScreen.
 *
 * These take plain comparable values (a timestamp, a date string, a label)
 * rather than whole items or a key-extractor function. The five screens sort
 * different item shapes (FavoriteShow, FavoriteSong, CollectionItem,
 * GratefulDeadShow, Performance) that don't share a common interface, and
 * every call site already has trivial direct field access (`item.savedAt`,
 * `item.date`, `item.venue`). A key-extractor would just add a layer of
 * indirection around a one-line property read; taking values directly keeps
 * call sites as simple as the switch-statement code they replace, e.g.
 * `.sort((a, b) => compareBySavedAt(a.savedAt, b.savedAt, 'newest'))`.
 */

export type SavedAtDirection = 'newest' | 'oldest';
export type DateDirection = 'oldest' | 'newest';

/**
 * Compares two "saved at" timestamps (Unix millis, possibly absent).
 *
 * Canonical tri-state policy (originally FavoritesScreen's behavior, now
 * adopted by every screen that sorts by save time — see PublicProfileScreen,
 * which previously used `(a.savedAt || 0) - (b.savedAt || 0)` and so sorted
 * items with no savedAt as if they were saved at the Unix epoch instead of
 * sorting them last; this comparator fixes that by treating missing savedAt
 * as genuinely missing rather than 0):
 *   - direction 'newest': items with a savedAt sort by timestamp descending;
 *     items with NO savedAt sort LAST.
 *   - direction 'oldest': items with a savedAt sort by timestamp ascending;
 *     items with NO savedAt sort FIRST.
 *   - two missing values are equal to each other.
 *
 * Only `null`/`undefined` count as "missing" — an actual timestamp of `0`
 * (epoch) is a real value, not a missing one, unlike the `value || 0` pattern
 * this replaces.
 */
export function compareBySavedAt(
  a: number | null | undefined,
  b: number | null | undefined,
  direction: SavedAtDirection = 'newest',
): number {
  const missingA = a === null || a === undefined;
  const missingB = b === null || b === undefined;

  if (missingA && missingB) return 0;

  if (direction === 'newest') {
    if (missingA) return 1;
    if (missingB) return -1;
    return b - a;
  }

  // oldest
  if (missingA) return -1;
  if (missingB) return 1;
  return a - b;
}

/**
 * Compares two date-like strings (show dates such as 'YYYY-MM-DD', or ISO
 * timestamps such as CollectionItem.addedAt). Both fields are plain strings
 * across every screen, so a single locale-aware string comparison covers
 * show-date sorting AND date-added sorting (CollectionDetailScreen) alike.
 *
 * Defaults to 'oldest' (ascending) to match the majority of call sites.
 */
export function compareByDate(a: string, b: string, direction: DateDirection = 'oldest'): number {
  return direction === 'oldest' ? a.localeCompare(b) : b.localeCompare(a);
}

/**
 * Compares two display strings (venue, track title, etc.) for the
 * "Alphabetical" sort option. Thin wrapper around localeCompare so call
 * sites read the same as the comparators above.
 */
export function compareAlphabetical(a: string, b: string): number {
  return a.localeCompare(b);
}
