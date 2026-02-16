import { NativeModules, NativeEventEmitter, Platform } from 'react-native';

const { AudioPlayerModule } = NativeModules;

if (!AudioPlayerModule) {
  throw new Error('AudioPlayerModule native module is not available');
}

const eventEmitter = new NativeEventEmitter(AudioPlayerModule);

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

// Event data types for type-safe event handling
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

// Empty for queue ended event
export interface PlaybackQueueEndedEventData {}

// Cast event data types
export interface CastStateChangedEventData {
  state: CastState;
}

export interface CastDeviceConnectedEventData {
  deviceName: string;
}

export interface CastDeviceDisconnectedEventData {}

// Union type for all event data
export type EventData =
  | PlaybackStateEventData
  | PlaybackTrackChangedEventData
  | PlaybackProgressEventData
  | PlaybackErrorEventData
  | PlaybackQueueEndedEventData
  | CastStateChangedEventData
  | CastDeviceConnectedEventData
  | CastDeviceDisconnectedEventData;

class NativeAudioPlayer {
  async setupPlayer(): Promise<void> {
    return AudioPlayerModule.setupPlayer();
  }

  async play(): Promise<void> {
    return AudioPlayerModule.play();
  }

  async pause(): Promise<void> {
    return AudioPlayerModule.pause();
  }

  async stop(): Promise<void> {
    return AudioPlayerModule.stop();
  }

  async seekTo(position: number): Promise<void> {
    return AudioPlayerModule.seekTo(position);
  }

  async skipToNext(): Promise<void> {
    return AudioPlayerModule.skipToNext();
  }

  async skipToPrevious(): Promise<void> {
    return AudioPlayerModule.skipToPrevious();
  }

  async setQueue(tracks: Track[], startIndex?: number): Promise<void> {
    return AudioPlayerModule.setQueue(tracks, startIndex ?? 0);
  }

  async addTrack(track: Track): Promise<void> {
    return AudioPlayerModule.addTrack(track);
  }

  async getState(): Promise<State> {
    const state = await AudioPlayerModule.getState();
    return state as State;
  }

  async getProgress(): Promise<Progress> {
    return AudioPlayerModule.getProgress();
  }

  async reset(): Promise<void> {
    return AudioPlayerModule.reset();
  }

  async refreshAudioSession(): Promise<void> {
    return AudioPlayerModule.refreshAudioSession();
  }

  // Cast methods (Android only)
  async getCastState(): Promise<CastState> {
    if (Platform.OS !== 'android') {
      return 'NO_DEVICES';
    }
    return AudioPlayerModule.getCastState();
  }

  async showCastDialog(): Promise<void> {
    if (Platform.OS !== 'android') {
      return;
    }
    return AudioPlayerModule.showCastDialog();
  }

  // Overloaded addEventListener for type-safe event handling
  addEventListener(event: Event.PlaybackState, handler: (data: PlaybackStateEventData) => void): { remove: () => void };
  addEventListener(event: Event.PlaybackTrackChanged, handler: (data: PlaybackTrackChangedEventData) => void): { remove: () => void };
  addEventListener(event: Event.PlaybackProgress, handler: (data: PlaybackProgressEventData) => void): { remove: () => void };
  addEventListener(event: Event.PlaybackError, handler: (data: PlaybackErrorEventData) => void): { remove: () => void };
  addEventListener(event: Event.PlaybackQueueEnded, handler: (data: PlaybackQueueEndedEventData) => void): { remove: () => void };
  addEventListener(event: Event.CastStateChanged, handler: (data: CastStateChangedEventData) => void): { remove: () => void };
  addEventListener(event: Event.CastDeviceConnected, handler: (data: CastDeviceConnectedEventData) => void): { remove: () => void };
  addEventListener(event: Event.CastDeviceDisconnected, handler: (data: CastDeviceDisconnectedEventData) => void): { remove: () => void };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  addEventListener(event: Event, handler: (data: any) => void): { remove: () => void } {
    const subscription = eventEmitter.addListener(event, handler);
    return subscription;
  }

  removeAllListeners() {
    Object.values(Event).forEach(eventName => {
      eventEmitter.removeAllListeners(eventName);
    });
  }
}

export const nativeAudioPlayer = new NativeAudioPlayer();
export default nativeAudioPlayer;
