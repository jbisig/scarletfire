// Local copy of src/utils/trackMatching.ts for the Vercel Functions bundle.
// The src/ version is imported by the React Native client; this api/_lib
// copy is imported by the OG image and HTML injection endpoints. They're
// kept in sync by hand — if you update one, update the other.
//
// Separate copy exists because the api/ tree is ESM ("type": "module" in
// api/package.json) with strict relative-import-with-.js-extension semantics
// at runtime, while src/ is CJS. Rather than force src/ to support both,
// we duplicate this small file.

import { normalizeTrackTitle } from './titleNormalization.js';

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
