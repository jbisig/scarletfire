jest.mock('../nativeAudioPlayer', () => ({
  __esModule: true,
  default: { setExcludedFromBackup: jest.fn().mockResolvedValue(undefined) },
}));

import type { ShowDetail } from '../../types/show.types';
import {
  getDownloadedShow,
  getShowProgress,
  resetDownloadsStoreForTests,
} from '../downloadsStore';
import { downloadManager, StreamOnlyError, classifyDownloadError } from '../downloadManager';
import { resetNetworkStatusForTests } from '../networkStatus';

const FS = require('expo-file-system/legacy');
const flush = async () => { for (let i = 0; i < 5; i++) await new Promise(r => setTimeout(r, 0)); };

function detail(identifier = 'aud', trackCount = 3, downloadable = true): ShowDetail {
  return {
    identifier,
    title: 'Cornell',
    date: '1977-05-08',
    year: '1977',
    venue: 'Barton Hall',
    downloadable,
    tracks: Array.from({ length: trackCount }, (_, i) => ({
      id: `d1t0${i + 1}.mp3`,
      title: `Track ${i + 1}`,
      format: 'VBR MP3',
      streamUrl: `https://ia600106.us.archive.org/1/items/${identifier}/d1t0${i + 1}.mp3`,
      fallbackStreamUrl: `https://archive.org/download/${identifier}/d1t0${i + 1}.mp3`,
      size: 1000,
    })),
  };
}

beforeEach(() => {
  FS.__reset();
  resetDownloadsStoreForTests();
  resetNetworkStatusForTests();
  downloadManager.__resetForTests();
  downloadManager.__setSleepForTests(async () => {});
});

describe('enqueueShow', () => {
  it('rejects stream-only recordings', async () => {
    await expect(downloadManager.enqueueShow(detail('sbd', 2, false))).rejects.toBeInstanceOf(StreamOnlyError);
    expect(getDownloadedShow('sbd')).toBeUndefined();
  });

  it('downloads two tracks at a time in order, then completes the show', async () => {
    await downloadManager.enqueueShow(detail());
    await flush();
    expect(getDownloadedShow('aud')?.status).toBe('downloading');
    expect(FS.__tasks.map((t: { url: string }) => t.url)).toEqual([
      'https://ia600106.us.archive.org/1/items/aud/d1t01.mp3',
      'https://ia600106.us.archive.org/1/items/aud/d1t02.mp3',
    ]);
    expect(FS.__tasks[0].fileUri).toBe('file:///mock-documents/downloads/aud/d1t01.mp3.part');

    FS.__tasks[0].progress(400);
    expect(getShowProgress('aud').bytesDownloaded).toBe(400);

    FS.__tasks[0].complete({ size: 1000 });
    await flush();
    expect(FS.__tasks).toHaveLength(3);
    expect(getDownloadedShow('aud')?.tracks['d1t01.mp3'].status).toBe('complete');
    expect(FS.__files.has('file:///mock-documents/downloads/aud/d1t01.mp3')).toBe(true);
    expect(FS.__files.has('file:///mock-documents/downloads/aud/d1t01.mp3.part')).toBe(false);

    FS.__tasks[1].complete();
    FS.__tasks[2].complete();
    await flush();
    const show = getDownloadedShow('aud')!;
    expect(show.status).toBe('complete');
    expect(show.completedAt).toEqual(expect.any(Number));
    expect(getShowProgress('aud').fraction).toBe(1);
  });

  it('ignores a second enqueue of the same identifier', async () => {
    await downloadManager.enqueueShow(detail('aud', 1));
    await downloadManager.enqueueShow(detail('aud', 1));
    await flush();
    expect(FS.__tasks).toHaveLength(1);
  });

  it('queues a second show behind the first', async () => {
    await downloadManager.enqueueShow(detail('first', 1));
    await downloadManager.enqueueShow(detail('second', 1));
    await flush();
    expect(FS.__tasks).toHaveLength(1);
    FS.__tasks[0].complete();
    await flush();
    expect(FS.__tasks[1].url).toContain('/second/');
  });
});

describe('failure ladder', () => {
  it('falls back to the /download URL on 404 and completes', async () => {
    await downloadManager.enqueueShow(detail('aud', 1));
    await flush();
    FS.__tasks[0].complete({ status: 404 });
    await flush();
    expect(FS.__tasks[1].url).toBe('https://archive.org/download/aud/d1t01.mp3');
    expect(FS.__files.has('file:///mock-documents/downloads/aud/d1t01.mp3.part')).toBe(false);
    FS.__tasks[1].complete();
    await flush();
    expect(getDownloadedShow('aud')?.status).toBe('complete');
  });

  it('retries 3 times per URL then fails the track and the show', async () => {
    await downloadManager.enqueueShow(detail('aud', 1));
    for (let i = 0; i < 6; i++) {
      await flush();
      FS.__tasks[i].fail(new Error('Network request failed'));
    }
    await flush();
    expect(FS.__tasks).toHaveLength(6);
    const show = getDownloadedShow('aud')!;
    expect(show.status).toBe('failed');
    expect(show.error).toBe('network');
    expect(show.tracks['d1t01.mp3'].status).toBe('failed');
  });

  it('keeps completed tracks when a later one fails, and retryShow only refetches the failed one', async () => {
    await downloadManager.enqueueShow(detail('aud', 2));
    await flush();
    FS.__tasks[0].complete();
    await flush();
    for (let i = 0; i < 6; i++) {
      await flush();
      FS.__tasks[1 + i].complete({ status: 500 });
    }
    await flush();
    expect(getDownloadedShow('aud')?.status).toBe('failed');
    expect(getDownloadedShow('aud')?.tracks['d1t01.mp3'].status).toBe('complete');

    const before = FS.__tasks.length;
    await downloadManager.retryShow('aud');
    await flush();
    expect(FS.__tasks).toHaveLength(before + 1);
    expect(FS.__tasks[before].url).toContain('d1t02.mp3');
    FS.__tasks[before].complete();
    await flush();
    expect(getDownloadedShow('aud')?.status).toBe('complete');
  });

  it('stops the show immediately on disk-full', async () => {
    await downloadManager.enqueueShow(detail('aud', 3));
    await flush();
    FS.__tasks[0].fail(new Error('No space left on device (ENOSPC)'));
    await flush();
    FS.__tasks[1].complete();
    await flush();
    const show = getDownloadedShow('aud')!;
    expect(show.status).toBe('failed');
    expect(show.error).toBe('disk-full');
    expect(FS.__tasks).toHaveLength(2); // third track never started
  });
});

describe('removeShow / cancelShow', () => {
  it('pauses in-flight tasks, deletes the directory and the manifest entry', async () => {
    await downloadManager.enqueueShow(detail('aud', 2));
    await flush();
    FS.__tasks[0].complete();
    await flush();
    await downloadManager.cancelShow('aud');
    await flush();
    expect(FS.__tasks[1].paused).toBe(true);
    expect(getDownloadedShow('aud')).toBeUndefined();
    expect([...FS.__files.keys()].some(k => k.includes('/downloads/aud/'))).toBe(false);
    expect(FS.__dirs.has('file:///mock-documents/downloads/aud/')).toBe(false);
  });
});

describe('classifyDownloadError', () => {
  it('maps messages to error codes', () => {
    expect(classifyDownloadError(new Error('No space left on device'))).toBe('disk-full');
    expect(classifyDownloadError(new Error('ENOSPC'))).toBe('disk-full');
    expect(classifyDownloadError(new Error('Network request failed'))).toBe('network');
    expect(classifyDownloadError(new Error('The request timed out'))).toBe('network');
    expect(classifyDownloadError(new Error('something else'))).toBe('unknown');
    expect(classifyDownloadError('nope')).toBe('unknown');
  });
});
