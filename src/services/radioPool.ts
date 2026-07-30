import {
  RatedSongPerformance,
  TIER_1_SONG_PERFORMANCES,
} from '../data/songPerformanceRatings';
import {
  getUserRatings,
  getActivePerformanceRating,
  performanceRatingKey,
} from './userRatingsStore';

/**
 * Radio pool = performances whose RESOLVED stars === 3.
 * - System tier-1 entries stay unless the user rated them below 3 stars.
 * - User 3-star ratings join as synthetic tier-1 entries, but only when
 *   they carry a showIdentifier (radio must fetch the recording); entries
 *   rated from surfaces without an identifier are display-only.
 */
export function buildRadioPool(): RatedSongPerformance[] {
  const systemKeys = new Set(
    TIER_1_SONG_PERFORMANCES.map(p => performanceRatingKey(p.songTitle, p.showDate))
  );

  const pool = TIER_1_SONG_PERFORMANCES.filter(perf => {
    const override = getActivePerformanceRating(perf.songTitle, perf.showDate);
    return !override || override.stars === 3;
  });

  const { performances } = getUserRatings();
  for (const [key, entry] of Object.entries(performances)) {
    const isTombstoned = entry.deletedAt !== undefined && entry.deletedAt >= entry.ratedAt;
    if (isTombstoned || entry.stars !== 3) continue;
    if (!entry.showIdentifier || !entry.songTitle) continue;
    if (systemKeys.has(key)) continue; // already in pool via the system list
    pool.push({
      songTitle: entry.songTitle,
      showDate: key.split('|')[1],
      showIdentifier: entry.showIdentifier,
      tier: 1,
      notes: 'Your 3-star rating',
    });
  }

  return pool;
}
