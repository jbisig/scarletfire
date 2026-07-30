import { compareByResolvedRating } from '../../utils/performanceSort';
import { compareByDate } from '../../utils/sortComparators';

const p = (date: string, stars: number | null) => ({ date, stars });
const cmp = (a: ReturnType<typeof p>, b: ReturnType<typeof p>) =>
  compareByResolvedRating(a, b, compareByDate);

it('higher stars sort first', () => {
  expect(cmp(p('1970-01-01', 3), p('1971-01-01', 1))).toBeLessThan(0);
  expect(cmp(p('1970-01-01', 1), p('1971-01-01', 3))).toBeGreaterThan(0);
});

it('0-star overrides sort below 1 star but above unrated', () => {
  expect(cmp(p('1970-01-01', 0), p('1971-01-01', 1))).toBeGreaterThan(0);
  expect(cmp(p('1970-01-01', 0), p('1971-01-01', null))).toBeLessThan(0);
});

it('unrated sorts last; ties fall back to oldest date first', () => {
  expect(cmp(p('1970-01-01', null), p('1971-01-01', 2))).toBeGreaterThan(0);
  expect(cmp(p('1972-01-01', 2), p('1970-01-01', 2))).toBeGreaterThan(0);
});
