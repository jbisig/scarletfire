import { Track, ShowDetail, GratefulDeadShow } from './show.types';
import { RatedSongPerformance } from '../data/songPerformanceRatings';

export type PlaybackMode = 'show' | 'radio' | 'shuffle';
export type ShuffleType = 'shows' | 'songs' | 'playlist';

// Minimal interface for shuffle queue items (matches FavoriteSong from FavoritesContext)
export interface ShuffleSongItem {
  trackId: string;
  trackTitle: string;
  showIdentifier: string;
  showDate: string;
  venue?: string;
  streamUrl: string;
}

// Type guards for shuffle queue items
export function isShuffleSongItem(item: ShuffleSongItem | GratefulDeadShow): item is ShuffleSongItem {
  return 'trackId' in item && 'streamUrl' in item;
}

export function isGratefulDeadShow(item: ShuffleSongItem | GratefulDeadShow): item is GratefulDeadShow {
  return 'primaryIdentifier' in item && 'versions' in item;
}

export interface RadioTrack {
  track: Track;
  show: ShowDetail;
  performance: RatedSongPerformance;
}

export interface PlaybackProgress {
  position: number;
  duration: number;
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
  // Shuffle mode state
  shuffleQueue: ShuffleSongItem[] | GratefulDeadShow[];
  shuffleQueueIndex: number;
  shuffleType: ShuffleType | null;
  isShuffleLoading: boolean;
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
  | { type: 'SYNC_RADIO_TRACK_INDEX'; index: number }
  // Shuffle mode actions
  | { type: 'START_SHUFFLE'; shuffleType: ShuffleType; queue: ShuffleSongItem[] | GratefulDeadShow[] }
  | { type: 'STOP_SHUFFLE' }
  | { type: 'EXIT_SHUFFLE' }
  | { type: 'SET_SHUFFLE_LOADING'; isLoading: boolean }
  | { type: 'SHUFFLE_NEXT' }
  | { type: 'SHUFFLE_PREVIOUS' }
  | { type: 'SET_SHUFFLE_QUEUE'; queue: ShuffleSongItem[] | GratefulDeadShow[] };
