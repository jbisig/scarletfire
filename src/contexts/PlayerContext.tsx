import React, { createContext, useReducer, useContext, useEffect, useRef } from 'react';
import { AVPlaybackStatus } from 'expo-av';
import { PlayerState, PlayerAction } from '../types/player.types';
import { Track, ShowDetail } from '../types/show.types';
import { audioService } from '../services/audioService';

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
      return { ...state, isPlaying: true };

    case 'PAUSE':
      return { ...state, isPlaying: false, shouldAutoPlay: false };

    case 'STOP':
      return initialState;

    case 'UPDATE_STATUS':
      if (!action.status.isLoaded) return state;

      return {
        ...state,
        isLoading: false,
        position: action.status.positionMillis || 0,
        duration: action.status.durationMillis || 0,
        isPlaying: action.status.isPlaying
      };

    case 'NEXT_TRACK':
      const nextIndex = state.currentTrackIndex + 1;
      if (nextIndex < state.playlist.length) {
        return {
          ...state,
          currentTrack: state.playlist[nextIndex],
          currentTrackIndex: nextIndex,
          isLoading: true,
          shouldAutoPlay: true
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
          isLoading: true,
          shouldAutoPlay: true
        };
      }
      return state;

    case 'SEEK':
      return { ...state, position: action.position };

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
  const isAdvancingTrackRef = useRef(false);
  const currentLoadingTrackIdRef = useRef<string | null>(null);

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
        (status: AVPlaybackStatus) => {
          // Ignore callbacks from old track if we're advancing
          if (isAdvancingTrackRef.current) {
            return;
          }

          // Auto-advance to next track when current track finishes
          if (status.isLoaded && status.didJustFinish) {
            isAdvancingTrackRef.current = true;
            dispatch({ type: 'NEXT_TRACK' });
            return;
          }

          dispatch({ type: 'UPDATE_STATUS', status });
        }
      ).then(() => {
        isAdvancingTrackRef.current = false;

        // Only play if we're still on the same track (prevent race condition)
        if (currentLoadingTrackIdRef.current !== trackId) {
          return;
        }

        if (shouldPlay) {
          audioService.play().then(() => {
            dispatch({ type: 'PLAY' });
          }).catch((error) => {
            // Error is already logged by audioService
            console.error('Auto-play failed:', error.message);
          });
        }
      }).catch((error) => {
        // Error is already logged by audioService
        console.error('Track load failed:', error.message);
      });
    }
  }, [state.currentTrack, state.isLoading, state.shouldAutoPlay]);

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

  const nextTrack = () => {
    dispatch({ type: 'NEXT_TRACK' });
  };

  const previousTrack = () => {
    dispatch({ type: 'PREVIOUS_TRACK' });
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
