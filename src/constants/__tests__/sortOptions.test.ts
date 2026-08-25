import {
  getSavedItemSortLabel,
  getCollectionSortLabel,
  getHomeSortLabel,
  getPerformanceSortLabel,
  SAVED_SHOW_SORT_OPTIONS,
  SAVED_SONG_SORT_OPTIONS,
} from '../sortOptions';

describe('getSavedItemSortLabel', () => {
  it('unifies the show-date pill label to "Show Date" (was "Perform. Date" / "Date")', () => {
    expect(getSavedItemSortLabel('performanceDateOldest', 'show')).toBe('Show Date');
    expect(getSavedItemSortLabel('performanceDateNewest', 'show')).toBe('Show Date');
  });

  it('unifies the performance-date pill label to "Performance Date" for songs (was "Perform. Date" / "Date")', () => {
    expect(getSavedItemSortLabel('performanceDateOldest', 'song')).toBe('Performance Date');
    expect(getSavedItemSortLabel('performanceDateNewest', 'song')).toBe('Performance Date');
  });

  it('labels date-saved sorts identically regardless of item kind', () => {
    expect(getSavedItemSortLabel('dateSavedNewest', 'show')).toBe('Date Saved');
    expect(getSavedItemSortLabel('dateSavedOldest', 'song')).toBe('Date Saved');
  });

  it('labels alphabetical sort', () => {
    expect(getSavedItemSortLabel('alphabetical', 'show')).toBe('Alphabetical');
  });
});

// The sort trigger pill mirrors the selected option's tray icon (via
// getSortOptionIcon); dated options carry direction arrows.
describe('tray option direction arrows', () => {
  it('dated options point down for oldest-first and up for newest-first', () => {
    for (const options of [SAVED_SHOW_SORT_OPTIONS, SAVED_SONG_SORT_OPTIONS]) {
      for (const option of options) {
        if (option.label.includes('Oldest First')) {
          expect(option.icon).toBe('arrow-down');
        } else if (option.label.includes('Newest First')) {
          expect(option.icon).toBe('arrow-up');
        }
      }
    }
  });
});

describe('option arrays share option text between Favorites and PublicProfile', () => {
  it('SAVED_SHOW_SORT_OPTIONS says "Show Date" for performance-date values', () => {
    const oldest = SAVED_SHOW_SORT_OPTIONS.find((o) => o.value === 'performanceDateOldest');
    expect(oldest?.label).toBe('Show Date (Oldest First)');
  });

  it('SAVED_SONG_SORT_OPTIONS says "Performance Date" for performance-date values', () => {
    const oldest = SAVED_SONG_SORT_OPTIONS.find((o) => o.value === 'performanceDateOldest');
    expect(oldest?.label).toBe('Performance Date (Oldest First)');
  });
});

describe('getCollectionSortLabel', () => {
  it('labels date-added and show-date sorts', () => {
    expect(getCollectionSortLabel('dateAddedNewest')).toBe('Date Added');
    expect(getCollectionSortLabel('performanceDateOldest')).toBe('Show Date');
    expect(getCollectionSortLabel('alphabetical')).toBe('Alphabetical');
  });
});

describe('getHomeSortLabel', () => {
  it('labels the default (oldest) and explicit-newest sorts both as "Show Date"', () => {
    expect(getHomeSortLabel('default')).toBe('Show Date');
    expect(getHomeSortLabel('performanceDateNewest')).toBe('Show Date');
  });

  it('labels mostPopular and alphabetical', () => {
    expect(getHomeSortLabel('mostPopular')).toBe('Most Popular');
    expect(getHomeSortLabel('alphabetical')).toBe('Alphabetical');
  });
});

describe('getPerformanceSortLabel', () => {
  it('labels performance-date, rating, and alphabetical sorts', () => {
    expect(getPerformanceSortLabel('performanceDateOldest')).toBe('Performance Date');
    expect(getPerformanceSortLabel('performanceDateNewest')).toBe('Performance Date');
    expect(getPerformanceSortLabel('ratingHighest')).toBe('Rating');
    expect(getPerformanceSortLabel('alphabetical')).toBe('Alphabetical');
  });
});
