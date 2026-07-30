import {
  performanceRatingKey,
  getUserRatings,
  getUserRatingsVersion,
  replaceUserRatings,
  setShowUserRating,
  resetShowUserRating,
  setPerformanceUserRating,
  resetPerformanceUserRating,
  getActiveShowRating,
  getActivePerformanceRating,
  subscribeUserRatings,
  mergeUserRatings,
  pruneTombstones,
  resetStoreForTests,
  UserRatings,
} from '../userRatingsStore';

beforeEach(() => resetStoreForTests());

describe('performanceRatingKey', () => {
  it('normalizes title and strips time from date', () => {
    expect(performanceRatingKey('Grateful Dead - Playing In The Band', '1972-08-27T00:00:00Z'))
      .toBe('playing in the band|1972-08-27');
  });
});

describe('set/reset show ratings', () => {
  it('stores an active rating keyed by date-only', () => {
    setShowUserRating('1977-05-08T00:00:00Z', 3);
    const entry = getActiveShowRating('1977-05-08');
    expect(entry).not.toBeNull();
    expect(entry!.stars).toBe(3);
  });

  it('stores an explicit 0-star rating as active', () => {
    setShowUserRating('1977-05-08', 0);
    expect(getActiveShowRating('1977-05-08')!.stars).toBe(0);
  });

  it('reset tombstones the entry (inactive but kept for sync)', () => {
    setShowUserRating('1977-05-08', 2);
    resetShowUserRating('1977-05-08');
    expect(getActiveShowRating('1977-05-08')).toBeNull();
    expect(getUserRatings().shows['1977-05-08'].deletedAt).toBeDefined();
  });

  it('re-rating after reset reactivates the entry', () => {
    setShowUserRating('1977-05-08', 2);
    resetShowUserRating('1977-05-08');
    setShowUserRating('1977-05-08', 1);
    expect(getActiveShowRating('1977-05-08')!.stars).toBe(1);
  });
});

describe('performance ratings', () => {
  it('stores title/identifier metadata and resolves via either title form', () => {
    setPerformanceUserRating("Playin' In The Band", '1972-08-27', 3, 'gd1972-08-27.sbd');
    const entry = getActivePerformanceRating('Grateful Dead - Playing In The Band', '1972-08-27');
    expect(entry).not.toBeNull();
    expect(entry!.stars).toBe(3);
    expect(entry!.showIdentifier).toBe('gd1972-08-27.sbd');
    expect(entry!.songTitle).toBe("Playin' In The Band");
  });

  it('reset tombstones a performance rating', () => {
    setPerformanceUserRating('Dark Star', '1969-02-27', 3);
    resetPerformanceUserRating('Dark Star', '1969-02-27');
    expect(getActivePerformanceRating('Dark Star', '1969-02-27')).toBeNull();
  });
});

describe('subscribe/version', () => {
  it('notifies listeners and bumps version on every mutation', () => {
    const listener = jest.fn();
    const unsubscribe = subscribeUserRatings(listener);
    const v0 = getUserRatingsVersion();
    setShowUserRating('1977-05-08', 3);
    expect(listener).toHaveBeenCalledTimes(1);
    expect(getUserRatingsVersion()).toBe(v0 + 1);
    unsubscribe();
    resetShowUserRating('1977-05-08');
    expect(listener).toHaveBeenCalledTimes(1);
  });
});

describe('mergeUserRatings', () => {
  const entry = (stars: 0 | 1 | 2 | 3, ratedAt: number, deletedAt?: number) =>
    ({ stars, ratedAt, ...(deletedAt ? { deletedAt } : {}) });

  it('takes the newer entry per key (latest-wins on max(ratedAt, deletedAt))', () => {
    const a: UserRatings = { shows: { d: entry(1, 100) }, performances: {} };
    const b: UserRatings = { shows: { d: entry(3, 200) }, performances: {} };
    expect(mergeUserRatings(a, b).shows['d'].stars).toBe(3);
    expect(mergeUserRatings(b, a).shows['d'].stars).toBe(3);
  });

  it('a newer tombstone beats an older rating', () => {
    const a: UserRatings = { shows: { d: entry(2, 100, 300) }, performances: {} };
    const b: UserRatings = { shows: { d: entry(3, 200) }, performances: {} };
    const merged = mergeUserRatings(a, b);
    expect(merged.shows['d'].deletedAt).toBe(300);
  });

  it('unions disjoint keys across both maps', () => {
    const a: UserRatings = { shows: { x: entry(1, 1) }, performances: { p1: entry(3, 1) } };
    const b: UserRatings = { shows: { y: entry(2, 2) }, performances: {} };
    const merged = mergeUserRatings(a, b);
    expect(Object.keys(merged.shows).sort()).toEqual(['x', 'y']);
    expect(Object.keys(merged.performances)).toEqual(['p1']);
  });
});

describe('pruneTombstones', () => {
  it('drops tombstones older than 30 days, keeps active entries', () => {
    const now = Date.now();
    const old = now - 31 * 24 * 60 * 60 * 1000;
    const ratings: UserRatings = {
      shows: {
        stale: { stars: 1, ratedAt: old - 1, deletedAt: old },
        fresh: { stars: 2, ratedAt: now - 1, deletedAt: now },
        active: { stars: 3, ratedAt: old },
      },
      performances: {},
    };
    const pruned = pruneTombstones(ratings, now);
    expect(pruned.shows['stale']).toBeUndefined();
    expect(pruned.shows['fresh']).toBeDefined();
    expect(pruned.shows['active']).toBeDefined();
  });
});
