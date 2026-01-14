import { AVPlaybackStatus } from 'expo-av';
import { Track, ShowDetail } from './show.types';

export interface PlayerState {
  currentTrack: Track | null;
  currentShow: ShowDetail | null;
  isPlaying: boolean;
  isLoading: boolean;
  position: number; // milliseconds
  duration: number; // milliseconds
  playlist: Track[];
  currentTrackIndex: number;
}

export type PlayerAction =
  | { type: 'LOAD_TRACK'; track: Track; show: ShowDetail; playlist: Track[] }
  | { type: 'PLAY' }
  | { type: 'PAUSE' }
  | { type: 'STOP' }
  | { type: 'UPDATE_STATUS'; status: AVPlaybackStatus }
  | { type: 'NEXT_TRACK' }
  | { type: 'PREVIOUS_TRACK' }
  | { type: 'SEEK'; position: number };
