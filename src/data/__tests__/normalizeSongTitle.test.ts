import { normalizeSongTitleForLookup } from '../songPerformanceRatings';
import { COLORS } from '../../constants/theme';
import { STORAGE_KEYS } from '../../constants/registry';

describe('normalizeSongTitleForLookup (exported)', () => {
  it('strips the Grateful Dead prefix and lowercases', () => {
    expect(normalizeSongTitleForLookup('Grateful Dead - Playing In The Band')).toBe(
      'playing in the band'
    );
  });

  it('produces identical keys for archive-style and heady-style titles', () => {
    expect(normalizeSongTitleForLookup("Playin' In The Band")).toBe(
      normalizeSongTitleForLookup('Grateful Dead - Playing In The Band')
    );
  });
});

describe('foundation constants', () => {
  it('defines the gold user-rating color', () => {
    expect(COLORS.userRating).toBe('#E5B44C');
  });

  it('registers the user ratings storage key', () => {
    expect(STORAGE_KEYS.USER_RATINGS).toBe('@user_ratings');
  });
});
