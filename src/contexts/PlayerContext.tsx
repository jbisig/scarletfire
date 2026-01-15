import React, { createContext, useReducer, useContext, useEffect } from 'react';
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

  useEffect(() => {
    audioService.initialize();
  }, []);

  // Auto-load track when currentTrack changes
  useEffect(() => {
    if (state.currentTrack && state.isLoading) {
      console.log('PlayerContext: Loading track', state.currentTrack.title);
      console.log('PlayerContext: shouldAutoPlay =', state.shouldAutoPlay);

      const shouldPlay = state.shouldAutoPlay; // Capture current value

      audioService.loadTrack(
        state.currentTrack,
        (status: AVPlaybackStatus) => {
          dispatch({ type: 'UPDATE_STATUS', status });

          // Auto-advance to next track when current track finishes
          if (status.isLoaded && status.didJustFinish) {
            console.log('PlayerContext: Track finished, advancing to next');
            dispatch({ type: 'NEXT_TRACK' });
          }
        }
      ).then(() => {
        console.log('PlayerContext: Track loaded, should play:', shouldPlay);
        if (shouldPlay) {
          audioService.play().then(() => {
            console.log('PlayerContext: Playing started');
            dispatch({ type: 'PLAY' });
          }).catch((error) => {
            console.error('PlayerContext: Play failed:', error);
          });
        }
      }).catch((error) => {
        console.error('PlayerContext: Load track failed:', error);
      });
    }
  }, [state.currentTrack, state.isLoading, state.shouldAutoPlay]);

  const loadTrack = async (track: Track, show: ShowDetail, playlist: Track[]) => {
    dispatch({ type: 'LOAD_TRACK', track, show, playlist });
  };

  const play = async () => {
    dispatch({ type: 'PLAY' });
    await audioService.play();
  };

  const pause = async () => {
    dispatch({ type: 'PAUSE' });
    await audioService.pause();
  };

  const stop = async () => {
    dispatch({ type: 'STOP' });
    await audioService.stop();
  };

  const nextTrack = () => {
    dispatch({ type: 'NEXT_TRACK' });
  };

  const previousTrack = () => {
    dispatch({ type: 'PREVIOUS_TRACK' });
  };

  const seekTo = async (position: number) => {
    dispatch({ type: 'SEEK', position });
    await audioService.seekTo(position);
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
