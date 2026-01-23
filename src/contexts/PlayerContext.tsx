import React, { createContext, useReducer, useContext, useEffect, useRef, useState } from 'react';
import nativeAudioPlayer, { State, Event } from '../services/nativeAudioPlayer';
import { PlayerState, PlayerAction, RadioTrack } from '../types/player.types';
import { Track, ShowDetail } from '../types/show.types';
import { audioService } from '../services/audioService';
import { usePlayCounts } from './PlayCountsContext';
import { radioService } from '../services/radioService';

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

    case 'UPDATE_POSITION':
      return {
        ...state,
        position: action.position,
        duration: action.duration,
      };

    case 'SET_LOADING':
      return { ...state, isLoading: action.isLoading };

    case 'NEXT_TRACK':
      const nextIndex = state.currentTrackIndex + 1;
      if (nextIndex < state.playlist.length) {
        return {
          ...state,
          currentTrack: state.playlist[nextIndex],
          currentTrackIndex: nextIndex,
          // Don't set isLoading - track is already in the queue
          position: 0,
          duration: 0,
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
          // Don't set isLoading - track is already in the queue
          position: 0,
          duration: 0,
        };
      }
      return state;

    case 'SEEK':
      return { ...state, position: action.position };

    case 'SYNC_TRACK_INDEX':
      // Sync to a specific track index without reloading (used by native player events)
      if (action.index >= 0 && action.index < state.playlist.length) {
        return {
          ...state,
          currentTrack: state.playlist[action.index],
          currentTrackIndex: action.index,
          position: 0,
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
        position: 0,
        duration: 0,
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
          position: 0,
          duration: 0,
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
          position: 0,
          duration: 0,
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
          position: 0,
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

  useEffect(() => {
    audioService.initialize();
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

  // Listen to track changes for gapless playback and lock screen controls
  useEffect(() => {
    const subscription = nativeAudioPlayer.addEventListener(Event.PlaybackTrackChanged, (event) => {
      // Handle radio mode vs show mode track changes
      if (state.playbackMode === 'radio') {
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
  }, [state.playbackMode]);

  // Listen to queue end event (all tracks finished)
  useEffect(() => {
    const subscription = nativeAudioPlayer.addEventListener(Event.PlaybackQueueEnded, () => {
      if (state.playbackMode === 'radio') {
        // Radio queue ended - this shouldn't happen with auto-replenish
        // but if it does, try to fetch more
        fetchMoreRadioTracks();
      } else {
        dispatch({ type: 'STOP' });
      }
    });

    return () => subscription.remove();
  }, [state.playbackMode]);

  // Radio auto-replenish: fetch more tracks when remaining <= 3
  const isReplenishingRef = useRef(false);
  useEffect(() => {
    if (
      state.playbackMode === 'radio' &&
      !state.isRadioLoading &&
      !isReplenishingRef.current &&
      state.radioQueue.length > 0
    ) {
      const remainingTracks = state.radioQueue.length - state.radioQueueIndex - 1;
      if (remainingTracks <= 3) {
        fetchMoreRadioTracks();
      }
    }
  }, [state.playbackMode, state.radioQueueIndex, state.radioQueue.length, state.isRadioLoading]);

  // Fetch more tracks for radio and add to queue
  const fetchMoreRadioTracks = async () => {
    if (isReplenishingRef.current) return;
    isReplenishingRef.current = true;

    try {
      dispatch({ type: 'SET_RADIO_LOADING', isLoading: true });
      const newTracks = await radioService.getRandomTracks(10);

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
      dispatch({ type: 'SET_RADIO_LOADING', isLoading: false });
      isReplenishingRef.current = false;
    }
  };

  // Update position and duration from native audio player progress events
  useEffect(() => {
    const subscription = nativeAudioPlayer.addEventListener(Event.PlaybackProgress, (data) => {
      const position = data.position * 1000; // Convert seconds to milliseconds
      const duration = data.duration * 1000;
      dispatch({ type: 'UPDATE_POSITION', position, duration });
    });

    return () => subscription.remove();
  }, []);

  // Reset recording flag when track changes
  useEffect(() => {
    hasRecordedPlayRef.current = false;
  }, [state.currentTrack?.id, state.currentShow?.identifier]);

  // Monitor playback progress for 50% threshold
  useEffect(() => {
    if (
      !hasRecordedPlayRef.current &&
      state.isPlaying &&
      state.currentTrack &&
      state.currentShow &&
      state.duration > 0 &&
      state.position >= state.duration * 0.5
    ) {
      // Record the play (reached 50% threshold)
      hasRecordedPlayRef.current = true;
      recordTrackPlay(
        state.currentTrack.title,
        state.currentShow.identifier,
        state.currentShow.date
      );
    }
  }, [state.position, state.duration, state.isPlaying, state.currentTrack, state.currentShow, recordTrackPlay]);

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
      dispatch({ type: 'SEEK', position });
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
      radioService.resetSession();

      // Fetch initial batch of tracks
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

      // Open the full player
      setFullPlayerVisible(true);
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
