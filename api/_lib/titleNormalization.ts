/**
 * Shared title normalization utilities for consistent track/song title handling
 */

/**
 * Normalizes archive.org track titles by removing track numbers, version indicators, etc.
 * Used for matching tracks against song databases.
 */
export function normalizeTrackTitle(title: string): string {
  return title
    // Remove track numbers at start (e.g., "01 ", "1. ", "Track 1: ")
    .replace(/^\d+[\s.-]*/, '')
    .replace(/^Track\s+\d+[\s:]*/, '')
    .trim()
    // Remove version indicators
    .replace(/\s*[-–]\s*(aborted|partial|incomplete|rehearsal|soundcheck).*$/i, '')
    .replace(/\s*[#]\d+.*$/i, '')
    // Clean up common suffixes
    .replace(/\s*\(.*?\)\s*$/, '')
    .replace(/\s*\[.*?\]\s*$/, '')
    .replace(/\s+[Jj]am\s*$/, '');
}

/**
 * Normalizes HeadyVersion song titles by removing band prefix and HTML entities
 */
export function normalizeHeadyVersionTitle(title: string): string {
  return title
    .replace(/^Grateful Dead\s*-\s*/, '')
    .replace(/&gt;/g, '>')
    .replace(/&lt;/g, '<')
    .replace(/&amp;/g, '&')
    .trim();
}

/**
 * Skip patterns for non-song content (tuning, banter, etc.)
 */
const SKIP_PATTERNS = [
  /^tuning/i,
  /^stage\s*banter/i,
  /^talk/i,
  /^announce/i,
  /^intro/i,
  /^crowd/i,
  /^applause/i,
  /^silence/i,
  /^unknown/i,
  /^banter/i,
];

/**
 * Checks if a title should be skipped (non-song content)
 */
export function shouldSkipTitle(title: string): boolean {
  return SKIP_PATTERNS.some(pattern => pattern.test(title));
}

/**
 * Normalizes a song title for database/comparison purposes.
 * Returns empty string for non-song content that should be skipped.
 */
export function normalizeSongTitle(title: string): string {
  if (!title) return '';

  const normalized = normalizeTrackTitle(title);

  if (shouldSkipTitle(normalized)) {
    return '';
  }

  return normalized;
}

/**
 * Normalizes a title for comparison (lowercase, trimmed)
 */
export function normalizeForComparison(title: string): string {
  return title.toLowerCase().trim();
}
