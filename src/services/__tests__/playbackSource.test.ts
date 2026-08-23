import type { Track } from '../../types/show.types';
import {
  createDownloadedShow,
  resetDownloadsStoreForTests,
  updateDownloadedShow,
  updateDownloadedTrack,
  upsertDownloadedShow,
} from '../downloadsStore';
import { reportLocalPlaybackFailure, resolvePlaybackSource } from '../playbackSource';

const track: Track = {
  id: 'd1t01.mp3',
  title: 'Minglewood',
  format: 'VBR MP3',
  streamUrl: 'https://ia600106.us.archive.org/1/items/aud/d1t01.mp3',
  fallbackStreamUrl: 'https://archive.org/download/aud/d1t01.mp3',
};

beforeEach(() => {
  resetDownloadsStoreForTests();
  upsertDownloadedShow(createDownloadedShow(
    { identifier: 'aud', title: 't', date: '1977-05-08', year: '1977', downloadable: true, tracks: [track] },
    { allowCellular: false, now: 1 },
  ));
});

describe('resolvePlaybackSource', () => {
  it('streams when the track is not downloaded', () => {
    expect(resolvePlaybackSource('aud', track)).toEqual({
      url: track.streamUrl,
      fallbackUrl: track.fallbackStreamUrl,
      isLocal: false,
    });
    expect(resolvePlaybackSource(undefined, track).isLocal).toBe(false);
  });

  it('plays the local file with the remote stream as fallback once downloaded', () => {
    updateDownloadedTrack('aud', 'd1t01.mp3', { status: 'complete' });
    expect(resolvePlaybackSource('aud', track)).toEqual({
      url: 'file:///mock-documents/downloads/aud/d1t01.mp3',
      fallbackUrl: track.streamUrl,
      isLocal: true,
    });
  });
});

describe('reportLocalPlaybackFailure', () => {
  it('marks a complete track failed and reports true; false otherwise', () => {
    expect(reportLocalPlaybackFailure('aud', 'd1t01.mp3')).toBe(false);
    updateDownloadedTrack('aud', 'd1t01.mp3', { status: 'complete' });
    updateDownloadedShow('aud', { status: 'complete' });
    expect(reportLocalPlaybackFailure('aud', 'd1t01.mp3')).toBe(true);
    expect(resolvePlaybackSource('aud', track).isLocal).toBe(false);
  });
});
