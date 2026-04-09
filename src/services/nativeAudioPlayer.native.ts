import { NativeModules, NativeEventEmitter, Platform } from 'react-native';
import {
  Track,
  Progress,
  State,
  Event,
  CastState,
  PlaybackStateEventData,
  PlaybackTrackChangedEventData,
  PlaybackProgressEventData,
  PlaybackErrorEventData,
  PlaybackQueueEndedEventData,
  CastStateChangedEventData,
  CastDeviceConnectedEventData,
  CastDeviceDisconnectedEventData,
} from './audioPlayerTypes';

// Re-export all types
export * from './audioPlayerTypes';

const { AudioPlayerModule } = NativeModules;

if (!AudioPlayerModule) {
  throw new Error('AudioPlayerModule native module is not available');
}

const eventEmitter = new NativeEventEmitter(AudioPlayerModule);

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
  addEventListener(event: Event.RemoteNextTrack, handler: () => void): { remove: () => void };
  addEventListener(event: Event.RemotePreviousTrack, handler: () => void): { remove: () => void };
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
