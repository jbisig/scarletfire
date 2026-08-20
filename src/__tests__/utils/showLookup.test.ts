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

  it('every recording carries a parsed format and lineage array (regenerated catalog)', () => {
    const allShowsByYear = showsData as ShowsByYear;
    const versions = Object.values(allShowsByYear).flat().flatMap(show => show.versions);
    const FORMATS = new Set(['sbd', 'aud', 'matrix', 'fm', 'unknown']);

    expect(versions.length).toBeGreaterThan(8000);
    for (const v of versions) {
      expect(FORMATS.has(v.format as string)).toBe(true);
      expect(Array.isArray(v.lineage)).toBe(true);
      expect(v).not.toHaveProperty('source');
    }
  });

  it('primaryIdentifier is the highest-download recording of its show', () => {
    const allShowsByYear = showsData as ShowsByYear;
    for (const show of Object.values(allShowsByYear).flat()) {
      const max = Math.max(...show.versions.map(v => v.downloads ?? 0));
      const primary = show.versions.find(v => v.identifier === show.primaryIdentifier);
      expect(primary?.downloads ?? 0).toBe(max);
    }
  });
});
