import {
  isResolvedClassic,
  collectResolvedClassics,
  isUserEjectedShow,
  mergeCuratedClassics,
} from '../../utils/classicShowsPool';
import { setShowUserRating, resetStoreForTests } from '../../services/userRatingsStore';
import { GratefulDeadShow } from '../../types/show.types';

const show = (date: string, id: string, classicTier?: 1 | 2 | 3): GratefulDeadShow => ({
  date, year: date.slice(0, 4), versions: [], primaryIdentifier: id, title: id,
  ...(classicTier ? { classicTier } : {}),
});

beforeEach(() => resetStoreForTests());

describe('isResolvedClassic', () => {
  it('true for system classics (Cornell 77)', () => {
    expect(isResolvedClassic('1977-05-08')).toBe(true);
  });
  it('false for unrated shows', () => {
    expect(isResolvedClassic('1966-01-08')).toBe(false);
  });
  it('user rating adds a show to the classic pool', () => {
    setShowUserRating('1966-01-08', 2);
    expect(isResolvedClassic('1966-01-08')).toBe(true);
  });
  it('0-star override ejects a system classic', () => {
    setShowUserRating('1977-05-08', 0);
    expect(isResolvedClassic('1977-05-08')).toBe(false);
  });
});

describe('isUserEjectedShow', () => {
  it('true when the user explicitly rates a show 0 stars', () => {
    setShowUserRating('1977-05-08', 0);
    expect(isUserEjectedShow('1977-05-08')).toBe(true);
  });
  it('false for an unrated show (no override at all)', () => {
    expect(isUserEjectedShow('1966-01-08')).toBe(false);
  });
  it('false when the user rates a show above 0 stars', () => {
    setShowUserRating('1966-01-08', 2);
    expect(isUserEjectedShow('1966-01-08')).toBe(false);
  });
  it('false for a system classic with no user override', () => {
    expect(isUserEjectedShow('1977-05-08')).toBe(false);
  });
});

describe('collectResolvedClassics', () => {
  it('collects by resolved rating, deduped', () => {
    setShowUserRating('1966-01-08', 3);
    const byYear = {
      '1966': [show('1966-01-08T00:00:00Z', 'a')],
      '1977': [show('1977-05-08T00:00:00Z', 'b', 1), show('1977-05-08T00:00:00Z', 'b', 1)],
    };
    const result = collectResolvedClassics(byYear);
    expect(result.map(s => s.primaryIdentifier).sort()).toEqual(['a', 'b']);
  });
});

describe('mergeCuratedClassics', () => {
  // Exercises the actual wiring used by DiscoverLandingScreen's classicShows
  // memo: curated dates found in showsByYear, filtered by isUserEjectedShow,
  // merged onto a base list without duplicates.
  it('merges a curated date with no rating at all', () => {
    const byYear = { '1966': [show('1966-01-08T00:00:00Z', 'a')] };
    const result = mergeCuratedClassics(byYear, ['1966-01-08'], []);
    expect(result.map(s => s.primaryIdentifier)).toEqual(['a']);
  });

  it('does not merge a curated date the user explicitly rated 0 stars', () => {
    setShowUserRating('1966-01-08', 0);
    const byYear = { '1966': [show('1966-01-08T00:00:00Z', 'a')] };
    const result = mergeCuratedClassics(byYear, ['1966-01-08'], []);
    expect(result.map(s => s.primaryIdentifier)).toEqual([]);
  });

  it('does not duplicate a show already present in the base list', () => {
    setShowUserRating('1966-01-08', 2);
    const byYear = { '1966': [show('1966-01-08T00:00:00Z', 'a')] };
    const base = collectResolvedClassics(byYear);
    expect(base.map(s => s.primaryIdentifier)).toEqual(['a']);

    const result = mergeCuratedClassics(byYear, ['1966-01-08'], base);
    expect(result.map(s => s.primaryIdentifier)).toEqual(['a']);
  });
});
