// src/contexts/__tests__/PlayerContext.streamFallback.test.tsx
//
// Coverage for the direct-datanode fallback: when a track's streamUrl is a
// direct datanode URL (skipping /download's redirect) and playback errors,
// PlayerContext must retry once via the durable fallbackStreamUrl, swap the
// whole playlist to fallback URLs, and invalidate the (stale) cached show
// detail — without looping if the fallback also fails.

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
}));

const mockInvalidate = jest.fn();
jest.mock('../../services/archiveApi', () => ({
  archiveApi: {
    invalidateShowDetail: (...args: unknown[]) => mockInvalidate(...args),
    getShowDetail: jest.fn(),
    getCachedShowDetail: jest.fn().mockReturnValue(null),
  },
}));

// The resolver would consult the real bundled catalog for 1977-05-08 and
// pick a real identifier; these tests key everything off the fake one.
jest.mock('../../services/sourceSelection', () => ({
  resolveShowIdentifier: (show: { primaryIdentifier: string }) => show.primaryIdentifier,
}));

const mockShowToast = jest.fn();
jest.mock('../ToastContext', () => ({
  useOptionalToast: () => ({ showToast: mockShowToast }),
}));

import React from 'react';
import { Text } from 'react-native';
import { render, waitFor, act } from '@testing-library/react-native';
import { PlayerProvider, usePlayer } from '../PlayerContext';
import { Event } from '../../services/audioPlayerTypes';
import type { Track, ShowDetail } from '../../types/show.types';

const DIRECT = 'https://ia600106.us.archive.org/1/items/test-show';
const DOWNLOAD = 'https://archive.org/download/test-show';

function makeShow(identifier: string): ShowDetail {
  return { identifier, title: identifier, date: '1977-05-08', year: '1977', tracks: [] };
}

function makeDirectTrack(id: string): Track {
  return {
    id,
    title: id,
    format: 'VBR MP3',
    streamUrl: `${DIRECT}/${id}.mp3`,
    fallbackStreamUrl: `${DOWNLOAD}/${id}.mp3`,
  };
}

function emitPlaybackError() {
  (mockEventHandlers.get(Event.PlaybackError) ?? []).forEach(h => h({ error: 'HTTP 404' }));
}

let probeApi: ReturnType<typeof usePlayer> | null = null;
function Probe() {
  const api = usePlayer();
  probeApi = api;
  return <Text testID="currentTrackId">{api.state.currentTrack?.id ?? 'none'}</Text>;
}

describe('PlayerContext direct-stream fallback', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockEventHandlers.clear();
    probeApi = null;
  });

  it('retries via /download URLs and invalidates the cached show on playback error', async () => {
    const { getByTestId } = render(<PlayerProvider><Probe /></PlayerProvider>);

    const show = makeShow('test-show');
    const trackA = makeDirectTrack('t1');
    const trackB = makeDirectTrack('t2');

    await act(async () => {
      await probeApi!.loadTrack(trackA, show, [trackA, trackB]);
    });
    await waitFor(() => expect(getByTestId('currentTrackId').props.children).toBe('t1'));
    const callsBefore = mockLoadTrack.mock.calls.length;

    await act(async () => {
      emitPlaybackError();
    });

    await waitFor(() => expect(mockLoadTrack.mock.calls.length).toBeGreaterThan(callsBefore));
    expect(mockInvalidate).toHaveBeenCalledWith('test-show');

    // The retried load must carry the durable /download URL for the current
    // track AND every playlist sibling.
    const [retryTrack, , retryQueue] = mockLoadTrack.mock.calls[mockLoadTrack.mock.calls.length - 1];
    expect(retryTrack.streamUrl).toBe(`${DOWNLOAD}/t1.mp3`);
    expect((retryQueue as Track[]).map(t => t.streamUrl)).toEqual([
      `${DOWNLOAD}/t1.mp3`,
      `${DOWNLOAD}/t2.mp3`,
    ]);
  });

  it('does not loop when the fallback URL also fails', async () => {
    render(<PlayerProvider><Probe /></PlayerProvider>);

    const show = makeShow('test-show');
    const track = makeDirectTrack('t1');

    await act(async () => {
      await probeApi!.loadTrack(track, show, [track]);
    });
    await act(async () => {
      emitPlaybackError();
    });
    await waitFor(() => expect(mockInvalidate).toHaveBeenCalledTimes(1));
    const callsAfterFirstError = mockLoadTrack.mock.calls.length;

    // Second error: the current track's streamUrl now EQUALS its fallback,
    // so the guard must not schedule another retry.
    await act(async () => {
      emitPlaybackError();
    });

    expect(mockLoadTrack.mock.calls.length).toBe(callsAfterFirstError);
    expect(mockInvalidate).toHaveBeenCalledTimes(1);
    // ...and the failure is final, so it's surfaced for the UI to offer
    // recovery instead of leaving the row red and the player silent.
    expect(probeApi!.state.loadError).toEqual({ trackId: 't1', showIdentifier: 'test-show' });
    expect(probeApi!.state.isLoading).toBe(false);
  });

  it('does not surface a failure while the fallback retry is still in flight', async () => {
    render(<PlayerProvider><Probe /></PlayerProvider>);
    const show = makeShow('test-show');
    const track = makeDirectTrack('t1');
    await act(async () => {
      await probeApi!.loadTrack(track, show, [track]);
    });
    await act(async () => {
      emitPlaybackError();
    });
    await waitFor(() => expect(mockInvalidate).toHaveBeenCalledTimes(1));
    expect(probeApi!.state.loadError).toBeNull();
  });

  it('toasts a failure once per track even when the player reports it per queued item', async () => {
    render(<PlayerProvider><Probe /></PlayerProvider>);
    const show = makeShow('test-show');
    const track: Track = { id: 'plain', title: 'plain', format: 'VBR MP3', streamUrl: `${DOWNLOAD}/plain.mp3` };
    await act(async () => {
      await probeApi!.loadTrack(track, show, [track]);
    });
    await act(async () => {
      emitPlaybackError();
      emitPlaybackError();
      emitPlaybackError();
    });
    expect(mockShowToast).toHaveBeenCalledTimes(1);
    expect(probeApi!.state.loadError).toEqual({ trackId: 'plain', showIdentifier: 'test-show' });
  });

  it('surfaces playback errors for tracks without a fallback URL as loadError', async () => {
    render(<PlayerProvider><Probe /></PlayerProvider>);

    const show = makeShow('test-show');
    const track: Track = {
      id: 'plain',
      title: 'plain',
      format: 'VBR MP3',
      streamUrl: `${DOWNLOAD}/plain.mp3`,
    };

    await act(async () => {
      await probeApi!.loadTrack(track, show, [track]);
    });
    const callsBefore = mockLoadTrack.mock.calls.length;

    await act(async () => {
      emitPlaybackError();
    });

    expect(mockLoadTrack.mock.calls.length).toBe(callsBefore);
    expect(mockInvalidate).not.toHaveBeenCalled();
    expect(probeApi!.state.loadError).toEqual({ trackId: 'plain', showIdentifier: 'test-show' });
  });
});
