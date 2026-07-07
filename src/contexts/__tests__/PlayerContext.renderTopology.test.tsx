// src/contexts/__tests__/PlayerContext.renderTopology.test.tsx
//
// Acceptance test for Task 25 (split PlayerContext into state + actions
// contexts). Proves the re-render topology the split exists to achieve:
//
//   - a consumer of usePlayerState() DOES re-render on a state dispatch, and
//   - a consumer of usePlayerActions() does NOT re-render on that same
//     dispatch (the actions object is referentially stable).
//
// Before the split, both consumers shared one context value memoized on the
// whole state, so any dispatch (e.g. play/pause) re-rendered every consumer —
// including whole action-only screens. This test would have failed then.
//
// Follows the "drive the real PlayerProvider" harness of
// PlayerContext.spinnerRace.test.tsx.

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

// Cut the PlayerContext -> PlayCountsContext dependency chain (AsyncStorage,
// Supabase auth, etc.) — irrelevant to the render-topology assertion.
jest.mock('../PlayCountsContext', () => ({
  usePlayCounts: () => ({ recordTrackPlay: jest.fn() }),
}));

// PlayerProvider's mount effect lazily requires videoDownloadService and kicks
// off background downloads via InteractionManager — unrelated here, and it
// throws under Jest. Stub it out.
jest.mock('../../services/videoDownloadService', () => ({
  videoDownloadService: { startDeferredDownloads: jest.fn() },
}));

jest.mock('../../services/audioService', () => ({
  audioService: {
    initialize: jest.fn().mockResolvedValue(undefined),
    loadTrack: jest.fn().mockResolvedValue(undefined),
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
import {
  PlayerProvider,
  usePlayerState,
  usePlayerActions,
} from '../PlayerContext';

let stateRenders = 0;
let actionsRenders = 0;
let actionsApi: ReturnType<typeof usePlayerActions> | null = null;

function StateProbe() {
  stateRenders++;
  const { state } = usePlayerState();
  return <Text testID="isPlaying">{String(state.isPlaying)}</Text>;
}

function ActionsProbe() {
  actionsRenders++;
  actionsApi = usePlayerActions();
  return null;
}

describe('PlayerContext state/actions render topology', () => {
  beforeEach(() => {
    stateRenders = 0;
    actionsRenders = 0;
    actionsApi = null;
  });

  it('re-renders state consumers but NOT actions consumers on a state dispatch', async () => {
    const { getByTestId } = render(
      <PlayerProvider>
        <StateProbe />
        <ActionsProbe />
      </PlayerProvider>,
    );

    await waitFor(() => expect(getByTestId('isPlaying').props.children).toBe('false'));

    // Baseline after mount effects have settled.
    const baseStateRenders = stateRenders;
    const baseActionsRenders = actionsRenders;
    const actionsBefore = actionsApi;
    expect(actionsBefore).not.toBeNull();

    // A pure state dispatch: play() dispatches PLAY -> isPlaying: true.
    await act(async () => {
      await actionsApi!.play();
    });

    await waitFor(() => expect(getByTestId('isPlaying').props.children).toBe('true'));

    // The state consumer re-rendered...
    expect(stateRenders).toBeGreaterThan(baseStateRenders);
    // ...while the actions consumer did NOT.
    expect(actionsRenders).toBe(baseActionsRenders);
    // The actions object identity is unchanged across the dispatch.
    expect(actionsApi).toBe(actionsBefore);
  });
});
