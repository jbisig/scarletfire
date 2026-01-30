/**
 * Tests for official releases data functions
 */

import {
  getOfficialReleasesForDate,
  hasOfficialRelease,
  DISPLAY_SERIES,
  getAllSeries,
} from '../../data/officialReleases';

describe('getOfficialReleasesForDate', () => {
  it('returns releases for Cornell 77', () => {
    const releases = getOfficialReleasesForDate('1977-05-08');
    expect(releases.length).toBeGreaterThan(0);
    expect(releases.some(r => r.name.includes('Cornell'))).toBe(true);
  });

  it('returns empty array for date with no releases', () => {
    const releases = getOfficialReleasesForDate('1977-01-01');
    expect(releases).toEqual([]);
  });

  it('handles Europe 72 shows', () => {
    // Europe 72 show at Lyceum
    const releases = getOfficialReleasesForDate('1972-05-26');
    expect(releases.length).toBeGreaterThan(0);
  });
});

describe('hasOfficialRelease', () => {
  it('returns true for shows with releases', () => {
    expect(hasOfficialRelease('1977-05-08')).toBe(true);
  });

  it('returns false for shows without releases', () => {
    expect(hasOfficialRelease('1977-01-01')).toBe(false);
  });
});

describe('DISPLAY_SERIES', () => {
  it('contains expected series', () => {
    expect(DISPLAY_SERIES).toContain("Dick's Picks");
    expect(DISPLAY_SERIES).toContain("Dave's Picks");
    expect(DISPLAY_SERIES).toContain('Road Trips');
  });

  it('getAllSeries returns array of strings', () => {
    const allSeries = getAllSeries();
    expect(Array.isArray(allSeries)).toBe(true);
    expect(allSeries.length).toBeGreaterThan(0);
    expect(typeof allSeries[0]).toBe('string');
  });
});
