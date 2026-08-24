import {
  getSongTags,
  makeSongTagFilter,
  getSongTagCounts,
  resetSongTagIndexForTests,
  RARE_MAX_PERFORMANCES,
  SONG_TAG_DEFS,
} from '../songTagResolver';
import { findSongByTitle } from '../../utils/songLookup';
import { GRATEFUL_DEAD_SONGS } from '../../constants/songs.generated';
import { SONG_TAGS, UNTAGGED_TITLES } from '../../data/songTags';

beforeEach(() => resetSongTagIndexForTests());

describe('getSongTags', () => {
  it('returns curated tags for an exact title', () => {
    expect(getSongTags('Ripple')).toEqual(expect.arrayContaining(['original', 'huntergarcia']));
  });

  it('derives rare from performance count instead of storing it', () => {
    const rareSong = GRATEFUL_DEAD_SONGS.find(
      s => s.performanceCount <= RARE_MAX_PERFORMANCES && s.title in SONG_TAGS
    )!;
    const commonSong = GRATEFUL_DEAD_SONGS.find(
      s => s.performanceCount > RARE_MAX_PERFORMANCES && s.title in SONG_TAGS
    )!;
    expect(getSongTags(rareSong.title)).toContain('rare');
    expect(getSongTags(commonSong.title)).not.toContain('rare');
  });

  it('never marks deliberately-untagged entries rare, whatever their count', () => {
    for (const title of UNTAGGED_TITLES) {
      expect([title, getSongTags(title)]).toEqual([title, []]);
    }
  });

  it('resolves loosely-spelled titles through songLookup', () => {
    // "Truckin" (no apostrophe) must land on the catalog's "Truckin'".
    expect(findSongByTitle('Truckin')).toBeDefined();
    expect(getSongTags('Truckin')).toEqual(getSongTags("Truckin'"));
    expect(getSongTags('Truckin').length).toBeGreaterThan(0);
  });

  it('returns [] for unknown titles', () => {
    expect(getSongTags('Free Bird')).toEqual([]);
  });
});

describe('makeSongTagFilter', () => {
  const titles = GRATEFUL_DEAD_SONGS.map(s => s.title);

  it('keeps everything when nothing is selected', () => {
    expect(titles.filter(makeSongTagFilter([]))).toHaveLength(titles.length);
  });

  it('ORs tags within a category', () => {
    const originals = titles.filter(makeSongTagFilter(['original']));
    const covers = titles.filter(makeSongTagFilter(['cover']));
    const either = titles.filter(makeSongTagFilter(['original', 'cover']));
    expect(either.length).toBe(new Set([...originals, ...covers]).size);
    expect(either.length).toBeGreaterThan(originals.length);
  });

  it('ANDs tags across categories', () => {
    const keep = makeSongTagFilter(['huntergarcia', 'ballad']);
    const matched = titles.filter(keep);
    expect(matched).toContain('Stella Blue');
    expect(matched).not.toContain('Looks Like Rain'); // ballad, but Barlow-Weir
    for (const title of matched) {
      const tags = getSongTags(title);
      expect([title, tags]).toEqual([title, expect.arrayContaining(['huntergarcia', 'ballad'])]);
    }
  });

  it('excludes untagged catalog noise from every tag filter', () => {
    const anyTag = titles.filter(makeSongTagFilter(['rare']));
    expect(anyTag).not.toContain('Drums');
    expect(anyTag).not.toContain('Encore Break');
  });
});

describe('getSongTagCounts', () => {
  const titles = GRATEFUL_DEAD_SONGS.map(s => s.title);

  it('counts each tag over the base titles when nothing is selected', () => {
    const counts = getSongTagCounts([], titles);
    for (const def of SONG_TAG_DEFS) {
      expect(counts[def.id]).toBe(titles.filter(makeSongTagFilter([def.id])).length);
    }
  });

  it("facets: another category's selection constrains a tag's count", () => {
    const unconstrained = getSongTagCounts([], titles);
    const constrained = getSongTagCounts(['gospel'], titles);
    // Fewer traditionals are gospel than exist overall…
    expect(constrained.traditional).toBeLessThan(unconstrained.traditional);
    // …while gospel's own category ignores its own selection.
    expect(constrained.gospel).toBe(unconstrained.gospel);
  });
});
