/**
 * Tests for classic shows tier data and functions
 */

import {
  getClassicTier,
  isClassicShow,
  ALL_CLASSIC_SHOWS,
  TIER_1_SHOWS,
  TIER_2_SHOWS,
  TIER_3_SHOWS,
} from '../../data/classicShowsTiers';

describe('getClassicTier', () => {
  it('returns tier 1 for top classic shows', () => {
    // Cornell '77 - the most famous show
    expect(getClassicTier('1977-05-08')).toBe(1);
    // Veneta, Oregon
    expect(getClassicTier('1972-08-27')).toBe(1);
    // Winterland Farewell
    expect(getClassicTier('1978-12-31')).toBe(1);
  });

  it('returns tier 2 for highly regarded shows', () => {
    // One From The Vault
    expect(getClassicTier('1975-08-13')).toBe(2);
  });

  it('returns null for non-classic shows', () => {
    expect(getClassicTier('1977-01-01')).toBe(null);
    expect(getClassicTier('1985-06-15')).toBe(null);
  });
});

describe('isClassicShow', () => {
  it('returns true for classic shows', () => {
    expect(isClassicShow('1977-05-08')).toBe(true);
    expect(isClassicShow('1972-08-27')).toBe(true);
  });

  it('returns false for non-classic shows', () => {
    expect(isClassicShow('1977-01-01')).toBe(false);
    expect(isClassicShow('invalid-date')).toBe(false);
  });
});

describe('tier data arrays', () => {
  it('TIER_1_SHOWS contains essential shows', () => {
    expect(TIER_1_SHOWS.length).toBeGreaterThan(0);
    expect(TIER_1_SHOWS.every(show => show.tier === 1)).toBe(true);
    // Cornell should be in Tier 1
    expect(TIER_1_SHOWS.some(show => show.date === '1977-05-08')).toBe(true);
  });

  it('TIER_2_SHOWS contains excellent shows', () => {
    expect(TIER_2_SHOWS.length).toBeGreaterThan(0);
    expect(TIER_2_SHOWS.every(show => show.tier === 2)).toBe(true);
  });

  it('TIER_3_SHOWS contains notable shows', () => {
    expect(TIER_3_SHOWS.length).toBeGreaterThan(0);
    expect(TIER_3_SHOWS.every(show => show.tier === 3)).toBe(true);
  });

  it('ALL_CLASSIC_SHOWS is combination of all tiers', () => {
    const totalCount = TIER_1_SHOWS.length + TIER_2_SHOWS.length + TIER_3_SHOWS.length;
    expect(ALL_CLASSIC_SHOWS.length).toBe(totalCount);
  });

  it('all shows have valid date format', () => {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    ALL_CLASSIC_SHOWS.forEach(show => {
      expect(show.date).toMatch(dateRegex);
    });
  });

  it('no duplicate dates across all tiers', () => {
    const dates = ALL_CLASSIC_SHOWS.map(show => show.date);
    const uniqueDates = new Set(dates);
    expect(uniqueDates.size).toBe(dates.length);
  });
});
