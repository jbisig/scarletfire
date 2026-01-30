/**
 * Tests for title normalization utilities
 */

import {
  normalizeTrackTitle,
  normalizeHeadyVersionTitle,
  shouldSkipTitle,
  normalizeSongTitle,
  normalizeForComparison,
} from '../../utils/titleNormalization';

describe('normalizeTrackTitle', () => {
  it('removes track numbers at start', () => {
    expect(normalizeTrackTitle('01 Dark Star')).toBe('Dark Star');
    expect(normalizeTrackTitle('1. Sugar Magnolia')).toBe('Sugar Magnolia');
    expect(normalizeTrackTitle('Track 1: Scarlet Begonias')).toBe('Scarlet Begonias');
  });

  it('removes version indicators', () => {
    expect(normalizeTrackTitle('Dark Star - aborted')).toBe('Dark Star');
    expect(normalizeTrackTitle('Playing in the Band - partial')).toBe('Playing in the Band');
    expect(normalizeTrackTitle('Truckin #2')).toBe('Truckin');
  });

  it('removes parenthetical and bracketed content', () => {
    expect(normalizeTrackTitle('Casey Jones (Reprise)')).toBe('Casey Jones');
    expect(normalizeTrackTitle('Sugar Magnolia [Live]')).toBe('Sugar Magnolia');
  });

  it('removes jam suffix', () => {
    expect(normalizeTrackTitle('Drums Jam')).toBe('Drums');
    expect(normalizeTrackTitle('Space jam')).toBe('Space');
  });

  it('handles clean titles unchanged', () => {
    expect(normalizeTrackTitle('Dark Star')).toBe('Dark Star');
    expect(normalizeTrackTitle('Scarlet Begonias')).toBe('Scarlet Begonias');
  });
});

describe('normalizeHeadyVersionTitle', () => {
  it('removes band prefix', () => {
    expect(normalizeHeadyVersionTitle('Grateful Dead - Dark Star')).toBe('Dark Star');
    expect(normalizeHeadyVersionTitle('Grateful Dead-Scarlet Begonias')).toBe('Scarlet Begonias');
  });

  it('decodes HTML entities', () => {
    expect(normalizeHeadyVersionTitle('Scarlet &gt; Fire')).toBe('Scarlet > Fire');
    expect(normalizeHeadyVersionTitle('&lt;Test&gt;')).toBe('<Test>');
    expect(normalizeHeadyVersionTitle('Rock &amp; Roll')).toBe('Rock & Roll');
  });

  it('trims whitespace', () => {
    expect(normalizeHeadyVersionTitle('  Dark Star  ')).toBe('Dark Star');
  });
});

describe('shouldSkipTitle', () => {
  it('returns true for non-song content', () => {
    expect(shouldSkipTitle('tuning')).toBe(true);
    expect(shouldSkipTitle('Stage Banter')).toBe(true);
    expect(shouldSkipTitle('TALK')).toBe(true);
    expect(shouldSkipTitle('Crowd noise')).toBe(true);
    expect(shouldSkipTitle('Unknown')).toBe(true);
    expect(shouldSkipTitle('Banter')).toBe(true);
  });

  it('returns false for actual songs', () => {
    expect(shouldSkipTitle('Dark Star')).toBe(false);
    expect(shouldSkipTitle('Truckin')).toBe(false);
    expect(shouldSkipTitle('Playing in the Band')).toBe(false);
  });
});

describe('normalizeSongTitle', () => {
  it('normalizes and returns song titles', () => {
    expect(normalizeSongTitle('01 Dark Star')).toBe('Dark Star');
    expect(normalizeSongTitle('Sugar Magnolia (Reprise)')).toBe('Sugar Magnolia');
  });

  it('returns empty string for non-song content', () => {
    expect(normalizeSongTitle('tuning')).toBe('');
    expect(normalizeSongTitle('banter')).toBe('');
  });

  it('returns empty string for empty input', () => {
    expect(normalizeSongTitle('')).toBe('');
  });
});

describe('normalizeForComparison', () => {
  it('lowercases and trims', () => {
    expect(normalizeForComparison('Dark Star')).toBe('dark star');
    expect(normalizeForComparison('  TRUCKIN  ')).toBe('truckin');
  });
});
