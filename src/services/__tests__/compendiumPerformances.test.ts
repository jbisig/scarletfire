import { COMPENDIUM_RATINGS } from '../../data/compendiumRatings';
import { getSongPerformanceRating } from '../../data/songPerformanceRatings';
import {
  getCompendiumPerformance,
  getCompendiumPerformanceTier,
  getPannedButRatedPerformances,
  resetCompendiumPerformanceIndex,
} from '../compendiumPerformances';
import { resolveSystemPerformanceStars } from '../ratingResolver';

beforeEach(resetCompendiumPerformanceIndex);

describe('compendium performance ratings', () => {
  it('maps assessments to tiers, and refuses to rate rare or panned ones', () => {
    expect(getCompendiumPerformanceTier('Morning Dew', '1977-05-08')).toBe(1);   // legendary
    expect(getCompendiumPerformanceTier('Scarlet Begonias', '1977-05-08')).toBe(2); // excellent
    expect(getCompendiumPerformanceTier('Loser', '1977-05-08')).toBe(3);          // notable

    const panned = getCompendiumPerformance('Hard to Handle', '1969-04-05');
    expect(panned?.assessment).toBe('negative');
    expect(panned?.isPanned).toBe(true);
    expect(panned?.tier).toBeNull();
  });

  it('never gives stars for rarity alone', () => {
    // A show can name the same song twice — 1983-10-08 flags Crazy Fingers as
    // both `rare` and `excellent` — and the index keeps the stronger claim. So
    // this asserts on the assessment the index actually resolved to, not on
    // every raw highlight.
    let seen = 0;
    for (const [date, entry] of Object.entries(COMPENDIUM_RATINGS)) {
      for (const h of entry.highlights) {
        const p = getCompendiumPerformance(h.canonicalTitle || h.song, date);
        if (!p || (p.assessment !== 'rare' && p.assessment !== 'negative')) continue;
        seen++;
        expect([date, h.song, p.tier]).toEqual([date, h.song, null]);
      }
    }
    expect(seen).toBeGreaterThan(100);
  });

  it('accepts ISO timestamps as well as plain dates', () => {
    expect(getCompendiumPerformanceTier('Morning Dew', '1977-05-08T00:00:00Z')).toBe(1);
  });

  it('finds a performance by the Compendium spelling or the catalog title', () => {
    // "Samson and Delilah" in the notes, "Samson & Delilah" in the catalog.
    const a = getCompendiumPerformance('Samson & Delilah', '1977-05-08');
    const b = getCompendiumPerformance('Samson and Delilah', '1977-05-08');
    expect(a).toEqual(b);
  });

  it('never overrides a vote-based rating', () => {
    let checked = 0;
    for (const [date, entry] of Object.entries(COMPENDIUM_RATINGS)) {
      for (const h of entry.highlights) {
        const song = h.canonicalTitle || h.song;
        const voted = getSongPerformanceRating(song, date);
        if (!voted) continue;
        checked++;
        expect([date, song, resolveSystemPerformanceStars(song, date)])
          .toEqual([date, song, (4 - voted) as 1 | 2 | 3]);
      }
    }
    expect(checked).toBeGreaterThan(100);
  });

  it('fills gaps the vote-based sources leave', () => {
    // The 6/7/69 Dark Star and St. Stephen are called legendary in the notes
    // and carry no vote-based rating from either existing source.
    for (const song of ['Dark Star', 'St. Stephen']) {
      expect([song, getSongPerformanceRating(song, '1969-06-07')]).toEqual([song, null]);
      expect([song, getCompendiumPerformanceTier(song, '1969-06-07')]).toEqual([song, 1]);
      expect([song, resolveSystemPerformanceStars(song, '1969-06-07')]).toEqual([song, 3]);
    }
  });

  it('returns null for songs and dates it knows nothing about', () => {
    expect(getCompendiumPerformanceTier('Morning Dew', '1900-01-01')).toBeNull();
    expect(getCompendiumPerformance('Not A Real Song', '1977-05-08')).toBeNull();
  });

  it('reports panned-but-rated performances for review without demoting them', () => {
    const conflicts = getPannedButRatedPerformances(resolveSystemPerformanceStars);
    expect(conflicts.length).toBeGreaterThan(0);
    for (const c of conflicts) {
      // Still rated: the criticism is surfaced, never applied.
      expect([c.date, c.song, c.stars]).toEqual([c.date, c.song, c.stars]);
      expect(resolveSystemPerformanceStars(c.song, c.date)).toBe(c.stars);
      expect(c.quote.length).toBeGreaterThan(0);
    }
  });

  it('quotes every performance verbatim from its show note', () => {
    // Guarded fully in compendiumRatings.test.ts; this asserts the index
    // carries the quote through unmodified.
    const p = getCompendiumPerformance('Morning Dew', '1977-05-08');
    expect(COMPENDIUM_RATINGS['1977-05-08'].highlights
      .some(h => h.quote === p?.quote)).toBe(true);
  });
});
