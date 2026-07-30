/**
 * Comparator for the "Rating (Highest First)" sort using resolved stars
 * (user overrides included). Higher stars first; explicit 0-star overrides
 * above unrated; unrated last; ties break by performance date, oldest first.
 */
export function compareByResolvedRating(
  a: { date: string; stars: number | null },
  b: { date: string; stars: number | null },
  compareByDate: (a: string, b: string, dir: 'oldest') => number,
): number {
  if (a.stars === null && b.stars === null) return compareByDate(a.date, b.date, 'oldest');
  if (a.stars === null) return 1;
  if (b.stars === null) return -1;
  if (a.stars !== b.stars) return b.stars - a.stars;
  return compareByDate(a.date, b.date, 'oldest');
}
