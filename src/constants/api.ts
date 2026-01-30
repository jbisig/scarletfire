/**
 * API-related constants for the Internet Archive
 */

export const ARCHIVE_CONFIG = {
  BASE_URL: 'https://archive.org',
  TIMEOUT: 60000, // 60 seconds
  MAX_RETRIES: 3,
} as const;

export const ARCHIVE_ENDPOINTS = {
  SEARCH: `${ARCHIVE_CONFIG.BASE_URL}/advancedsearch.php`,
  METADATA: `${ARCHIVE_CONFIG.BASE_URL}/metadata`,
  DOWNLOAD: `${ARCHIVE_CONFIG.BASE_URL}/download`,
} as const;

export const SEARCH_LIMITS = {
  DEFAULT_PAGE_SIZE: 100,
  MAX_SHOWS: 50000,
  TOP_SHOWS_COUNT: 365,
  TOP_SHOWS_MULTIPLIER: 10,
  MAX_VERSIONS_PER_SHOW: 5,
  MAX_SHOW_VERSIONS: 100,
} as const;

export const GRATEFUL_DEAD_YEARS = {
  START: 1965,
  END: 1995,
} as const;

export const AUDIO_FORMATS = {
  VBR_MP3: 'VBR MP3',
  FLAC: 'Flac',
  MP3_64: '64Kbps MP3',
  MP3_128: '128Kbps MP3',
} as const;

export const SOURCE_TYPES = {
  SOUNDBOARD: 'Soundboard',
  AUDIENCE: 'Audience',
  MATRIX: 'Matrix',
  FM_BROADCAST: 'FM Broadcast',
  UNKNOWN: 'Unknown',
} as const;
