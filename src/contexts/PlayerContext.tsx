import React, { createContext, useReducer, useContext, useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Animated, InteractionManager } from 'react-native';
import nativeAudioPlayer, { State, Event } from '../services/nativeAudioPlayer';
import { PlayerState, PlayerAction, RadioTrack, PlaybackProgress, ShuffleSongItem, isShuffleSongItem, isGratefulDeadShow } from '../types/player.types';
import { Track, ShowDetail, GratefulDeadShow, ShowsByYear } from '../types/show.types';
import { audioService } from '../services/audioService';
import { usePlayCounts } from './PlayCountsContext';
import { radioService } from '../services/radioService';
import { archiveApi } from '../services/archiveApi';
import { shuffleArray } from '../utils/shuffle';
import { logger } from '../utils/logger';
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
  position: 0,
  duration: 0,
  playlist: [],
  currentTrackIndex: -1,
  shouldAutoPlay: false,
  // Radio mode state
  playbackMode: 'show',
  radioQueue: [],
  radioQueueIndex: -1,
  isRadioLoading: false,
  // Shuffle mode state
  shuffleQueue: [],
  shuffleQueueIndex: -1,
  shuffleType: null,
  isShuffleLoading: false,
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
      const nextShuffleIndex = state.shuffleQueueIndex + 1;
      if (nextShuffleIndex < state.shuffleQueue.length) {
        return {
          ...state,
          shuffleQueueIndex: nextShuffleIndex,
          isShuffleLoading: true,
        };
      }
      // Queue exhausted - will be handled by the effect to reshuffle
      return {
        ...state,
        shuffleQueueIndex: -1, // Signal to reshuffle
        isShuffleLoading: true,
      };

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
  // Shuffle mode functions
  startShuffleSongs: (songs: ShuffleSongItem[]) => Promise<void>;
  startShuffleShows: (shows: GratefulDeadShow[]) => Promise<void>;
  stopShuffle: () => Promise<void>;
  isShuffleMode: boolean;
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
        logger.player.warn('Failed to start video downloads:', e);
      }
    });
  }, []);

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
            logger.player.error('Auto-play failed:', error.message);
          });
        }
      }).catch((error) => {
        logger.player.error('Track load failed:', error.message);
        dispatch({ type: 'SET_LOADING', isLoading: false });
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
      } else if (playbackState === 'stopped' || playbackState === 'idle' || playbackState === 'ended') {
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
      const showDetail = await archiveApi.getShowDetail(nextShow.primaryIdentifier);

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

  // Refs to track state for 50% play count threshold checking without re-subscribing
  const currentTrackRef = useRef(state.currentTrack);
  const currentShowRef = useRef(state.currentShow);
  const isPlayingRef = useRef(state.isPlaying);
  const currentTrackIndexRef = useRef(state.currentTrackIndex);
  const playlistLengthRef = useRef(state.playlist.length);
  const hasTriggeredEndOfShowRef = useRef(false);

  // Keep refs in sync with state
  useEffect(() => {
    currentTrackRef.current = state.currentTrack;
    currentShowRef.current = state.currentShow;
    isPlayingRef.current = state.isPlaying;
    currentTrackIndexRef.current = state.currentTrackIndex;
    playlistLengthRef.current = state.playlist.length;
  }, [state.currentTrack, state.currentShow, state.isPlaying, state.currentTrackIndex, state.playlist.length]);

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
            currentShowRef.current.identifier,
            currentShowRef.current.date
          );
        }

        // Check for end of last track in shuffle shows mode
        // Trigger next show when we're within 1 second of the end
        const isLastTrack = playlistLengthRef.current > 0 &&
                            currentTrackIndexRef.current === playlistLengthRef.current - 1;
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
  }, [progressAnim, recordTrackPlay]);

  const loadTrack = useCallback(async (track: Track, show: ShowDetail, playlist: Track[]) => {
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
  }, [state.playbackMode]);

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
      // In shuffle songs mode, manually advance to next shuffled song
      if (state.playbackMode === 'shuffle' && state.shuffleType === 'songs') {
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
      await audioService.skipToNext();
    } catch (error) {
      logger.player.error('Skip to next failed:', error instanceof Error ? error.message : 'Unknown error');
    }
  }, [state.playbackMode, state.shuffleType]);

  const previousTrack = useCallback(async () => {
    try {
      // In shuffle songs mode, restart current song or go to previous
      if (state.playbackMode === 'shuffle' && state.shuffleType === 'songs') {
        // If we're more than 3 seconds in, restart the current song
        if (progressRef.current.position > 3000) {
          await audioService.seekTo(0);
        } else {
          // Go to previous song in shuffle queue
          shufflePreviousRef.current();
        }
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
      const showDetail = await archiveApi.getShowDetail(song.showIdentifier, false);

      // Find the matching track
      const track = showDetail.tracks.find(t => t.id === song.trackId);

      if (track) {
        // Set up native player with just this track (not the full show playlist)
        const nativeTrack = {
          id: track.id,
          url: track.streamUrl,
          title: track.title,
          artist: showDetail.venue || 'Grateful Dead',
          duration: track.duration,
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
  }, []);

  // Helper to load and play a show from shuffle queue
  const loadShuffleShow = useCallback(async (show: GratefulDeadShow) => {
    try {
      dispatch({ type: 'SET_SHUFFLE_LOADING', isLoading: true });

      // Fetch the show details
      const showDetail = await archiveApi.getShowDetail(show.primaryIdentifier);

      if (showDetail.tracks.length > 0) {
        // Set up native player queue with all tracks
        const nativeTracks = showDetail.tracks.map(t => ({
          id: t.id,
          url: t.streamUrl,
          title: t.title,
          artist: showDetail.venue || 'Grateful Dead',
          duration: t.duration,
        }));

        await nativeAudioPlayer.setQueue(nativeTracks, 0);

        // Store playlist length in ref for skip detection
        shuffleShowPlaylistLengthRef.current = showDetail.tracks.length;

        // Update state
        dispatch({ type: 'LOAD_TRACK', track: showDetail.tracks[0], show: showDetail, playlist: showDetail.tracks });
        dispatch({ type: 'SET_SHUFFLE_LOADING', isLoading: false });

        // Start playback
        await nativeAudioPlayer.play();
        dispatch({ type: 'PLAY' });
      } else {
        logger.player.error('No tracks in show:', show.primaryIdentifier);
        dispatch({ type: 'SET_SHUFFLE_LOADING', isLoading: false });
      }
    } catch (error) {
      logger.player.error('Failed to load shuffle show:', error);
      dispatch({ type: 'SET_SHUFFLE_LOADING', isLoading: false });
    }
  }, []);

  // Start shuffle mode for songs
  const startShuffleSongs = useCallback(async (songs: ShuffleSongItem[]) => {
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

      // Start shuffle mode
      dispatch({ type: 'START_SHUFFLE', shuffleType: 'songs', queue: shuffledSongs });

      // Load and play the first song
      await loadShuffleSong(shuffledSongs[0]);
    } catch (error) {
      logger.player.error('Failed to start shuffle songs:', error);
      dispatch({ type: 'STOP_SHUFFLE' });
    }
  }, [state.playbackMode, loadShuffleSong]);

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
    if (state.shuffleType === 'songs') {
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
    if (state.shuffleType === 'songs') {
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

  // Derived values
  const isRadioMode = state.playbackMode === 'radio';
  const isShuffleMode = state.playbackMode === 'shuffle';
  const currentRadioTrack = isRadioMode && state.radioQueueIndex >= 0 && state.radioQueueIndex < state.radioQueue.length
    ? state.radioQueue[state.radioQueueIndex]
    : null;

  // Memoize context value to prevent unnecessary re-renders of consumers
  const contextValue = useMemo(() => ({
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
    startShuffleSongs,
    startShuffleShows,
    stopShuffle,
    isShuffleMode,
    isFullPlayerVisible,
    setFullPlayerVisible,
  }), [
    state,
    loadTrack,
    play,
    pause,
    stop,
    nextTrack,
    previousTrack,
    seekTo,
    progressAnim,
    startRadio,
    stopRadio,
    isRadioMode,
    currentRadioTrack,
    startShuffleSongs,
    startShuffleShows,
    stopShuffle,
    isShuffleMode,
    isFullPlayerVisible,
  ]);

  return (
    <PlayerContext.Provider value={contextValue}>
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
