// src/services/compendiumPerformances.ts
/**
 * Per-performance ratings derived from the song highlights in
 * compendiumRatings.ts — the songs the Taping Compendium singles out of a
 * given show, each carrying the sentence that named it.
 *
 * The index is built lazily from COMPENDIUM_RATINGS rather than baked into a
 * second data file, so there is exactly one copy of the highlight data and no
 * chance of the two drifting apart.
 *
 * Ranking below the vote-based sources is deliberate: HeadyVersion votes and
 * the community list aggregate many listeners, while this is one book's
 * opinion. It fills gaps — 3,595 of the 4,018 highlights name a performance no
 * other source rates at all — and never overrides a vote.
 */
import type { ClassicTier } from '../data/classicShowsTiers';
import { COMPENDIUM_RATINGS, HighlightAssessment } from '../data/compendiumRatings';
import { normalizeSongTitleForLookup } from '../data/songPerformanceRatings';

export interface CompendiumPerformance {
  /** Star tier, or null when the note flags the song without rating it. */
  tier: ClassicTier | null;
  assessment: HighlightAssessment;
  /** Short display phrase, grounded in `quote`. */
  reason: string;
  /** Verbatim excerpt from that date's show note. */
  quote: string;
  /** The note names it rare, a debut, or a one-off — independent of quality. */
  isRare: boolean;
  /** The note criticises this performance. Never carries a tier. */
  isPanned: boolean;
}

/**
 * `rare` earns no stars on its own: rarity is not quality, and conflating them
 * would rate a sloppy one-off above a great routine version. `negative` is
 * likewise never a rating — it is surfaced as `isPanned` instead.
 */
const BASE_TIER: Record<HighlightAssessment, ClassicTier | null> = {
  legendary: 1,
  excellent: 2,
  notable: 3,
  rare: null,
  negative: null,
};

/** Rank used to keep the strongest claim when a show names a song twice. */
const STRENGTH: Record<HighlightAssessment, number> = {
  legendary: 5, excellent: 4, notable: 3, rare: 2, negative: 1,
};

const demote = (tier: ClassicTier | null): ClassicTier | null =>
  tier === null ? null : (Math.min(3, tier + 1) as ClassicTier);

const keyFor = (songTitle: string, showDate: string) =>
  `${normalizeSongTitleForLookup(songTitle)}|${showDate.split('T')[0]}`;

let index: Map<string, CompendiumPerformance> | null = null;

function getIndex(): Map<string, CompendiumPerformance> {
  if (index) return index;
  const map = new Map<string, CompendiumPerformance>();

  for (const [date, entry] of Object.entries(COMPENDIUM_RATINGS)) {
    for (const h of entry.highlights) {
      let tier = BASE_TIER[h.assessment];

      // A song singled out inside a note the judge was unsure of, or one whose
      // praise was really about the recording, is a weaker claim than the same
      // words in a confident note about the playing.
      if (tier !== null && (entry.confidence === 'low' || entry.tapeOnly)) {
        tier = demote(tier);
      }

      const performance: CompendiumPerformance = {
        tier,
        assessment: h.assessment,
        reason: h.reason,
        quote: h.quote,
        isRare: h.assessment === 'rare',
        isPanned: h.assessment === 'negative',
      };

      // Index under the catalog title when the song resolved, and always under
      // the Compendium's own spelling, so a lookup succeeds either way.
      for (const title of new Set([h.canonicalTitle, h.song].filter(Boolean) as string[])) {
        const key = keyFor(title, date);
        const existing = map.get(key);
        if (!existing || STRENGTH[h.assessment] > STRENGTH[existing.assessment]) {
          map.set(key, performance);
        }
      }
    }
  }

  index = map;
  return index;
}

/** Compendium-derived tier for one performance, or null. */
export function getCompendiumPerformanceTier(
  songTitle: string,
  showDate: string
): ClassicTier | null {
  return getIndex().get(keyFor(songTitle, showDate))?.tier ?? null;
}

/**
 * The full Compendium note on one performance — including flagged-but-unrated
 * ones, so a surface can show "rare" or "the notes pan this" without a star.
 */
export function getCompendiumPerformance(
  songTitle: string,
  showDate: string
): CompendiumPerformance | null {
  return getIndex().get(keyFor(songTitle, showDate)) ?? null;
}

export interface PannedButRated {
  date: string;
  song: string;
  /** Stars the vote-based sources currently give it. */
  stars: 1 | 2 | 3;
  reason: string;
  quote: string;
}

/**
 * Performances the vote-based sources rate but the Compendium criticises.
 *
 * Surfaced for review, never acted on. The `negative` assessments have a real
 * false-positive rate — a note reading "though it pales in comparison to the
 * debut, this version is noteworthy" can be read either way — so demoting a
 * voted rating on one book's hedged sentence would be the wrong trade. A
 * surface may show the criticism next to the stars; the stars stay.
 */
export function getPannedButRatedPerformances(
  ratedStars: (songTitle: string, showDate: string) => 1 | 2 | 3 | null
): PannedButRated[] {
  const out: PannedButRated[] = [];
  for (const [date, entry] of Object.entries(COMPENDIUM_RATINGS)) {
    for (const h of entry.highlights) {
      if (h.assessment !== 'negative') continue;
      const song = h.canonicalTitle || h.song;
      const stars = ratedStars(song, date);
      if (stars) out.push({ date, song, stars, reason: h.reason, quote: h.quote });
    }
  }
  return out.sort((a, b) => a.stars - b.stars || a.date.localeCompare(b.date));
}

/** Test/diagnostic hook: drop the memoised index. */
export function resetCompendiumPerformanceIndex(): void {
  index = null;
}
