import {
  CURATED_COLLECTIONS,
  CLASSIC_SHOWS,
} from '../curatedCollections';
import showsJson from '../shows.json';

const KNOWN_DATES = new Set<string>(
  Object.values(showsJson as Record<string, { date: string }[]>)
    .flat()
    .map(s => s.date.substring(0, 10)),
);

describe('CURATED_COLLECTIONS data integrity', () => {
  it('has at least the 11 legendary run collections', () => {
    expect(CURATED_COLLECTIONS.length).toBeGreaterThanOrEqual(11);
  });

  it('has unique ids', () => {
    const ids = CURATED_COLLECTIONS.map(c => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every collection has a title, description, and at least one date', () => {
    for (const c of CURATED_COLLECTIONS) {
      expect(c.title.trim()).not.toBe('');
      expect(c.description.trim()).not.toBe('');
      expect(c.dates.length).toBeGreaterThan(0);
    }
  });

  it('every date is a valid YYYY-MM-DD string', () => {
    for (const c of CURATED_COLLECTIONS) {
      for (const d of c.dates) {
        expect(d).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      }
    }
  });

  it('every date resolves to a real show in shows.json', () => {
    const missing: string[] = [];
    for (const c of CURATED_COLLECTIONS) {
      for (const d of c.dates) {
        if (!KNOWN_DATES.has(d)) missing.push(`${c.id}: ${d}`);
      }
    }
    expect(missing).toEqual([]);
  });

  it('every collection is a strict curation — at most 12 shows', () => {
    const oversized = CURATED_COLLECTIONS
      .filter(c => c.dates.length > 12)
      .map(c => `${c.id} (${c.dates.length})`);
    expect(oversized).toEqual([]);
  });

  it('dates within a collection are unique and sorted ascending', () => {
    for (const c of CURATED_COLLECTIONS) {
      const sorted = [...c.dates].sort();
      expect(c.dates).toEqual(sorted);
      expect(new Set(c.dates).size).toBe(c.dates.length);
    }
  });
});

describe('CLASSIC_SHOWS', () => {
  it('is a hand-curated list of exactly 12 shows', () => {
    expect(CLASSIC_SHOWS.dates).toHaveLength(12);
  });

  it('has a title and a non-empty description', () => {
    expect(CLASSIC_SHOWS.title).toBe('Classic Shows');
    expect(CLASSIC_SHOWS.description.trim()).not.toBe('');
  });

  it('every date is valid, unique, and resolves to a real show', () => {
    expect(new Set(CLASSIC_SHOWS.dates).size).toBe(CLASSIC_SHOWS.dates.length);
    for (const d of CLASSIC_SHOWS.dates) {
      expect(d).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(KNOWN_DATES.has(d)).toBe(true);
    }
  });

  it('leads with Cornell — the list is ranked, not chronological', () => {
    expect(CLASSIC_SHOWS.dates[0]).toBe('1977-05-08');
  });
});
