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

import { resolveForDate, resolveShowIdentifier, resolveRouteIdentifier, stableShowIdentifier } from '../sourceSelection';
import { resetStoreForTests, setSourcePreference, setPin } from '../sourcePrefsStore';
import { createDownloadedShow, resetDownloadsStoreForTests, updateDownloadedShow, upsertDownloadedShow } from '../downloadsStore';
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

beforeEach(() => {
  resetStoreForTests();
  resetDownloadsStoreForTests();
});

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

  it('treats a complete download for the date as a pin, below a real user pin', () => {
    upsertDownloadedShow(createDownloadedShow(
      { identifier: 'aud', title: 'Cornell', date: '1977-05-08', year: '1977', downloadable: true, tracks: [] },
      { allowCellular: false, now: 1 },
    ));
    expect(resolveForDate('1977-05-08')).toEqual({ identifier: 'mtx', via: 'popular' }); // not complete yet
    updateDownloadedShow('aud', { status: 'complete', completedAt: 2 });
    expect(resolveForDate('1977-05-08')).toEqual({ identifier: 'aud', via: 'downloaded' });
    expect(resolveForDate('1977-05-08', { ignoreUserPin: true })).toEqual({ identifier: 'mtx', via: 'popular' });
    setPin('1977-05-08', 'betty', 'sbd', 3);
    expect(resolveForDate('1977-05-08')).toEqual({ identifier: 'betty', via: 'user-pin' });
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

describe('stableShowIdentifier', () => {
  it('uses the catalog primary identifier for a catalog date regardless of which recording is loaded', () => {
    expect(stableShowIdentifier('1977-05-08', 'betty')).toBe('mtx');
    expect(stableShowIdentifier('1977-05-08', 'aud')).toBe('mtx');
  });

  it('accepts a full ISO timestamp', () => {
    expect(stableShowIdentifier('1977-05-08T00:00:00Z', 'aud')).toBe('mtx');
  });

  it('falls back to the given identifier for an off-catalog date', () => {
    expect(stableShowIdentifier('1966-01-01', 'gd66.fav')).toBe('gd66.fav');
  });

  it('falls back to the given identifier when date is undefined', () => {
    expect(stableShowIdentifier(undefined, 'gd66.fav')).toBe('gd66.fav');
  });
});
