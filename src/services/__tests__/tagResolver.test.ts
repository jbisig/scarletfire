jest.mock('../recordingCatalog', () => ({
  getCatalogVersions: (date: string) => mockCatalog[date.slice(0, 10)] ?? [],
}));
jest.mock('../../utils/showLookup', () => ({
  getAllShowsSorted: () => mockShows,
  findShowByDate: (date: string) => mockShows.find(s => s.date.slice(0, 10) === date.slice(0, 10)),
}));
jest.mock('../../data/venueTypes', () => ({
  VENUE_TYPES: {
    'barton hall': { type: 'arena', confidence: 'high' },
    'winterland arena': { type: 'arena', confidence: 'high' },
    'wembley arena': { type: 'arena', confidence: 'high' },
    'sunshine daydream field': { type: 'amphitheater', confidence: 'low' },
  },
  INTERNATIONAL_VENUES: new Set(['wembley arena']),
}));
jest.mock('../../data/festivalDates', () => ({ FESTIVAL_DATES: [{ date: '1969-08-16', note: 'Woodstock', source: 's', confidence: 'high' }] }));
jest.mock('../../data/instrumentation', () => ({
  PEDAL_STEEL_DATES: [{ date: '1970-05-02', note: 'x', source: 's', confidence: 'high' }],
  ACOUSTIC_SET_DATES: [{ date: '1970-05-02', note: 'x', source: 's', confidence: 'high' }],
}));
jest.mock('../../data/notableShows', () => ({
  HISTORIC_EVENT_DATES: [{ date: '1969-08-16', note: 'x', source: 's', confidence: 'high' }],
  GUEST_SIT_IN_DATES: [{ date: '1990-03-29', note: 'Branford Marsalis', source: 's', confidence: 'high' }],
  consensusClassicDates: () => ['1977-05-08'],
}));

import {
  getShowTags, buildTagPredicate, makeShowTagFilter, applyTagFilter, getTagCounts,
  sourceConstraintFromTags, getTagCoverage, resetTagIndexForTests,
} from '../tagResolver';
import type { GratefulDeadShow, RecordingVersion } from '../../types/show.types';
import type { TagId } from '../../constants/tags';

const v = (identifier: string, over: Partial<RecordingVersion> = {}): RecordingVersion => ({ identifier, format: 'sbd', lineage: [], ...over });
const show = (date: string, venue: string): GratefulDeadShow => ({ date: `${date}T00:00:00Z`, year: date.slice(0, 4), venue, versions: [], primaryIdentifier: `id-${date}`, title: '' });

// Winterland 1978-12-27..31 = a 5-night residency; Barton Hall single night; Wembley international.
// Sunshine Daydream Field is a low-confidence venue-type entry (see the venueTypes
// mock below) — it must never resolve a physical type tag, so it's excluded from
// every venueType-filtered assertion below.
const mockShows: GratefulDeadShow[] = [
  show('1969-08-16', 'Woodstock'),
  show('1970-05-02', 'Harpur College'),
  show('1972-04-08', 'Wembley Arena'),
  show('1977-05-08', 'Barton Hall'),
  show('1977-05-09', 'Sunshine Daydream Field'),
  show('1978-12-27', 'Winterland Arena'), show('1978-12-28', 'Winterland Arena'),
  show('1978-12-30', 'Winterland Arena'), show('1978-12-31', 'Winterland Arena'),
  show('1990-03-29', 'Nassau Coliseum'),
];
const mockCatalog: Record<string, RecordingVersion[]> = {
  '1977-05-08': [v('mtx', { format: 'matrix' }), v('betty', { lineage: ['betty', 'lowgen'] }), v('aud', { format: 'aud' })],
  '1972-04-08': [v('e', { format: 'sbd', lineage: ['miller'] })],
  '1978-12-31': [v('w', { format: 'sbd' })],
  '1969-08-16': [v('unk', { format: 'unknown' })],
};
const DATES = mockShows.map(s => s.date.slice(0, 10));

beforeEach(() => resetTagIndexForTests());

describe('getShowTags', () => {
  it('unions era, source (from the catalog, excluding unknown), venue, instrumentation, notable', () => {
    expect(getShowTags('1977-05-08T00:00:00Z').sort()).toEqual(
      ['arena', 'aud', 'betty', 'classic', 'lowgen', 'matrix', 'peakkeith', 'sbd'].sort(),
    );
    expect(getShowTags('1972-04-08')).toEqual(expect.arrayContaining(['europe72', 'arena', 'international', 'sbd', 'miller']));
    expect(getShowTags('1969-08-16')).toEqual(expect.arrayContaining(['livedead', 'festival', 'historic']));
    expect(getShowTags('1969-08-16')).not.toContain('unknown');
    expect(getShowTags('1970-05-02')).toEqual(expect.arrayContaining(['americana', 'pedalsteel', 'acousticset']));
    expect(getShowTags('1990-03-29')).toEqual(expect.arrayContaining(['brent', 'guest']));
  });
  it('tags every night of a ≥4-show run within 10-day spacing as a residency, not a lone night', () => {
    ['1978-12-27', '1978-12-28', '1978-12-30', '1978-12-31'].forEach(d => expect(getShowTags(d)).toContain('residency'));
    expect(getShowTags('1977-05-08')).not.toContain('residency');
  });
  it('returns [] for a date not in the catalog and memoizes', () => {
    expect(getShowTags('2050-01-01')).toEqual([]);
    expect(getShowTags('1977-05-08')).toBe(getShowTags('1977-05-08'));
  });
  it('ignores a low-confidence venue-type entry (does not resolve a physical type)', () => {
    const tags = getShowTags('1977-05-09');
    expect(tags).not.toContain('amphitheater');
    expect(tags).not.toContain('theater');
    expect(tags).not.toContain('arena');
    expect(tags).not.toContain('stadium');
    expect(tags).toContain('peakkeith'); // other tag derivation is unaffected
  });
});

describe('buildTagPredicate (entity-agnostic)', () => {
  // Items are plain objects; categories come from the real registry, so real ids are used.
  it('ORs within a category and ANDs across categories', () => {
    const getTags = (i: { tags: TagId[] }) => i.tags;
    const pred = buildTagPredicate(['arena', 'stadium', 'peakkeith'], getTags);
    expect(pred({ tags: ['arena', 'peakkeith'] })).toBe(true);
    expect(pred({ tags: ['stadium', 'peakkeith'] })).toBe(true);
    expect(pred({ tags: ['arena', 'brent'] })).toBe(false);
    expect(pred({ tags: ['peakkeith'] })).toBe(false);
    expect(buildTagPredicate([], getTags)({ tags: [] })).toBe(true);
  });
});

describe('applyTagFilter / makeShowTagFilter', () => {
  it('filters dates', () => {
    expect(applyTagFilter(DATES, ['international'])).toEqual(['1972-04-08']);
    expect(applyTagFilter(DATES, ['arena', 'international']).length).toBe(6);   // both venueType → OR
    expect(applyTagFilter(DATES, ['residency']).length).toBe(4);
    expect(applyTagFilter(DATES, ['arena', 'peakkeith'])).toEqual(['1977-05-08', '1978-12-27', '1978-12-28', '1978-12-30', '1978-12-31']);
    expect(makeShowTagFilter(['guest'])('1990-03-29')).toBe(true);
  });
});

describe('getTagCounts (faceted)', () => {
  it('ignores the tag’s own category but applies the others', () => {
    const counts = getTagCounts(['arena'], DATES);
    expect(counts.arena).toBe(6);            // Barton Hall + 4 Winterland + Wembley
    expect(counts.international).toBe(1);    // own category ignored → not narrowed by 'arena'
    expect(counts.peakkeith).toBe(5);        // era counts ARE narrowed by the arena selection: Barton Hall + the 4 Winterland nights (Dec '78 is still Peak Keith)
    expect(counts.brent).toBe(0);            // Nassau (no venue type) excluded by the arena selection
    const none = getTagCounts([], DATES);
    expect(none.brent).toBe(1);
    expect(none.sbd).toBe(3);
  });
  it('respects the caller’s base dates', () => {
    expect(getTagCounts([], ['1977-05-08']).arena).toBe(1);
    expect(getTagCounts([], ['1977-05-08']).international).toBe(0);
  });
});

describe('sourceConstraintFromTags', () => {
  it('takes all selected lineage tags and ignores other categories', () => {
    expect(sourceConstraintFromTags(['arena', 'betty', 'sbd', 'aud', 'lowgen'])).toEqual({ format: 'sbd', lineage: ['betty', 'lowgen'] });
    expect(sourceConstraintFromTags(['arena'])).toBeUndefined();
    expect(sourceConstraintFromTags(['miller'])).toEqual({ lineage: ['miller'] });
  });
  it('picks the format by REGISTRY order (sbd, aud, matrix, fm), not tap order', () => {
    expect(sourceConstraintFromTags(['aud', 'sbd'])).toEqual({ format: 'sbd' });
    expect(sourceConstraintFromTags(['fm', 'matrix', 'aud'])).toEqual({ format: 'aud' });
  });
});

describe('getTagCoverage', () => {
  it('reports show counts and percentages per tag over the catalog', () => {
    const cov = getTagCoverage();
    expect(cov.find(c => c.id === 'arena')).toEqual({ id: 'arena', shows: 6, pct: Math.round((6 / DATES.length) * 100) });
    expect(cov.find(c => c.id === 'residency')?.shows).toBe(4);
  });
});
