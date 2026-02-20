import {
  ArchiveSearchResponse,
  ArchiveMetadataResponse,
  ArchiveDoc,
  ArchiveFile
} from '../types/archive.types';
import { GratefulDeadShow, ShowDetail, Track, ShowsByYear, RecordingVersion } from '../types/show.types';
import {
  ARCHIVE_CONFIG,
  ARCHIVE_ENDPOINTS,
  SEARCH_LIMITS,
  AUDIO_FORMATS,
  SOURCE_TYPES,
} from '../constants/api';
import { Platform } from 'react-native';
import { normalizeSongTitle } from '../utils/titleNormalization';
import { logger } from '../utils/logger';

/**
 * Service for interacting with the Internet Archive API
 */
class ArchiveApiService {
  // Simple in-memory cache for show details to avoid re-fetching
  private showDetailCache: Map<string, { data: ShowDetail; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 60 * 60 * 1000; // 1 hour — show details are historical and don't change

  // In-flight request deduplication - prevents duplicate concurrent requests
  private inFlightRequests: Map<string, Promise<Response>> = new Map();

  /**
   * Synchronously get a cached show detail (returns null if not cached or expired).
   * Used by ShowCard to avoid triggering API calls just to get track count.
   */
  getCachedShowDetail(identifier: string): ShowDetail | null {
    const cached = this.showDetailCache.get(identifier);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }
    return null;
  }

  /**
   * Handle API errors consistently
   */
  private handleError(error: unknown, context: string): never {
    throw new Error(`${context}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  /**
   * Helper to build query string from params object
   */
  private buildQueryString(params: Record<string, any>): string {
    const parts: string[] = [];
    Object.entries(params).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach(v => {
          parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(v))}`);
        });
      } else if (value !== undefined && value !== null) {
        parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
      }
    });
    return parts.join('&');
  }

  /**
   * Fetch with timeout to prevent hanging requests
   */
  private async fetchWithTimeout(url: string, timeoutMs: number = ARCHIVE_CONFIG.TIMEOUT): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, { signal: controller.signal });
      return response;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Fetch with deduplication - returns existing in-flight request if one exists
   */
  private async fetchWithDedup(url: string, timeoutMs: number = ARCHIVE_CONFIG.TIMEOUT): Promise<Response> {
    // Check if there's already an in-flight request for this URL
    const existing = this.inFlightRequests.get(url);
    if (existing) {
      return existing;
    }

    // Create the request and track it
    const requestPromise = this.fetchWithTimeout(url, timeoutMs)
      .finally(() => {
        // Clean up once the request completes
        this.inFlightRequests.delete(url);
      });

    this.inFlightRequests.set(url, requestPromise);
    return requestPromise;
  }

  /**
   * Fetch with retry logic and exponential backoff
   * Automatically retries on timeout or server errors (5xx)
   */
  private async fetchWithRetry(
    url: string,
    maxRetries: number = ARCHIVE_CONFIG.MAX_RETRIES,
    baseDelayMs: number = 1000
  ): Promise<Response> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        // Use dedup fetch to prevent duplicate concurrent requests
        const response = await this.fetchWithDedup(url);

        // Retry on server errors (5xx)
        if (response.status >= 500) {
          throw new Error(`Server error: HTTP ${response.status}`);
        }

        return response;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Don't retry on client errors (4xx) except for rate limiting (429)
        if (error instanceof Error && error.message.includes('HTTP 4') && !error.message.includes('429')) {
          throw error;
        }

        // Don't retry on the last attempt
        if (attempt < maxRetries - 1) {
          const delay = baseDelayMs * Math.pow(2, attempt);
          logger.api.debug(`Retry ${attempt + 1}/${maxRetries} after ${delay}ms: ${lastError.message}`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError || new Error('Max retries exceeded');
  }

  /**
   * Search for Grateful Dead shows
   * @param page Page number (0-indexed)
   * @param rows Number of results per page
   * @param year Optional year filter
   */
  async searchShows(
    page: number = 0,
    rows: number = SEARCH_LIMITS.DEFAULT_PAGE_SIZE,
    year?: string
  ): Promise<ArchiveDoc[]> {
    try {
      let query = 'collection:GratefulDead AND mediatype:etree';
      if (year) {
        if (!/^\d{4}$/.test(year)) throw new Error('Invalid year format');
        query += ` AND year:${year}`;
      }

      const params = {
        q: query,
        'fl[]': ['identifier', 'title', 'date', 'venue', 'coverage', 'year', 'downloads'],
        sort: 'date asc',
        rows,
        page,
        output: 'json'
      };

      const queryString = this.buildQueryString(params);
      const response = await this.fetchWithTimeout(`${ARCHIVE_ENDPOINTS.SEARCH}?${queryString}`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data: ArchiveSearchResponse = await response.json();
      if (!Array.isArray(data?.response?.docs)) {
        throw new Error('Unexpected API response format');
      }
      return data.response.docs;
    } catch (error) {
      this.handleError(error, 'Failed to fetch shows');
    }
  }

  /**
   * Get shows organized by year, with multiple recordings aggregated
   */
  async getShowsByYear(): Promise<ShowsByYear> {
    const allDocs = await this.searchShows(0, SEARCH_LIMITS.MAX_SHOWS);

    // Group by date to aggregate multiple recordings of the same show
    const showsByDate = new Map<string, {
      date: string;
      year: string;
      venue?: string;
      location?: string;
      versions: RecordingVersion[];
    }>();

    allDocs.forEach(doc => {
      const existing = showsByDate.get(doc.date);
      const version: RecordingVersion = {
        identifier: doc.identifier,
        title: doc.title,
        source: this.extractSource(doc.identifier),
        downloads: doc.downloads || 0,
      };

      if (existing) {
        existing.versions.push(version);
      } else {
        showsByDate.set(doc.date, {
          date: doc.date,
          year: doc.year || doc.date.split('-')[0],
          venue: doc.venue,
          location: doc.coverage,
          versions: [version],
        });
      }
    });

    // Convert to ShowsByYear format
    const showsByYear: ShowsByYear = {};
    showsByDate.forEach((showData) => {
      // Sort versions by downloads (descending) and take top versions
      const sortedVersions = showData.versions
        .sort((a, b) => (b.downloads || 0) - (a.downloads || 0))
        .slice(0, SEARCH_LIMITS.MAX_VERSIONS_PER_SHOW);

      const show: GratefulDeadShow = {
        date: showData.date,
        year: showData.year,
        venue: showData.venue,
        location: showData.location,
        versions: sortedVersions,
        primaryIdentifier: sortedVersions[0].identifier,
        title: sortedVersions[0].title,
      };

      if (!showsByYear[show.year]) {
        showsByYear[show.year] = [];
      }
      showsByYear[show.year].push(show);
    });

    return showsByYear;
  }

  /**
   * Get top N shows sorted by downloads
   */
  async getTopShows(count: number = SEARCH_LIMITS.TOP_SHOWS_COUNT): Promise<GratefulDeadShow[]> {
    try {
      const query = 'collection:GratefulDead AND mediatype:etree';
      const params = {
        q: query,
        'fl[]': ['identifier', 'title', 'date', 'venue', 'coverage', 'year', 'downloads'],
        sort: 'downloads desc',
        rows: count * SEARCH_LIMITS.TOP_SHOWS_MULTIPLIER,
        output: 'json'
      };

      const queryString = this.buildQueryString(params);
      const response = await this.fetchWithTimeout(`${ARCHIVE_ENDPOINTS.SEARCH}?${queryString}`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data: ArchiveSearchResponse = await response.json();
      if (!Array.isArray(data?.response?.docs)) {
        throw new Error('Unexpected API response format');
      }

      // Group by date and get unique shows with highest downloads
      const showsByDate = new Map<string, {
        doc: ArchiveDoc;
        maxDownloads: number;
      }>();

      data.response.docs.forEach(doc => {
        const existing = showsByDate.get(doc.date);
        const downloads = doc.downloads || 0;

        if (!existing || downloads > existing.maxDownloads) {
          showsByDate.set(doc.date, {
            doc,
            maxDownloads: downloads,
          });
        }
      });

      // Convert to GratefulDeadShow array
      const shows: GratefulDeadShow[] = Array.from(showsByDate.values())
        .map(({ doc }) => {
          const version: RecordingVersion = {
            identifier: doc.identifier,
            title: doc.title,
            source: this.extractSource(doc.identifier),
            downloads: doc.downloads || 0,
          };

          return {
            date: doc.date,
            year: doc.year || doc.date.split('-')[0],
            venue: doc.venue,
            location: doc.coverage,
            versions: [version],
            primaryIdentifier: doc.identifier,
            title: doc.title,
          };
        })
        .slice(0, count);

      return shows;
    } catch (error) {
      this.handleError(error, 'Failed to fetch top shows');
    }
  }

  /**
   * Extract source type from identifier (sbd, aud, matrix, etc.)
   */
  private extractSource(identifier: string): string {
    const lowerIdent = identifier.toLowerCase();
    if (lowerIdent.includes('sbd')) return SOURCE_TYPES.SOUNDBOARD;
    if (lowerIdent.includes('aud')) return SOURCE_TYPES.AUDIENCE;
    if (lowerIdent.includes('matrix')) return SOURCE_TYPES.MATRIX;
    if (lowerIdent.includes('fm')) return SOURCE_TYPES.FM_BROADCAST;
    return SOURCE_TYPES.UNKNOWN;
  }

  /**
   * Get top versions of a show by date
   */
  async getShowVersions(date: string): Promise<RecordingVersion[]> {
    try {
      if (!/^\d{4}-\d{2}-\d{2}/.test(date)) return [];
      const query = `collection:GratefulDead AND mediatype:etree AND date:${date}`;
      const params = {
        q: query,
        'fl[]': ['identifier', 'title', 'downloads', 'taper', 'transferer'],
        rows: SEARCH_LIMITS.MAX_SHOW_VERSIONS,
        output: 'json'
      };

      const queryString = this.buildQueryString(params);
      const response = await this.fetchWithTimeout(`${ARCHIVE_ENDPOINTS.SEARCH}?${queryString}`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data: ArchiveSearchResponse = await response.json();
      if (!Array.isArray(data?.response?.docs)) return [];

      // Sort by downloads and return top versions
      return data.response.docs
        .map(doc => ({
          identifier: doc.identifier,
          title: doc.title,
          source: this.extractSource(doc.identifier),
          downloads: doc.downloads || 0,
          taper: doc.taper,
          transferrer: doc.transferer, // Note: Archive.org uses "transferer"
        }))
        .sort((a, b) => (b.downloads || 0) - (a.downloads || 0))
        .slice(0, SEARCH_LIMITS.MAX_VERSIONS_PER_SHOW);
    } catch (error) {
      // Return empty array on error to allow graceful degradation
      return [];
    }
  }

  /**
   * Parse duration from various formats (MM:SS, HH:MM:SS, or seconds)
   */
  private parseDuration(lengthStr: string | undefined): number | undefined {
    if (!lengthStr) return undefined;

    // Check if it's in time format (contains colon)
    if (lengthStr.includes(':')) {
      const parts = lengthStr.split(':').map(p => parseFloat(p));
      if (parts.some(isNaN)) return undefined;

      if (parts.length === 2) {
        // MM:SS format
        return parts[0] * 60 + parts[1];
      } else if (parts.length === 3) {
        // HH:MM:SS format
        return parts[0] * 3600 + parts[1] * 60 + parts[2];
      }
    }

    // Try parsing as a number (seconds)
    const parsed = parseFloat(lengthStr);
    return isNaN(parsed) ? undefined : parsed;
  }

  /**
   * Validate that an object is a valid ArchiveFile with required properties
   */
  private isValidAudioFile(file: unknown): file is ArchiveFile {
    if (!file || typeof file !== 'object') return false;
    const f = file as Record<string, unknown>;
    return (
      typeof f.name === 'string' &&
      f.name.length > 0 &&
      typeof f.format === 'string'
    );
  }

  /**
   * Filter and sort audio files for optimal streaming
   */
  private selectAudioFiles(files: unknown[]): ArchiveFile[] {
    const supportedFormats: string[] = [
      AUDIO_FORMATS.VBR_MP3,
      AUDIO_FORMATS.FLAC,
      AUDIO_FORMATS.MP3_64,
      AUDIO_FORMATS.MP3_128,
    ];

    // Filter to valid audio files only
    const validFiles = files.filter(this.isValidAudioFile);
    const audioFiles = validFiles.filter(file => supportedFormats.includes(file.format));

    // Prefer MP3 for streaming (smaller file size, better compatibility)
    const mp3Files = audioFiles.filter(file => file.format.includes('MP3'));
    return mp3Files.length > 0 ? mp3Files : audioFiles;
  }

  /**
   * Get all unique songs with their performances across shows
   * This is an expensive operation that fetches many shows
   */
  async getSongVersions(): Promise<Map<string, Array<{ date: string; identifier: string; venue?: string }>>> {
    try {
      // Fetch a large sample of shows to get diverse song list
      const allDocs = await this.searchShows(0, SEARCH_LIMITS.SONG_INDEX_SAMPLE);

      const songToShows = new Map<string, Array<{ date: string; identifier: string; venue?: string }>>();

      // Fetch details for a sample of shows to build song index
      const topShows = allDocs
        .sort((a, b) => (b.downloads || 0) - (a.downloads || 0))
        .slice(0, SEARCH_LIMITS.SONG_INDEX_TOP_SHOWS);

      // Process shows in batches to avoid overwhelming the API
      const batchSize = SEARCH_LIMITS.SONG_INDEX_BATCH_SIZE;
      for (let i = 0; i < topShows.length; i += batchSize) {
        const batch = topShows.slice(i, i + batchSize);
        const showPromises = batch.map(doc =>
          this.getShowDetail(doc.identifier).catch(() => null)
        );

        const shows = await Promise.all(showPromises);

        shows.forEach(show => {
          if (!show) return;

          show.tracks.forEach(track => {
            // Normalize song title (remove track numbers, clean up)
            const songTitle = normalizeSongTitle(track.title);
            if (!songTitle) return;

            if (!songToShows.has(songTitle)) {
              songToShows.set(songTitle, []);
            }

            const performances = songToShows.get(songTitle)!;
            // Avoid duplicates by checking if show already exists
            if (!performances.some(p => p.identifier === show.identifier)) {
              performances.push({
                date: show.date,
                identifier: show.identifier,
                venue: show.venue,
              });
            }
          });
        });

        // Small delay between batches to be respectful to the API
        if (i + batchSize < topShows.length) {
          await new Promise(resolve => setTimeout(resolve, SEARCH_LIMITS.BATCH_DELAY_MS));
        }
      }

      // Sort performances by date for each song
      songToShows.forEach(performances => {
        performances.sort((a, b) => a.date.localeCompare(b.date));
      });

      return songToShows;
    } catch (error) {
      this.handleError(error, 'Failed to fetch song versions');
    }
  }

  /**
   * Get detailed metadata for a specific show
   */
  async getShowDetail(identifier: string): Promise<ShowDetail> {
    // Validate identifier to prevent path traversal
    if (!/^[a-zA-Z0-9._-]+$/.test(identifier)) {
      throw new Error('Invalid show identifier');
    }

    // Always check cache first
    const cached = this.showDetailCache.get(identifier);
    const cacheIsValid = cached && Date.now() - cached.timestamp < this.CACHE_TTL;

    if (cacheIsValid) {
      return cached.data;
    }

    // Cache miss - fetch fresh data
    try {
      const response = await this.fetchWithRetry(`${ARCHIVE_ENDPOINTS.METADATA}/${identifier}`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data: ArchiveMetadataResponse = await response.json();
      if (!data?.metadata || !Array.isArray(data?.files)) {
        throw new Error('Unexpected metadata response format');
      }
      const { metadata, files } = data;
      const audioFiles = this.selectAudioFiles(files);

      const tracks: Track[] = audioFiles
        .map((file, index) => {
          const duration = this.parseDuration(file.length);

          return {
            id: file.name,
            title: file.title || file.name.replace(/\.\w+$/, ''),
            duration,
            format: file.format,
            streamUrl: `${ARCHIVE_ENDPOINTS.DOWNLOAD}/${identifier}/${encodeURIComponent(file.name)}`,
            trackNumber: parseInt(file.track || String(index + 1))
          };
        })
        .sort((a, b) => (a.trackNumber || 0) - (b.trackNumber || 0));

      const baseShowDetail: ShowDetail = {
        identifier,
        title: metadata.title,
        date: metadata.date,
        year: metadata.year || metadata.date.split('-')[0],
        venue: metadata.venue,
        location: metadata.coverage,
        description: metadata.description,
        tracks,
      };

      // Cache the base show detail (without versions to keep cache entries small)
      this.showDetailCache.set(identifier, { data: baseShowDetail, timestamp: Date.now() });

      return baseShowDetail;
    } catch (error) {
      this.handleError(error, 'Failed to fetch show details');
    }
  }
}

export const archiveApi = new ArchiveApiService();

// Warm up the connection to archive.org on native (web warmup is in App.tsx via preconnect)
if (Platform.OS !== 'web') {
  fetch(`${ARCHIVE_CONFIG.BASE_URL}/metadata/favicon.ico`, { method: 'HEAD' }).catch(() => {});
}
