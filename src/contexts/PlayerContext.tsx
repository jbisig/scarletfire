import React, { createContext, useReducer, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { Animated, InteractionManager } from 'react-native';
import nativeAudioPlayer, { State, Event } from '../services/nativeAudioPlayer';
import { PlayerState, PlayerAction, RadioTrack, PlaybackProgress } from '../types/player.types';
import { Track, ShowDetail, GratefulDeadShow, ShowsByYear } from '../types/show.types';
import { audioService } from '../services/audioService';
import { usePlayCounts } from './PlayCountsContext';
import { radioService } from '../services/radioService';
import { archiveApi } from '../services/archiveApi';
import showsData from '../data/shows.json';

// Load shows data for finding next chronological show
const allShowsByYear = showsData as ShowsByYear;

// Helper function to find the next show after a given date
function findNextShow(currentDate: string): GratefulDeadShow | null {
  const allShows: GratefulDeadShow[] = [];

  // Collect all shows from all years
  Object.values(allShowsByYear).forEach(yearShows => {
    allShows.push(...yearShows);
  });

  // Normalize date to YYYY-MM-DD format for comparison
  const normalizeDate = (date: string) => date.substring(0, 10);
  const currentDateNormalized = normalizeDate(currentDate);

  // Filter shows that are STRICTLY after the current date and sort by date
  const futureShows = allShows
    .filter(s => normalizeDate(s.date) > currentDateNormalized)
    .sort((a, b) => normalizeDate(a.date).localeCompare(normalizeDate(b.date)));

  // Return the first one (next chronological show)
  return futureShows.length > 0 ? futureShows[0] : null;
}

const initialState: PlayerState = {
  currentTrack: null,
  currentShow: null,
  isPlaying: false,
  isLoading: false,
  playlist: [],
  currentTrackIndex: -1,
  shouldAutoPlay: false,
  // Radio mode state
  playbackMode: 'show',
  radioQueue: [],
  radioQueueIndex: -1,
  isRadioLoading: false,
};

function playerReducer(state: PlayerState, action: PlayerAction): PlayerState {
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
        shouldAutoPlay: true
      };

    case 'PLAY':
      return { ...state, isPlaying: true, isLoading: false };

    case 'PAUSE':
      return { ...state, isPlaying: false, shouldAutoPlay: false };

    case 'STOP':
      return initialState;

    case 'SET_LOADING':
      return { ...state, isLoading: action.isLoading };

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
        isRadioLoading: true,
      };

    case 'STOP_RADIO':
      return {
        ...state,
        playbackMode: 'show',
        radioQueue: [],
        radioQueueIndex: -1,
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
      const newRadioQueue = [...state.radioQueue, ...action.tracks];
      const newRadioIndex = state.radioQueueIndex < 0 ? 0 : state.radioQueueIndex;
      const firstNewTrack = action.tracks[0];
      return {
        ...state,
        radioQueue: newRadioQueue,
        radioQueueIndex: newRadioIndex,
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

    case 'SYNC_RADIO_TRACK_INDEX':
      if (action.index >= 0 && action.index < state.radioQueue.length) {
        const radioTrack = state.radioQueue[action.index];
        return {
          ...state,
          radioQueueIndex: action.index,
          currentTrack: radioTrack.track,
          currentShow: radioTrack.show,
        };
      }
      return state;

    default:
      return state;
  }
}

interface PlayerContextType {
  state: PlayerState;
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
  isRadioMode: boolean;
  currentRadioTrack: RadioTrack | null;
  // Full player visibility
  isFullPlayerVisible: boolean;
  setFullPlayerVisible: (visible: boolean) => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(playerReducer, initialState);
  const [isFullPlayerVisible, setFullPlayerVisible] = useState(false);
  const currentLoadingTrackIdRef = useRef<string | null>(null);
  const hasRecordedPlayRef = useRef(false);
  const { recordTrackPlay } = usePlayCounts();

  // Progress tracking via refs to avoid re-renders on every position update
  const progressRef = useRef<PlaybackProgress>({ position: 0, duration: 0 });
  const progressAnimRef = useRef(new Animated.Value(0));
  const progressAnim = progressAnimRef.current;

  useEffect(() => {
    audioService.initialize();
    // Defer non-critical work until after initial render is complete
    InteractionManager.runAfterInteractions(() => {
      radioService.prefetch(20);
      // Start downloading background videos in the background
      try {
        const { videoDownloadService } = require('../services/videoDownloadService');
        videoDownloadService.startDeferredDownloads();
      } catch (e) {
        console.warn('[PlayerContext] Failed to start video downloads:', e);
      }
    });
  }, []);

  // Auto-load track when currentTrack changes
  useEffect(() => {
    if (state.currentTrack && state.isLoading) {
      const trackId = state.currentTrack.id;
      const shouldPlay = state.shouldAutoPlay;
      currentLoadingTrackIdRef.current = trackId;

      audioService.loadTrack(
        state.currentTrack,
        state.currentShow || undefined,
        state.playlist  // Pass full playlist for gapless playback
      ).then(() => {
        dispatch({ type: 'SET_LOADING', isLoading: false });

        // Only play if we're still on the same track (prevent race condition)
        if (currentLoadingTrackIdRef.current !== trackId) {
          return;
        }

        if (shouldPlay) {
          audioService.play().then(() => {
            dispatch({ type: 'PLAY' });
          }).catch((error) => {
            console.error('Auto-play failed:', error.message);
          });
        }
      }).catch((error) => {
        console.error('Track load failed:', error.message);
        dispatch({ type: 'SET_LOADING', isLoading: false });
      });
    }
  }, [state.currentTrack, state.isLoading, state.shouldAutoPlay]);

  // Listen to playback state changes from native audio player
  useEffect(() => {
    const subscription = nativeAudioPlayer.addEventListener(Event.PlaybackState, (event) => {
      const playbackState = event.state;

      if (playbackState === 'playing') {
        dispatch({ type: 'PLAY' });
      } else if (playbackState === 'paused') {
        dispatch({ type: 'PAUSE' });
      }
    });

    return () => subscription.remove();
  }, []);

  // Ref to track playback mode without causing listener re-subscription
  const playbackModeRef = useRef(state.playbackMode);
  useEffect(() => {
    playbackModeRef.current = state.playbackMode;
  }, [state.playbackMode]);

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

  // Track the last index where we triggered a replenish to avoid duplicate fetches
  const lastReplenishIndexRef = useRef(-1);
  // Promise ref to allow callers to wait for ongoing replenish
  const replenishPromiseRef = useRef<Promise<void> | null>(null);

  // Fetch more tracks for radio and add to queue
  const fetchMoreRadioTracks = useCallback(async () => {
    // If already replenishing, return the existing promise so callers can wait
    if (replenishPromiseRef.current) {
      return replenishPromiseRef.current;
    }

    const promise = (async () => {
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
            });
          }
          dispatch({ type: 'ADD_RADIO_TRACKS', tracks: newTracks });
        }
      } catch (error) {
        console.error('Failed to fetch more radio tracks:', error);
      } finally {
        replenishPromiseRef.current = null;
      }
    })();

    replenishPromiseRef.current = promise;
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
      const showDetail = await archiveApi.getShowDetail(nextShow.primaryIdentifier);

      if (showDetail.tracks.length > 0) {
        // Load the first track of the next show
        dispatch({ type: 'LOAD_TRACK', track: showDetail.tracks[0], show: showDetail, playlist: showDetail.tracks });
      } else {
        dispatch({ type: 'STOP' });
      }
    } catch (error) {
      console.error('Failed to load next show:', error);
      dispatch({ type: 'STOP' });
    }
  }, [state.currentShow?.date]);

  // Listen to queue end event (all tracks finished)
  useEffect(() => {
    const subscription = nativeAudioPlayer.addEventListener(Event.PlaybackQueueEnded, () => {
      if (state.playbackMode === 'radio') {
        // Radio queue ended - fetch more and restart
        fetchMoreRadioTracks().then(() => {
          nativeAudioPlayer.play();
        });
      } else {
        // Show ended - play the next chronological show
        playNextShow();
      }
    });

    return () => subscription.remove();
  }, [state.playbackMode, fetchMoreRadioTracks, playNextShow]);

  // Radio auto-replenish: fetch more tracks when 15 tracks remaining
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

  // Update position and duration from native audio player progress events
  // Uses refs to avoid triggering re-renders on every position update
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
      }
    });

    return () => subscription.remove();
  }, [progressAnim]);

  // Reset recording flag and progress when track changes
  useEffect(() => {
    hasRecordedPlayRef.current = false;
    // Reset progress for new track
    progressRef.current = { position: 0, duration: 0 };
    progressAnim.setValue(0);
  }, [state.currentTrack?.id, state.currentShow?.identifier, progressAnim]);

  // Monitor playback progress for 50% threshold using the progress listener
  // We check the ref in the progress listener callback to avoid extra effects
  const currentTrackRef = useRef(state.currentTrack);
  const currentShowRef = useRef(state.currentShow);
  const isPlayingRef = useRef(state.isPlaying);

  // Keep refs in sync with state
  useEffect(() => {
    currentTrackRef.current = state.currentTrack;
    currentShowRef.current = state.currentShow;
    isPlayingRef.current = state.isPlaying;
  }, [state.currentTrack, state.currentShow, state.isPlaying]);

  // Check 50% threshold in progress updates
  useEffect(() => {
    const checkThreshold = () => {
      const { position, duration } = progressRef.current;
      if (
        !hasRecordedPlayRef.current &&
        isPlayingRef.current &&
        currentTrackRef.current &&
        currentShowRef.current &&
        duration > 0 &&
        position >= duration * 0.5
      ) {
        hasRecordedPlayRef.current = true;
        recordTrackPlay(
          currentTrackRef.current.title,
          currentShowRef.current.identifier,
          currentShowRef.current.date
        );
      }
    };

    // Subscribe to progress updates for threshold checking
    const subscription = nativeAudioPlayer.addEventListener(Event.PlaybackProgress, checkThreshold);
    return () => subscription.remove();
  }, [recordTrackPlay]);

  const loadTrack = async (track: Track, show: ShowDetail, playlist: Track[]) => {
    // If in radio mode, stop radio first
    if (state.playbackMode === 'radio') {
      dispatch({ type: 'STOP_RADIO' });
      radioService.resetSession();
    }
    dispatch({ type: 'LOAD_TRACK', track, show, playlist });
  };

  const play = async () => {
    try {
      dispatch({ type: 'PLAY' });
      await audioService.play();
    } catch (error) {
      console.error('Play failed:', error instanceof Error ? error.message : 'Unknown error');
      dispatch({ type: 'PAUSE' });
    }
  };

  const pause = async () => {
    try {
      dispatch({ type: 'PAUSE' });
      await audioService.pause();
    } catch (error) {
      console.error('Pause failed:', error instanceof Error ? error.message : 'Unknown error');
    }
  };

  const stop = async () => {
    try {
      dispatch({ type: 'STOP' });
      await audioService.stop();
    } catch (error) {
      console.error('Stop failed:', error instanceof Error ? error.message : 'Unknown error');
    }
  };

  const nextTrack = async () => {
    try {
      await audioService.skipToNext();
    } catch (error) {
      console.error('Skip to next failed:', error instanceof Error ? error.message : 'Unknown error');
    }
  };

  const previousTrack = async () => {
    try {
      await audioService.skipToPrevious();
    } catch (error) {
      console.error('Skip to previous failed:', error instanceof Error ? error.message : 'Unknown error');
    }
  };

  const seekTo = async (position: number) => {
    try {
      // Update progress ref and animation immediately for responsive UI
      const duration = progressRef.current.duration;
      progressRef.current.position = position;
      if (duration > 0) {
        progressAnim.setValue(position / duration);
      }
      await audioService.seekTo(position);
    } catch (error) {
      console.error('Seek failed:', error instanceof Error ? error.message : 'Unknown error');
    }
  };

  // Start radio mode
  const startRadio = async () => {
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
        console.error('No radio tracks available');
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
      }));

      await nativeAudioPlayer.setQueue(nativeTracks, 0);
      dispatch({ type: 'ADD_RADIO_TRACKS', tracks: initialTracks });

      // Start playback
      await nativeAudioPlayer.play();
      dispatch({ type: 'PLAY' });
    } catch (error) {
      console.error('Failed to start radio:', error);
      dispatch({ type: 'STOP_RADIO' });
    }
  };

  // Stop radio mode
  const stopRadio = async () => {
    try {
      dispatch({ type: 'STOP_RADIO' });
      radioService.resetSession();
      lastReplenishIndexRef.current = -1;
      replenishPromiseRef.current = null;
      await audioService.stop();
    } catch (error) {
      console.error('Failed to stop radio:', error);
    }
  };

  // Derived values
  const isRadioMode = state.playbackMode === 'radio';
  const currentRadioTrack = isRadioMode && state.radioQueueIndex >= 0 && state.radioQueueIndex < state.radioQueue.length
    ? state.radioQueue[state.radioQueueIndex]
    : null;

  return (
    <PlayerContext.Provider
      value={{
        state,
        loadTrack,
        play,
        pause,
        stop,
        nextTrack,
        previousTrack,
        seekTo,
        progressRef,
        progressAnim,
        startRadio,
        stopRadio,
        isRadioMode,
        currentRadioTrack,
        isFullPlayerVisible,
        setFullPlayerVisible,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error('usePlayer must be used within PlayerProvider');
  }
  return context;
}
