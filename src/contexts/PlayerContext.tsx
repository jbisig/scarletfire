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
      console.log('[REDUCER] LOAD_TRACK:', action.track.title, 'index:', trackIndex, 'shouldAutoPlay: true');
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
      console.log('[REDUCER] PLAY');
      return { ...state, isPlaying: true };

    case 'PAUSE':
      console.log('[REDUCER] PAUSE - setting shouldAutoPlay to false');
      return { ...state, isPlaying: false, shouldAutoPlay: false };

    case 'STOP':
      console.log('[REDUCER] STOP');
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
      console.log('[REDUCER] NEXT_TRACK - currentIndex:', state.currentTrackIndex, 'nextIndex:', nextIndex, 'playlist length:', state.playlist.length);
      if (nextIndex < state.playlist.length) {
        console.log('[REDUCER] NEXT_TRACK - Loading:', state.playlist[nextIndex].title, 'shouldAutoPlay: true');
        return {
          ...state,
          currentTrack: state.playlist[nextIndex],
          currentTrackIndex: nextIndex,
          isLoading: true,
          shouldAutoPlay: true
        };
      }
      console.log('[REDUCER] NEXT_TRACK - No more tracks in playlist');
      return state;

    case 'PREVIOUS_TRACK':
      const prevIndex = state.currentTrackIndex - 1;
      console.log('[REDUCER] PREVIOUS_TRACK - currentIndex:', state.currentTrackIndex, 'prevIndex:', prevIndex);
      if (prevIndex >= 0) {
        console.log('[REDUCER] PREVIOUS_TRACK - Loading:', state.playlist[prevIndex].title, 'shouldAutoPlay: true');
        return {
          ...state,
          currentTrack: state.playlist[prevIndex],
          currentTrackIndex: prevIndex,
          isLoading: true,
          shouldAutoPlay: true
        };
      }
      console.log('[REDUCER] PREVIOUS_TRACK - Already at first track');
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
    console.log('[EFFECT] useEffect triggered');
    console.log('[EFFECT] currentTrack:', state.currentTrack?.title);
    console.log('[EFFECT] isLoading:', state.isLoading);
    console.log('[EFFECT] shouldAutoPlay:', state.shouldAutoPlay);

    if (state.currentTrack && state.isLoading) {
      console.log('=== [EFFECT] Starting track load ===');
      console.log('[EFFECT] Track:', state.currentTrack.title);
      console.log('[EFFECT] isPlaying:', state.isPlaying);
      console.log('[EFFECT] currentTrackIndex:', state.currentTrackIndex);

      const trackId = state.currentTrack.id; // Capture track ID
      const shouldPlay = state.shouldAutoPlay; // Capture current value
      currentLoadingTrackIdRef.current = trackId;

      audioService.loadTrack(
        state.currentTrack,
        (status: AVPlaybackStatus) => {
          // If we're already advancing tracks, ignore callbacks from the old track
          if (isAdvancingTrackRef.current) {
            console.log('[CALLBACK] Ignoring callback - already advancing to next track');
            return;
          }

          // Auto-advance to next track when current track finishes
          if (status.isLoaded && status.didJustFinish) {
            console.log('=== [CALLBACK] Track finished! ===');
            console.log('[CALLBACK] Setting advancing flag and dispatching NEXT_TRACK');
            isAdvancingTrackRef.current = true;
            dispatch({ type: 'NEXT_TRACK' });
            return;
          }

          dispatch({ type: 'UPDATE_STATUS', status });
        }
      ).then(() => {
        console.log('[EFFECT] Resetting advancing flag');
        isAdvancingTrackRef.current = false;
        console.log('=== [EFFECT] Track loaded successfully ===');
        console.log('[EFFECT] Loaded track ID:', trackId, 'Current track ID:', state.currentTrack?.id);

        // Only play if we're still on the same track
        if (currentLoadingTrackIdRef.current !== trackId) {
          console.log('[EFFECT] Track changed during load, skipping play');
          return;
        }

        console.log('[EFFECT] shouldPlay (captured):', shouldPlay);
        if (shouldPlay) {
          console.log('[EFFECT] Calling audioService.play()...');
          audioService.play().then(() => {
            console.log('[EFFECT] audioService.play() succeeded');
            dispatch({ type: 'PLAY' });
          }).catch((error) => {
            console.error('[EFFECT] audioService.play() FAILED:', error);
          });
        } else {
          console.log('[EFFECT] Skipping auto-play (shouldPlay is false)');
        }
      }).catch((error) => {
        console.error('[EFFECT] Load track FAILED:', error);
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
