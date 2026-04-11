// Shared fuzzy track-slug matching. Used by:
//  - ShowDetailScreen's URL-driven track selection (formerly inline in the screen)
//  - the Vercel Functions that render song share cards (they import this file directly)
//
// Extracted here so the exact same matching behavior runs on the client and server.
// Depends on normalizeTrackTitle from titleNormalization.ts, which is pure TS and safe
// to import from non-RN contexts (no react-native, expo, or platform imports).

import { normalizeTrackTitle } from './titleNormalization';

/**
 * Calculate string similarity using Levenshtein distance, normalized to [0, 1].
 * Lifted verbatim from the local copy in ShowDetailScreen.tsx:85-113. Do not
 * modify — the behavior must match the pre-extraction state exactly.
 */
export function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();

  const costs: number[] = [];
  for (let i = 0; i <= s1.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= s2.length; j++) {
      if (i === 0) {
        costs[j] = j;
      } else if (j > 0) {
        let newValue = costs[j - 1];
        if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
          newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
        }
        costs[j - 1] = lastValue;
        lastValue = newValue;
      }
    }
    if (i > 0) {
      costs[s2.length] = lastValue;
    }
  }

  const maxLength = Math.max(s1.length, s2.length);
  const distance = costs[s2.length];
  return maxLength === 0 ? 1 : (maxLength - distance) / maxLength;
}

export interface MinimalTrack {
  id: string;
  title: string;
}

/**
 * Given a URL slug (or any search string) and a list of tracks, return the track
 * whose normalized title best matches the slug, or null if no track clears the
 * threshold. Matches the existing ShowDetailScreen auto-select logic byte-for-byte:
 *   - the incoming slug is lowercased (not further normalized)
 *   - the track titles are passed through normalizeTrackTitle and lowercased
 *   - Levenshtein similarity is computed and the best-scoring track above threshold wins
 */
export function matchTrackBySlug<T extends MinimalTrack>(
  slug: string,
  tracks: readonly T[],
  threshold: number
): T | null {
  if (tracks.length === 0) return null;

  const searchString = slug.toLowerCase();
  let bestMatch: T | null = null;
  let bestScore = 0;

  for (const track of tracks) {
    const normalized = normalizeTrackTitle(track.title).toLowerCase();
    const score = calculateSimilarity(searchString, normalized);
    if (score > bestScore) {
      bestScore = score;
      bestMatch = track;
    }
  }

  if (bestMatch && bestScore >= threshold) {
    return bestMatch;
  }
  return null;
}
