import React, { createContext, useReducer, useContext, useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Animated, InteractionManager } from 'react-native';
import nativeAudioPlayer, { State, Event } from '../services/nativeAudioPlayer';
import { PlayerState, PlayerAction, RadioTrack, PlaybackProgress, ShuffleSongItem, isShuffleSongItem, isGratefulDeadShow } from '../types/player.types';
import { Track, ShowDetail, GratefulDeadShow } from '../types/show.types';
import { audioService, appIconUri } from '../services/audioService';
import { usePlayCounts } from './PlayCountsContext';
import { useOptionalShows } from './ShowsContext';
import { radioService } from '../services/radioService';
import { archiveApi } from '../services/archiveApi';
import { shuffleArray } from '../utils/shuffle';
import { logger } from '../utils/logger';
import { isAllowedStreamUrl } from '../utils/validateStreamUrl';
import { useOptionalToast } from './ToastContext';
import { findNextShow } from '../utils/showLookup';
import { describeLoadError } from '../utils/userFacingError';
import { resolveShowIdentifier, stableShowIdentifier } from '../services/sourceSelection';

const initialState: PlayerState = {
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
  // Radio mode state
  playbackMode: 'show',
  radioQueue: [],
  radioQueueIndex: -1,
  radioQueueOffset: 0,
  isRadioLoading: false,
  // Shuffle mode state
  shuffleQueue: [],
  shuffleQueueIndex: -1,
  shuffleType: null,
  isShuffleLoading: false,
};

export function playerReducer(state: PlayerState, action: PlayerAction): PlayerState {
  switch (action.type) {
    case 'LOAD_TRACK':
      const trackIndex = action.playlist.findIndex(t => t.id === action.track.id);
      return {
        ...state,
        currentTrack: action.track,
        currentShow: action.show,
        playlist: action.playlist,
        currentTrackIndex: trackIndex,
        isLoading: true,
        loadError: null,
        isBuffering: true,
        shouldAutoPlay: true
      };

    case 'PLAY':
      return { ...state, isPlaying: true, isLoading: false, isBuffering: false };

    case 'PAUSE':
      return { ...state, isPlaying: false, isBuffering: false, shouldAutoPlay: false };

    case 'STOP':
      return initialState;

    case 'SET_LOADING':
      return { ...state, isLoading: action.isLoading };

    case 'LOAD_FAILED':
      return {
        ...state,
        isLoading: false,
        isPlaying: false,
        isBuffering: false,
        loadError: { trackId: action.trackId, showIdentifier: action.showIdentifier },
      };

    case 'SET_BUFFERING':
      return state.isBuffering === action.isBuffering ? state : { ...state, isBuffering: action.isBuffering };

    case 'NEXT_TRACK':
      const nextIndex = state.currentTrackIndex + 1;
      if (nextIndex < state.playlist.length) {
        return {
          ...state,
          currentTrack: state.playlist[nextIndex],
          currentTrackIndex: nextIndex,
        };
      }
      return state;

    case 'PREVIOUS_TRACK':
      const prevIndex = state.currentTrackIndex - 1;
      if (prevIndex >= 0) {
        return {
          ...state,
          currentTrack: state.playlist[prevIndex],
          currentTrackIndex: prevIndex,
        };
      }
      return state;

    case 'SYNC_TRACK_INDEX':
      // Sync to a specific track index without reloading (used by native player events)
      if (action.index >= 0 && action.index < state.playlist.length) {
        return {
          ...state,
          currentTrack: state.playlist[action.index],
          currentTrackIndex: action.index,
        };
      }
      return state;

    // Radio mode actions
    case 'START_RADIO':
      return {
        ...state,
        playbackMode: 'radio',
        radioQueue: [],
        radioQueueIndex: -1,
        radioQueueOffset: 0,
        isRadioLoading: true,
      };

    case 'STOP_RADIO':
      return {
        ...state,
        playbackMode: 'show',
        radioQueue: [],
        radioQueueIndex: -1,
        radioQueueOffset: 0,
        isRadioLoading: false,
        currentTrack: null,
        currentShow: null,
        isPlaying: false,
      };

    case 'SET_RADIO_LOADING':
      return {
        ...state,
        isRadioLoading: action.isLoading,
      };

    case 'ADD_RADIO_TRACKS':
      // Trim old tracks from queue to prevent unbounded growth
      const trimmedQueue = state.radioQueue.length > 100
        ? state.radioQueue.slice(state.radioQueueIndex > 50 ? state.radioQueueIndex - 50 : 0)
        : state.radioQueue;
      const indexAdjustment = state.radioQueue.length - trimmedQueue.length;
      const newRadioQueue = [...trimmedQueue, ...action.tracks];
      const adjustedIndex = state.radioQueueIndex - indexAdjustment;
      const newRadioIndex = adjustedIndex < 0 ? 0 : adjustedIndex;
      const firstNewTrack = action.tracks[0];
      return {
        ...state,
        radioQueue: newRadioQueue,
        radioQueueIndex: newRadioIndex,
        // Cumulative count of tracks ever trimmed - the native queue is
        // append-only, so native absolute indices keep growing even though
        // radioQueue itself is capped. Track the running total so absolute
        // indices can be translated back to radioQueue indices.
        radioQueueOffset: state.radioQueueOffset + indexAdjustment,
        currentTrack: state.radioQueueIndex < 0 && firstNewTrack ? firstNewTrack.track : state.currentTrack,
        currentShow: state.radioQueueIndex < 0 && firstNewTrack ? firstNewTrack.show : state.currentShow,
        isRadioLoading: false,
        shouldAutoPlay: true,
      };

    case 'RADIO_NEXT_TRACK':
      const nextRadioIndex = state.radioQueueIndex + 1;
      if (nextRadioIndex < state.radioQueue.length) {
        const nextRadioTrack = state.radioQueue[nextRadioIndex];
        return {
          ...state,
          radioQueueIndex: nextRadioIndex,
          currentTrack: nextRadioTrack.track,
          currentShow: nextRadioTrack.show,
        };
      }
      return state;

    case 'RADIO_PREVIOUS_TRACK':
      const prevRadioIndex = state.radioQueueIndex - 1;
      if (prevRadioIndex >= 0) {
        const prevRadioTrack = state.radioQueue[prevRadioIndex];
        return {
          ...state,
          radioQueueIndex: prevRadioIndex,
          currentTrack: prevRadioTrack.track,
          currentShow: prevRadioTrack.show,
        };
      }
      return state;

    case 'SYNC_RADIO_TRACK_INDEX': {
      // action.index is the ABSOLUTE index from the native player's
      // append-only queue. Translate it to a radioQueue index by removing
      // the count of tracks already trimmed from the front of radioQueue.
      const translatedIndex = action.index - state.radioQueueOffset;
      if (translatedIndex >= 0 && translatedIndex < state.radioQueue.length) {
        const radioTrack = state.radioQueue[translatedIndex];
        return {
          ...state,
          radioQueueIndex: translatedIndex,
          currentTrack: radioTrack.track,
          currentShow: radioTrack.show,
        };
      }
      return state;
    }

    // Shuffle mode actions
    case 'START_SHUFFLE':
      return {
        ...state,
        playbackMode: 'shuffle',
        shuffleQueue: action.queue,
        shuffleQueueIndex: 0,
        shuffleType: action.shuffleType,
        isShuffleLoading: true,
        // Clear radio state
        radioQueue: [],
        radioQueueIndex: -1,
        radioQueueOffset: 0,
      };

    case 'STOP_SHUFFLE':
      return {
        ...state,
        playbackMode: 'show',
        shuffleQueue: [],
        shuffleQueueIndex: -1,
        shuffleType: null,
        isShuffleLoading: false,
        currentTrack: null,
        currentShow: null,
        isPlaying: false,
      };

    case 'SET_SHUFFLE_LOADING':
      return {
        ...state,
        isShuffleLoading: action.isLoading,
      };

    case 'SHUFFLE_NEXT':
      // shuffleNext() (below) only ever dispatches this action when the next
      // index is within bounds — when the queue is exhausted it dispatches
      // SET_SHUFFLE_QUEUE with a reshuffled queue instead. So the "queue
      // exhausted" case can't reach this reducer; no branch for it here.
      const nextShuffleIndex = state.shuffleQueueIndex + 1;
      if (nextShuffleIndex < state.shuffleQueue.length) {
        return {
          ...state,
          shuffleQueueIndex: nextShuffleIndex,
          isShuffleLoading: true,
        };
      }
      return state;

    case 'SHUFFLE_PREVIOUS':
      const prevShuffleIndex = state.shuffleQueueIndex - 1;
      if (prevShuffleIndex >= 0) {
        return {
          ...state,
          shuffleQueueIndex: prevShuffleIndex,
          isShuffleLoading: true,
        };
      }
      // At the beginning, stay at current position
      return state;

    case 'SET_SHUFFLE_QUEUE':
      return {
        ...state,
        shuffleQueue: action.queue,
        shuffleQueueIndex: 0,
      };

    case 'EXIT_SHUFFLE':
      // Exit shuffle mode without stopping audio - used when transitioning to normal playback
      return {
        ...state,
        playbackMode: 'show',
        shuffleQueue: [],
        shuffleQueueIndex: -1,
        shuffleType: null,
        isShuffleLoading: false,
      };

    default:
      return state;
  }
}

// Playback state + values derived from it. Changes on every dispatch — this is
// what state-reading consumers subscribe to.
interface PlayerStateContextValue {
  state: PlayerState;
  // Derived values
  isRadioMode: boolean;
  currentRadioTrack: RadioTrack | null;
  isShuffleMode: boolean;
}

// Imperative actions. This object is REFERENTIALLY STABLE across all renders
// (see the actions useMemo below) so consumers that only call actions never
// re-render on a state dispatch.
interface PlayerActionsContextValue {
  loadTrack: (track: Track, show: ShowDetail, playlist: Track[]) => Promise<void>;
  play: () => Promise<void>;
  pause: () => Promise<void>;
  stop: () => Promise<void>;
  nextTrack: () => void;
  previousTrack: () => void;
  seekTo: (position: number) => Promise<void>;
  // Progress tracking (refs to avoid re-renders)
  progressRef: React.MutableRefObject<PlaybackProgress>;
  progressAnim: Animated.Value;
  // Radio mode functions
  startRadio: () => Promise<void>;
  stopRadio: () => Promise<void>;
  // Shuffle mode functions
  startShuffleSongs: (
    songs: ShuffleSongItem[],
    source?: 'favorites' | 'playlist',
  ) => Promise<void>;
  startShuffleShows: (shows: GratefulDeadShow[]) => Promise<void>;
  startSequentialSongs: (songs: ShuffleSongItem[], startIndex?: number) => Promise<void>;
  stopShuffle: () => Promise<void>;
}

// Full-player visibility isolated into its own tiny context so the navigator
// shell can subscribe to it WITHOUT subscribing to playback state.
interface FullPlayerVisibilityContextValue {
  isFullPlayerVisible: boolean;
  setFullPlayerVisible: (visible: boolean) => void;
}

const PlayerStateContext = createContext<PlayerStateContextValue | undefined>(undefined);
const PlayerActionsContext = createContext<PlayerActionsContextValue | undefined>(undefined);
const FullPlayerVisibilityContext = createContext<FullPlayerVisibilityContextValue | undefined>(undefined);

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(playerReducer, initialState);
  const [isFullPlayerVisible, setFullPlayerVisible] = useState(false);
  const currentLoadingTrackIdRef = useRef<string | null>(null);
  const hasRecordedPlayRef = useRef(false);
  const { recordTrackPlay } = usePlayCounts();
  // Optional: some tests mount PlayerProvider without a ShowsProvider
  // ancestor. Falls back to a no-op so the prefetch effect below is skipped.
  const shows = useOptionalShows();
  // Optional: some tests mount PlayerProvider without a ToastProvider
  // ancestor. Falls back to a silent no-op so warnings are still logged.
  const toast = useOptionalToast();
  // Ref so the auto-load effect below can toast without adding the toast
  // host to its dependency list (which would re-run the load on provider
  // identity churn).
  const toastRef = useRef(toast);
  toastRef.current = toast;

  // Progress tracking via refs to avoid re-renders on every position update
  const progressRef = useRef<PlaybackProgress>({ position: 0, duration: 0 });
  const progressAnimRef = useRef(new Animated.Value(0));
  const progressAnim = progressAnimRef.current;

  useEffect(() => {
    audioService.initialize();
    // Defer non-critical work until after initial render is complete.
    // Radio prefetch is triggered lazily from DiscoverLandingScreen (with a
    // delay) and from getRandomTracks after radio is first used — keeping it
    // off the app-mount critical path so show-card taps aren't contended.
    InteractionManager.runAfterInteractions(() => {
      // Start downloading background videos in the background
      try {
        const { videoDownloadService } = require('../services/videoDownloadService');
        videoDownloadService.startDeferredDownloads();
      } catch (e) {
        logger.player.warn('Failed to start video downloads:', e);
      }
    });
  }, []);

  // Prefetch show details in background so navigation to the current show is
  // instant. Single instance here — FullPlayer and MiniPlayer both used to
  // run this identical effect, which meant it fired twice (redundantly) any
  // time both were mounted at once.
  useEffect(() => {
    if (state.currentShow?.identifier) {
      // Fire and forget - preloads into cache
      shows?.getShowDetail(state.currentShow.identifier).catch(() => {
        // Ignore errors - this is just prefetching
      });
    }
  }, [state.currentShow?.identifier, shows?.getShowDetail]);

  // Auto-load track when currentTrack changes
  // Skip in shuffle mode - loadShuffleSong/loadShuffleShow handle loading directly
  useEffect(() => {
    if (state.currentTrack && state.isLoading) {
      // In shuffle mode, loading is handled by loadShuffleSong/loadShuffleShow
      if (state.playbackMode === 'shuffle') {
        dispatch({ type: 'SET_LOADING', isLoading: false });
        return;
      }

      const trackId = state.currentTrack.id;
      const showIdentifier = state.currentShow?.identifier ?? null;
      const shouldPlay = state.shouldAutoPlay;
      currentLoadingTrackIdRef.current = trackId;

      audioService.loadTrack(
        state.currentTrack,
        state.currentShow || undefined,
        state.playlist  // Pass full playlist for gapless playback
      ).then(() => {
        // Only clear the spinner / play if we're still on the same track. A
        // previous (slower) load resolving after a newer track has already
        // started loading must not touch loading state — otherwise it
        // clears the spinner for the newer track that is still in flight.
        if (currentLoadingTrackIdRef.current !== trackId) {
          return;
        }

        dispatch({ type: 'SET_LOADING', isLoading: false });

        if (shouldPlay) {
          audioService.play().then(() => {
            dispatch({ type: 'PLAY' });
          }).catch((error) => {
            logger.player.error('Auto-play failed:', error.message);
            if (currentLoadingTrackIdRef.current !== trackId) return;
            dispatch({ type: 'LOAD_FAILED', trackId, showIdentifier });
            toastRef.current?.showToast("Couldn't start that track. Try again, or pick another recording.", 'error');
          });
        }
      }).catch((error) => {
        logger.player.error('Track load failed:', error.message);
        // Same staleness guard as the success path — a stale failure must not
        // clear loading state for a newer, still-loading track.
        if (currentLoadingTrackIdRef.current !== trackId) {
          return;
        }
        // Tapping a track is the highest-stakes moment in the app; a silent
        // failure here reads as "the app is broken". Record it on state (so
        // Show Detail can offer Retry / another recording) and say so.
        dispatch({ type: 'LOAD_FAILED', trackId, showIdentifier });
        toastRef.current?.showToast(describeLoadError(error, 'that track'), 'error');
      });
    }
  }, [state.currentTrack, state.isLoading, state.shouldAutoPlay, state.playbackMode]);

  // Listen to playback state changes from native audio player
  useEffect(() => {
    const subscription = nativeAudioPlayer.addEventListener(Event.PlaybackState, (event) => {
      const playbackState = event.state;

      if (playbackState === 'playing') {
        dispatch({ type: 'PLAY' });
      } else if (playbackState === 'paused') {
        dispatch({ type: 'PAUSE' });
      } else if (playbackState === 'buffering') {
        // Mid-track stall (or the initial fetch on players that report it):
        // show the spinner until the player says it's playing again.
        dispatch({ type: 'SET_BUFFERING', isBuffering: true });
      } else if (playbackState === 'stopped' || playbackState === 'idle' || playbackState === 'ended') {
        dispatch({ type: 'SET_BUFFERING', isBuffering: false });
        // Check if we need to load next shuffled show
        if (playbackModeRef.current === 'shuffle' && shuffleTypeRef.current === 'shows') {
          shuffleNextRef.current();
        }
      }
    });

    return () => subscription.remove();
  }, []);

  // Refs to track playback mode and shuffle type without causing listener re-subscription
  const playbackModeRef = useRef(state.playbackMode);
  const shuffleTypeRef = useRef(state.shuffleType);
  useEffect(() => {
    playbackModeRef.current = state.playbackMode;
    shuffleTypeRef.current = state.shuffleType;
  }, [state.playbackMode, state.shuffleType]);

  // Listen to track changes for gapless playback and lock screen controls
  // Uses ref for playbackMode to avoid re-subscribing when mode changes
  useEffect(() => {
    const subscription = nativeAudioPlayer.addEventListener(Event.PlaybackTrackChanged, (event) => {
      // Handle radio mode vs show mode track changes
      if (playbackModeRef.current === 'radio') {
        if (event.trackIndex !== undefined) {
          dispatch({ type: 'SYNC_RADIO_TRACK_INDEX', index: event.trackIndex });
        } else {
          dispatch({ type: 'RADIO_NEXT_TRACK' });
        }
      } else if (playbackModeRef.current === 'shuffle') {
        // In shuffle mode, sync track changes within a show
        if (event.trackIndex !== undefined) {
          nativeTrackIndexRef.current = event.trackIndex;
          dispatch({ type: 'SYNC_TRACK_INDEX', index: event.trackIndex });
        } else if (shuffleTypeRef.current === 'shows') {
          // Show ended in shuffle shows mode - load next shuffled show
          shuffleNextRef.current();
        }
      } else {
        // Sync React state to the track index from native player
        if (event.trackIndex !== undefined) {
          dispatch({ type: 'SYNC_TRACK_INDEX', index: event.trackIndex });
        } else {
          dispatch({ type: 'NEXT_TRACK' });
        }
      }
    });

    return () => subscription.remove();
  }, []); // Empty deps - subscribe once, use ref for mode

  // Listen for lock screen remote commands (skip forward/back)
  // Routes through nextTrack/previousTrack which have shuffle-aware logic
  useEffect(() => {
    const nextSub = nativeAudioPlayer.addEventListener(Event.RemoteNextTrack, () => {
      nextTrackRef.current();
    });
    const prevSub = nativeAudioPlayer.addEventListener(Event.RemotePreviousTrack, () => {
      previousTrackRef.current();
    });
    return () => {
      nextSub.remove();
      prevSub.remove();
    };
  }, []);

  // Direct-datanode stream URLs (see archiveApi.getShowDetail) skip the
  // /download 302 hop but can go stale when archive.org rebalances an item.
  // On playback error, retry the current show once via the durable /download
  // URLs and drop the cached (stale) detail so the next fetch is fresh.
  const fallbackAttemptedForTrackRef = useRef<string | null>(null);
  useEffect(() => {
    const subscription = nativeAudioPlayer.addEventListener(Event.PlaybackError, (data) => {
      // Radio queues are built incrementally from fresh fetches and rebuilt
      // constantly — swapping the whole native queue mid-radio isn't worth
      // the complexity, so radio keeps its existing error behavior (but
      // never leaves a spinner running).
      if (playbackModeRef.current === 'radio') {
        dispatch({ type: 'SET_BUFFERING', isBuffering: false });
        return;
      }

      const track = currentTrackRef.current;
      const show = currentShowRef.current;
      // Without a show we can't meaningfully reload; loadTrack requires it.
      if (!track || !show) return;

      // This is where a dead stream actually lands on both platforms: the
      // native/web players resolve setQueue() immediately and report the
      // failure later as an event. When there's no fallback left to try, the
      // failure is final — record it (Show Detail turns it into Retry / "try
      // another recording") and say so, instead of leaving the row red and
      // the mini player on a Play glyph with no explanation.
      const surfaceFailure = () => {
        dispatch({ type: 'LOAD_FAILED', trackId: track.id, showIdentifier: show.identifier });
        toastRef.current?.showToast(describeLoadError(data?.error, 'that track'), 'error');
      };

      if (!track.fallbackStreamUrl || track.fallbackStreamUrl === track.streamUrl) {
        surfaceFailure();
        return;
      }
      // One fallback attempt per track — if /download also fails, surface
      // the error instead of looping.
      if (fallbackAttemptedForTrackRef.current === track.id) {
        surfaceFailure();
        return;
      }
      fallbackAttemptedForTrackRef.current = track.id;

      logger.player.warn(
        'Direct stream failed; retrying via archive.org/download',
        data?.error
      );
      archiveApi.invalidateShowDetail(show.identifier);

      const toFallback = (t: Track): Track =>
        t.fallbackStreamUrl ? { ...t, streamUrl: t.fallbackStreamUrl } : t;
      const fallbackPlaylist = playlistRef.current.map(toFallback);
      loadTrackImplRef.current(
        toFallback(track),
        show,
        fallbackPlaylist.length > 0 ? fallbackPlaylist : [toFallback(track)]
      );
    });

    return () => subscription.remove();
  }, []);

  // Track the last index where we triggered a replenish to avoid duplicate fetches
  const lastReplenishIndexRef = useRef(-1);
  // Promise ref to allow callers to wait for ongoing replenish
  const replenishPromiseRef = useRef<Promise<void> | null>(null);

  // Fetch more tracks for radio and add to queue with retry logic
  const fetchMoreRadioTracks = useCallback(async () => {
    // If already replenishing, return the existing promise so callers can wait
    if (replenishPromiseRef.current) {
      return replenishPromiseRef.current;
    }

    const MAX_RETRIES = 3;
    const BASE_DELAY_MS = 1000;

    const promise = (async () => {
      let lastError: Error | null = null;

      for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        try {
          const newTracks = await radioService.getRandomTracks(20);

          if (newTracks.length > 0) {
            // Add tracks to native player queue
            for (const radioTrack of newTracks) {
              await nativeAudioPlayer.addTrack({
                id: radioTrack.track.id,
                url: radioTrack.track.streamUrl,
                title: radioTrack.track.title,
                artist: radioTrack.show.venue || 'Grateful Dead',
                duration: radioTrack.track.duration,
                artwork: appIconUri,
              });
            }
            dispatch({ type: 'ADD_RADIO_TRACKS', tracks: newTracks });
            return; // Success - exit retry loop
          }
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error));
          logger.player.warn(`Radio replenish attempt ${attempt + 1}/${MAX_RETRIES} failed:`, lastError.message);

          if (attempt < MAX_RETRIES - 1) {
            // Exponential backoff before retry
            const delay = BASE_DELAY_MS * Math.pow(2, attempt);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      }

      // All retries failed
      logger.player.error('Failed to replenish radio queue after all retries:', lastError?.message);
      // Don't stop radio - let it continue with remaining tracks
      // User will naturally see the queue end if no more tracks can be fetched
    })();

    replenishPromiseRef.current = promise;
    promise.finally(() => {
      replenishPromiseRef.current = null;
    });
    return promise;
  }, []);

  // Helper to load and play the next chronological show
  const playNextShow = useCallback(async () => {
    if (!state.currentShow?.date) {
      dispatch({ type: 'STOP' });
      return;
    }

    const nextShow = findNextShow(state.currentShow.date);
    if (!nextShow) {
      // No more shows - we've reached the end of the catalog
      dispatch({ type: 'STOP' });
      return;
    }

    try {
      // Fetch the show details
      const showDetail = await archiveApi.getShowDetail(resolveShowIdentifier(nextShow));

      if (showDetail.tracks.length > 0) {
        // Load the first track of the next show
        dispatch({ type: 'LOAD_TRACK', track: showDetail.tracks[0], show: showDetail, playlist: showDetail.tracks });
      } else {
        dispatch({ type: 'STOP' });
      }
    } catch (error) {
      logger.player.error('Failed to load next show:', error);
      dispatch({ type: 'STOP' });
    }
  }, [state.currentShow?.date]);

  // Ref to hold shuffleNext to avoid stale closures in event listener
  const shuffleNextRef = useRef<() => Promise<void>>(async () => {});
  const shufflePreviousRef = useRef<() => Promise<void>>(async () => {});
  // Refs for remote command handlers (lock screen skip forward/back)
  const nextTrackRef = useRef<() => Promise<void>>(async () => {});
  const previousTrackRef = useRef<() => Promise<void>>(async () => {});

  // Refs to track the current show's playlist length and native track index for shuffle shows mode
  const shuffleShowPlaylistLengthRef = useRef(0);
  const nativeTrackIndexRef = useRef(0);

  // Refs for stable event handler references
  const fetchMoreRadioTracksRef = useRef(fetchMoreRadioTracks);
  const playNextShowRef = useRef(playNextShow);
  useEffect(() => {
    fetchMoreRadioTracksRef.current = fetchMoreRadioTracks;
    playNextShowRef.current = playNextShow;
  }, [fetchMoreRadioTracks, playNextShow]);

  // Listen to queue end event (all tracks finished)
  // Uses refs to avoid re-subscribing when callbacks change
  useEffect(() => {
    const subscription = nativeAudioPlayer.addEventListener(Event.PlaybackQueueEnded, () => {
      if (playbackModeRef.current === 'radio') {
        // Radio queue ended - fetch more and restart
        fetchMoreRadioTracksRef.current().then(() => {
          nativeAudioPlayer.play();
        });
      } else if (playbackModeRef.current === 'shuffle') {
        // Shuffle queue ended - play next shuffled item
        shuffleNextRef.current();
      } else {
        // Show ended - play the next chronological show
        playNextShowRef.current();
      }
    });

    return () => subscription.remove();
  }, []); // Empty deps - subscribe once, use refs for callbacks

  // Radio auto-replenish: fetch more tracks when 25 tracks remaining
  // API fetches can take 45-90 seconds, so we need a large buffer for rapid skipping
  useEffect(() => {
    if (
      state.playbackMode === 'radio' &&
      state.radioQueue.length > 0 &&
      state.radioQueueIndex !== lastReplenishIndexRef.current
    ) {
      const remainingTracks = state.radioQueue.length - state.radioQueueIndex - 1;
      if (remainingTracks <= 15) {
        lastReplenishIndexRef.current = state.radioQueueIndex;
        fetchMoreRadioTracks();
      }
    }
  }, [state.playbackMode, state.radioQueueIndex, state.radioQueue.length, fetchMoreRadioTracks]);

  // Refs to track state for 50% play count threshold checking without re-subscribing
  const currentTrackRef = useRef(state.currentTrack);
  const currentShowRef = useRef(state.currentShow);
  const isPlayingRef = useRef(state.isPlaying);
  const currentTrackIndexRef = useRef(state.currentTrackIndex);
  const playlistRef = useRef(state.playlist);
  const hasTriggeredEndOfShowRef = useRef(false);

  // Keep refs in sync with state
  useEffect(() => {
    currentTrackRef.current = state.currentTrack;
    currentShowRef.current = state.currentShow;
    isPlayingRef.current = state.isPlaying;
    currentTrackIndexRef.current = state.currentTrackIndex;
    playlistRef.current = state.playlist;
  }, [state.currentTrack, state.currentShow, state.isPlaying, state.currentTrackIndex, state.playlist]);

  // Reset end-of-show trigger when show changes
  useEffect(() => {
    hasTriggeredEndOfShowRef.current = false;
  }, [state.currentShow?.identifier]);

  // Reset recording flag and progress when track changes
  useEffect(() => {
    hasRecordedPlayRef.current = false;
    // Reset progress for new track
    progressRef.current = { position: 0, duration: 0 };
    progressAnim.setValue(0);
  }, [state.currentTrack?.id, state.currentShow?.identifier, progressAnim]);

  // Consolidated progress listener: updates refs/animation AND checks 50% threshold
  // Single listener prevents duplicate event subscriptions
  useEffect(() => {
    const subscription = nativeAudioPlayer.addEventListener(Event.PlaybackProgress, (data) => {
      const position = data.position * 1000; // Convert seconds to milliseconds
      const duration = data.duration * 1000;

      // Only update if we have valid duration (audio is actually loaded/playing)
      if (duration > 0 && !isNaN(duration)) {
        // Update ref without triggering re-render
        progressRef.current = { position, duration };
        // Update animated value for smooth progress bar
        const progress = duration > 0 ? position / duration : 0;
        progressAnim.setValue(progress);

        // Check 50% threshold for play count recording
        if (
          !hasRecordedPlayRef.current &&
          isPlayingRef.current &&
          currentTrackRef.current &&
          currentShowRef.current &&
          position >= duration * 0.5
        ) {
          hasRecordedPlayRef.current = true;
          recordTrackPlay(
            currentTrackRef.current.title,
            // Keyed by the show's stable identity (catalog primary), not the
            // recording actually loaded — otherwise the same show's plays
            // split across recordings when the resolver picks a non-primary
            // one. See sourceSelection.ts.
            stableShowIdentifier(currentShowRef.current.date, currentShowRef.current.identifier),
            currentShowRef.current.date,
            playlistRef.current.length
          );
        }

        // Check for end of last track in shuffle shows mode
        // Trigger next show when we're within 1 second of the end
        const isLastTrack = playlistRef.current.length > 0 &&
                            currentTrackIndexRef.current === playlistRef.current.length - 1;
        if (
          !hasTriggeredEndOfShowRef.current &&
          playbackModeRef.current === 'shuffle' &&
          shuffleTypeRef.current === 'shows' &&
          isLastTrack &&
          duration - position < 1000 // Within 1 second of end
        ) {
          hasTriggeredEndOfShowRef.current = true;
          shuffleNextRef.current();
        }
      }
    });

    return () => subscription.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recordTrackPlay]); // progressAnim excluded — only used for setValue(), not conditional logic

  const loadTrack = useCallback(async (track: Track, show: ShowDetail, playlist: Track[]) => {
    // Screens pass tracks sourced from favorites/collections/public
    // profiles — any of which can be synced from ANOTHER user — so the
    // streamUrl must be confirmed to point at archive.org before we ever
    // hand it to the native player. This is a user-initiated action (tapping
    // a track), so surface a toast in addition to the logged warning.
    if (!isAllowedStreamUrl(track.streamUrl)) {
      logger.player.warn('Skipped track with disallowed streamUrl:', track.streamUrl);
      toast?.showToast("Couldn't play that track", 'error');
      return;
    }

    // If in radio mode, stop radio first
    if (state.playbackMode === 'radio') {
      dispatch({ type: 'STOP_RADIO' });
      radioService.resetSession();
    }
    // If in shuffle mode, exit shuffle and return to normal show mode
    if (state.playbackMode === 'shuffle') {
      dispatch({ type: 'EXIT_SHUFFLE' });
    }
    dispatch({ type: 'LOAD_TRACK', track, show, playlist });
  }, [state.playbackMode, toast]);

  const play = useCallback(async () => {
    try {
      dispatch({ type: 'PLAY' });
      await audioService.play();
    } catch (error) {
      logger.player.error('Play failed:', error instanceof Error ? error.message : 'Unknown error');
      dispatch({ type: 'PAUSE' });
    }
  }, []);

  const pause = useCallback(async () => {
    try {
      dispatch({ type: 'PAUSE' });
      await audioService.pause();
    } catch (error) {
      logger.player.error('Pause failed:', error instanceof Error ? error.message : 'Unknown error');
    }
  }, []);

  const stop = useCallback(async () => {
    try {
      dispatch({ type: 'STOP' });
      await audioService.stop();
    } catch (error) {
      logger.player.error('Stop failed:', error instanceof Error ? error.message : 'Unknown error');
    }
  }, []);

  const nextTrack = useCallback(async () => {
    try {
      // In shuffle songs / playlist modes, manually advance to next queued song
      if (
        state.playbackMode === 'shuffle' &&
        (state.shuffleType === 'songs' || state.shuffleType === 'playlist' || state.shuffleType === 'playlistShuffle')
      ) {
        shuffleNextRef.current();
        return;
      }
      // In shuffle shows mode, check if we're on the last track using refs (more reliable than state)
      if (state.playbackMode === 'shuffle' && state.shuffleType === 'shows') {
        const nativeIndex = nativeTrackIndexRef.current;
        const playlistLen = shuffleShowPlaylistLengthRef.current;
        const isLastTrack = playlistLen > 0 && nativeIndex === playlistLen - 1;
        if (isLastTrack) {
          // On last track, load next shuffled show
          shuffleNextRef.current();
          return;
        }
      }
      // In show mode, check if we're on the last track and should start next show
      if (state.playbackMode === 'show') {
        const isLastTrack = state.playlist.length > 0 &&
                            state.currentTrackIndex === state.playlist.length - 1;
        if (isLastTrack) {
          // On last track of show, play next chronological show
          playNextShowRef.current();
          return;
        }
      }
      await audioService.skipToNext();
    } catch (error) {
      logger.player.error('Skip to next failed:', error instanceof Error ? error.message : 'Unknown error');
    }
  }, [state.playbackMode, state.shuffleType, state.playlist.length, state.currentTrackIndex]);

  const previousTrack = useCallback(async () => {
    try {
      // If we're more than 3 seconds in, restart the current song
      if (progressRef.current.position > 3000) {
        await audioService.seekTo(0);
        return;
      }

      // In shuffle songs / playlist modes, go to previous queued song
      if (
        state.playbackMode === 'shuffle' &&
        (state.shuffleType === 'songs' || state.shuffleType === 'playlist' || state.shuffleType === 'playlistShuffle')
      ) {
        shufflePreviousRef.current();
        return;
      }

      await audioService.skipToPrevious();
    } catch (error) {
      logger.player.error('Skip to previous failed:', error instanceof Error ? error.message : 'Unknown error');
    }
  }, [state.playbackMode, state.shuffleType]);

  const seekTo = useCallback(async (position: number) => {
    try {
      // Update progress ref and animation immediately for responsive UI
      const duration = progressRef.current.duration;
      progressRef.current.position = position;
      if (duration > 0) {
        progressAnim.setValue(position / duration);
      }
      await audioService.seekTo(position);
    } catch (error) {
      logger.player.error('Seek failed:', error instanceof Error ? error.message : 'Unknown error');
    }
  }, [progressAnim]);

  // Start radio mode
  const startRadio = useCallback(async () => {
    try {
      // If already in radio mode, do nothing
      if (state.playbackMode === 'radio') {
        return;
      }

      dispatch({ type: 'START_RADIO' });

      // Open the full player immediately for responsiveness
      setFullPlayerVisible(true);

      // Get first batch of tracks (uses prefetched tracks if available)
      const initialTracks = await radioService.getRandomTracks(10);

      if (initialTracks.length === 0) {
        logger.player.error('No radio tracks available');
        dispatch({ type: 'STOP_RADIO' });
        return;
      }

      // Set up native player queue with initial tracks
      const nativeTracks = initialTracks.map(rt => ({
        id: rt.track.id,
        url: rt.track.streamUrl,
        title: rt.track.title,
        artist: rt.show.venue || 'Grateful Dead',
        duration: rt.track.duration,
        artwork: appIconUri,
      }));

      await nativeAudioPlayer.setQueue(nativeTracks, 0);
      dispatch({ type: 'ADD_RADIO_TRACKS', tracks: initialTracks });

      // Start playback
      await nativeAudioPlayer.play();
      dispatch({ type: 'PLAY' });
    } catch (error) {
      logger.player.error('Failed to start radio:', error);
      dispatch({ type: 'STOP_RADIO' });
    }
  }, [state.playbackMode]);

  // Stop radio mode
  const stopRadio = useCallback(async () => {
    try {
      dispatch({ type: 'STOP_RADIO' });
      radioService.resetSession();
      lastReplenishIndexRef.current = -1;
      replenishPromiseRef.current = null;
      await audioService.stop();
    } catch (error) {
      logger.player.error('Failed to stop radio:', error);
    }
  }, []);

  // Helper to load and play a song from shuffle queue
  const loadShuffleSong = useCallback(async (song: ShuffleSongItem) => {
    try {
      dispatch({ type: 'SET_SHUFFLE_LOADING', isLoading: true });

      // Fetch the show details
      const showDetail = await archiveApi.getShowDetail(song.showIdentifier);

      // Find the matching track
      const track = showDetail.tracks.find(t => t.id === song.trackId);

      if (track && !isAllowedStreamUrl(track.streamUrl)) {
        // `song` came from a shuffle queue that can be sourced from favorites
        // or a synced/shared collection — i.e. from ANOTHER user. Even
        // though the track itself was just freshly fetched from archive.org,
        // validate defensively before it reaches the native player.
        logger.player.warn('Skipped shuffle song with disallowed streamUrl:', track.streamUrl);
        toast?.showToast("Couldn't play that track", 'error');
        dispatch({ type: 'SET_SHUFFLE_LOADING', isLoading: false });
        return;
      }

      if (track) {
        // Set up native player with just this track (not the full show playlist)
        const nativeTrack = {
          id: track.id,
          url: track.streamUrl,
          title: track.title,
          artist: showDetail.venue || 'Grateful Dead',
          duration: track.duration,
          artwork: appIconUri,
        };

        await nativeAudioPlayer.setQueue([nativeTrack], 0);

        // Update state with current track/show
        dispatch({ type: 'LOAD_TRACK', track, show: showDetail, playlist: [track] });
        dispatch({ type: 'SET_SHUFFLE_LOADING', isLoading: false });

        // Start playback
        await nativeAudioPlayer.play();
        dispatch({ type: 'PLAY' });
      } else {
        logger.player.error('Track not found in show:', song.trackId);
        dispatch({ type: 'SET_SHUFFLE_LOADING', isLoading: false });
      }
    } catch (error) {
      logger.player.error('Failed to load shuffle song:', error);
      dispatch({ type: 'SET_SHUFFLE_LOADING', isLoading: false });
    }
  }, [toast]);

  // Helper to load and play a show from shuffle queue
  const loadShuffleShow = useCallback(async (show: GratefulDeadShow) => {
    try {
      dispatch({ type: 'SET_SHUFFLE_LOADING', isLoading: true });

      // Fetch the show details
      const identifier = resolveShowIdentifier(show);
      const showDetail = await archiveApi.getShowDetail(identifier);

      // `show` can come from a shuffle queue sourced from favorites or a
      // synced/shared collection (another user). Drop any tracks whose
      // streamUrl isn't archive.org rather than trusting the fetched list
      // wholesale — defensive, since the fetch itself is keyed by an
      // identifier that ultimately traces back to that foreign data.
      const validTracks = showDetail.tracks.filter(t => isAllowedStreamUrl(t.streamUrl));
      if (validTracks.length < showDetail.tracks.length) {
        logger.player.warn(
          `Skipped ${showDetail.tracks.length - validTracks.length} track(s) with disallowed streamUrl in show:`,
          identifier,
        );
        toast?.showToast('Skipped some tracks with an invalid link', 'error');
      }

      if (validTracks.length > 0) {
        // Set up native player queue with all tracks
        const nativeTracks = validTracks.map(t => ({
          id: t.id,
          url: t.streamUrl,
          title: t.title,
          artist: showDetail.venue || 'Grateful Dead',
          duration: t.duration,
          artwork: appIconUri,
        }));

        await nativeAudioPlayer.setQueue(nativeTracks, 0);

        // Store playlist length in ref for skip detection
        shuffleShowPlaylistLengthRef.current = validTracks.length;

        // Update state
        dispatch({ type: 'LOAD_TRACK', track: validTracks[0], show: showDetail, playlist: validTracks });
        dispatch({ type: 'SET_SHUFFLE_LOADING', isLoading: false });

        // Start playback
        await nativeAudioPlayer.play();
        dispatch({ type: 'PLAY' });
      } else {
        logger.player.error('No tracks in show:', identifier);
        dispatch({ type: 'SET_SHUFFLE_LOADING', isLoading: false });
      }
    } catch (error) {
      logger.player.error('Failed to load shuffle show:', error);
      dispatch({ type: 'SET_SHUFFLE_LOADING', isLoading: false });
    }
  }, [toast]);

  // Start shuffle mode for songs. `source` distinguishes favorites shuffle
  // from a playlist shuffle so the UI can show a distinct badge.
  const startShuffleSongs = useCallback(async (
    songs: ShuffleSongItem[],
    source: 'favorites' | 'playlist' = 'favorites',
  ) => {
    if (songs.length === 0) {
      logger.player.warn('No songs to shuffle');
      return;
    }

    try {
      // Stop any current playback mode
      if (state.playbackMode === 'radio') {
        radioService.resetSession();
        lastReplenishIndexRef.current = -1;
        replenishPromiseRef.current = null;
      }

      // Shuffle the songs
      const shuffledSongs = shuffleArray(songs);

      // Start shuffle mode with the source-appropriate badge type.
      const shuffleType = source === 'playlist' ? 'playlistShuffle' : 'songs';
      dispatch({ type: 'START_SHUFFLE', shuffleType, queue: shuffledSongs });

      // Load and play the first song
      await loadShuffleSong(shuffledSongs[0]);
    } catch (error) {
      logger.player.error('Failed to start shuffle songs:', error);
      dispatch({ type: 'STOP_SHUFFLE' });
    }
  }, [state.playbackMode, loadShuffleSong]);

  // Sequential playback of a fixed song list (e.g. a playlist). Starts at startIndex
  // and plays through to the end, reusing the shuffle-queue infrastructure without
  // randomizing the order.
  const startSequentialSongs = useCallback(
    async (songs: ShuffleSongItem[], startIndex = 0) => {
      if (songs.length === 0) return;
      const safeIndex = Math.max(0, Math.min(startIndex, songs.length - 1));
      // Rotate so the chosen track is first; later tracks follow in order.
      const queue = [...songs.slice(safeIndex), ...songs.slice(0, safeIndex)];
      try {
        if (state.playbackMode === 'radio') {
          radioService.resetSession();
          lastReplenishIndexRef.current = -1;
          replenishPromiseRef.current = null;
        }
        dispatch({ type: 'START_SHUFFLE', shuffleType: 'playlist', queue });
        await loadShuffleSong(queue[0]);
      } catch (error) {
        logger.player.error('Failed to start playlist:', error);
        dispatch({ type: 'STOP_SHUFFLE' });
      }
    },
    [state.playbackMode, loadShuffleSong],
  );

  // Start shuffle mode for shows
  const startShuffleShows = useCallback(async (shows: GratefulDeadShow[]) => {
    if (shows.length === 0) {
      logger.player.warn('No shows to shuffle');
      return;
    }

    try {
      // Stop any current playback mode
      if (state.playbackMode === 'radio') {
        radioService.resetSession();
        lastReplenishIndexRef.current = -1;
        replenishPromiseRef.current = null;
      }

      // Shuffle the shows
      const shuffledShows = shuffleArray(shows);

      // Start shuffle mode
      dispatch({ type: 'START_SHUFFLE', shuffleType: 'shows', queue: shuffledShows });

      // Load and play the first show
      await loadShuffleShow(shuffledShows[0]);
    } catch (error) {
      logger.player.error('Failed to start shuffle shows:', error);
      dispatch({ type: 'STOP_SHUFFLE' });
    }
  }, [state.playbackMode, loadShuffleShow]);

  // Stop shuffle mode
  const stopShuffle = useCallback(async () => {
    try {
      dispatch({ type: 'STOP_SHUFFLE' });
      await audioService.stop();
    } catch (error) {
      logger.player.error('Failed to stop shuffle:', error);
    }
  }, []);

  // Handle shuffle next - called when track/show ends in shuffle mode
  const shuffleNext = useCallback(async () => {
    if (state.shuffleType === 'songs' || state.shuffleType === 'playlist' || state.shuffleType === 'playlistShuffle') {
      const nextIndex = state.shuffleQueueIndex + 1;
      if (nextIndex < state.shuffleQueue.length) {
        const nextItem = state.shuffleQueue[nextIndex];
        if (isShuffleSongItem(nextItem)) {
          dispatch({ type: 'SHUFFLE_NEXT' });
          await loadShuffleSong(nextItem);
        }
      } else {
        // Queue exhausted - reshuffle and continue
        const songsQueue = state.shuffleQueue.filter(isShuffleSongItem);
        const reshuffled = shuffleArray(songsQueue);
        dispatch({ type: 'SET_SHUFFLE_QUEUE', queue: reshuffled });
        if (reshuffled.length > 0) {
          await loadShuffleSong(reshuffled[0]);
        }
      }
    } else if (state.shuffleType === 'shows') {
      const nextIndex = state.shuffleQueueIndex + 1;
      if (nextIndex < state.shuffleQueue.length) {
        const nextItem = state.shuffleQueue[nextIndex];
        if (isGratefulDeadShow(nextItem)) {
          dispatch({ type: 'SHUFFLE_NEXT' });
          await loadShuffleShow(nextItem);
        }
      } else {
        // Queue exhausted - reshuffle and continue
        const showsQueue = state.shuffleQueue.filter(isGratefulDeadShow);
        const reshuffled = shuffleArray(showsQueue);
        dispatch({ type: 'SET_SHUFFLE_QUEUE', queue: reshuffled });
        if (reshuffled.length > 0) {
          await loadShuffleShow(reshuffled[0]);
        }
      }
    }
  }, [state.shuffleType, state.shuffleQueueIndex, state.shuffleQueue, loadShuffleSong, loadShuffleShow]);

  // Handle shuffle previous - go back to previous song in shuffle queue
  const shufflePrevious = useCallback(async () => {
    if (state.shuffleType === 'songs' || state.shuffleType === 'playlist' || state.shuffleType === 'playlistShuffle') {
      const prevIndex = state.shuffleQueueIndex - 1;
      if (prevIndex >= 0) {
        const prevItem = state.shuffleQueue[prevIndex];
        if (isShuffleSongItem(prevItem)) {
          dispatch({ type: 'SHUFFLE_PREVIOUS' });
          await loadShuffleSong(prevItem);
        }
      }
      // If at the beginning, just restart the current song
      else if (state.shuffleQueueIndex >= 0 && state.shuffleQueueIndex < state.shuffleQueue.length) {
        const currentItem = state.shuffleQueue[state.shuffleQueueIndex];
        if (isShuffleSongItem(currentItem)) {
          await loadShuffleSong(currentItem);
        }
      }
    }
  }, [state.shuffleType, state.shuffleQueueIndex, state.shuffleQueue, loadShuffleSong]);

  // Keep shuffleNextRef and shufflePreviousRef updated to avoid stale closures
  useEffect(() => {
    shuffleNextRef.current = shuffleNext;
  }, [shuffleNext]);

  useEffect(() => {
    shufflePreviousRef.current = shufflePrevious;
  }, [shufflePrevious]);

  useEffect(() => {
    nextTrackRef.current = nextTrack;
  }, [nextTrack]);

  useEffect(() => {
    previousTrackRef.current = previousTrack;
  }, [previousTrack]);

  // ---------------------------------------------------------------------------
  // Referentially stable public actions
  //
  // Several action callbacks above are re-created across renders because they
  // close over slices of state (e.g. loadTrack over state.playbackMode). To
  // keep the actions context value referentially stable — so consumers that
  // only call actions never re-render on a state dispatch — each such action is
  // mirrored into a ref and exposed through a stable wrapper. Actions that are
  // already stable (empty-dep useCallbacks) are passed through directly.
  //
  // Stabilizing loadTrack in particular makes usePlaySavedSong's playSong
  // genuinely stable — previously it followed loadTrack's identity, which
  // changed on every playback-mode change. (nextTrack/previousTrack are already
  // mirrored into nextTrackRef/previousTrackRef above for the lock-screen
  // remote handlers; those refs are reused here.)
  const loadTrackImplRef = useRef(loadTrack);
  const startRadioImplRef = useRef(startRadio);
  const startShuffleSongsImplRef = useRef(startShuffleSongs);
  const startShuffleShowsImplRef = useRef(startShuffleShows);
  const startSequentialSongsImplRef = useRef(startSequentialSongs);
  useEffect(() => {
    loadTrackImplRef.current = loadTrack;
    startRadioImplRef.current = startRadio;
    startShuffleSongsImplRef.current = startShuffleSongs;
    startShuffleShowsImplRef.current = startShuffleShows;
    startSequentialSongsImplRef.current = startSequentialSongs;
  }, [loadTrack, startRadio, startShuffleSongs, startShuffleShows, startSequentialSongs]);

  const stableLoadTrack = useCallback(
    (track: Track, show: ShowDetail, playlist: Track[]) => loadTrackImplRef.current(track, show, playlist),
    [],
  );
  const stableNextTrack = useCallback(() => nextTrackRef.current(), []);
  const stablePreviousTrack = useCallback(() => previousTrackRef.current(), []);
  const stableStartRadio = useCallback(() => startRadioImplRef.current(), []);
  const stableStartShuffleSongs = useCallback(
    (songs: ShuffleSongItem[], source?: 'favorites' | 'playlist') =>
      startShuffleSongsImplRef.current(songs, source),
    [],
  );
  const stableStartShuffleShows = useCallback(
    (shows: GratefulDeadShow[]) => startShuffleShowsImplRef.current(shows),
    [],
  );
  const stableStartSequentialSongs = useCallback(
    (songs: ShuffleSongItem[], startIndex?: number) =>
      startSequentialSongsImplRef.current(songs, startIndex),
    [],
  );

  // Derived values
  const isRadioMode = state.playbackMode === 'radio';
  const isShuffleMode = state.playbackMode === 'shuffle';
  const currentRadioTrack = isRadioMode && state.radioQueueIndex >= 0 && state.radioQueueIndex < state.radioQueue.length
    ? state.radioQueue[state.radioQueueIndex]
    : null;

  // Referentially stable actions object — every member is stable (empty-dep
  // callbacks, the stable wrappers above, or refs), so this identity never
  // changes and PlayerActionsContext consumers never re-render on a dispatch.
  const actions = useMemo<PlayerActionsContextValue>(() => ({
    loadTrack: stableLoadTrack,
    play,
    pause,
    stop,
    nextTrack: stableNextTrack,
    previousTrack: stablePreviousTrack,
    seekTo,
    progressRef,
    progressAnim,
    startRadio: stableStartRadio,
    stopRadio,
    startShuffleSongs: stableStartShuffleSongs,
    startShuffleShows: stableStartShuffleShows,
    startSequentialSongs: stableStartSequentialSongs,
    stopShuffle,
  }), [
    stableLoadTrack,
    play,
    pause,
    stop,
    stableNextTrack,
    stablePreviousTrack,
    seekTo,
    progressAnim,
    stableStartRadio,
    stopRadio,
    stableStartShuffleSongs,
    stableStartShuffleShows,
    stableStartSequentialSongs,
    stopShuffle,
  ]);

  // State context value — changes on every dispatch (that is the point).
  const stateValue = useMemo<PlayerStateContextValue>(() => ({
    state,
    isRadioMode,
    currentRadioTrack,
    isShuffleMode,
  }), [state, isRadioMode, currentRadioTrack, isShuffleMode]);

  // Visibility context value — changes only when the full player opens/closes.
  const visibilityValue = useMemo<FullPlayerVisibilityContextValue>(() => ({
    isFullPlayerVisible,
    setFullPlayerVisible,
  }), [isFullPlayerVisible]);

  return (
    <PlayerActionsContext.Provider value={actions}>
      <PlayerStateContext.Provider value={stateValue}>
        <FullPlayerVisibilityContext.Provider value={visibilityValue}>
          {children}
        </FullPlayerVisibilityContext.Provider>
      </PlayerStateContext.Provider>
    </PlayerActionsContext.Provider>
  );
}

export function usePlayerState() {
  const context = useContext(PlayerStateContext);
  if (!context) {
    throw new Error('usePlayerState must be used within PlayerProvider');
  }
  return context;
}

export function usePlayerActions() {
  const context = useContext(PlayerActionsContext);
  if (!context) {
    throw new Error('usePlayerActions must be used within PlayerProvider');
  }
  return context;
}

export function useFullPlayerVisibility() {
  const context = useContext(FullPlayerVisibilityContext);
  if (!context) {
    throw new Error('useFullPlayerVisibility must be used within PlayerProvider');
  }
  return context;
}

// Backwards-compatible hook returning the combined state + actions shape so
// consumers that read both (FullPlayer, MiniPlayer, PlayerBar, etc.) don't have
// to migrate. Because the actions object is referentially stable, also
// subscribing to it adds no re-renders beyond the state subscription. Does NOT
// include full-player visibility — that now lives in useFullPlayerVisibility.
export function usePlayer() {
  const state = usePlayerState();
  const actions = usePlayerActions();
  return { ...state, ...actions };
}
