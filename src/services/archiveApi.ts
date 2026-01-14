import axios from 'axios';
import {
  ArchiveSearchResponse,
  ArchiveMetadataResponse,
  ArchiveDoc
} from '../types/archive.types';
import { GratefulDeadShow, ShowDetail, Track, ShowsByYear, RecordingVersion } from '../types/show.types';

const BASE_URL = 'https://archive.org';
const SEARCH_URL = `${BASE_URL}/advancedsearch.php`;
const METADATA_URL = `${BASE_URL}/metadata`;
const DOWNLOAD_URL = `${BASE_URL}/download`;

class ArchiveApiService {
  /**
   * Search for Grateful Dead shows
   * @param page Page number (0-indexed)
   * @param rows Number of results per page
   * @param year Optional year filter
   */
  async searchShows(
    page: number = 0,
    rows: number = 100,
    year?: string
  ): Promise<ArchiveDoc[]> {
    try {
      let query = 'collection:GratefulDead AND mediatype:etree';
      if (year) {
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

      const response = await axios.get<ArchiveSearchResponse>(SEARCH_URL, { params });

      return response.data.response.docs;
    } catch (error) {
      console.error('Error searching shows:', error);
      throw new Error('Failed to fetch shows from Internet Archive');
    }
  }

  /**
   * Get shows organized by year, with multiple recordings aggregated
   */
  async getShowsByYear(): Promise<ShowsByYear> {
    // Fetch shows from 1965-1995 (Grateful Dead active years)
    // Increase limit to get all recordings (there are many versions per show)
    const allDocs = await this.searchShows(0, 50000);

    console.log(`Fetched ${allDocs.length} recordings from Internet Archive`);

    // Group by date to aggregate multiple recordings of the same show
    const showsByDate: Map<string, {
      date: string;
      year: string;
      venue?: string;
      location?: string;
      versions: RecordingVersion[];
    }> = new Map();

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
      // Sort versions by downloads (descending) and take top 5
      const sortedVersions = showData.versions
        .sort((a, b) => (b.downloads || 0) - (a.downloads || 0))
        .slice(0, 5);

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

    const years = Object.keys(showsByYear).sort();
    console.log(`Shows organized into ${years.length} years: ${years[0]} - ${years[years.length - 1]}`);
    console.log(`Total unique shows: ${showsByDate.size}`);

    return showsByYear;
  }

  /**
   * Extract source type from identifier (sbd, aud, matrix, etc.)
   */
  private extractSource(identifier: string): string {
    const lowerIdent = identifier.toLowerCase();
    if (lowerIdent.includes('sbd')) return 'Soundboard';
    if (lowerIdent.includes('aud')) return 'Audience';
    if (lowerIdent.includes('matrix')) return 'Matrix';
    if (lowerIdent.includes('fm')) return 'FM Broadcast';
    return 'Unknown';
  }

  /**
   * Get top 5 most popular versions of a show by date
   */
  async getShowVersions(date: string): Promise<RecordingVersion[]> {
    try {
      const query = `collection:GratefulDead AND mediatype:etree AND date:${date}`;
      const params = {
        q: query,
        'fl[]': ['identifier', 'title', 'downloads'],
        rows: 100,
        output: 'json'
      };

      const response = await axios.get<ArchiveSearchResponse>(SEARCH_URL, { params });

      // Sort by downloads and return top 5
      return response.data.response.docs
        .map(doc => ({
          identifier: doc.identifier,
          title: doc.title,
          source: this.extractSource(doc.identifier),
          downloads: doc.downloads || 0,
        }))
        .sort((a, b) => (b.downloads || 0) - (a.downloads || 0))
        .slice(0, 5);
    } catch (error) {
      console.error('Error fetching show versions:', error);
      return [];
    }
  }

  /**
   * Get detailed metadata for a specific show
   */
  async getShowDetail(identifier: string, includeAllVersions: boolean = true): Promise<ShowDetail> {
    try {
      const response = await axios.get<ArchiveMetadataResponse>(
        `${METADATA_URL}/${identifier}`
      );

      const { metadata, files } = response.data;

      // Filter for audio files (MP3 or FLAC)
      const audioFiles = files.filter(file =>
        file.format === 'VBR MP3' ||
        file.format === 'Flac' ||
        file.format === '64Kbps MP3' ||
        file.format === '128Kbps MP3'
      );

      // Prefer MP3 for streaming (smaller file size)
      const mp3Files = audioFiles.filter(file => file.format.includes('MP3'));
      const tracksToUse = mp3Files.length > 0 ? mp3Files : audioFiles;

      const tracks: Track[] = tracksToUse
        .map((file, index) => {
          // Parse duration - Archive.org can return it in different formats
          let duration: number | undefined;
          if (file.length) {
            // Check if it's in MM:SS or HH:MM:SS format
            if (file.length.includes(':')) {
              const parts = file.length.split(':').map(p => parseFloat(p));
              if (parts.length === 2) {
                // MM:SS format
                duration = parts[0] * 60 + parts[1];
              } else if (parts.length === 3) {
                // HH:MM:SS format
                duration = parts[0] * 3600 + parts[1] * 60 + parts[2];
              }
            } else {
              // Assume it's a number in seconds
              const parsed = parseFloat(file.length);
              if (!isNaN(parsed)) {
                duration = parsed;
              }
            }

            if (!duration || isNaN(duration)) {
              console.warn(`Invalid duration for ${file.name}: ${file.length}`);
            }
          }

          // Debug log first few tracks to see what we're getting
          if (index < 3) {
            console.log(`Track ${index + 1} data:`, {
              name: file.name,
              title: file.title,
              lengthRaw: file.length,
              durationParsed: duration,
              format: file.format,
              track: file.track,
            });
          }

          return {
            id: file.name,
            title: file.title || file.name.replace(/\.\w+$/, ''),
            duration,
            format: file.format,
            streamUrl: `${DOWNLOAD_URL}/${identifier}/${encodeURIComponent(file.name)}`,
            trackNumber: parseInt(file.track || String(index + 1))
          };
        })
        .sort((a, b) => (a.trackNumber || 0) - (b.trackNumber || 0));

      // Get all versions of this show if requested
      let allVersions: RecordingVersion[] | undefined;
      if (includeAllVersions && metadata.date) {
        allVersions = await this.getShowVersions(metadata.date);
      }

      return {
        identifier,
        title: metadata.title,
        date: metadata.date,
        year: metadata.year || metadata.date.split('-')[0],
        venue: metadata.venue,
        location: metadata.coverage,
        description: metadata.description,
        tracks,
        allVersions
      };
    } catch (error) {
      console.error('Error fetching show detail:', error);
      throw new Error('Failed to fetch show details');
    }
  }

}

export const archiveApi = new ArchiveApiService();
