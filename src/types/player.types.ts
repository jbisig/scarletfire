import { Track, ShowDetail } from './show.types';
import { RatedSongPerformance } from '../data/songPerformanceRatings';

export type PlaybackMode = 'show' | 'radio';

export interface RadioTrack {
  track: Track;
  show: ShowDetail;
  performance: RatedSongPerformance;
}

export interface PlayerState {
  currentTrack: Track | null;
  currentShow: ShowDetail | null;
  isPlaying: boolean;
  isLoading: boolean;
  position: number; // milliseconds
  duration: number; // milliseconds
  playlist: Track[];
  currentTrackIndex: number;
  shouldAutoPlay: boolean;
  // Radio mode state
  playbackMode: PlaybackMode;
  radioQueue: RadioTrack[];
  radioQueueIndex: number;
  isRadioLoading: boolean;
}

export type PlayerAction =
  | { type: 'LOAD_TRACK'; track: Track; show: ShowDetail; playlist: Track[] }
  | { type: 'PLAY' }
  | { type: 'PAUSE' }
  | { type: 'STOP' }
  | { type: 'UPDATE_POSITION'; position: number; duration: number }
  | { type: 'SET_LOADING'; isLoading: boolean }
  | { type: 'NEXT_TRACK' }
  | { type: 'PREVIOUS_TRACK' }
  | { type: 'SEEK'; position: number }
  | { type: 'SYNC_TRACK_INDEX'; index: number }
  // Radio mode actions
  | { type: 'START_RADIO' }
  | { type: 'STOP_RADIO' }
  | { type: 'SET_RADIO_LOADING'; isLoading: boolean }
  | { type: 'ADD_RADIO_TRACKS'; tracks: RadioTrack[] }
  | { type: 'RADIO_NEXT_TRACK' }
  | { type: 'RADIO_PREVIOUS_TRACK' }
  | { type: 'SYNC_RADIO_TRACK_INDEX'; index: number };
