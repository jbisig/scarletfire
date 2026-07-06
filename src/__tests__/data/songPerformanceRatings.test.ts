/**
 * Characterization tests for getSongPerformanceRating.
 *
 * These were written and passed against the ORIGINAL linear-scan
 * implementation before it was replaced with a lazily-built Map index
 * (see src/data/songPerformanceRatings.ts). They pin down the exact
 * match semantics so the Map-based rewrite cannot silently change
 * behavior:
 *  - title matching is case/whitespace/punctuation-normalized on BOTH
 *    sides via normalizeSongTitleForLookup (query and stored title)
 *  - the "Grateful Dead - " prefix on stored titles is stripped, so a
 *    query with or without that prefix matches the same entries
 *  - arrow notation ("->", "-", "→") in segued song titles all
 *    normalize to " > "
 *  - showDate is compared after stripping any "T..." time suffix
 *  - lookups fall back through TIER_1 -> TIER_2 -> TIER_3 -> community
 *    ratings, and when the SAME normalized-title+date key exists in
 *    more than one tier with different tiers, the FIRST one in that
 *    array order wins (this is measured/asserted below, not assumed)
 *  - a miss returns null
 */

import { getSongPerformanceRating } from '../../data/songPerformanceRatings';

describe('getSongPerformanceRating', () => {
  it('returns tier 1 for a known Tier 1 (HeadyVersion) entry', () => {
    // TIER_1_SONG_PERFORMANCES: "Grateful Dead - Playing In The Band", 1972-08-27, tier 1, 371 votes
    expect(
      getSongPerformanceRating('Grateful Dead - Playing In The Band', '1972-08-27')
    ).toBe(1);
  });

  it('returns tier 2 for a known Tier 2 entry', () => {
    // TIER_2_SONG_PERFORMANCES: "Grateful Dead - Playing In The Band", 1974-08-06, tier 2, 120 votes
    expect(
      getSongPerformanceRating('Grateful Dead - Playing In The Band', '1974-08-06')
    ).toBe(2);
  });

  it('returns tier 3 for a known Tier 3 entry', () => {
    // TIER_3_SONG_PERFORMANCES: "Grateful Dead - Dark Star", 1973-12-06, tier 3, 145 votes
    expect(getSongPerformanceRating('Grateful Dead - Dark Star', '1973-12-06')).toBe(3);
  });

  it('returns a community-sourced tier for an entry only present in COMMUNITY_RATINGS', () => {
    // COMMUNITY_RATINGS: 'Scarlet Begonias > Fire On The Mountain', '1981-03-10', tier 3
    // (no HeadyVersion entry exists for this date, so this exercises the
    // community-ratings fallback tier of the scan/index)
    expect(
      getSongPerformanceRating(
        'Grateful Dead - Scarlet Begonias > Fire On The Mountain',
        '1981-03-10'
      )
    ).toBe(3);
  });

  it('resolves duplicate normalized-title+date keys with first-match-wins ordering', () => {
    // "Dark Star" / 1973-11-11 exists TWICE across the source arrays with
    // DIFFERENT tiers:
    //   - TIER_2_SONG_PERFORMANCES: tier 2, 234 votes, showIdentifier
    //     gd73-11-11.sbd.schlissel.14105.sbeok.shnf (appears earlier in
    //     ALL_RATED_SONG_PERFORMANCES = [...TIER_1, ...TIER_2, ...TIER_3,
    //     ...COMMUNITY_RATINGS])
    //   - COMMUNITY_RATINGS: tier 1, "Community: The 'Thinking Man's Dark
    //     Star'..." (appears later)
    // The original .find() returns the FIRST match in array order, so the
    // result must be tier 2, not tier 1. This is real measured data (see
    // task report), not a hypothetical edge case -- across the full
    // 2,988-entry dataset there are 141 duplicate normalized-title+date
    // keys, 44 of which resolve to a different tier than their first
    // occurrence, so preserving this ordering is load-bearing.
    expect(getSongPerformanceRating('Grateful Dead - Dark Star', '1973-11-11')).toBe(2);
  });

  it('matches regardless of the "Grateful Dead - " prefix on the query', () => {
    expect(getSongPerformanceRating('Playing In The Band', '1972-08-27')).toBe(1);
  });

  it('normalizes segue arrow notation ("->" vs ">") to the same key', () => {
    // Both spellings are stored in COMMUNITY_RATINGS for the same date/tier;
    // querying with the other arrow style must still match.
    expect(
      getSongPerformanceRating(
        'Grateful Dead - Scarlet Begonias -> Fire On The Mountain',
        '1981-03-10'
      )
    ).toBe(3);
  });

  it('strips an ISO timestamp suffix from the query date', () => {
    expect(
      getSongPerformanceRating(
        'Grateful Dead - Playing In The Band',
        '1972-08-27T00:00:00.000Z'
      )
    ).toBe(1);
  });

  it('returns null for a song/date combination with no rating', () => {
    expect(getSongPerformanceRating('Not A Real Song', '2099-01-01')).toBeNull();
  });
});
