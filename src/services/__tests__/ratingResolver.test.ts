// src/services/__tests__/ratingResolver.test.ts
import { resolveShowRating, resolvePerformanceRating, tierToStars } from '../ratingResolver';
import {
  setShowUserRating,
  resetShowUserRating,
  setPerformanceUserRating,
  resetStoreForTests,
} from '../userRatingsStore';
import { getClassicTier } from '../../data/classicShowsTiers';
import { getSongPerformanceRating } from '../../data/songPerformanceRatings';

beforeEach(() => resetStoreForTests());

// Real fixture dates from the static data — verified in the test itself so
// the test fails loudly if the curated data ever changes.
const CLASSIC_DATE = '1977-05-08';       // Cornell — tier 1 in TIER_1_SHOWS
const UNRATED_DATE = '1966-01-08';       // no classic tier

describe('tierToStars', () => {
  it('inverts the tier scale', () => {
    expect(tierToStars(1)).toBe(3);
    expect(tierToStars(2)).toBe(2);
    expect(tierToStars(3)).toBe(1);
  });
});

describe('resolveShowRating', () => {
  it('falls back to the system classic tier when no override', () => {
    const tier = getClassicTier(CLASSIC_DATE);
    expect(tier).toBe(1); // fixture guard
    expect(resolveShowRating(CLASSIC_DATE)).toEqual({ stars: 3, isUserRating: false });
  });

  it('returns null when neither user nor system rating exists', () => {
    expect(getClassicTier(UNRATED_DATE)).toBeNull(); // fixture guard
    expect(resolveShowRating(UNRATED_DATE)).toBeNull();
  });

  it('user rating wins over system rating', () => {
    setShowUserRating(CLASSIC_DATE, 1);
    expect(resolveShowRating(CLASSIC_DATE)).toEqual({ stars: 1, isUserRating: true });
  });

  it('a 0-star override suppresses the system rating', () => {
    setShowUserRating(CLASSIC_DATE, 0);
    expect(resolveShowRating(CLASSIC_DATE)).toEqual({ stars: 0, isUserRating: true });
  });

  it('reset falls back to the system rating', () => {
    setShowUserRating(CLASSIC_DATE, 0);
    resetShowUserRating(CLASSIC_DATE);
    expect(resolveShowRating(CLASSIC_DATE)).toEqual({ stars: 3, isUserRating: false });
  });

  it('handles ISO timestamps in the date', () => {
    expect(resolveShowRating(`${CLASSIC_DATE}T00:00:00Z`)).toEqual({ stars: 3, isUserRating: false });
  });
});

describe('resolvePerformanceRating', () => {
  // Find a real system-rated performance so the test is stable against data.
  const SYSTEM_TITLE = 'Grateful Dead - Playing In The Band';
  const SYSTEM_DATE = '1972-08-27';

  it('falls back to system performance rating when no override', () => {
    const systemTier = getSongPerformanceRating(SYSTEM_TITLE, SYSTEM_DATE);
    expect(systemTier).not.toBeNull(); // fixture guard — a famous tier-1 version
    expect(resolvePerformanceRating(SYSTEM_TITLE, SYSTEM_DATE)).toEqual({
      stars: tierToStars(systemTier!),
      isUserRating: false,
    });
  });

  it('user rating wins, keyed identically across title variants', () => {
    setPerformanceUserRating("Playin' In The Band", SYSTEM_DATE, 2);
    expect(resolvePerformanceRating(SYSTEM_TITLE, SYSTEM_DATE)).toEqual({
      stars: 2,
      isUserRating: true,
    });
  });

  it('returns null for an unrated performance', () => {
    expect(resolvePerformanceRating('Not A Real Song Title XYZ', '1970-01-01')).toBeNull();
  });
});
