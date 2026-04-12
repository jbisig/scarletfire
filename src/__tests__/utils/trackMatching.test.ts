import { calculateSimilarity, matchTrackBySlug } from '../../utils/trackMatching';

describe('calculateSimilarity', () => {
  it('returns 1 for identical strings', () => {
    expect(calculateSimilarity('dark star', 'dark star')).toBe(1);
  });

  it('returns 0 for completely different strings of equal length', () => {
    expect(calculateSimilarity('abcd', 'wxyz')).toBe(0);
  });

  it('returns a value between 0 and 1 for partial matches', () => {
    const score = calculateSimilarity('franklins tower', 'franklin tower');
    expect(score).toBeGreaterThan(0.5);
    expect(score).toBeLessThan(1);
  });

  it('is case insensitive', () => {
    expect(calculateSimilarity('Dark Star', 'dark star')).toBe(1);
  });

  it('returns 1 for two empty strings', () => {
    expect(calculateSimilarity('', '')).toBe(1);
  });
});

describe('matchTrackBySlug', () => {
  const tracks = [
    { id: 't1', title: "Franklin's Tower" },
    { id: 't2', title: 'Dark Star' },
    { id: 't3', title: 'Scarlet Begonias' },
  ];

  it('finds an exact-ish match for a simple slug', () => {
    // URL slug format is already lowercased + hyphenated in the existing
    // ShowDetailScreen effect — it lowercases the incoming trackTitle
    // (from route params) directly, without replacing hyphens.
    const result = matchTrackBySlug('dark star', tracks, 0.85);
    expect(result?.id).toBe('t2');
  });

  it('returns null when no track clears the threshold', () => {
    const result = matchTrackBySlug('not-a-real-song', tracks, 0.85);
    expect(result).toBeNull();
  });

  it('returns null for an empty track list', () => {
    const result = matchTrackBySlug('dark star', [], 0.85);
    expect(result).toBeNull();
  });

  it('matches case-insensitively', () => {
    const result = matchTrackBySlug('DARK STAR', tracks, 0.85);
    expect(result?.id).toBe('t2');
  });
});
