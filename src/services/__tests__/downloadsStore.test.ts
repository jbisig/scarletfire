import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../../constants/registry';
import type { ShowDetail } from '../../types/show.types';
import {
  createDownloadedShow,
  clearDownloadedShows,
  flushDownloadsPersist,
  getDownloadedBytesTotal,
  getDownloadedIdentifierForDate,
  getDownloadedShow,
  getDownloadedShowDetail,
  getDownloadsVersion,
  getManifest,
  getShowProgress,
  hydrateDownloads,
  isTrackDownloaded,
  listDownloadedShows,
  markTrackFailed,
  normalizeManifest,
  removeDownloadedShow,
  resetDownloadsStoreForTests,
  setTrackProgress,
  setWifiOnly,
  subscribeDownloads,
  updateDownloadedShow,
  updateDownloadedTrack,
  upsertDownloadedShow,
} from '../downloadsStore';

function detail(identifier: string, date = '1977-05-08'): ShowDetail {
  return {
    identifier,
    title: `Show ${identifier}`,
    date,
    year: date.slice(0, 4),
    venue: 'Barton Hall',
    location: 'Ithaca, NY',
    downloadable: true,
    tracks: [
      { id: 'd1t01.mp3', title: 'Minglewood', format: 'VBR MP3', streamUrl: 'https://archive.org/download/x/d1t01.mp3', size: 1000 },
      { id: 'd1t02.mp3', title: 'Loser', format: 'VBR MP3', streamUrl: 'https://archive.org/download/x/d1t02.mp3', size: 3000 },
    ],
  };
}

beforeEach(async () => {
  resetDownloadsStoreForTests();
  await AsyncStorage.clear();
});

describe('createDownloadedShow', () => {
  it('snapshots the detail, queues every track with a relative path, and sums sizes', () => {
    const show = createDownloadedShow(detail('aud'), { allowCellular: false, now: 123 });
    expect(show.identifier).toBe('aud');
    expect(show.status).toBe('queued');
    expect(show.requestedAt).toBe(123);
    expect(show.totalBytes).toBe(4000);
    expect(show.allowCellular).toBe(false);
    expect(show.tracks['d1t01.mp3']).toEqual({ relativePath: 'downloads/aud/d1t01.mp3', bytes: 1000, status: 'queued' });
    expect(show.detail.tracks).toHaveLength(2);
  });
});

describe('reads and writes', () => {
  it('upserts, lists newest first, and exposes snapshots', () => {
    upsertDownloadedShow(createDownloadedShow(detail('a', '1977-05-08'), { allowCellular: false, now: 1 }));
    upsertDownloadedShow(createDownloadedShow(detail('b', '1972-08-27'), { allowCellular: true, now: 2 }));
    expect(listDownloadedShows().map(s => s.identifier)).toEqual(['b', 'a']);
    expect(getDownloadedShowDetail('a')?.title).toBe('Show a');
    expect(getDownloadedShowDetail('zzz')).toBeNull();
  });

  it('only treats complete shows as the downloaded recording for a date', () => {
    upsertDownloadedShow(createDownloadedShow(detail('a'), { allowCellular: false, now: 1 }));
    expect(getDownloadedIdentifierForDate('1977-05-08')).toBeNull();
    updateDownloadedShow('a', { status: 'complete', completedAt: 5 });
    expect(getDownloadedIdentifierForDate('1977-05-08T00:00:00Z')).toBe('a');
    expect(isTrackDownloaded('a', 'd1t01.mp3')).toBe(false);
    updateDownloadedTrack('a', 'd1t01.mp3', { status: 'complete' });
    expect(isTrackDownloaded('a', 'd1t01.mp3')).toBe(true);
  });

  it('computes progress from complete bytes plus in-flight bytes', () => {
    upsertDownloadedShow(createDownloadedShow(detail('a'), { allowCellular: false, now: 1 }));
    updateDownloadedTrack('a', 'd1t01.mp3', { status: 'complete' });
    setTrackProgress('a', 'd1t02.mp3', 1500);
    expect(getShowProgress('a')).toEqual({ bytesDownloaded: 2500, totalBytes: 4000, fraction: 0.625 });
    updateDownloadedShow('a', { status: 'complete' });
    expect(getShowProgress('a').fraction).toBe(1);
    expect(getShowProgress('nope')).toEqual({ bytesDownloaded: 0, totalBytes: 0, fraction: 0 });
  });

  it('totals only complete tracks, removes and clears', () => {
    upsertDownloadedShow(createDownloadedShow(detail('a'), { allowCellular: false, now: 1 }));
    upsertDownloadedShow(createDownloadedShow(detail('b'), { allowCellular: false, now: 2 }));
    updateDownloadedTrack('a', 'd1t01.mp3', { status: 'complete', bytes: 1234 });
    expect(getDownloadedBytesTotal()).toBe(1234);
    removeDownloadedShow('a');
    expect(getDownloadedShow('a')).toBeUndefined();
    clearDownloadedShows();
    expect(listDownloadedShows()).toEqual([]);
  });

  it('marks a complete track failed (and the show) when the file is bad at play time', () => {
    upsertDownloadedShow(createDownloadedShow(detail('a'), { allowCellular: false, now: 1 }));
    expect(markTrackFailed('a', 'd1t01.mp3')).toBe(false);
    updateDownloadedTrack('a', 'd1t01.mp3', { status: 'complete' });
    updateDownloadedShow('a', { status: 'complete', completedAt: 9 });
    expect(markTrackFailed('a', 'd1t01.mp3')).toBe(true);
    expect(getDownloadedShow('a')?.status).toBe('failed');
    expect(getDownloadedShow('a')?.tracks['d1t01.mp3'].status).toBe('failed');
  });

  it('bumps the version and notifies subscribers on every write', () => {
    const listener = jest.fn();
    subscribeDownloads(listener);
    const before = getDownloadsVersion();
    setWifiOnly(false);
    setWifiOnly(false); // no-op, no notify
    expect(listener).toHaveBeenCalledTimes(1);
    expect(getDownloadsVersion()).toBe(before + 1);
  });
});

describe('persistence', () => {
  it('persists writes and hydrates them back', async () => {
    upsertDownloadedShow(createDownloadedShow(detail('a'), { allowCellular: false, now: 1 }));
    setWifiOnly(false);
    await flushDownloadsPersist();
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.DOWNLOADS);
    expect(raw).toContain('"version":1');

    resetDownloadsStoreForTests();
    expect(getManifest().shows).toEqual({});
    await hydrateDownloads();
    expect(getDownloadedShow('a')?.title).toBe('Show a');
    expect(getManifest().wifiOnly).toBe(false);
  });

  it('never persists in-flight progress', async () => {
    upsertDownloadedShow(createDownloadedShow(detail('a'), { allowCellular: false, now: 1 }));
    setTrackProgress('a', 'd1t01.mp3', 500);
    await flushDownloadsPersist();
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.DOWNLOADS);
    expect(raw).not.toContain('500');
  });

  it('treats corrupt or foreign JSON as an empty manifest', async () => {
    await AsyncStorage.setItem(STORAGE_KEYS.DOWNLOADS, '{not json');
    await hydrateDownloads();
    expect(getManifest()).toEqual({ version: 1, wifiOnly: true, shows: {} });
    expect(normalizeManifest({ version: 2, shows: {} })).toEqual({ version: 1, wifiOnly: true, shows: {} });
    expect(normalizeManifest({ version: 1, wifiOnly: false, shows: { x: { identifier: 'y' } } }).shows).toEqual({});
  });
});
