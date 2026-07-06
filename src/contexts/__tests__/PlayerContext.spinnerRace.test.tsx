// src/contexts/__tests__/PlayerContext.spinnerRace.test.tsx
//
// Regression coverage for the auto-load spinner race fixed in Task 8: the
// auto-load effect's stale-track guard correctly prevented playing the
// wrong track when a slower, earlier load resolved after a newer one had
// already started — but it used to clear `isLoading` (dispatch
// SET_LOADING/isLoading:false) BEFORE checking staleness. That meant an old
// track's completion (success or failure) could clear the spinner while a
// newer, still-loading track was in flight, showing "not loading" even
// though playback hadn't actually started for the current track.
//
// This test drives the real PlayerProvider (so the effect under test runs),
// with `audioService.loadTrack` mocked to return controllable, per-call
// deferred promises so the resolution order can be inverted independently
// of call order.

jest.mock('../../services/nativeAudioPlayer', () => {
  const actual = jest.requireActual('../../services/audioPlayerTypes');
  return {
    __esModule: true,
    default: {
      addEventListener: jest.fn().mockReturnValue({ remove: jest.fn() }),
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

// Cut the PlayerContext -> PlayCountsContext -> AuthContext/ToastContext
// dependency chain (AsyncStorage, Supabase auth, etc.) — irrelevant to the
// spinner-ordering race under test.
jest.mock('../PlayCountsContext', () => ({
  usePlayCounts: () => ({ recordTrackPlay: jest.fn() }),
}));

// PlayerProvider's mount effect lazily requires videoDownloadService and
// kicks off background video downloads via InteractionManager — unrelated to
// the race under test, and it throws under Jest (no real filesystem). Stub
// it out to keep test output free of unrelated error noise.
jest.mock('../../services/videoDownloadService', () => ({
  videoDownloadService: { startDeferredDownloads: jest.fn() },
}));

// Control audioService.loadTrack's resolution per-track and per-call.
const mockLoadTrack = jest.fn();
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

import React from 'react';
import { Text } from 'react-native';
import { render, waitFor, act } from '@testing-library/react-native';
import { PlayerProvider, usePlayer } from '../PlayerContext';
import type { Track, ShowDetail } from '../../types/show.types';

function makeShow(identifier: string): ShowDetail {
  return { identifier, title: identifier, date: '1977-05-08', year: '1977', tracks: [] };
}

function makeTrack(id: string): Track {
  return { id, title: id, format: 'VBR MP3', streamUrl: `https://example.com/${id}.mp3` };
}

let probeApi: ReturnType<typeof usePlayer> | null = null;
function Probe() {
  const api = usePlayer();
  probeApi = api;
  return (
    <>
      <Text testID="isLoading">{String(api.state.isLoading)}</Text>
      <Text testID="currentTrackId">{api.state.currentTrack?.id ?? 'none'}</Text>
    </>
  );
}

describe('PlayerContext auto-load spinner staleness', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    probeApi = null;
  });

  it('keeps the spinner on when a slower, earlier load resolves after a newer track has started loading', async () => {
    // Deferred promises so we control resolution order independently of the
    // order loadTrack was called in.
    let resolveA: () => void = () => {};
    let resolveB: () => void = () => {};
    const deferredA = new Promise<void>((resolve) => { resolveA = resolve; });
    const deferredB = new Promise<void>((resolve) => { resolveB = resolve; });

    mockLoadTrack.mockImplementation((track: Track) => {
      if (track.id === 'A') return deferredA;
      if (track.id === 'B') return deferredB;
      return Promise.resolve();
    });

    const { getByTestId } = render(
      <PlayerProvider><Probe /></PlayerProvider>
    );

    const show = makeShow('show-1');
    const trackA = makeTrack('A');
    const trackB = makeTrack('B');

    // User taps track A.
    await act(async () => {
      await probeApi!.loadTrack(trackA, show, [trackA, trackB]);
    });
    await waitFor(() => expect(getByTestId('currentTrackId').props.children).toBe('A'));
    expect(getByTestId('isLoading').props.children).toBe('true');

    // Before A's load resolves, user switches to track B.
    await act(async () => {
      await probeApi!.loadTrack(trackB, show, [trackA, trackB]);
    });
    await waitFor(() => expect(getByTestId('currentTrackId').props.children).toBe('B'));
    expect(getByTestId('isLoading').props.children).toBe('true');

    // A's (stale, slower) load now resolves. Pre-fix, this unconditionally
    // dispatched SET_LOADING(false) and cleared the spinner even though B
    // is still loading.
    await act(async () => {
      resolveA();
      await deferredA;
    });

    expect(getByTestId('currentTrackId').props.children).toBe('B');
    expect(getByTestId('isLoading').props.children).toBe('true');

    // Now B (the current, latest track) actually finishes loading — only now
    // should the spinner clear.
    await act(async () => {
      resolveB();
      await deferredB;
    });

    await waitFor(() => expect(getByTestId('isLoading').props.children).toBe('false'));
    expect(getByTestId('currentTrackId').props.children).toBe('B');
  });

  it('keeps the spinner on when a stale load fails after a newer track has started loading', async () => {
    let rejectA: (err: Error) => void = () => {};
    let resolveB: () => void = () => {};
    const deferredA = new Promise<void>((_resolve, reject) => { rejectA = reject; });
    const deferredB = new Promise<void>((resolve) => { resolveB = resolve; });

    mockLoadTrack.mockImplementation((track: Track) => {
      if (track.id === 'A') return deferredA;
      if (track.id === 'B') return deferredB;
      return Promise.resolve();
    });

    const { getByTestId } = render(
      <PlayerProvider><Probe /></PlayerProvider>
    );

    const show = makeShow('show-1');
    const trackA = makeTrack('A');
    const trackB = makeTrack('B');

    await act(async () => {
      await probeApi!.loadTrack(trackA, show, [trackA, trackB]);
    });
    await act(async () => {
      await probeApi!.loadTrack(trackB, show, [trackA, trackB]);
    });
    await waitFor(() => expect(getByTestId('currentTrackId').props.children).toBe('B'));
    expect(getByTestId('isLoading').props.children).toBe('true');

    // A's stale load fails. Pre-fix this cleared the spinner unconditionally
    // in the .catch handler too.
    await act(async () => {
      rejectA(new Error('stale load failed'));
      await deferredA.catch(() => {});
    });

    expect(getByTestId('currentTrackId').props.children).toBe('B');
    expect(getByTestId('isLoading').props.children).toBe('true');

    await act(async () => {
      resolveB();
      await deferredB;
    });

    await waitFor(() => expect(getByTestId('isLoading').props.children).toBe('false'));
  });
});
