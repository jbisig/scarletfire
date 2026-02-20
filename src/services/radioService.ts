/**
 * Radio Service
 *
 * Provides a never-ending stream of Tier 1 (3-star) rated performances
 * picked randomly from across all shows.
 */

import { Track, ShowDetail } from '../types/show.types';
import { RatedSongPerformance, TIER_1_SONG_PERFORMANCES } from '../data/songPerformanceRatings';
import { archiveApi } from './archiveApi';
import { normalizeTrackTitle, normalizeHeadyVersionTitle } from '../utils/titleNormalization';
import { SIMILARITY_THRESHOLDS } from '../constants/thresholds';
import { logger } from '../utils/logger';

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

  // Prefetched tracks ready for immediate playback
  private prefetchedTracks: RadioTrack[] = [];
  private isPrefetching: boolean = false;
  private prefetchPromise: Promise<void> | null = null;

  // LRU cache for similarity calculations to avoid redundant Levenshtein computations
  private similarityCache: Map<string, number> = new Map();
  private readonly MAX_CACHE_SIZE = 10000;

  /**
   * Get cached similarity score or calculate and cache it (LRU eviction)
   */
  private getCachedSimilarity(str1: string, str2: string): number {
    const key = `${str1}|${str2}`;
    const cached = this.similarityCache.get(key);
    if (cached !== undefined) {
      // Move to end for LRU (Map preserves insertion order)
      this.similarityCache.delete(key);
      this.similarityCache.set(key, cached);
      return cached;
    }

    const score = calculateSimilarity(str1, str2);

    // LRU eviction: remove oldest 25% when full
    if (this.similarityCache.size >= this.MAX_CACHE_SIZE) {
      const toRemove = this.MAX_CACHE_SIZE / 4;
      const iter = this.similarityCache.keys();
      for (let i = 0; i < toRemove; i++) {
        const next = iter.next();
        if (next.done) break;
        this.similarityCache.delete(next.value);
      }
    }

    this.similarityCache.set(key, score);
    return score;
  }

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
      const showDetail = await archiveApi.getShowDetail(perf.showIdentifier);

      // Clean up the song title for matching (HeadyVersion format)
      const targetTitle = normalizeHeadyVersionTitle(perf.songTitle);

      // Find the best matching track using fuzzy matching
      // Early-exit on high-confidence match (>= 0.95) to avoid unnecessary comparisons
      let bestMatch: Track | null = null;
      let bestScore = 0;

      for (const track of showDetail.tracks) {
        const normalizedTitle = normalizeTrackTitle(track.title);
        const similarity = this.getCachedSimilarity(normalizedTitle, targetTitle);

        if (similarity > bestScore) {
          bestScore = similarity;
          bestMatch = track;
          if (bestScore >= 0.95) break; // High confidence — skip remaining tracks
        }

        // Also try matching against the full title with "Grateful Dead - " prefix
        const fullTitle = `Grateful Dead - ${normalizedTitle}`;
        const fullSimilarity = this.getCachedSimilarity(fullTitle, perf.songTitle);
        if (fullSimilarity > bestScore) {
          bestScore = fullSimilarity;
          bestMatch = track;
          if (bestScore >= 0.95) break;
        }
      }

      if (bestMatch && bestScore >= SIMILARITY_THRESHOLDS.RADIO_TRACK_MATCH) {
        return {
          track: bestMatch,
          show: showDetail,
          performance: perf,
        };
      }

      return null;
    } catch (error) {
      logger.radio.error(`Failed to resolve performance: ${perf.songTitle} from ${perf.showDate}`, error);
      return null;
    }
  }

  /**
   * Prefetch tracks in the background for instant radio start
   * Call this when the app starts or Discover screen mounts
   */
  async prefetch(count: number = 10): Promise<void> {
    // Don't prefetch if already prefetching or have enough tracks
    if (this.isPrefetching || this.prefetchedTracks.length >= count) {
      logger.radio.debug(`Prefetch skipped - already have ${this.prefetchedTracks.length} tracks`);
      return;
    }

    this.isPrefetching = true;
    logger.radio.debug('Starting prefetch...');
    const startTime = Date.now();

    this.prefetchPromise = (async () => {
      try {
        const needed = count - this.prefetchedTracks.length;
        const newTracks = await this.fetchTracks(needed);
        this.prefetchedTracks.push(...newTracks);
        logger.radio.debug(`Prefetch complete - ${this.prefetchedTracks.length} tracks ready (${Date.now() - startTime}ms)`);
      } catch (error) {
        logger.radio.error('Failed to prefetch radio tracks:', error);
      } finally {
        this.isPrefetching = false;
        this.prefetchPromise = null;
      }
    })();

    return this.prefetchPromise;
  }

  /**
   * Check if prefetched tracks are available
   */
  hasPrefetchedTracks(): boolean {
    return this.prefetchedTracks.length > 0;
  }

  /**
   * Get the count of prefetched tracks
   */
  getPrefetchedCount(): number {
    return this.prefetchedTracks.length;
  }

  /**
   * Internal method to fetch and resolve tracks
   * Uses parallel fetching for faster performance
   */
  private async fetchTracks(count: number): Promise<RadioTrack[]> {
    const tracks: RadioTrack[] = [];
    const BATCH_SIZE = 5; // Fetch shows in parallel
    let totalAttempts = 0;
    const maxAttempts = count * 3;

    while (tracks.length < count && totalAttempts < maxAttempts) {
      // Get a batch of performances to try
      const batch: RatedSongPerformance[] = [];
      for (let i = 0; i < BATCH_SIZE && totalAttempts < maxAttempts; i++) {
        const perf = this.getNextPerformance();
        if (!perf) break;
        batch.push(perf);
        totalAttempts++;
      }

      if (batch.length === 0) break;

      // Resolve all performances in parallel
      const results = await Promise.all(
        batch.map(perf => this.resolvePerformance(perf).catch(() => null))
      );

      // Collect successful results
      for (let i = 0; i < results.length; i++) {
        const resolved = results[i];
        if (resolved && tracks.length < count) {
          this.playedPerformances.add(this.getPerformanceKey(batch[i]));
          tracks.push(resolved);
        }
      }
    }

    return tracks;
  }

  /**
   * Get random tracks for radio playback
   * Uses prefetched tracks first, then fetches more if needed
   */
  async getRandomTracks(count: number): Promise<RadioTrack[]> {
    const startTime = Date.now();
    const tracks: RadioTrack[] = [];

    // Wait for any in-progress prefetch to complete first
    if (this.prefetchPromise) {
      logger.radio.debug('Waiting for prefetch to complete...');
      await this.prefetchPromise;
    }

    // Use prefetched tracks first
    const prefetchedUsed = Math.min(count, this.prefetchedTracks.length);
    while (tracks.length < count && this.prefetchedTracks.length > 0) {
      tracks.push(this.prefetchedTracks.shift()!);
    }
    logger.radio.debug(`Used ${prefetchedUsed} prefetched tracks`);

    // Fetch more if needed
    if (tracks.length < count) {
      const needed = count - tracks.length;
      logger.radio.debug(`Need to fetch ${needed} more tracks...`);
      const fetchStart = Date.now();
      const newTracks = await this.fetchTracks(needed);
      logger.radio.debug(`Fetched ${newTracks.length} tracks in ${Date.now() - fetchStart}ms`);
      tracks.push(...newTracks);
    }

    logger.radio.debug(`getRandomTracks complete: ${tracks.length} tracks in ${Date.now() - startTime}ms`);

    // Start background prefetch for next time
    this.prefetch(20);

    return tracks;
  }

  /**
   * Reset the session - clears played history and reshuffles
   */
  resetSession(): void {
    this.playedPerformances.clear();
    this.shuffledQueue = [];
    this.queueIndex = 0;
    this.prefetchedTracks = [];
    this.prefetchPromise = null;
    this.isPrefetching = false;
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
