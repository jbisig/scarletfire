// src/contexts/__tests__/PlayerContext.loadError.test.ts
//
// A stream that fails to load from archive.org used to be silent: the
// auto-load effect's catch just cleared `isLoading`, so the mini player
// went back to a Play glyph with no explanation. `LOAD_FAILED` records
// which track/show failed so the Show Detail screen can offer recovery
// ("Retry" / "Try another recording") right where the user tapped.

jest.mock('../../services/authService', () => ({
  authService: {
    onAuthStateChanged: jest.fn(),
    getClient: jest.fn(),
  },
}));

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

import { playerReducer } from '../PlayerContext';
import type { PlayerState } from '../../types/player.types';
import type { Track, ShowDetail } from '../../types/show.types';

const show: ShowDetail = {
  identifier: 'gd1977-05-08.sbd.hicks.4982.sbeok.shnf',
  title: 'Barton Hall',
  date: '1977-05-08',
  year: '1977',
  tracks: [],
};

const track: Track = {
  id: 't1',
  title: 'Scarlet Begonias',
  format: 'VBR MP3',
  streamUrl: 'https://archive.org/download/x/t1.mp3',
};

function baseState(overrides: Partial<PlayerState> = {}): PlayerState {
  return {
    currentTrack: null,
    currentShow: null,
    isPlaying: false,
    isLoading: false,
    loadError: null,
    isBuffering: false,
    position: 0,
    duration: 0,
    playlist: [],
    currentTrackIndex: -1,
    shouldAutoPlay: false,
    playbackMode: 'show',
    radioQueue: [],
    radioQueueIndex: -1,
    radioQueueOffset: 0,
    isRadioLoading: false,
    shuffleQueue: [],
    shuffleQueueIndex: -1,
    shuffleType: null,
    isShuffleLoading: false,
    ...overrides,
  };
}

describe('playerReducer buffering', () => {
  it('marks a freshly chosen track as buffering until the player reports playing', () => {
    const loading = playerReducer(baseState(), { type: 'LOAD_TRACK', track, show, playlist: [track] });
    expect(loading.isBuffering).toBe(true);
    expect(playerReducer(loading, { type: 'PLAY' }).isBuffering).toBe(false);
  });

  it('clears buffering on pause and on failure', () => {
    const buffering = baseState({ isBuffering: true, currentTrack: track, currentShow: show });
    expect(playerReducer(buffering, { type: 'PAUSE' }).isBuffering).toBe(false);
    expect(playerReducer(buffering, { type: 'LOAD_FAILED', trackId: track.id, showIdentifier: show.identifier }).isBuffering).toBe(false);
  });

  it('follows the player\'s own buffering state mid-track', () => {
    const playing = baseState({ isPlaying: true });
    const stalled = playerReducer(playing, { type: 'SET_BUFFERING', isBuffering: true });
    expect(stalled.isBuffering).toBe(true);
    expect(stalled.isPlaying).toBe(true);
    // No-op when unchanged keeps referential identity (no spurious renders).
    expect(playerReducer(stalled, { type: 'SET_BUFFERING', isBuffering: true })).toBe(stalled);
  });
});

describe('playerReducer LOAD_FAILED', () => {
  it('records the failed track and show and clears loading', () => {
    const loading = playerReducer(baseState(), { type: 'LOAD_TRACK', track, show, playlist: [track] });
    expect(loading.isLoading).toBe(true);
    expect(loading.loadError).toBeNull();

    const failed = playerReducer(loading, { type: 'LOAD_FAILED', trackId: track.id, showIdentifier: show.identifier });
    expect(failed.isLoading).toBe(false);
    expect(failed.isPlaying).toBe(false);
    expect(failed.loadError).toEqual({ trackId: track.id, showIdentifier: show.identifier });
  });

  it('clears the error when a new track starts loading', () => {
    const failed = baseState({ loadError: { trackId: 'old', showIdentifier: show.identifier } });
    const next = playerReducer(failed, { type: 'LOAD_TRACK', track, show, playlist: [track] });
    expect(next.loadError).toBeNull();
  });

  it('clears the error on STOP', () => {
    const failed = baseState({ loadError: { trackId: 't1', showIdentifier: show.identifier } });
    expect(playerReducer(failed, { type: 'STOP' }).loadError).toBeNull();
  });
});
