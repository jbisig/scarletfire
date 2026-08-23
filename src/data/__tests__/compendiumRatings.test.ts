import { SHOW_NOTES } from '../showNotes';
import {
  COMPENDIUM_RATINGS,
  CURATED_TIER_DISPUTES,
  getCompendiumTier,
  getShowHighlights,
  getShowSummary,
} from '../compendiumRatings';
import { getClassicTier } from '../classicShowsTiers';
import { resolveSystemShowStars } from '../../services/ratingResolver';

const entries = Object.entries(COMPENDIUM_RATINGS);

/**
 * compendiumRatings.ts is derived from SHOW_NOTES by a fan-out of judging
 * agents. The failure mode that matters is a quote that isn't actually in the
 * note it cites — a rating or a highlight nothing in the source supports — so
 * that is what these guard, along with the shape of the tier assignment.
 */
describe('COMPENDIUM_RATINGS', () => {
  it('covers exactly the dates SHOW_NOTES covers', () => {
    expect(entries.length).toBe(Object.keys(SHOW_NOTES).length);
    for (const [date] of entries) {
      expect([date, SHOW_NOTES[date] !== undefined]).toEqual([date, true]);
    }
  });

  it('quotes every piece of evidence verbatim from that date\'s note', () => {
    for (const [date, entry] of entries) {
      const note = SHOW_NOTES[date];
      for (const quote of entry.evidence ?? []) {
        expect([date, quote, note.includes(quote)]).toEqual([date, quote, true]);
      }
    }
  });

  it('quotes every highlight verbatim from that date\'s note', () => {
    for (const [date, entry] of entries) {
      const note = SHOW_NOTES[date];
      for (const highlight of entry.highlights) {
        expect([date, highlight.song, note.includes(highlight.quote)])
          .toEqual([date, highlight.song, true]);
      }
    }
  });

  it('only assigns a tier where there is evidence for it', () => {
    for (const [date, entry] of entries) {
      if (entry.tier === null) continue;
      expect([date, entry.evidence?.length ?? 0]).not.toEqual([date, 0]);
      expect([date, entry.verdict]).not.toEqual([date, 'insufficient']);
      expect([date, entry.score !== null]).toEqual([date, true]);
    }
  });

  it('keeps three stars rare and the tiers monotonic', () => {
    const counts = { 1: 0, 2: 0, 3: 0 };
    for (const [, entry] of entries) if (entry.tier) counts[entry.tier]++;
    expect(counts[1]).toBeGreaterThan(0);
    expect(counts[1]).toBeLessThan(counts[2]);
    expect(counts[2]).toBeLessThan(counts[3]);
    // A single book should not be minting classics wholesale.
    expect(counts[1] / entries.length).toBeLessThan(0.05);
  });

  it('never lets the Compendium override a curated tier', () => {
    for (const [date, entry] of entries) {
      const curated = getClassicTier(date);
      if (curated === null || entry.tier === null) continue;
      const stars = resolveSystemShowStars(date);
      expect([date, stars]).toEqual([date, (4 - curated) as 1 | 2 | 3]);
    }
  });

  it('fills in shows the curated list has no opinion on', () => {
    const filled = entries.filter(
      ([date, entry]) => entry.tier !== null && getClassicTier(date) === null
    );
    expect(filled.length).toBeGreaterThan(100);
    for (const [date] of filled.slice(0, 25)) {
      expect([date, resolveSystemShowStars(date) !== null]).toEqual([date, true]);
    }
  });

  it('flags curated/Compendium disputes instead of silently demoting them', () => {
    for (const dispute of CURATED_TIER_DISPUTES) {
      expect(getClassicTier(dispute.date)).toBe(dispute.curatedTier);
      // The curated rating still wins at read time.
      expect(resolveSystemShowStars(dispute.date))
        .toBe((4 - dispute.curatedTier) as 1 | 2 | 3);
    }
  });

  /**
   * The three dates below are the ones whose notes undercut a curated rating.
   * All were reviewed and settled in favour of the curated tier, so they no
   * longer appear in CURATED_TIER_DISPUTES — which means the loop above would
   * pass vacuously. These assert the settled outcome directly, so a
   * regeneration that quietly demoted one of them would fail here.
   */
  it.each([
    ['1977-05-09', 1, 3], // Buffalo — note praises the tape, not the playing
    ['1972-05-04', 2, 2], // Olympia, Paris — note calls the show unremarkable
    ['1969-04-05', 3, 1], // Avalon — note pans the second set
  ])('keeps the curated rating on the settled dispute %s', (date, tier, stars) => {
    expect(getClassicTier(date as string)).toBe(tier);
    expect(resolveSystemShowStars(date as string)).toBe(stars);
    expect(CURATED_TIER_DISPUTES.some(d => d.date === date)).toBe(false);
  });

  it('holds the May 1977 run at three stars', () => {
    for (const date of ['1977-05-07', '1977-05-08', '1977-05-09']) {
      expect([date, getClassicTier(date)]).toEqual([date, 1]);
      expect([date, resolveSystemShowStars(date)]).toEqual([date, 3]);
    }
  });

  it('exposes highlights and summaries through the accessors', () => {
    const withHighlights = entries.filter(([, e]) => e.highlights.length > 0);
    expect(withHighlights.length).toBeGreaterThan(1000);

    const [date, entry] = withHighlights[0];
    expect(getShowHighlights(date)).toEqual(entry.highlights);
    expect(getShowHighlights(`${date}T00:00:00Z`)).toEqual(entry.highlights);
    expect(getCompendiumTier(date)).toBe(entry.tier);
    expect(getShowSummary(date)).toBe(entry.summary ?? null);

    expect(getShowHighlights('1900-01-01')).toEqual([]);
    expect(getCompendiumTier('1900-01-01')).toBeNull();
    expect(getShowSummary('1900-01-01')).toBeNull();
  });

  it('gives every highlight a song, a reason and a quote', () => {
    for (const [date, entry] of entries) {
      for (const h of entry.highlights) {
        expect([date, h.song.length > 0]).toEqual([date, true]);
        expect([date, h.reason.length > 0]).toEqual([date, true]);
        expect([date, h.quote.length > 0]).toEqual([date, true]);
      }
    }
  });
});
