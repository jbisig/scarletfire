import {
  compareBySavedAt,
  compareByDate,
  compareAlphabetical,
} from '../sortComparators';

describe('compareBySavedAt', () => {
  describe('newest first (default direction)', () => {
    it('orders larger timestamps before smaller ones', () => {
      expect(compareBySavedAt(200, 100)).toBeLessThan(0);
      expect(compareBySavedAt(100, 200)).toBeGreaterThan(0);
    });

    it('treats equal timestamps as equal', () => {
      expect(compareBySavedAt(100, 100)).toBe(0);
    });

    it('sorts a missing savedAt LAST (canonical tri-state policy)', () => {
      // a is missing -> a should sort after b
      expect(compareBySavedAt(undefined, 100, 'newest')).toBeGreaterThan(0);
      // b is missing -> b should sort after a
      expect(compareBySavedAt(100, undefined, 'newest')).toBeLessThan(0);
    });

    it('treats two missing values as equal', () => {
      expect(compareBySavedAt(undefined, undefined, 'newest')).toBe(0);
      expect(compareBySavedAt(null, null, 'newest')).toBe(0);
    });

    it('treats 0 as a real (missing/falsy but present) timestamp — only null/undefined count as missing', () => {
      // Guards against the `a.savedAt || 0` bug this task fixes: an actual
      // saved timestamp of 0 (epoch) must not be conflated with "no value".
      expect(compareBySavedAt(0, 100, 'newest')).toBeGreaterThan(0);
    });
  });

  describe('oldest first', () => {
    it('orders smaller timestamps before larger ones', () => {
      expect(compareBySavedAt(100, 200, 'oldest')).toBeLessThan(0);
      expect(compareBySavedAt(200, 100, 'oldest')).toBeGreaterThan(0);
    });

    it('sorts a missing savedAt FIRST (canonical tri-state policy, opposite of newest)', () => {
      expect(compareBySavedAt(undefined, 100, 'oldest')).toBeLessThan(0);
      expect(compareBySavedAt(100, undefined, 'oldest')).toBeGreaterThan(0);
    });

    it('treats two missing values as equal', () => {
      expect(compareBySavedAt(undefined, undefined, 'oldest')).toBe(0);
    });
  });

  it('matches FavoritesScreen canonical policy end-to-end when sorting a mixed list', () => {
    const items = [
      { id: 'a', savedAt: 100 },
      { id: 'b', savedAt: undefined },
      { id: 'c', savedAt: 300 },
      { id: 'd', savedAt: undefined },
      { id: 'e', savedAt: 200 },
    ];

    const newest = [...items].sort((x, y) => compareBySavedAt(x.savedAt, y.savedAt, 'newest'));
    expect(newest.map((i) => i.id).slice(0, 3)).toEqual(['c', 'e', 'a']);
    // Missing values trail at the end on "newest first"
    expect(newest.slice(3).map((i) => i.id).sort()).toEqual(['b', 'd']);

    const oldest = [...items].sort((x, y) => compareBySavedAt(x.savedAt, y.savedAt, 'oldest'));
    // Missing values lead at the start on "oldest first"
    expect(oldest.slice(0, 2).map((i) => i.id).sort()).toEqual(['b', 'd']);
    expect(oldest.slice(2).map((i) => i.id)).toEqual(['a', 'e', 'c']);
  });
});

describe('compareByDate', () => {
  it('defaults to oldest-first (ascending) ordering', () => {
    expect(compareByDate('1977-05-08', '1972-05-04')).toBeGreaterThan(0);
    expect(compareByDate('1972-05-04', '1977-05-08')).toBeLessThan(0);
  });

  it('supports explicit oldest direction', () => {
    expect(compareByDate('1972-05-04', '1977-05-08', 'oldest')).toBeLessThan(0);
  });

  it('supports newest direction (descending)', () => {
    expect(compareByDate('1977-05-08', '1972-05-04', 'newest')).toBeLessThan(0);
    expect(compareByDate('1972-05-04', '1977-05-08', 'newest')).toBeGreaterThan(0);
  });

  it('treats equal date strings as equal', () => {
    expect(compareByDate('1977-05-08', '1977-05-08')).toBe(0);
    expect(compareByDate('1977-05-08', '1977-05-08', 'newest')).toBe(0);
  });

  it('works for ISO added-at timestamps, not just show dates', () => {
    const older = '2024-01-01T00:00:00.000Z';
    const newer = '2024-06-01T00:00:00.000Z';
    expect(compareByDate(older, newer, 'oldest')).toBeLessThan(0);
    expect(compareByDate(older, newer, 'newest')).toBeGreaterThan(0);
  });
});

describe('compareAlphabetical', () => {
  it('orders strings alphabetically', () => {
    expect(compareAlphabetical('Alpine Valley', 'Winterland')).toBeLessThan(0);
    expect(compareAlphabetical('Winterland', 'Alpine Valley')).toBeGreaterThan(0);
  });

  it('treats equal strings as equal', () => {
    expect(compareAlphabetical('Winterland', 'Winterland')).toBe(0);
  });

  it('is case-insensitive-ish via localeCompare defaults (matches prior screen behavior)', () => {
    // Prior implementations used String.prototype.localeCompare directly;
    // this just documents that this helper is a thin, behavior-preserving wrapper.
    expect(compareAlphabetical('a', 'B')).toBe('a'.localeCompare('B'));
  });
});
