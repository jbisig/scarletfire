/**
 * Tests for shuffle utility function
 */

import { shuffleArray } from '../../utils/shuffle';

describe('shuffleArray', () => {
  it('returns an array of the same length', () => {
    const input = [1, 2, 3, 4, 5];
    const result = shuffleArray(input);
    expect(result).toHaveLength(input.length);
  });

  it('contains all original elements', () => {
    const input = [1, 2, 3, 4, 5];
    const result = shuffleArray(input);
    expect(result.sort()).toEqual(input.sort());
  });

  it('does not modify the original array', () => {
    const input = [1, 2, 3, 4, 5];
    const originalCopy = [...input];
    shuffleArray(input);
    expect(input).toEqual(originalCopy);
  });

  it('handles empty arrays', () => {
    const result = shuffleArray([]);
    expect(result).toEqual([]);
  });

  it('handles single element arrays', () => {
    const result = shuffleArray([42]);
    expect(result).toEqual([42]);
  });

  it('produces different orderings (statistical test)', () => {
    const input = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const results = new Set<string>();

    // Run shuffle 20 times and collect unique orderings
    for (let i = 0; i < 20; i++) {
      results.add(JSON.stringify(shuffleArray(input)));
    }

    // With 10 elements, we should get multiple different orderings
    // (probability of getting same order twice is astronomically low)
    expect(results.size).toBeGreaterThan(1);
  });
});
