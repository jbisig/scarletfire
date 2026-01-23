/**
 * Radio Service
 *
 * Provides a never-ending stream of Tier 1 (3-star) rated performances
 * picked randomly from across all shows.
 */

import { Track, ShowDetail } from '../types/show.types';
import { RatedSongPerformance, TIER_1_SONG_PERFORMANCES } from '../data/songPerformanceRatings';
import { archiveApi } from './archiveApi';

export interface RadioTrack {
  track: Track;
  show: ShowDetail;
  performance: RatedSongPerformance;
}

// Levenshtein distance for fuzzy matching (copied from SongPerformancesScreen)
function calculateSimilarity(str1: string, str2: string): number {
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

function normalizeTrackTitle(title: string): string {
  return title
    .replace(/^\d+[\s.-]*/, '')
    .replace(/^Track\s+\d+[\s:]*/, '')
    .trim()
    .replace(/\s*[-–]\s*(aborted|partial|incomplete|rehearsal|soundcheck).*$/i, '')
    .replace(/\s*[#]\d+.*$/i, '')
    .replace(/\s*\(.*?\)\s*$/, '')
    .replace(/\s*\[.*?\]\s*$/, '')
    .replace(/\s+[Jj]am\s*$/, '');
}

// Clean up song titles from HeadyVersion format
function normalizeSongTitle(title: string): string {
  return title
    .replace(/^Grateful Dead\s*-\s*/, '')
    .replace(/&gt;/g, '>')
    .replace(/&lt;/g, '<')
    .replace(/&amp;/g, '&')
    .trim();
}

// Fisher-Yates shuffle
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

class RadioService {
  private playedPerformances: Set<string> = new Set();
  private shuffledQueue: RatedSongPerformance[] = [];
  private queueIndex: number = 0;

  /**
   * Get a unique key for a performance to track what's been played
   */
  private getPerformanceKey(perf: RatedSongPerformance): string {
    return `${perf.showIdentifier}:${perf.songTitle}`;
  }

  /**
   * Initialize or refill the shuffled queue from TIER_1_SONG_PERFORMANCES
   */
  private refillQueue(): void {
    // Filter out already-played performances
    const available = TIER_1_SONG_PERFORMANCES.filter(
      perf => !this.playedPerformances.has(this.getPerformanceKey(perf))
    );

    if (available.length === 0) {
      // All played - reset and start over
      this.playedPerformances.clear();
      this.shuffledQueue = shuffleArray([...TIER_1_SONG_PERFORMANCES]);
    } else {
      this.shuffledQueue = shuffleArray(available);
    }
    this.queueIndex = 0;
  }

  /**
   * Get the next performance from the shuffled queue
   */
  private getNextPerformance(): RatedSongPerformance | null {
    if (this.queueIndex >= this.shuffledQueue.length) {
      this.refillQueue();
    }

    if (this.shuffledQueue.length === 0) {
      return null;
    }

    const perf = this.shuffledQueue[this.queueIndex];
    this.queueIndex++;
    return perf;
  }

  /**
   * Resolve a rated performance to a playable RadioTrack
   * Returns null if the track cannot be resolved
   */
  private async resolvePerformance(perf: RatedSongPerformance): Promise<RadioTrack | null> {
    try {
      // Fetch show details
      const showDetail = await archiveApi.getShowDetail(perf.showIdentifier, false);

      // Clean up the song title for matching
      const targetTitle = normalizeSongTitle(perf.songTitle);

      // Find the best matching track using fuzzy matching
      let bestMatch: Track | null = null;
      let bestScore = 0;
      const SIMILARITY_THRESHOLD = 0.6; // Lower threshold since HeadyVersion titles may differ

      for (const track of showDetail.tracks) {
        const normalizedTitle = normalizeTrackTitle(track.title);
        const similarity = calculateSimilarity(normalizedTitle, targetTitle);

        if (similarity > bestScore) {
          bestScore = similarity;
          bestMatch = track;
        }

        // Also try matching against the full title with "Grateful Dead - " prefix
        const fullTitle = `Grateful Dead - ${normalizedTitle}`;
        const fullSimilarity = calculateSimilarity(fullTitle, perf.songTitle);
        if (fullSimilarity > bestScore) {
          bestScore = fullSimilarity;
          bestMatch = track;
        }
      }

      if (bestMatch && bestScore >= SIMILARITY_THRESHOLD) {
        return {
          track: bestMatch,
          show: showDetail,
          performance: perf,
        };
      }

      return null;
    } catch (error) {
      console.error(`Failed to resolve performance: ${perf.songTitle} from ${perf.showDate}`, error);
      return null;
    }
  }

  /**
   * Get random tracks for radio playback
   * Fetches and resolves performances until we have the requested count
   */
  async getRandomTracks(count: number): Promise<RadioTrack[]> {
    const tracks: RadioTrack[] = [];
    let attempts = 0;
    const maxAttempts = count * 3; // Allow for some failures

    while (tracks.length < count && attempts < maxAttempts) {
      const perf = this.getNextPerformance();
      if (!perf) break;

      attempts++;
      const resolved = await this.resolvePerformance(perf);

      if (resolved) {
        // Mark as played
        this.playedPerformances.add(this.getPerformanceKey(perf));
        tracks.push(resolved);
      }
    }

    return tracks;
  }

  /**
   * Reset the session - clears played history and reshuffles
   */
  resetSession(): void {
    this.playedPerformances.clear();
    this.shuffledQueue = [];
    this.queueIndex = 0;
  }

  /**
   * Get the total number of Tier 1 performances available
   */
  getTotalPerformances(): number {
    return TIER_1_SONG_PERFORMANCES.length;
  }

  /**
   * Get the number of performances played in this session
   */
  getPlayedCount(): number {
    return this.playedPerformances.size;
  }
}

export const radioService = new RadioService();
