jest.mock('../nativeAudioPlayer', () => {
  const actual = jest.requireActual('../audioPlayerTypes');
  return {
    __esModule: true,
    default: { setupPlayer: jest.fn(), setQueue: jest.fn(), addTrack: jest.fn() },
    State: actual.State,
    Event: actual.Event,
  };
});

import type { ShowDetail, Track } from '../../types/show.types';
import { convertToNativeTrack, appIconUri } from '../audioService';
import {
  createDownloadedShow,
  resetDownloadsStoreForTests,
  updateDownloadedTrack,
  upsertDownloadedShow,
} from '../downloadsStore';

const track: Track = { id: 'd1t01.mp3', title: 'Minglewood', format: 'VBR MP3', duration: 300, streamUrl: 'https://archive.org/download/aud/d1t01.mp3' };
const show: ShowDetail = { identifier: 'aud', title: 't', date: '1977-05-08', year: '1977', venue: 'Barton Hall', downloadable: true, tracks: [track] };

beforeEach(() => resetDownloadsStoreForTests());

describe('convertToNativeTrack', () => {
  it('uses the stream URL and show venue by default', () => {
    expect(convertToNativeTrack(track, show)).toEqual({
      id: 'd1t01.mp3',
      url: track.streamUrl,
      title: 'Minglewood',
      artist: 'Barton Hall',
      duration: 300,
      artwork: appIconUri,
    });
    expect(convertToNativeTrack(track).artist).toBe('Grateful Dead');
  });

  it('swaps in the local file when the track is downloaded', () => {
    upsertDownloadedShow(createDownloadedShow(show, { allowCellular: false, now: 1 }));
    updateDownloadedTrack('aud', 'd1t01.mp3', { status: 'complete' });
    expect(convertToNativeTrack(track, show).url).toBe('file:///mock-documents/downloads/aud/d1t01.mp3');
  });
});
