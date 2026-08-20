jest.mock('../recordingCatalog', () => ({
  getCatalogVersions: (date: string) => mockCatalog[date.slice(0, 10)] ?? [],
}));
jest.mock('../../data/recordingOverrides', () => ({
  tagFixes: {},
  editorialPins: { '1972-08-27': 'veneta-editorial' },
}));
jest.mock('../../utils/showLookup', () => ({
  findShowByDate: (date: string) => mockShows[date.slice(0, 10)],
}));

import { resolveForDate, resolveShowIdentifier, resolveRouteIdentifier } from '../sourceSelection';
import { resetStoreForTests, setSourcePreference, setPin } from '../sourcePrefsStore';
import type { GratefulDeadShow, RecordingVersion } from '../../types/show.types';

const v = (identifier: string, over: Partial<RecordingVersion> = {}): RecordingVersion => ({
  identifier, format: 'sbd', lineage: [], downloads: 1000, ...over,
});

const mockCatalog: Record<string, RecordingVersion[]> = {
  '1977-05-08': [v('mtx', { format: 'matrix', downloads: 1_000_000 }), v('betty', { lineage: ['betty'] }), v('aud', { format: 'aud' })],
  '1972-08-27': [v('veneta-sbd', { downloads: 90_000 }), v('veneta-editorial', { downloads: 10 })],
};
const mockShows: Record<string, GratefulDeadShow> = {
  '1977-05-08': { date: '1977-05-08T00:00:00Z', year: '1977', versions: mockCatalog['1977-05-08'], primaryIdentifier: 'mtx', title: 'Cornell' },
};

beforeEach(() => resetStoreForTests());

describe('resolveForDate', () => {
  it('resolves through preference, pins, and editorial pins from the stores', () => {
    expect(resolveForDate('1977-05-08')).toEqual({ identifier: 'mtx', via: 'popular' });
    setSourcePreference('sbd', 1);
    expect(resolveForDate('1977-05-08')).toEqual({ identifier: 'betty', via: 'preference' });
    setPin('1977-05-08', 'aud', 'aud', 2);
    expect(resolveForDate('1977-05-08T00:00:00Z')).toEqual({ identifier: 'aud', via: 'user-pin' });
    expect(resolveForDate('1972-08-27')).toEqual({ identifier: 'veneta-editorial', via: 'editorial' });
  });

  it('can ignore the user pin (to show what the default WOULD be)', () => {
    setSourcePreference('sbd', 1);
    setPin('1977-05-08', 'aud', 'aud', 2);
    expect(resolveForDate('1977-05-08', { ignoreUserPin: true })).toEqual({ identifier: 'betty', via: 'preference' });
  });

  it('honours a session constraint and reports fallback', () => {
    expect(resolveForDate('1977-05-08', { sessionConstraint: { format: 'fm' } })).toEqual({
      identifier: 'mtx', via: 'filter', fallback: { requested: ['fm'], relaxed: ['fm'] },
    });
  });

  it('returns the fallback identifier when the date is not in the catalog, else null', () => {
    expect(resolveForDate('1966-01-01')).toBeNull();
    expect(resolveForDate('1966-01-01', { fallbackIdentifier: 'gd66.xyz' })).toEqual({ identifier: 'gd66.xyz', via: 'popular' });
  });
});

describe('resolveShowIdentifier', () => {
  it('uses the catalog for the show date and falls back to primaryIdentifier off-catalog', () => {
    setSourcePreference('aud', 1);
    expect(resolveShowIdentifier(mockShows['1977-05-08'])).toBe('aud');
    const offCatalog: GratefulDeadShow = { date: '1966-01-01', year: '1966', versions: [], primaryIdentifier: 'gd66.fav', title: 'x' };
    expect(resolveShowIdentifier(offCatalog)).toBe('gd66.fav');
  });
});

describe('resolveRouteIdentifier', () => {
  it('resolves a YYYY-MM-DD route id to the preferred recording and passes identifiers through', () => {
    setSourcePreference('sbd', 1);
    expect(resolveRouteIdentifier('1977-05-08')).toBe('betty');
    expect(resolveRouteIdentifier('1977-05-08', { format: 'aud' })).toBe('aud');
    expect(resolveRouteIdentifier('gd1977-05-08.mtx.seamons')).toBe('gd1977-05-08.mtx.seamons');
    expect(resolveRouteIdentifier('1966-01-01')).toBe('1966-01-01');
  });
});
