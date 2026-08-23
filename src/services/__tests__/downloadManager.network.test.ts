jest.mock('../nativeAudioPlayer', () => ({
  __esModule: true,
  default: { setExcludedFromBackup: jest.fn().mockResolvedValue(undefined) },
}));

import type { ShowDetail } from '../../types/show.types';
import {
  createDownloadedShow,
  getDownloadedShow,
  getManifest,
  listDownloadedShows,
  markTrackFailed,
  resetDownloadsStoreForTests,
  updateDownloadedShow,
  updateDownloadedTrack,
  upsertDownloadedShow,
} from '../downloadsStore';
import { downloadManager } from '../downloadManager';
import { resetNetworkStatusForTests } from '../networkStatus';

const FS = require('expo-file-system/legacy');
const ExpoNetwork = require('expo-network');
const flush = async () => { for (let i = 0; i < 5; i++) await new Promise(r => setTimeout(r, 0)); };

function detail(identifier = 'aud', trackCount = 2): ShowDetail {
  return {
    identifier,
    title: 'Cornell',
    date: '1977-05-08',
    year: '1977',
    downloadable: true,
    tracks: Array.from({ length: trackCount }, (_, i) => ({
      id: `d1t0${i + 1}.mp3`,
      title: `Track ${i + 1}`,
      format: 'VBR MP3',
      streamUrl: `https://archive.org/download/${identifier}/d1t0${i + 1}.mp3`,
      size: 1000,
    })),
  };
}

beforeEach(async () => {
  FS.__reset();
  ExpoNetwork.__resetNetworkState();
  resetDownloadsStoreForTests();
  resetNetworkStatusForTests();
  downloadManager.__resetForTests();
  downloadManager.__setSleepForTests(async () => {});
  downloadManager.start();
  await flush();
});

describe('Wi-Fi guard', () => {
  it('pauses a new show on cellular when wifiOnly is on, and resumes on Wi-Fi', async () => {
    ExpoNetwork.__setNetworkState({ type: 'CELLULAR' });
    await downloadManager.enqueueShow(detail());
    await flush();
    expect(getDownloadedShow('aud')?.status).toBe('paused');
    expect(FS.__tasks).toHaveLength(0);

    ExpoNetwork.__setNetworkState({ type: 'WIFI' });
    await flush();
    expect(getDownloadedShow('aud')?.status).toBe('downloading');
    expect(FS.__tasks).toHaveLength(2);
  });

  it('lets a show with allowCellular through, and allowCellular() unblocks a paused one', async () => {
    ExpoNetwork.__setNetworkState({ type: 'CELLULAR' });
    await downloadManager.enqueueShow(detail('ok'), { allowCellular: true });
    await downloadManager.enqueueShow(detail('blocked'));
    await flush();
    expect(getDownloadedShow('ok')?.status).toBe('downloading');
    FS.__tasks[0].complete();
    FS.__tasks[1].complete();
    await flush();
    expect(getDownloadedShow('ok')?.status).toBe('complete');
    expect(getDownloadedShow('blocked')?.status).toBe('paused');

    downloadManager.allowCellular('blocked');
    await flush();
    expect(getDownloadedShow('blocked')?.allowCellular).toBe(true);
    expect(getDownloadedShow('blocked')?.status).toBe('downloading');
  });

  it('pauses the active show when the network drops to cellular and re-queues it on Wi-Fi', async () => {
    await downloadManager.enqueueShow(detail('aud', 3));
    await flush();
    FS.__tasks[0].complete();
    await flush();
    ExpoNetwork.__setNetworkState({ type: 'CELLULAR' });
    await flush();
    expect(FS.__tasks[1].paused).toBe(true);
    expect(getDownloadedShow('aud')?.status).toBe('paused');
    expect(getDownloadedShow('aud')?.tracks['d1t01.mp3'].status).toBe('complete');

    ExpoNetwork.__setNetworkState({ type: 'WIFI' });
    await flush();
    expect(getDownloadedShow('aud')?.status).toBe('downloading');
    // Only the two unfinished tracks restart.
    expect(FS.__tasks.slice(3).map((t: { url: string }) => t.url)).toEqual([
      'https://archive.org/download/aud/d1t02.mp3',
      'https://archive.org/download/aud/d1t03.mp3',
    ]);
  });

  it('treats no connection like cellular-with-guard (paused until connected)', async () => {
    ExpoNetwork.__setNetworkState({ type: 'NONE', isConnected: false });
    await downloadManager.enqueueShow(detail('aud'), { allowCellular: true });
    await flush();
    expect(getDownloadedShow('aud')?.status).toBe('paused');
    ExpoNetwork.__setNetworkState({ type: 'CELLULAR', isConnected: true });
    await flush();
    expect(getDownloadedShow('aud')?.status).toBe('downloading');
  });

  it('setWifiOnly(false) resumes paused shows and persists the setting', async () => {
    ExpoNetwork.__setNetworkState({ type: 'CELLULAR' });
    await downloadManager.enqueueShow(detail());
    await flush();
    downloadManager.setWifiOnly(false);
    await flush();
    expect(getManifest().wifiOnly).toBe(false);
    expect(getDownloadedShow('aud')?.status).toBe('downloading');
  });

  it('does not strand a show in paused when the network recovers before the pause write lands', async () => {
    await downloadManager.enqueueShow(detail('aud', 2));
    await flush();
    expect(FS.__tasks).toHaveLength(2);

    // No flush() between these two: the network drop and recovery both land
    // before the still-unwinding worker writes its status.
    ExpoNetwork.__setNetworkState({ type: 'CELLULAR' });
    ExpoNetwork.__setNetworkState({ type: 'WIFI' });
    await flush();

    expect(getDownloadedShow('aud')?.status).not.toBe('paused');
    expect(['downloading', 'complete']).toContain(getDownloadedShow('aud')?.status);
    // The unfinished tracks were re-queued and got fresh download tasks.
    expect(FS.__tasks.length).toBeGreaterThan(2);
  });

  it('setWifiOnly(true) pauses an active cellular transfer', async () => {
    downloadManager.setWifiOnly(false);
    ExpoNetwork.__setNetworkState({ type: 'CELLULAR' });
    await downloadManager.enqueueShow(detail('aud', 2));
    await flush();
    expect(getDownloadedShow('aud')?.status).toBe('downloading');

    downloadManager.setWifiOnly(true);
    await flush();
    expect(getDownloadedShow('aud')?.status).toBe('paused');
    expect(FS.__tasks[0].paused).toBe(true);
    expect(FS.__tasks[1].paused).toBe(true);
  });
});

describe('reconcileOnLaunch', () => {
  it('marks present files complete, re-queues missing ones, and restarts the worker', async () => {
    const show = createDownloadedShow(detail('aud', 2), { allowCellular: false, now: 1 });
    upsertDownloadedShow({ ...show, status: 'downloading' });
    FS.__files.set('file:///mock-documents/downloads/aud/d1t01.mp3', { size: 1000 });
    await downloadManager.reconcileOnLaunch();
    await flush();
    const after = getDownloadedShow('aud')!;
    expect(after.tracks['d1t01.mp3'].status).toBe('complete');
    expect(after.status).toBe('downloading');
    expect(FS.__tasks.map((t: { url: string }) => t.url)).toEqual(['https://archive.org/download/aud/d1t02.mp3']);
  });

  it('completes a show whose files are all present', async () => {
    const show = createDownloadedShow(detail('aud', 1), { allowCellular: false, now: 1 });
    upsertDownloadedShow({ ...show, status: 'queued' });
    FS.__files.set('file:///mock-documents/downloads/aud/d1t01.mp3', { size: 1000 });
    await downloadManager.reconcileOnLaunch();
    await flush();
    expect(getDownloadedShow('aud')?.status).toBe('complete');
    expect(FS.__tasks).toHaveLength(0);
  });

  it('fails a complete show with no files on disk instead of silently re-downloading', async () => {
    const show = createDownloadedShow(detail('aud', 2), { allowCellular: false, now: 1 });
    upsertDownloadedShow(show);
    updateDownloadedTrack('aud', 'd1t01.mp3', { status: 'complete' });
    updateDownloadedTrack('aud', 'd1t02.mp3', { status: 'complete' });
    updateDownloadedShow('aud', { status: 'complete', completedAt: 2 });
    await downloadManager.reconcileOnLaunch();
    await flush();
    expect(getDownloadedShow('aud')?.status).toBe('failed');
    expect(FS.__tasks).toHaveLength(0);
  });

  it('retries out of a files-missing failure instead of dead-ending (tracks were re-queued)', async () => {
    const show = createDownloadedShow(detail('aud', 2), { allowCellular: false, now: 1 });
    upsertDownloadedShow(show);
    updateDownloadedTrack('aud', 'd1t01.mp3', { status: 'complete' });
    updateDownloadedTrack('aud', 'd1t02.mp3', { status: 'complete' });
    updateDownloadedShow('aud', { status: 'complete', completedAt: 2 });
    await downloadManager.reconcileOnLaunch();
    await flush();
    expect(getDownloadedShow('aud')?.status).toBe('failed');
    expect(getDownloadedShow('aud')?.tracks['d1t01.mp3'].status).toBe('queued');
    expect(getDownloadedShow('aud')?.tracks['d1t02.mp3'].status).toBe('queued');

    await downloadManager.retryShow('aud');
    await flush();
    expect(FS.__tasks.length).toBeGreaterThan(0);
    expect(['downloading', 'complete']).toContain(getDownloadedShow('aud')?.status);

    for (const task of FS.__tasks) task.complete();
    await flush();
    expect(getDownloadedShow('aud')?.status).toBe('complete');
  });

  it('leaves a show that playback marked failed alone even though its files are still on disk', async () => {
    const show = createDownloadedShow(detail('aud', 2), { allowCellular: false, now: 1 });
    upsertDownloadedShow(show);
    updateDownloadedTrack('aud', 'd1t01.mp3', { status: 'complete' });
    updateDownloadedTrack('aud', 'd1t02.mp3', { status: 'complete' });
    updateDownloadedShow('aud', { status: 'complete', completedAt: 2 });
    FS.__files.set('file:///mock-documents/downloads/aud/d1t01.mp3', { size: 1000 });
    FS.__files.set('file:///mock-documents/downloads/aud/d1t02.mp3', { size: 1000 });
    markTrackFailed('aud', 'd1t01.mp3');

    await downloadManager.reconcileOnLaunch();
    await flush();
    const after = getDownloadedShow('aud')!;
    expect(after.status).toBe('failed');
    expect(after.tracks['d1t01.mp3'].status).toBe('failed');
    expect(FS.__tasks).toHaveLength(0);
  });

  it('resolves and keeps network monitoring alive when a per-track getInfoAsync call throws', async () => {
    // Undo beforeEach's own start() so this test isolates
    // reconcileOnLaunch's `finally { this.start(); }` as the thing that
    // re-wires network monitoring, even though the getInfoAsync call below
    // throws partway through the reconcile loop.
    downloadManager.__resetForTests();
    downloadManager.__setSleepForTests(async () => {});

    const show = createDownloadedShow(detail('aud', 2), { allowCellular: false, now: 1 });
    upsertDownloadedShow(show);
    ExpoNetwork.__setNetworkState({ type: 'CELLULAR' });

    FS.getInfoAsync.mockImplementationOnce(() => { throw new Error('boom'); });

    await expect(downloadManager.reconcileOnLaunch()).resolves.toBeUndefined();
    await flush();
    // Paused by the Wi-Fi guard (cellular, no allowCellular) — reconcile
    // itself didn't crash and lose the show along the way.
    expect(getDownloadedShow('aud')?.status).toBe('paused');

    // Only possible if reconcileOnLaunch's `finally` ran start() and
    // re-subscribed network monitoring despite the throw above.
    ExpoNetwork.__setNetworkState({ type: 'WIFI' });
    await flush();
    expect(getDownloadedShow('aud')?.status).not.toBe('paused');
    expect(FS.__tasks.length).toBeGreaterThan(0);
  });

  it('deletes orphan directories and leaves failed shows alone', async () => {
    FS.__dirs.add('file:///mock-documents/downloads/orphan/');
    FS.__files.set('file:///mock-documents/downloads/orphan/x.mp3', { size: 1 });
    const show = createDownloadedShow(detail('bad', 1), { allowCellular: false, now: 1 });
    upsertDownloadedShow({ ...show, status: 'failed', error: 'network' });
    await downloadManager.reconcileOnLaunch();
    await flush();
    expect(FS.__dirs.has('file:///mock-documents/downloads/orphan/')).toBe(false);
    expect(FS.__files.has('file:///mock-documents/downloads/orphan/x.mp3')).toBe(false);
    expect(getDownloadedShow('bad')?.status).toBe('failed');
    expect(FS.__tasks).toHaveLength(0);
  });
});

describe('removeAll', () => {
  it('stops everything, clears the manifest and deletes the downloads directory', async () => {
    await downloadManager.enqueueShow(detail('a', 1));
    await downloadManager.enqueueShow(detail('b', 1));
    await flush();
    await downloadManager.removeAll();
    await flush();
    expect(listDownloadedShows()).toEqual([]);
    expect(FS.__tasks[0].paused).toBe(true);
    expect(FS.__dirs.has('file:///mock-documents/downloads/')).toBe(false);
  });
});
