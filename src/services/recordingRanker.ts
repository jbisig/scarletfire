/**
 * Read-time "best recording" score for one show's recordings. Pure. Weights
 * live in RANK_WEIGHTS so tuning never needs a catalog regen.
 */
import type { LineageTag, RecordingVersion } from '../types/show.types';

export const RANK_WEIGHTS = {
  POP: 0.45,
  RATING: 0.35,
  /** Bayesian shrinkage toward a 4.0 average with the weight of 5 reviews. */
  PRIOR_MEAN: 4.0,
  PRIOR_WEIGHT: 5,
  LINEAGE_CAP: 0.30,
  LINEAGE_BONUS: { betty: 0.15, miller: 0.15, '16track': 0.10, lowgen: 0.05 } as Record<LineageTag, number>,
} as const;

function log10Plus1(downloads: number | undefined): number {
  return Math.log10((downloads ?? 0) + 1);
}

function ratingScore(version: RecordingVersion): number {
  const n = typeof version.avgRating === 'number' ? (version.numReviews ?? 0) : 0;
  const avg = typeof version.avgRating === 'number' ? version.avgRating : 0;
  const shrunk = (avg * n + RANK_WEIGHTS.PRIOR_MEAN * RANK_WEIGHTS.PRIOR_WEIGHT) / (n + RANK_WEIGHTS.PRIOR_WEIGHT);
  return shrunk / 5;
}

function lineageScore(version: RecordingVersion): number {
  const sum = version.lineage.reduce((acc, tag) => acc + (RANK_WEIGHTS.LINEAGE_BONUS[tag] ?? 0), 0);
  return Math.min(RANK_WEIGHTS.LINEAGE_CAP, sum);
}

export function scoreRecordings(versions: RecordingVersion[]): Array<{ version: RecordingVersion; score: number }> {
  const maxLog = versions.reduce((max, v) => Math.max(max, log10Plus1(v.downloads)), 0);
  return versions.map(version => {
    const pop = maxLog > 0 ? log10Plus1(version.downloads) / maxLog : 0;
    const score = RANK_WEIGHTS.POP * pop + RANK_WEIGHTS.RATING * ratingScore(version) + lineageScore(version);
    return { version, score };
  });
}

export function rankRecordings(versions: RecordingVersion[]): RecordingVersion[] {
  return scoreRecordings(versions)
    .sort((a, b) =>
      b.score - a.score
      || (b.version.downloads ?? 0) - (a.version.downloads ?? 0)
      || a.version.identifier.localeCompare(b.version.identifier))
    .map(s => s.version);
}
