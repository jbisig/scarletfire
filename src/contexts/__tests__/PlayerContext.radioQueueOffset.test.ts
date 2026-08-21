// src/contexts/__tests__/PlayerContext.radioQueueOffset.test.ts
//
// Regression coverage for the radio-queue trim/native-index desync bug:
// the native player queue is append-only during a radio session, so
// `PlaybackTrackChanged` events carry an ABSOLUTE index into that
// ever-growing queue. `radioQueue` on the other hand gets trimmed to ~100
// entries (ADD_RADIO_TRACKS). Without a cumulative offset, every native
// index sync after the first trim resolves to the wrong entry in
// `radioQueue` — wrong metadata on screen, and the 50%-play-count recorder
// (which reads `state.currentTrack` / `state.currentShow`) attributes the
// play to the wrong show.
//
// These tests exercise the exported `playerReducer` directly (pure
// function), so the native/web audio modules and other context providers
// never need to be instantiated.

// PlayerContext.tsx -> PlayCountsContext.tsx -> AuthContext.tsx -> authService
// pulls in @react-native-google-signin/google-signin, which throws under
// Jest because the native turbo module isn't registered. Mock it out.
jest.mock('../../services/authService', () => ({
  authService: {
    onAuthStateChanged: jest.fn(),
    getClient: jest.fn(),
  },
}));

// nativeAudioPlayer.native.ts throws at import time if the native module
// isn't registered (it isn't, under Jest). PlayerContext.tsx (and
// audioService.ts, transitively) import it, so it must be mocked before
// anything else is imported.
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
import type { PlayerState, RadioTrack } from '../../types/player.types';
import type { Track, ShowDetail } from '../../types/show.types';
import type { RatedSongPerformance } from '../../data/songPerformanceRatings';

function makeShow(identifier: string): ShowDetail {
  return {
    identifier,
    title: identifier,
    date: '1977-05-08',
    year: '1977',
    tracks: [],
  };
}

function makeRadioTrack(id: string): RadioTrack {
  const track: Track = {
    id,
    title: id,
    format: 'VBR MP3',
    streamUrl: `https://example.com/${id}.mp3`,
  };
  return {
    track,
    show: makeShow(`show-${id}`),
    performance: {} as RatedSongPerformance,
  };
}

function radioTracks(prefix: string, count: number): RadioTrack[] {
  return Array.from({ length: count }, (_, i) => makeRadioTrack(`${prefix}${i}`));
}

function baseRadioState(overrides: Partial<PlayerState> = {}): PlayerState {
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
    playbackMode: 'radio',
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

describe('playerReducer radio queue trim/offset', () => {
  it('ADD_RADIO_TRACKS trims the queue past 100 entries and increments the offset by the trimmed amount', () => {
    // Queue already over the 100-entry trim threshold, with the play cursor
    // far enough in that the trim will actually remove entries.
    const seeded = radioTracks('seed', 105);
    const state = baseRadioState({ radioQueue: seeded, radioQueueIndex: 90 });

    const next = playerReducer(state, { type: 'ADD_RADIO_TRACKS', tracks: radioTracks('new', 5) });

    // Trim keeps [radioQueueIndex - 50, end) = [40, 105) => 65 kept + 5 new = 70
    expect(next.radioQueue.length).toBe(70);
    expect(next.radioQueueOffset).toBe(40); // indexAdjustment: 105 - 65
    // radioQueueIndex shifted back by the same amount trimmed
    expect(next.radioQueueIndex).toBe(90 - 40);
  });

  it('offset accumulates across multiple trims', () => {
    let state = baseRadioState({ radioQueue: radioTracks('seed', 105), radioQueueIndex: 90 });

    // First trim: length 105 -> 70, offset 0 -> 40, index 90 -> 50.
    state = playerReducer(state, { type: 'ADD_RADIO_TRACKS', tracks: radioTracks('batch1', 5) });
    expect(state.radioQueueOffset).toBe(40);
    expect(state.radioQueue.length).toBe(70);
    expect(state.radioQueueIndex).toBe(50);

    // Grow past the threshold again without crossing it mid-trim (pre-length
    // 70 and 90 are both <=100, so these two adds don't trim).
    state = playerReducer(state, { type: 'ADD_RADIO_TRACKS', tracks: radioTracks('mid1', 20) });
    expect(state.radioQueue.length).toBe(90);
    state = playerReducer(state, { type: 'ADD_RADIO_TRACKS', tracks: radioTracks('mid2', 20) });
    expect(state.radioQueue.length).toBe(110);
    expect(state.radioQueueOffset).toBe(40); // unchanged - no trim yet

    // Second trim: pre-length 110 > 100 and radioQueueIndex (50) is not > 50,
    // so the trim boundary is 0 (nothing removed) per existing trim policy...
    // advance the cursor past 50 first so this add actually trims.
    state = { ...state, radioQueueIndex: 60 };
    state = playerReducer(state, { type: 'ADD_RADIO_TRACKS', tracks: radioTracks('batch2', 5) });

    // Trim keeps [60 - 50, 110) = [10, 110) => 100 kept + 5 new = 105
    expect(state.radioQueue.length).toBe(105);
    expect(state.radioQueueOffset).toBe(50); // 40 + (110 - 100)
    expect(state.radioQueueIndex).toBe(50); // 60 - 10
  });

  it('SYNC_RADIO_TRACK_INDEX resolves the correct track using a post-trim native absolute index', () => {
    // Simulate the state right after a trim: 40 tracks were trimmed off the
    // front, so radioQueueOffset is 40 and radioQueue holds tracks that used
    // to be at native absolute indices [40, 105).
    const queue = radioTracks('post', 65); // absolute indices 40..104
    const state = baseRadioState({ radioQueue: queue, radioQueueIndex: 0, radioQueueOffset: 40 });

    // Native reports absolute index 42 (the 3rd track in the trimmed queue).
    const next = playerReducer(state, { type: 'SYNC_RADIO_TRACK_INDEX', index: 42 });

    expect(next.radioQueueIndex).toBe(2);
    expect(next.currentTrack).toBe(queue[2].track);
    expect(next.currentShow).toBe(queue[2].show);
  });

  it('BUG (pre-fix behavior guard): treating the native absolute index as a raw radioQueue index would pick the wrong track', () => {
    // This documents the bug this task fixes: without subtracting the
    // offset, absolute index 42 would incorrectly index into position 42 of
    // the 65-entry trimmed queue instead of position 2.
    const queue = radioTracks('post', 65);
    const wrongIndex = 42; // what the old code would have used directly
    expect(queue[wrongIndex].track.id).not.toBe(queue[2].track.id);
  });

  it.each([
    ['START_RADIO' as const, { type: 'START_RADIO' as const }],
    ['STOP_RADIO' as const, { type: 'STOP_RADIO' as const }],
  ])('%s resets radioQueueOffset to 0', (_name, action) => {
    const state = baseRadioState({
      radioQueue: radioTracks('x', 65),
      radioQueueIndex: 10,
      radioQueueOffset: 40,
    });

    const next = playerReducer(state, action);

    expect(next.radioQueueOffset).toBe(0);
  });

  it('START_SHUFFLE (mode switch away from radio) resets radioQueueOffset to 0', () => {
    const state = baseRadioState({
      radioQueue: radioTracks('x', 65),
      radioQueueIndex: 10,
      radioQueueOffset: 40,
    });

    const next = playerReducer(state, { type: 'START_SHUFFLE', shuffleType: 'shows', queue: [] });

    expect(next.radioQueueOffset).toBe(0);
  });

  it('STOP resets to initialState, which has radioQueueOffset 0', () => {
    const state = baseRadioState({
      radioQueue: radioTracks('x', 65),
      radioQueueIndex: 10,
      radioQueueOffset: 40,
    });

    const next = playerReducer(state, { type: 'STOP' });

    expect(next.radioQueueOffset).toBe(0);
  });

  it('a stale native index from before the current offset resolves out of range and is ignored (no crash, no state change)', () => {
    const queue = radioTracks('post', 65);
    const state = baseRadioState({ radioQueue: queue, radioQueueIndex: 5, radioQueueOffset: 40 });

    // Absolute index 10 predates the trim window entirely (translated index -30).
    const next = playerReducer(state, { type: 'SYNC_RADIO_TRACK_INDEX', index: 10 });

    expect(next).toBe(state);
  });
});
