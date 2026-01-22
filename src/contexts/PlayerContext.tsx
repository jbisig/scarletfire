import React, { createContext, useReducer, useContext, useEffect, useRef, useState } from 'react';
import nativeAudioPlayer, { State, Event } from '../services/nativeAudioPlayer';
import { PlayerState, PlayerAction } from '../types/player.types';
import { Track, ShowDetail } from '../types/show.types';
import { audioService } from '../services/audioService';
import { usePlayCounts } from './PlayCountsContext';

const initialState: PlayerState = {
  currentTrack: null,
  currentShow: null,
  isPlaying: false,
  isLoading: false,
  position: 0,
  duration: 0,
  playlist: [],
  currentTrackIndex: -1,
  shouldAutoPlay: false
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
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(playerReducer, initialState);
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
      // Sync React state to the track index from native player
      if (event.trackIndex !== undefined) {
        dispatch({ type: 'SYNC_TRACK_INDEX', index: event.trackIndex });
      } else {
        dispatch({ type: 'NEXT_TRACK' });
      }
    });

    return () => subscription.remove();
  }, []);

  // Listen to queue end event (all tracks finished)
  useEffect(() => {
    const subscription = nativeAudioPlayer.addEventListener(Event.PlaybackQueueEnded, () => {
      dispatch({ type: 'STOP' });
    });

    return () => subscription.remove();
  }, []);

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
        seekTo
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
