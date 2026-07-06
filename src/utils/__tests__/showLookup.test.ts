import {
  findShowByDate,
  getCorrectVenue,
  resolveIdentifierFromDate,
  getAllShowsSorted,
  findShowIndexByDate,
  findNextShow,
} from '../showLookup';
import showsData from '../../data/shows.json';
import { ShowsByYear } from '../../types/show.types';

const rawShowsByYear = showsData as ShowsByYear;
const allRawShows = Object.values(rawShowsByYear).flat();

describe('showLookup', () => {
  describe('findShowByDate', () => {
    it('finds a show on an exact YYYY-MM-DD hit', () => {
      const known = allRawShows[100];
      const normalizedDate = known.date.substring(0, 10);
      const found = findShowByDate(normalizedDate);
      expect(found?.primaryIdentifier).toBe(known.primaryIdentifier);
    });

    it('finds a show when given a full ISO timestamp', () => {
      const known = allRawShows[200];
      const found = findShowByDate(known.date);
      expect(found?.primaryIdentifier).toBe(known.primaryIdentifier);
    });

    it('returns undefined for a date with no show (miss)', () => {
      // Grateful Dead did not play in the year 2050
      expect(findShowByDate('2050-01-01')).toBeUndefined();
    });

    it('returns undefined for a date with no show but a valid year that exists', () => {
      // Feb 30th never exists in any calendar
      expect(findShowByDate('1977-02-30')).toBeUndefined();
    });
  });

  describe('getCorrectVenue', () => {
    it('returns the venue for a known show date', () => {
      const known = allRawShows.find(s => s.title?.includes('Live at'));
      expect(known).toBeDefined();
      const normalizedDate = known!.date.substring(0, 10);
      const venue = getCorrectVenue(normalizedDate);
      expect(venue).toBeTruthy();
      expect(typeof venue).toBe('string');
    });

    it('returns undefined for a date with no show', () => {
      expect(getCorrectVenue('2050-01-01')).toBeUndefined();
    });
  });

  describe('resolveIdentifierFromDate', () => {
    it('resolves a YYYY-MM-DD date string to the primaryIdentifier', () => {
      const known = allRawShows[50];
      const normalizedDate = known.date.substring(0, 10);
      expect(resolveIdentifierFromDate(normalizedDate)).toBe(known.primaryIdentifier);
    });

    it('passes through a non-date identifier unchanged', () => {
      expect(resolveIdentifierFromDate('gd1977-05-08.sbd.hicks.4982.sbeok.shnf')).toBe(
        'gd1977-05-08.sbd.hicks.4982.sbeok.shnf'
      );
    });

    it('passes through a date string with no matching show unchanged', () => {
      expect(resolveIdentifierFromDate('2050-01-01')).toBe('2050-01-01');
    });
  });

  describe('getAllShowsSorted', () => {
    it('returns shows in ascending chronological order', () => {
      const sorted = getAllShowsSorted();
      expect(sorted.length).toBe(allRawShows.length);
      for (let i = 1; i < sorted.length; i++) {
        const prev = sorted[i - 1].date.substring(0, 10);
        const curr = sorted[i].date.substring(0, 10);
        expect(prev <= curr).toBe(true);
      }
    });

    it('returns the same array reference on repeated calls (lazy memoization)', () => {
      expect(getAllShowsSorted()).toBe(getAllShowsSorted());
    });
  });

  describe('findShowIndexByDate (binary search)', () => {
    it('finds the upper-bound index for the very first show (edge: first)', () => {
      const sorted = getAllShowsSorted();
      const firstDate = sorted[0].date;
      const idx = findShowIndexByDate(firstDate);
      // Everything from idx onward must be strictly after firstDate.
      expect(idx).toBeGreaterThanOrEqual(1);
      if (idx < sorted.length) {
        expect(sorted[idx].date.substring(0, 10) > firstDate.substring(0, 10)).toBe(true);
      }
    });

    it('finds the upper-bound index for the very last show (edge: last)', () => {
      const sorted = getAllShowsSorted();
      const lastDate = sorted[sorted.length - 1].date;
      const idx = findShowIndexByDate(lastDate);
      expect(idx).toBe(sorted.length);
    });

    it('finds the correct insertion point for an absent date (edge: absent)', () => {
      const sorted = getAllShowsSorted();
      // A date far beyond the catalog's end.
      const idx = findShowIndexByDate('2050-01-01');
      expect(idx).toBe(sorted.length);
    });

    it('finds the correct insertion point for a date before the catalog start', () => {
      const idx = findShowIndexByDate('1900-01-01');
      expect(idx).toBe(0);
    });

    it('matches a brute-force linear scan for a sample of dates across the catalog', () => {
      const sorted = getAllShowsSorted();
      const sampleIndices = [0, 1, 10, 100, 500, 1000, sorted.length - 2, sorted.length - 1];
      for (const i of sampleIndices) {
        if (i < 0 || i >= sorted.length) continue;
        const date = sorted[i].date.substring(0, 10);
        const expectedIdx = sorted.findIndex(s => s.date.substring(0, 10) > date);
        const bruteForceIdx = expectedIdx === -1 ? sorted.length : expectedIdx;
        expect(findShowIndexByDate(date)).toBe(bruteForceIdx);
      }
    });
  });

  describe('findNextShow', () => {
    it('returns the chronologically next show after a mid-catalog date', () => {
      const sorted = getAllShowsSorted();
      const midIndex = Math.floor(sorted.length / 2);
      const midShow = sorted[midIndex];
      const next = findNextShow(midShow.date);
      expect(next?.primaryIdentifier).toBe(sorted[midIndex + 1].primaryIdentifier);
    });

    it('returns null when called on the last show in the catalog', () => {
      const sorted = getAllShowsSorted();
      const lastShow = sorted[sorted.length - 1];
      expect(findNextShow(lastShow.date)).toBeNull();
    });
  });
});
