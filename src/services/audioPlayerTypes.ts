export interface Track {
  id: string;
  url: string;
  title: string;
  artist?: string;
  artwork?: string;
  duration?: number;
}

export interface Progress {
  position: number;
  duration: number;
  buffered: number;
}

export enum State {
  None = 'none',
  Ready = 'ready',
  Playing = 'playing',
  Paused = 'paused',
  Stopped = 'stopped',
  Buffering = 'buffering',
}

export enum Event {
  PlaybackState = 'playback-state',
  PlaybackTrackChanged = 'playback-track-changed',
  PlaybackProgress = 'playback-progress',
  PlaybackError = 'playback-error',
  PlaybackQueueEnded = 'playback-queue-ended',
  CastStateChanged = 'cast-state-changed',
  CastDeviceConnected = 'cast-device-connected',
  CastDeviceDisconnected = 'cast-device-disconnected',
}

export type CastState = 'NO_DEVICES' | 'NOT_CONNECTED' | 'CONNECTING' | 'CONNECTED';

export interface PlaybackStateEventData {
  state: string;
}

export interface PlaybackTrackChangedEventData {
  trackIndex?: number;
}

export interface PlaybackProgressEventData {
  position: number;
  duration: number;
}

export interface PlaybackErrorEventData {
  error: string;
}

export interface PlaybackQueueEndedEventData {}

export interface CastStateChangedEventData {
  state: CastState;
}

export interface CastDeviceConnectedEventData {
  deviceName: string;
}

export interface CastDeviceDisconnectedEventData {}

export type EventData =
  | PlaybackStateEventData
  | PlaybackTrackChangedEventData
  | PlaybackProgressEventData
  | PlaybackErrorEventData
  | PlaybackQueueEndedEventData
  | CastStateChangedEventData
  | CastDeviceConnectedEventData
  | CastDeviceDisconnectedEventData;

export interface NativeAudioPlayerInterface {
  setupPlayer(): Promise<void>;
  play(): Promise<void>;
  pause(): Promise<void>;
  stop(): Promise<void>;
  seekTo(position: number): Promise<void>;
  skipToNext(): Promise<void>;
  skipToPrevious(): Promise<void>;
  setQueue(tracks: Track[], startIndex?: number): Promise<void>;
  addTrack(track: Track): Promise<void>;
  getState(): Promise<State>;
  getProgress(): Promise<Progress>;
  reset(): Promise<void>;
  refreshAudioSession(): Promise<void>;
  getCastState(): Promise<CastState>;
  showCastDialog(): Promise<void>;

  addEventListener(event: Event.PlaybackState, handler: (data: PlaybackStateEventData) => void): { remove: () => void };
  addEventListener(event: Event.PlaybackTrackChanged, handler: (data: PlaybackTrackChangedEventData) => void): { remove: () => void };
  addEventListener(event: Event.PlaybackProgress, handler: (data: PlaybackProgressEventData) => void): { remove: () => void };
  addEventListener(event: Event.PlaybackError, handler: (data: PlaybackErrorEventData) => void): { remove: () => void };
  addEventListener(event: Event.PlaybackQueueEnded, handler: (data: PlaybackQueueEndedEventData) => void): { remove: () => void };
  addEventListener(event: Event.CastStateChanged, handler: (data: CastStateChangedEventData) => void): { remove: () => void };
  addEventListener(event: Event.CastDeviceConnected, handler: (data: CastDeviceConnectedEventData) => void): { remove: () => void };
  addEventListener(event: Event.CastDeviceDisconnected, handler: (data: CastDeviceDisconnectedEventData) => void): { remove: () => void };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  addEventListener(event: Event, handler: (data: any) => void): { remove: () => void };

  removeAllListeners(): void;
}
