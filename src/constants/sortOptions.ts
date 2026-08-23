import { SortOption } from '../components/SortDropdown';

/**
 * Shared sort option arrays + label/icon lookups for every <SortDropdown>
 * consumer: FavoritesScreen, PublicProfileScreen, CollectionDetailScreen,
 * HomeScreen, and SongPerformancesScreen.
 *
 * Sanctioned label changes (the only user-visible differences from before
 * this consolidation — see task-19-report.md for the full rationale):
 *   - The collapsed sort-pill label for "show date" sorting is unified to
 *     "Show Date" everywhere (was "Perform. Date" on FavoritesScreen and
 *     "Date" on PublicProfileScreen; CollectionDetailScreen and HomeScreen
 *     already said "Show Date").
 *   - The collapsed sort-pill label for "performance date" sorting (used for
 *     song/track items, which aren't shows themselves but reference one) is
 *     unified to "Performance Date" everywhere (was "Perform. Date" on
 *     FavoritesScreen and "Date" on PublicProfileScreen; the dropdown OPTION
 *     text already said "Performance Date" on both screens — only the pill
 *     label had drifted).
 * Dropdown option text itself was already consistent between the screens
 * that share a given option set (see SAVED_SHOW_SORT_OPTIONS /
 * SAVED_SONG_SORT_OPTIONS below) and is unchanged.
 */

// ---------------------------------------------------------------------------
// Favorites / PublicProfile: shows + songs sorted by save time.
// ---------------------------------------------------------------------------

/**
 * FavoritesScreen and PublicProfileScreen both sort a "saved" show or song by
 * the exact same value set: alphabetical, date saved (old/new), and
 * performance/show date (old/new). The two screens' local `ShowSortType` /
 * `SongSortType` unions were textually identical, so a single shared type
 * covers all four dropdowns (Favorites shows, Favorites songs, PublicProfile
 * shows, PublicProfile songs).
 */
export type SavedItemSortType =
  | 'alphabetical'
  | 'dateSavedOldest'
  | 'dateSavedNewest'
  | 'performanceDateOldest'
  | 'performanceDateNewest'
  // Shows dropdown only (never offered for songs): downloaded shows first,
  // most recently saved on top. Auto-selected when the device goes offline.
  | 'downloadedFirst';

export const SAVED_SHOW_SORT_OPTIONS: SortOption<SavedItemSortType>[] = [
  { value: 'downloadedFirst', label: 'Downloaded' },
  { value: 'alphabetical', label: 'Alphabetical' },
  { value: 'dateSavedOldest', label: 'Date Saved (Oldest First)' },
  { value: 'dateSavedNewest', label: 'Date Saved (Newest First)' },
  { value: 'performanceDateOldest', label: 'Show Date (Oldest First)' },
  { value: 'performanceDateNewest', label: 'Show Date (Newest First)' },
];

export const SAVED_SONG_SORT_OPTIONS: SortOption<SavedItemSortType>[] = [
  { value: 'alphabetical', label: 'Alphabetical' },
  { value: 'dateSavedOldest', label: 'Date Saved (Oldest First)' },
  { value: 'dateSavedNewest', label: 'Date Saved (Newest First)' },
  { value: 'performanceDateOldest', label: 'Performance Date (Oldest First)' },
  { value: 'performanceDateNewest', label: 'Performance Date (Newest First)' },
];

/**
 * Collapsed sort-pill label. `itemKind` picks "Show Date" vs "Performance
 * Date" for the performanceDate* values — see the module doc comment above.
 */
export function getSavedItemSortLabel(sortType: SavedItemSortType, itemKind: 'show' | 'song'): string {
  switch (sortType) {
    case 'alphabetical':
      return 'Alphabetical';
    case 'dateSavedNewest':
    case 'dateSavedOldest':
      return 'Date Saved';
    case 'performanceDateOldest':
    case 'performanceDateNewest':
      return itemKind === 'show' ? 'Show Date' : 'Performance Date';
    case 'downloadedFirst':
      return 'Downloaded';
    default:
      return 'Sort';
  }
}

export function getSavedItemSortIcon(sortType: SavedItemSortType): 'arrow-up' | 'arrow-down' {
  return sortType === 'dateSavedOldest' || sortType === 'performanceDateOldest' ? 'arrow-up' : 'arrow-down';
}

// ---------------------------------------------------------------------------
// CollectionDetailScreen: show collections sorted by date added.
// ---------------------------------------------------------------------------

/**
 * CollectionDetailScreen tracks "date added to this collection" rather than
 * "date saved", so it gets its own value set (dateAdded* instead of
 * dateSaved*) even though the shape mirrors SavedItemSortType.
 */
export type CollectionSortType =
  | 'alphabetical'
  | 'dateAddedOldest'
  | 'dateAddedNewest'
  | 'performanceDateOldest'
  | 'performanceDateNewest';

export const COLLECTION_SHOW_SORT_OPTIONS: SortOption<CollectionSortType>[] = [
  { value: 'alphabetical', label: 'Alphabetical' },
  { value: 'dateAddedOldest', label: 'Date Added (Oldest First)' },
  { value: 'dateAddedNewest', label: 'Date Added (Newest First)' },
  { value: 'performanceDateOldest', label: 'Show Date (Oldest First)' },
  { value: 'performanceDateNewest', label: 'Show Date (Newest First)' },
];

export function getCollectionSortLabel(sortType: CollectionSortType): string {
  switch (sortType) {
    case 'alphabetical':
      return 'Alphabetical';
    case 'dateAddedOldest':
    case 'dateAddedNewest':
      return 'Date Added';
    case 'performanceDateOldest':
    case 'performanceDateNewest':
      return 'Show Date';
  }
}

export function getCollectionSortIcon(sortType: CollectionSortType): 'arrow-up' | 'arrow-down' {
  switch (sortType) {
    case 'dateAddedOldest':
    case 'performanceDateOldest':
      return 'arrow-up';
    case 'alphabetical':
      return 'arrow-down';
    default:
      return 'arrow-down';
  }
}

// ---------------------------------------------------------------------------
// HomeScreen: full show catalog, with a "default" (natural year-grouped)
// order in addition to explicit sorts.
// ---------------------------------------------------------------------------

export type HomeSortType = 'default' | 'alphabetical' | 'performanceDateNewest' | 'mostPopular';

export const HOME_SORT_VALID_TYPES: HomeSortType[] = [
  'default',
  'alphabetical',
  'performanceDateNewest',
  'mostPopular',
];

export const HOME_SORT_OPTIONS: SortOption<HomeSortType>[] = [
  { value: 'default', label: 'Show Date (Oldest First)' },
  { value: 'performanceDateNewest', label: 'Show Date (Newest First)' },
  { value: 'mostPopular', label: 'Most Popular' },
  { value: 'alphabetical', label: 'Alphabetical' },
];

export function getHomeSortLabel(sortType: HomeSortType): string {
  switch (sortType) {
    case 'default':
    case 'performanceDateNewest':
      return 'Show Date';
    case 'mostPopular':
      return 'Most Popular';
    case 'alphabetical':
      return 'Alphabetical';
    default:
      return 'Sort';
  }
}

export function getHomeSortIcon(sortType: HomeSortType): 'arrow-up' | 'arrow-down' {
  return sortType === 'default' ? 'arrow-up' : 'arrow-down';
}

// ---------------------------------------------------------------------------
// SongPerformancesScreen: every performance of a single song across shows.
// ---------------------------------------------------------------------------

export type PerformanceSortType =
  | 'alphabetical'
  | 'performanceDateOldest'
  | 'performanceDateNewest'
  | 'ratingHighest';

export const PERFORMANCE_SORT_OPTIONS: SortOption<PerformanceSortType>[] = [
  { value: 'alphabetical', label: 'Alphabetical' },
  { value: 'performanceDateOldest', label: 'Performance Date (Oldest First)' },
  { value: 'performanceDateNewest', label: 'Performance Date (Newest First)' },
  { value: 'ratingHighest', label: 'Rating (Highest First)' },
];

export function getPerformanceSortLabel(sortType: PerformanceSortType): string {
  switch (sortType) {
    case 'alphabetical':
      return 'Alphabetical';
    case 'performanceDateOldest':
    case 'performanceDateNewest':
      return 'Performance Date';
    case 'ratingHighest':
      return 'Rating';
    default:
      return 'Sort';
  }
}

export function getPerformanceSortIcon(sortType: PerformanceSortType): 'arrow-up' | 'arrow-down' {
  return sortType === 'performanceDateOldest' ? 'arrow-up' : 'arrow-down';
}
