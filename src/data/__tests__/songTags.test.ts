import { GRATEFUL_DEAD_SONGS } from '../../constants/songs.generated';
import { SONG_TAGS, UNTAGGED_TITLES } from '../songTags';
import { isSongTagId, tagCategory } from '../../constants/tags';

const catalogTitles = new Set(GRATEFUL_DEAD_SONGS.map(s => s.title));

describe('songTags data integrity', () => {
  it('keys every entry by an exact catalog title', () => {
    for (const title of Object.keys(SONG_TAGS)) {
      expect([title, catalogTitles.has(title)]).toEqual([title, true]);
    }
  });

  it('lists every UNTAGGED_TITLES entry in the catalog', () => {
    for (const title of UNTAGGED_TITLES) {
      expect([title, catalogTitles.has(title)]).toEqual([title, true]);
    }
  });

  it('accounts for every catalog song: tagged or deliberately untagged', () => {
    for (const song of GRATEFUL_DEAD_SONGS) {
      const accounted = song.title in SONG_TAGS || UNTAGGED_TITLES.has(song.title);
      expect([song.title, accounted]).toEqual([song.title, true]);
    }
  });

  it('never lists a title as both tagged and untagged', () => {
    for (const title of UNTAGGED_TITLES) {
      expect([title, title in SONG_TAGS]).toEqual([title, false]);
    }
  });

  it('uses only valid song tag ids and never stores the derived rare tag', () => {
    for (const [title, tags] of Object.entries(SONG_TAGS)) {
      expect(tags.length).toBeGreaterThan(0);
      for (const tag of tags) {
        expect([title, tag, isSongTagId(tag)]).toEqual([title, tag, true]);
        expect([title, tag]).not.toEqual([title, 'rare']);
      }
    }
  });

  it('gives at most one tag per entry from the writers category', () => {
    // OR-within-category makes multiple writer tags legal, but for this data
    // a song crediting two writing pairs is a curation slip, not a fact.
    for (const [title, tags] of Object.entries(SONG_TAGS)) {
      const writers = tags.filter(t => tagCategory(t) === 'songWriters' && t !== 'pigpen');
      expect([title, writers.length <= 1]).toEqual([title, true]);
    }
  });

  it('spot-checks canonical assignments', () => {
    expect(SONG_TAGS['Ripple']).toEqual(
      expect.arrayContaining(['original', 'huntergarcia', 'acoustic'])
    );
    expect(SONG_TAGS['Me & My Uncle']).toEqual(expect.arrayContaining(['cover', 'cowboy']));
    expect(SONG_TAGS['Turn on Your Lovelight']).toEqual(
      expect.arrayContaining(['cover', 'pigpen', 'jamvehicle'])
    );
    expect(SONG_TAGS['Dark Star']).toEqual(
      expect.arrayContaining(['original', 'huntergarcia', 'jamvehicle'])
    );
    expect(SONG_TAGS['Estimated Prophet']).toEqual(
      expect.arrayContaining(['original', 'barlowweir'])
    );
    expect(SONG_TAGS['Samson & Delilah']).toEqual(
      expect.arrayContaining(['traditional', 'gospel'])
    );
    expect(SONG_TAGS['Shakedown Street']).toEqual(expect.arrayContaining(['funk']));
    expect(SONG_TAGS['Friend of the Devil']).toEqual(expect.arrayContaining(['americanagenre']));
    // Hunter/Weir songs belong to neither writing-pair tag.
    expect(SONG_TAGS['Jack Straw']).toEqual(['original']);
    expect(SONG_TAGS['Sugar Magnolia']).toEqual(['original']);
  });
});
