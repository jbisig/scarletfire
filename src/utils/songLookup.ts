import { GRATEFUL_DEAD_SONGS, Song } from '../constants/songs.generated';

// Lazily-built Map<lowercased title, Song> index over the ~5MB generated
// song catalog. Built once, on first lookup, and shared by every caller
// (ShowDetailScreen, SongPerformancesScreen, usePerformanceRating) so the
// O(n) Map-construction pass only ever runs once per process, not once per
// screen/hook that needs a lookup.
let songsByTitle: Map<string, Song> | null = null;

function getSongsByTitle(): Map<string, Song> {
  if (!songsByTitle) {
    // Map construction is last-write-wins on a duplicate lowercased title —
    // theoretical in practice since the song catalog generator already
    // dedupes titles before this file ever sees them.
    songsByTitle = new Map(GRATEFUL_DEAD_SONGS.map(song => [song.title.toLowerCase(), song]));
  }
  return songsByTitle;
}

/**
 * O(1) (after first-use index build) lookup of a Song by its title.
 * Case-insensitive.
 */
export function findSongByTitle(title: string): Song | undefined {
  return getSongsByTitle().get(title.toLowerCase());
}
