import { isResolvedClassic, collectResolvedClassics } from '../../utils/classicShowsPool';
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
