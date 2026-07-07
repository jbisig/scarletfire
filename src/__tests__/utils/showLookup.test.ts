/**
 * Catalog-integrity test for shows.json.
 *
 * showLookup.ts builds two lazily-materialized structures over shows.json:
 * a Map<normalizedDate, Show> (findShowByDate) and a chronologically sorted
 * array searched via binary search (findShowIndexByDate / findNextShow).
 * Both assume at most one show per normalized ("YYYY-MM-DD") date -- if the
 * catalog ever contained two shows on the same date, the Map index would
 * silently drop one of them while the sorted-array binary search would
 * still "find" a show for that date, giving inconsistent results depending
 * on which lookup path is used. This test guards that invariant directly
 * against the raw data file, independent of showLookup's implementation.
 */

import showsData from '../../data/shows.json';
import { ShowsByYear } from '../../types/show.types';

describe('shows.json catalog integrity', () => {
  it('has no duplicate normalized (YYYY-MM-DD) show dates', () => {
    const allShowsByYear = showsData as ShowsByYear;
    const dates = Object.values(allShowsByYear)
      .flat()
      .map(show => show.date.substring(0, 10));

    expect(new Set(dates).size).toBe(dates.length);
  });
});
