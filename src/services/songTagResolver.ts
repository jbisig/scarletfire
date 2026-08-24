/**
 * Read-time song tags: curated tags from data/songTags.ts plus the derived
 * 'rare' tag (performanceCount <= RARE_MAX_PERFORMANCES, and only for
 * curated titles — stage banter and drums/space segments stay untagged).
 * Filtering reuses buildTagPredicate (OR within a category, AND between),
 * faceted counts mirror tagResolver.getTagCounts over the song categories.
 */
import { TAG_DEFS, TagDef, TagId, SONG_TAG_CATEGORY_IDS } from '../constants/tags';
import { buildTagPredicate, groupByCategory } from './tagResolver';
import { SONG_TAGS } from '../data/songTags';
import { GRATEFUL_DEAD_SONGS } from '../constants/songs.generated';
import { findSongByTitle } from '../utils/songLookup';

export const RARE_MAX_PERFORMANCES = 10;

const SONG_CATEGORY_SET: ReadonlySet<string> = new Set(SONG_TAG_CATEGORY_IDS);
export const SONG_TAG_DEFS: readonly TagDef[] = TAG_DEFS.filter(d => SONG_CATEGORY_SET.has(d.category));

// Built once per process, keyed by exact catalog title.
let tagsByTitle: Map<string, TagId[]> | null = null;

function getIndex(): Map<string, TagId[]> {
  if (tagsByTitle) return tagsByTitle;
  const index = new Map<string, TagId[]>();
  for (const song of GRATEFUL_DEAD_SONGS) {
    const curated = SONG_TAGS[song.title];
    if (!curated) continue;
    const tags: TagId[] = [...curated];
    if (song.performanceCount <= RARE_MAX_PERFORMANCES) tags.push('rare');
    index.set(song.title, tags);
  }
  tagsByTitle = index;
  return index;
}

/** Tags for a song title (resolves loose/former spellings via songLookup). */
export function getSongTags(title: string): TagId[] {
  const index = getIndex();
  const direct = index.get(title);
  if (direct) return direct;
  const song = findSongByTitle(title);
  return song ? (index.get(song.title) ?? []) : [];
}

/** OR within a category, AND between categories — same semantics as shows. */
export function makeSongTagFilter(selected: TagId[]): (title: string) => boolean {
  return buildTagPredicate<string>(selected, getSongTags);
}

/**
 * Faceted counts over `baseTitles`: for each song tag, apply every OTHER
 * category's selection, ignore its own category's, then count titles
 * carrying the tag. Mirrors tagResolver.getTagCounts.
 */
export function getSongTagCounts(selected: TagId[], baseTitles: string[]): Record<TagId, number> {
  const groups = groupByCategory(selected);
  const tagsByBase = baseTitles.map(t => new Set(getSongTags(t)));

  const counts = {} as Record<TagId, number>;
  for (const def of SONG_TAG_DEFS) {
    const otherGroups = [...groups.entries()].filter(([cat]) => cat !== def.category).map(([, ids]) => ids);
    let n = 0;
    for (const tags of tagsByBase) {
      if (!tags.has(def.id)) continue;
      if (otherGroups.every(group => group.some(id => tags.has(id)))) n++;
    }
    counts[def.id] = n;
  }
  return counts;
}

export function resetSongTagIndexForTests(): void {
  tagsByTitle = null;
}
