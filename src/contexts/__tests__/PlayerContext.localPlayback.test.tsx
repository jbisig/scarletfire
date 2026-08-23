// A downloaded file that fails at play time must be reported to the downloads
// store and reloaded (which now resolves to streaming) WITHOUT burning the
// direct→/download fallback attempt or invalidating the cached show.

type Handler = (data: unknown) => void;
const mockEventHandlers = new Map<string, Handler[]>();

jest.mock('../../services/nativeAudioPlayer', () => {
  const actual = jest.requireActual('../../services/audioPlayerTypes');
  return {
    __esModule: true,
    default: {
      addEventListener: jest.fn((event: string, handler: Handler) => {
        const list = mockEventHandlers.get(event) ?? [];
        list.push(handler);
        mockEventHandlers.set(event, list);
        return { remove: jest.fn() };
      }),
      setupPlayer: jest.fn(),
      addTrack: jest.fn(),
      setQueue: jest.fn(),
      reset: jest.fn(),
      play: jest.fn(),
      pause: jest.fn(),
      stop: jest.fn(),
      seekTo: jest.fn(),
      skipToNext: jest.fn(),
      skipToPrevious: jest.fn(),
      setExcludedFromBackup: jest.fn(),
    },
    State: actual.State,
    Event: actual.Event,
  };
});

jest.mock('../PlayCountsContext', () => ({
  usePlayCounts: () => ({ recordTrackPlay: jest.fn() }),
}));

jest.mock('../../services/videoDownloadService', () => ({
  videoDownloadService: { startDeferredDownloads: jest.fn() },
}));

const mockLoadTrack = jest.fn().mockResolvedValue(undefined);
jest.mock('../../services/audioService', () => ({
  audioService: {
    initialize: jest.fn().mockResolvedValue(undefined),
    loadTrack: (...args: unknown[]) => mockLoadTrack(...args),
    play: jest.fn().mockResolvedValue(undefined),
    pause: jest.fn().mockResolvedValue(undefined),
    stop: jest.fn().mockResolvedValue(undefined),
    seekTo: jest.fn().mockResolvedValue(undefined),
  },
  appIconUri: 'test://icon',
  convertToNativeTrack: (track: { id: string; streamUrl: string; title: string }) => ({
    id: track.id, url: track.streamUrl, title: track.title, artwork: 'test://icon',
  }),
}));

const mockInvalidate = jest.fn();
jest.mock('../../services/archiveApi', () => ({
  archiveApi: {
    invalidateShowDetail: (...args: unknown[]) => mockInvalidate(...args),
    getShowDetail: jest.fn(),
    getCachedShowDetail: jest.fn().mockReturnValue(null),
  },
}));

jest.mock('../../services/sourceSelection', () => ({
  resolveShowIdentifier: (show: { primaryIdentifier: string }) => show.primaryIdentifier,
  stableShowIdentifier: (_date: string | undefined, fallback: string) => fallback,
}));

const mockReportLocalFailure = jest.fn();
jest.mock('../../services/playbackSource', () => ({
  reportLocalPlaybackFailure: (...args: unknown[]) => mockReportLocalFailure(...args),
}));

jest.mock('../ToastContext', () => ({
  useOptionalToast: () => ({ showToast: jest.fn() }),
}));

import React from 'react';
import { Text } from 'react-native';
import { render, waitFor, act } from '@testing-library/react-native';
import { PlayerProvider, usePlayer } from '../PlayerContext';
import { Event } from '../../services/audioPlayerTypes';
import type { Track, ShowDetail } from '../../types/show.types';

const show: ShowDetail = { identifier: 'aud', title: 'aud', date: '1977-05-08', year: '1977', tracks: [] };
const track: Track = {
  id: 't1',
  title: 't1',
  format: 'VBR MP3',
  streamUrl: 'https://ia600106.us.archive.org/1/items/aud/t1.mp3',
  fallbackStreamUrl: 'https://archive.org/download/aud/t1.mp3',
};

let probeApi: ReturnType<typeof usePlayer> | null = null;
function Probe() {
  probeApi = usePlayer();
  return <Text testID="id">{probeApi.state.currentTrack?.id ?? 'none'}</Text>;
}

function emitPlaybackError() {
  (mockEventHandlers.get(Event.PlaybackError) ?? []).forEach(h => h({ error: 'decode failed' }));
}

beforeEach(() => {
  jest.clearAllMocks();
  mockEventHandlers.clear();
  probeApi = null;
});

it('reloads the same track after a local-file failure without using the stream fallback', async () => {
  mockReportLocalFailure.mockReturnValueOnce(true);
  const { getByTestId } = render(<PlayerProvider><Probe /></PlayerProvider>);
  await act(async () => { await probeApi!.loadTrack(track, show, [track]); });
  await waitFor(() => expect(getByTestId('id').props.children).toBe('t1'));
  const before = mockLoadTrack.mock.calls.length;

  await act(async () => { emitPlaybackError(); });

  await waitFor(() => expect(mockLoadTrack.mock.calls.length).toBeGreaterThan(before));
  expect(mockReportLocalFailure).toHaveBeenCalledWith('aud', 't1');
  expect(mockInvalidate).not.toHaveBeenCalled();
  const [reloaded] = mockLoadTrack.mock.calls[mockLoadTrack.mock.calls.length - 1];
  expect(reloaded.streamUrl).toBe(track.streamUrl); // unchanged — not the /download fallback
  expect(probeApi!.state.loadError).toBeNull();
});

it('falls through to the normal stream fallback when the track was not local', async () => {
  mockReportLocalFailure.mockReturnValue(false);
  render(<PlayerProvider><Probe /></PlayerProvider>);
  await act(async () => { await probeApi!.loadTrack(track, show, [track]); });
  await act(async () => { emitPlaybackError(); });
  await waitFor(() => expect(mockInvalidate).toHaveBeenCalledWith('aud'));
});

it('suppresses the rest of a local-failure burst without consuming the stream fallback, then still runs the ladder for a later genuine failure', async () => {
  mockReportLocalFailure.mockReturnValueOnce(true);
  const { getByTestId } = render(<PlayerProvider><Probe /></PlayerProvider>);
  await act(async () => { await probeApi!.loadTrack(track, show, [track]); });
  await waitFor(() => expect(getByTestId('id').props.children).toBe('t1'));
  const initialCalls = mockLoadTrack.mock.calls.length;

  // The iOS module can raise a dozen PlaybackError events for the same
  // queued item in one burst — only the first should trigger a reload.
  await act(async () => {
    emitPlaybackError();
    emitPlaybackError();
    emitPlaybackError();
  });

  await waitFor(() => expect(mockLoadTrack.mock.calls.length).toBe(initialCalls + 1));
  expect(mockLoadTrack.mock.calls.length).toBe(initialCalls + 1); // one reload, not three
  expect(mockInvalidate).not.toHaveBeenCalled();
  expect(probeApi!.state.loadError).toBeNull();

  // A later, genuinely dead remote stream re-errors outside the suppression
  // window and must still run the direct→/download fallback ladder.
  const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(Date.now() + 6000);
  await act(async () => { emitPlaybackError(); });
  nowSpy.mockRestore();

  await waitFor(() => expect(mockInvalidate).toHaveBeenCalledTimes(1));
});
