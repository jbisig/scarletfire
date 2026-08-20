// src/contexts/__tests__/PlayerContext.loadShuffleShow.test.tsx
//
// Task 13 test-coverage gap: `loadShuffleShow` (PlayerContext.tsx ~976-993)
// filters a fetched show's tracks through `isAllowedStreamUrl` before
// queuing/playing them, since a shuffle queue can be sourced from another
// user's favorites/collection (synced data, not server-validated). There
// was no regression coverage for either outcome of that guard:
//   - some tracks rejected: the valid remainder still plays, and the user
//     is warned via toast.
//   - all tracks rejected: nothing is queued/played, the loading spinner
//     clears, and nothing throws.
//
// `loadShuffleShow` isn't exposed directly on the context value, but
// `startShuffleShows([show])` drives it deterministically for a
// single-show array (shuffleArray on a 1-element array is a no-op), so
// these tests exercise it through that public entry point — following the
// same "drive the real PlayerProvider" approach as
// PlayerContext.spinnerRace.test.tsx.

jest.mock('../../services/nativeAudioPlayer', () => {
  const actual = jest.requireActual('../../services/audioPlayerTypes');
  return {
    __esModule: true,
    default: {
      addEventListener: jest.fn().mockReturnValue({ remove: jest.fn() }),
      setupPlayer: jest.fn(),
      addTrack: jest.fn(),
      setQueue: jest.fn().mockResolvedValue(undefined),
      reset: jest.fn(),
      play: jest.fn().mockResolvedValue(undefined),
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
// dependency chain (AsyncStorage, Supabase auth, etc.) — irrelevant here.
jest.mock('../PlayCountsContext', () => ({
  usePlayCounts: () => ({ recordTrackPlay: jest.fn() }),
}));

// PlayerProvider's mount effect lazily requires videoDownloadService and
// kicks off background video downloads via InteractionManager — unrelated
// to the guard under test, and it throws under Jest (no real filesystem).
jest.mock('../../services/videoDownloadService', () => ({
  videoDownloadService: { startDeferredDownloads: jest.fn() },
}));

// Mock the toast surface so we can assert on the "some tracks skipped"
// warning without needing a real ToastProvider mounted.
const mockShowToast = jest.fn();
jest.mock('../ToastContext', () => ({
  useOptionalToast: () => ({ showToast: mockShowToast }),
}));

// Control what the shuffled show "fetches" to per test.
const mockGetShowDetail = jest.fn();
jest.mock('../../services/archiveApi', () => ({
  archiveApi: {
    getShowDetail: (...args: unknown[]) => mockGetShowDetail(...args),
  },
}));

// The resolver would consult the real bundled catalog for 1977-05-08 and
// pick a real identifier; these tests key everything off the fake one.
jest.mock('../../services/sourceSelection', () => ({
  resolveShowIdentifier: (show: { primaryIdentifier: string }) => show.primaryIdentifier,
}));

import React from 'react';
import { Text } from 'react-native';
import { render, waitFor, act } from '@testing-library/react-native';
import { PlayerProvider, usePlayer } from '../PlayerContext';
import nativeAudioPlayer from '../../services/nativeAudioPlayer';
import type { GratefulDeadShow, ShowDetail, Track } from '../../types/show.types';

function makeShow(identifier: string): GratefulDeadShow {
  return {
    date: '1977-05-08',
    year: '1977',
    venue: 'Barton Hall',
    versions: [],
    primaryIdentifier: identifier,
    title: identifier,
  };
}

function makeTrack(id: string, streamUrl: string): Track {
  return { id, title: id, format: 'VBR MP3', streamUrl };
}

function makeShowDetail(identifier: string, tracks: Track[]): ShowDetail {
  return { identifier, title: identifier, date: '1977-05-08', year: '1977', venue: 'Barton Hall', tracks };
}

let probeApi: ReturnType<typeof usePlayer> | null = null;
function Probe() {
  const api = usePlayer();
  probeApi = api;
  return (
    <>
      <Text testID="isShuffleLoading">{String(api.state.isShuffleLoading)}</Text>
      <Text testID="currentTrackId">{api.state.currentTrack?.id ?? 'none'}</Text>
      <Text testID="playlistLength">{String(api.state.playlist.length)}</Text>
    </>
  );
}

describe('PlayerContext loadShuffleShow — cross-user streamUrl guard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    probeApi = null;
  });

  it('plays the valid remainder and warns via toast when some tracks are rejected', async () => {
    const show = makeShow('gd1977-05-08');
    mockGetShowDetail.mockResolvedValue(
      makeShowDetail('gd1977-05-08', [
        makeTrack('good1', 'https://archive.org/download/gd1977-05-08/good1.mp3'),
        makeTrack('evil', 'https://evil.com/download/gd1977-05-08/evil.mp3'),
        makeTrack('good2', 'https://ia800000.us.archive.org/download/gd1977-05-08/good2.mp3'),
      ]),
    );

    const { getByTestId } = render(<PlayerProvider><Probe /></PlayerProvider>);

    await act(async () => {
      await probeApi!.startShuffleShows([show]);
    });

    await waitFor(() => expect(getByTestId('currentTrackId').props.children).toBe('good1'));
    expect(getByTestId('playlistLength').props.children).toBe('2');
    expect(getByTestId('isShuffleLoading').props.children).toBe('false');

    expect(mockShowToast).toHaveBeenCalledWith('Skipped some tracks with an invalid link', 'error');

    // Only the two valid tracks were handed to the native player queue.
    expect(nativeAudioPlayer.setQueue).toHaveBeenCalledTimes(1);
    const [queuedTracks] = (nativeAudioPlayer.setQueue as jest.Mock).mock.calls[0];
    expect(queuedTracks.map((t: { id: string }) => t.id)).toEqual(['good1', 'good2']);
    expect(nativeAudioPlayer.play).toHaveBeenCalledTimes(1);
  });

  it('queues and plays nothing, and clears the loading spinner, when every track is rejected', async () => {
    const show = makeShow('gd1977-05-08');
    mockGetShowDetail.mockResolvedValue(
      makeShowDetail('gd1977-05-08', [
        makeTrack('evil1', 'https://evil.com/download/gd1977-05-08/evil1.mp3'),
        makeTrack('evil2', 'http://archive.org/download/gd1977-05-08/evil2.mp3'), // wrong scheme
      ]),
    );

    const { getByTestId } = render(<PlayerProvider><Probe /></PlayerProvider>);

    await act(async () => {
      await probeApi!.startShuffleShows([show]);
    });

    await waitFor(() => expect(getByTestId('isShuffleLoading').props.children).toBe('false'));
    expect(getByTestId('currentTrackId').props.children).toBe('none');
    expect(getByTestId('playlistLength').props.children).toBe('0');

    expect(nativeAudioPlayer.setQueue).not.toHaveBeenCalled();
    expect(nativeAudioPlayer.play).not.toHaveBeenCalled();
    // The "skipped some tracks" warning fires any time at least one track
    // is dropped, including the all-rejected case.
    expect(mockShowToast).toHaveBeenCalledWith('Skipped some tracks with an invalid link', 'error');
  });
});
