import { GRATEFUL_DEAD_SONGS } from '../songs.generated';
import { findSongByTitle } from '../../utils/songLookup';

/**
 * songs.generated.ts was corrupted by escapeString() in the generators, which
 * doubled backslashes with no guard against already-escaped input: regenerating
 * the catalog from its own output turned one apostrophe into 64 backslashes,
 * and split three songs into a damaged orphan beside the real entry.
 *
 * escapeString now defers to JSON.stringify and the data was repaired by
 * scripts/repairSongCatalogTitles.js. These guard against a regression.
 */
describe('song catalog integrity', () => {
  it('has no title carrying escape damage', () => {
    for (const song of GRATEFUL_DEAD_SONGS) {
      expect([song.title, /\\/.test(song.title)]).toEqual([song.title, false]);
    }
  });

  it('has no title carrying mis-decoded Windows-1252 punctuation', () => {
    // U+00E2 followed by a C1 control is the signature of 0x92/0x93/0x94 read
    // as UTF-8; a lone C1 control is the same damage half-stripped.
    for (const song of GRATEFUL_DEAD_SONGS) {
      expect([song.title, /â[-]|[-]/.test(song.title)])
        .toEqual([song.title, false]);
    }
  });

  it('has no two songs that differ only in punctuation', () => {
    const seen = new Map<string, string>();
    for (const song of GRATEFUL_DEAD_SONGS) {
      const key = song.title
        .toLowerCase()
        .replace(/playin'/g, 'playing')
        .replace(/truckin'/g, 'truckin')
        .replace(/lovin'/g, 'loving')
        .replace(/&/g, 'and')
        .replace(/[^a-z0-9]/g, '');
      const prior = seen.get(key);
      expect([key, prior, song.title]).toEqual([key, undefined, song.title]);
      seen.set(key, song.title);
    }
  });

  it('keeps performanceCount in step with the performances array', () => {
    for (const song of GRATEFUL_DEAD_SONGS) {
      expect([song.title, song.performanceCount])
        .toEqual([song.title, song.performances.length]);
    }
  });

  it('has no duplicate performance within a song', () => {
    for (const song of GRATEFUL_DEAD_SONGS) {
      const keys = song.performances.map(p => `${p.identifier}|${p.date}`);
      expect([song.title, new Set(keys).size]).toEqual([song.title, keys.length]);
    }
  });

  it('carries the merged performances on the surviving entries', () => {
    // Each damaged orphan held 3 performances, but only Truckin's were new —
    // the other six already existed on the surviving entry and were deduped by
    // identifier+date rather than double-counted.
    expect(findSongByTitle("Truckin'")?.performanceCount).toBe(506);
    expect(findSongByTitle("Uncle John's Band")?.performanceCount).toBe(307);
    expect(findSongByTitle('Playing in the Band')?.performanceCount).toBe(576);
    expect(GRATEFUL_DEAD_SONGS.length).toBe(362);
  });

  it('resolves a title whatever its punctuation', () => {
    const truckin = findSongByTitle("Truckin'");
    expect(truckin).toBeDefined();
    for (const variant of ['Truckin', 'truckin', "TRUCKIN'", 'Truckin’']) {
      expect([variant, findSongByTitle(variant)]).toEqual([variant, truckin]);
    }

    const uncle = findSongByTitle("Uncle John's Band");
    for (const variant of ['Uncle Johns Band', 'uncle johns band']) {
      expect([variant, findSongByTitle(variant)]).toEqual([variant, uncle]);
    }

    // "Playin'" and "Playing" are the same song to every other lookup path.
    expect(findSongByTitle("Playin' in the Band"))
      .toBe(findSongByTitle('Playing in the Band'));

    // ...but the Reprise is genuinely a different entry.
    expect(findSongByTitle('Playing in the Band Reprise'))
      .not.toBe(findSongByTitle('Playing in the Band'));
  });

  it('still returns undefined for a song that is not there', () => {
    expect(findSongByTitle('Not A Grateful Dead Song')).toBeUndefined();
    expect(findSongByTitle('')).toBeUndefined();
  });
});
