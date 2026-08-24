import {
  resolveCollectionShows,
  resolveCollectionShowsRanked,
} from '../../utils/curatedCollectionsPool';
import { setShowUserRating, resetStoreForTests } from '../../services/userRatingsStore';
import { GratefulDeadShow } from '../../types/show.types';

const show = (date: string, id: string): GratefulDeadShow => ({
  date, year: date.slice(0, 4), versions: [], primaryIdentifier: id, title: id,
});

beforeEach(() => resetStoreForTests());

describe('resolveCollectionShows', () => {
  const byYear = {
    '1972': [
      show('1972-04-08T00:00:00Z', 'wembley'),
      show('1972-05-26T00:00:00Z', 'lyceum'),
    ],
    '1977': [show('1977-05-08T00:00:00Z', 'cornell')],
  };

  it('resolves dates to shows in chronological order regardless of authored order', () => {
    const result = resolveCollectionShows(byYear, ['1977-05-08', '1972-05-26', '1972-04-08']);
    expect(result.map(s => s.primaryIdentifier)).toEqual(['wembley', 'lyceum', 'cornell']);
  });

  it('skips dates with no matching show', () => {
    const result = resolveCollectionShows(byYear, ['1972-04-08', '1999-01-01']);
    expect(result.map(s => s.primaryIdentifier)).toEqual(['wembley']);
  });

  it('dedupes shows that share a primary identifier', () => {
    const dupes = {
      '1972': [show('1972-04-08T00:00:00Z', 'same'), show('1972-04-08T00:00:00Z', 'same')],
    };
    const result = resolveCollectionShows(dupes, ['1972-04-08', '1972-04-08']);
    expect(result).toHaveLength(1);
  });

  it('honors a user 0-star ejection', () => {
    setShowUserRating('1972-05-26', 0);
    const result = resolveCollectionShows(byYear, ['1972-04-08', '1972-05-26']);
    expect(result.map(s => s.primaryIdentifier)).toEqual(['wembley']);
  });

  it('returns an empty array for an empty date list', () => {
    expect(resolveCollectionShows(byYear, [])).toEqual([]);
  });
});

describe('resolveCollectionShowsRanked', () => {
  const byYear = {
    '1972': [
      show('1972-04-08T00:00:00Z', 'wembley'),
      show('1972-05-26T00:00:00Z', 'lyceum'),
    ],
    '1977': [show('1977-05-08T00:00:00Z', 'cornell')],
  };

  it('preserves the authored (ranked) order instead of sorting by date', () => {
    const result = resolveCollectionShowsRanked(byYear, ['1977-05-08', '1972-05-26', '1972-04-08']);
    expect(result.map(s => s.primaryIdentifier)).toEqual(['cornell', 'lyceum', 'wembley']);
  });

  it('still honors a user 0-star ejection', () => {
    setShowUserRating('1977-05-08', 0);
    const result = resolveCollectionShowsRanked(byYear, ['1977-05-08', '1972-04-08']);
    expect(result.map(s => s.primaryIdentifier)).toEqual(['wembley']);
  });
});
