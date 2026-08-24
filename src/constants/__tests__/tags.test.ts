import { FORMAT_LABELS, LINEAGE_LABELS, formatLabel, lineageLabel } from '../tags';
import { TAG_CATEGORIES, TAG_DEFS, isTagId, tagLabel, tagCategory, tagsInCategory } from '../tags';

describe('tag labels', () => {
  it('labels every format', () => {
    expect(FORMAT_LABELS).toEqual({
      sbd: 'Soundboard',
      aud: 'Audience',
      matrix: 'Matrix',
      fm: 'FM Broadcast',
      unknown: 'Unknown',
    });
    expect(formatLabel('matrix')).toBe('Matrix');
    expect(formatLabel(undefined)).toBe('Unknown');
  });
  it('labels every lineage tag', () => {
    expect(LINEAGE_LABELS).toEqual({
      betty: 'Betty Board',
      miller: 'Charlie Miller',
      '16track': '16-Track',
      lowgen: 'Low Generation',
    });
    expect(lineageLabel('betty')).toBe('Betty Board');
  });
});

describe('tag registry', () => {
  it('lists the nine categories in menu order with the right entity levels', () => {
    expect(TAG_CATEGORIES.map(c => c.id)).toEqual([
      'era', 'source', 'venueType', 'instrumentation', 'notable',
      'songType', 'songWriters', 'songGenre', 'songCharacter',
    ]);
    expect(TAG_CATEGORIES.find(c => c.id === 'source')?.appliesTo).toBe('recording');
    TAG_CATEGORIES.filter(c => ['era', 'venueType', 'instrumentation', 'notable'].includes(c.id))
      .forEach(c => expect(c.appliesTo).toBe('show'));
    TAG_CATEGORIES.filter(c => c.id.startsWith('song')).forEach(c => expect(c.appliesTo).toBe('song'));
  });

  it('defines every tag id exactly once with a label and a known category', () => {
    const ids = TAG_DEFS.map(t => t.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toEqual([
      'primal', 'livedead', 'americana', 'europe72', 'wallofsound', 'hiatus', 'return', 'peakkeith', 'brent', 'vincebruce', 'finalyears',
      'sbd', 'aud', 'matrix', 'fm', 'betty', 'miller', '16track', 'lowgen',
      'theater', 'arena', 'stadium', 'amphitheater', 'festival', 'international', 'residency',
      'pedalsteel', 'acousticset',
      'classic', 'historic', 'guest',
      'original', 'cover', 'traditional',
      'huntergarcia', 'barlowweir', 'pigpen',
      'blues', 'gospel', 'cowboy', 'americanagenre', 'funk',
      'jamvehicle', 'ballad', 'acoustic', 'rare',
    ]);
    const categoryIds = new Set(TAG_CATEGORIES.map(c => c.id));
    TAG_DEFS.forEach(t => { expect(categoryIds.has(t.category)).toBe(true); expect(t.label.length).toBeGreaterThan(0); });
  });

  it('source tag labels come from the PR-1 tables', () => {
    expect(tagLabel('sbd')).toBe('Soundboard');
    expect(tagLabel('betty')).toBe('Betty Board');
    expect(tagLabel('europe72')).toBe("Europe '72");
    expect(tagLabel('classic')).toBe('Consensus Classic');
    expect(tagLabel('guest')).toBe('Guest Sit-In');
  });

  it('validates ids, maps to categories, and lists a category in order', () => {
    expect(isTagId('arena')).toBe(true);
    expect(isTagId('unknown')).toBe(false);
    expect(isTagId('series')).toBe(false);
    expect(tagCategory('miller')).toBe('source');
    expect(tagCategory('residency')).toBe('venueType');
    expect(tagsInCategory('instrumentation').map(t => t.id)).toEqual(['pedalsteel', 'acousticset']);
  });
});
