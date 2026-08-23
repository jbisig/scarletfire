import { GRATEFUL_DEAD_SONGS, Song } from '../constants/songs.generated';

// Lazily-built Map<lowercased title, Song> index over the ~5MB generated
// song catalog. Built once, on first lookup, and shared by every caller
// (ShowDetailScreen, SongPerformancesScreen, usePerformanceRating) so the
// O(n) Map-construction pass only ever runs once per process, not once per
// screen/hook that needs a lookup.
let songsByTitle: Map<string, Song> | null = null;
let songsByLooseTitle: Map<string, Song> | null = null;

/**
 * Collapses the spelling differences that separate the same song across
 * sources: Archive track titles, the Compendium's prose, and this catalog all
 * punctuate differently ("Truckin" / "Truckin'", "Samson and Delilah" /
 * "Samson & Delilah", "Playin'" / "Playing"). Mirrors the intent of
 * normalizeSongTitleForLookup in songPerformanceRatings.
 */
function looseKey(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/^grateful\s+dead\s*[-–]\s*/i, '')
    .replace(/[‘’]/g, "'")
    .replace(/playin'/g, 'playing')
    .replace(/truckin'/g, 'truckin')
    .replace(/lovin'/g, 'loving')
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]/g, '');
}

function buildIndexes(): void {
  const exact = new Map<string, Song>();
  const loose = new Map<string, Song>();
  for (const song of GRATEFUL_DEAD_SONGS) {
    exact.set(song.title.toLowerCase(), song);
    const key = looseKey(song.title);
    // First writer wins on the loose index: a collision means two catalog
    // entries differ only in punctuation, and the earlier (alphabetically
    // first) one is as good a target as any. scripts/repairSongCatalogTitles.js
    // keeps the catalog free of these, and a test guards it.
    if (key && !loose.has(key)) loose.set(key, song);
  }
  songsByTitle = exact;
  songsByLooseTitle = loose;
}

function getSongsByTitle(): Map<string, Song> {
  if (!songsByTitle) buildIndexes();
  return songsByTitle!;
}

function getSongsByLooseTitle(): Map<string, Song> {
  if (!songsByLooseTitle) buildIndexes();
  return songsByLooseTitle!;
}

/**
 * O(1) (after first-use index build) lookup of a Song by its title.
 *
 * Tries the exact (case-insensitive) title first, then falls back to a
 * punctuation-insensitive match so callers holding an older or differently
 * punctuated spelling still resolve.
 */
export function findSongByTitle(title: string): Song | undefined {
  if (!title) return undefined;
  return (
    getSongsByTitle().get(title.toLowerCase()) ??
    getSongsByLooseTitle().get(looseKey(title))
  );
}
