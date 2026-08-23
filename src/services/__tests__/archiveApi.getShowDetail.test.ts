// Coverage for the song-load performance work: direct datanode stream URLs
// (skipping /download's 302 hop) with durable fallbacks, the persistent
// two-tier show-detail cache, and cache invalidation.

jest.mock('../../utils/logger', () => ({
  logger: {
    api: { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() },
    player: { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() },
  },
}));

// The persistent tier uses AsyncStorage, globally mocked (in-memory) by
// src/__tests__/setup.ts.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { archiveApi } from '../archiveApi';

function metadataResponse(overrides: { server?: string | null } = {}) {
  const server = overrides.server === undefined ? 'ia600106.us.archive.org' : overrides.server;
  return {
    created: 1,
    d1: 'ia600106.us.archive.org',
    d2: 'ia800106.us.archive.org',
    dir: '/1/items/test-show',
    ...(server ? { server } : {}),
    metadata: {
      title: 'Test Show',
      date: '1977-05-08',
      venue: 'Barton Hall',
      coverage: 'Ithaca, NY',
    },
    files: [
      { name: 'd1t01.mp3', format: 'VBR MP3', size: '1', length: '5:00', track: '1' },
      { name: 'd1t02.mp3', format: 'VBR MP3', size: '1', length: '6:00', track: '2' },
      { name: 'd1t01.flac', format: 'Flac', size: '1', length: '5:00', track: '1' },
      { name: 'info.txt', format: 'Text', size: '1' },
    ],
  };
}

function mockFetchOnce(body: unknown) {
  return jest.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => body,
  });
}

describe('archiveApi.getShowDetail', () => {
  const originalFetch = global.fetch;

  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.clearAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('builds direct datanode stream URLs with /download fallbacks when server+dir are present', async () => {
    global.fetch = mockFetchOnce(metadataResponse()) as unknown as typeof fetch;

    const detail = await archiveApi.getShowDetail('direct-url-show');

    expect(detail.tracks).toHaveLength(2); // MP3s only, FLAC/txt filtered
    expect(detail.tracks[0].streamUrl).toBe(
      'https://ia600106.us.archive.org/1/items/test-show/d1t01.mp3'
    );
    expect(detail.tracks[0].fallbackStreamUrl).toBe(
      'https://archive.org/download/direct-url-show/d1t01.mp3'
    );
  });

  it('falls back to /download URLs with no fallback field when server is absent', async () => {
    global.fetch = mockFetchOnce(metadataResponse({ server: null })) as unknown as typeof fetch;

    const detail = await archiveApi.getShowDetail('no-server-show');

    expect(detail.tracks[0].streamUrl).toBe(
      'https://archive.org/download/no-server-show/d1t01.mp3'
    );
    expect(detail.tracks[0].fallbackStreamUrl).toBeUndefined();
  });

  it('serves a persisted entry without fetching (cold-start path)', async () => {
    const persisted = {
      data: {
        identifier: 'persisted-show',
        title: 'Persisted',
        date: '1972-08-27',
        year: '1972',
        tracks: [],
      },
      timestamp: Date.now() - 1000,
    };
    await AsyncStorage.setItem('showDetail:persisted-show', JSON.stringify(persisted));
    const fetchSpy = jest.fn();
    global.fetch = fetchSpy as unknown as typeof fetch;

    const detail = await archiveApi.getShowDetail('persisted-show');

    expect(detail.title).toBe('Persisted');
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('refetches when the persisted entry is expired', async () => {
    const persisted = {
      data: { identifier: 'expired-show', title: 'Old', date: '1970-01-01', year: '1970', tracks: [] },
      timestamp: Date.now() - 15 * 24 * 60 * 60 * 1000, // past the 14-day TTL
    };
    await AsyncStorage.setItem('showDetail:expired-show', JSON.stringify(persisted));
    global.fetch = mockFetchOnce(metadataResponse()) as unknown as typeof fetch;

    const detail = await archiveApi.getShowDetail('expired-show');

    expect(detail.title).toBe('Test Show');
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('persists fetched details and maintains the LRU index', async () => {
    global.fetch = mockFetchOnce(metadataResponse()) as unknown as typeof fetch;

    await archiveApi.getShowDetail('written-show');

    // The write is fire-and-forget from getShowDetail — flush microtasks.
    await new Promise(resolve => setImmediate(resolve));
    const entry = JSON.parse((await AsyncStorage.getItem('showDetail:written-show'))!);
    expect(entry.data.identifier).toBe('written-show');
    const index = JSON.parse((await AsyncStorage.getItem('showDetail:index'))!);
    expect(index).toContain('written-show');
  });

  it('invalidateShowDetail drops both cache tiers so the next call refetches', async () => {
    global.fetch = mockFetchOnce(metadataResponse()) as unknown as typeof fetch;
    await archiveApi.getShowDetail('invalidate-show');
    expect(global.fetch).toHaveBeenCalledTimes(1);

    // Let the fire-and-forget persistence write land before invalidating.
    await new Promise(resolve => setImmediate(resolve));
    archiveApi.invalidateShowDetail('invalidate-show');
    await new Promise(resolve => setImmediate(resolve));
    expect(await AsyncStorage.getItem('showDetail:invalidate-show')).toBeNull();

    await archiveApi.getShowDetail('invalidate-show');
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('marks a recording downloadable unless its collection contains stream_only', async () => {
    const aud = metadataResponse();
    aud.metadata = { ...aud.metadata, collection: ['GratefulDead', 'etree'] } as typeof aud.metadata;
    global.fetch = mockFetchOnce(aud) as unknown as typeof fetch;
    expect((await archiveApi.getShowDetail('aud-show')).downloadable).toBe(true);

    const sbd = metadataResponse();
    sbd.metadata = { ...sbd.metadata, collection: ['GratefulDead', 'etree', 'stream_only'] } as typeof sbd.metadata;
    global.fetch = mockFetchOnce(sbd) as unknown as typeof fetch;
    expect((await archiveApi.getShowDetail('sbd-show')).downloadable).toBe(false);
  });

  it('handles a bare-string collection and a missing collection', async () => {
    const single = metadataResponse();
    single.metadata = { ...single.metadata, collection: 'stream_only' } as typeof single.metadata;
    global.fetch = mockFetchOnce(single) as unknown as typeof fetch;
    expect((await archiveApi.getShowDetail('single-show')).downloadable).toBe(false);

    global.fetch = mockFetchOnce(metadataResponse()) as unknown as typeof fetch;
    expect((await archiveApi.getShowDetail('no-collection-show')).downloadable).toBe(true);
  });

  it('carries the archive file size onto each track', async () => {
    const body = metadataResponse();
    body.files[0].size = '5242880';
    global.fetch = mockFetchOnce(body) as unknown as typeof fetch;
    const detail = await archiveApi.getShowDetail('sized-show');
    expect(detail.tracks[0].size).toBe(5242880);
  });
});
