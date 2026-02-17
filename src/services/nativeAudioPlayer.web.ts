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

// Simple EventEmitter for web
type EventHandler = (data: any) => void; // eslint-disable-line @typescript-eslint/no-explicit-any

class SimpleEventEmitter {
  private listeners: Map<string, Set<EventHandler>> = new Map();

  addListener(event: string, handler: EventHandler): { remove: () => void } {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler);
    return {
      remove: () => {
        this.listeners.get(event)?.delete(handler);
      },
    };
  }

  emit(event: string, data: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
    this.listeners.get(event)?.forEach(handler => {
      try {
        handler(data);
      } catch (e) {
        console.error(`Error in event handler for ${event}:`, e);
      }
    });
  }

  removeAllListeners(event: string) {
    this.listeners.delete(event);
  }
}

class NativeAudioPlayer {
  private audio: HTMLAudioElement | null = null;
  private preloadAudio: HTMLAudioElement | null = null;
  private queue: Track[] = [];
  private currentIndex: number = -1;
  private currentState: State = State.None;
  private emitter = new SimpleEventEmitter();
  private progressRAF: number | null = null;
  private lastProgressTime: number = 0;

  async setupPlayer(): Promise<void> {
    // No-op on web — Audio elements are created on demand
  }

  async play(): Promise<void> {
    if (!this.audio) return;
    try {
      await this.audio.play();
      this.setState(State.Playing);
      this.startProgressLoop();
    } catch (error) {
      this.emitter.emit(Event.PlaybackError, {
        error: error instanceof Error ? error.message : 'Playback failed',
      });
    }
  }

  async pause(): Promise<void> {
    if (!this.audio) return;
    this.audio.pause();
    this.setState(State.Paused);
    this.stopProgressLoop();
  }

  async stop(): Promise<void> {
    this.stopProgressLoop();
    if (this.audio) {
      this.audio.pause();
      this.audio.src = '';
    }
    this.setState(State.Stopped);
    this.clearMediaSession();
  }

  async seekTo(position: number): Promise<void> {
    if (!this.audio) return;
    this.audio.currentTime = position;
  }

  async skipToNext(): Promise<void> {
    if (this.currentIndex < this.queue.length - 1) {
      this.currentIndex++;
      await this.loadCurrentTrack(true);
      this.emitter.emit(Event.PlaybackTrackChanged, { trackIndex: this.currentIndex });
    } else {
      // Queue ended
      this.emitter.emit(Event.PlaybackQueueEnded, {});
    }
  }

  async skipToPrevious(): Promise<void> {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      await this.loadCurrentTrack(true);
      this.emitter.emit(Event.PlaybackTrackChanged, { trackIndex: this.currentIndex });
    }
  }

  async setQueue(tracks: Track[], startIndex?: number): Promise<void> {
    this.queue = [...tracks];
    this.currentIndex = startIndex ?? 0;
    if (this.queue.length > 0) {
      await this.loadCurrentTrack(false);
      this.preloadNext();
    }
  }

  async addTrack(track: Track): Promise<void> {
    this.queue.push(track);
    // If this is the first track added after empty queue, preload it
    if (this.queue.length === 1 && this.currentIndex === -1) {
      this.currentIndex = 0;
      await this.loadCurrentTrack(false);
    }
  }

  async getState(): Promise<State> {
    return this.currentState;
  }

  async getProgress(): Promise<Progress> {
    if (!this.audio) {
      return { position: 0, duration: 0, buffered: 0 };
    }
    const buffered = this.audio.buffered.length > 0
      ? this.audio.buffered.end(this.audio.buffered.length - 1)
      : 0;
    return {
      position: this.audio.currentTime || 0,
      duration: this.audio.duration || 0,
      buffered,
    };
  }

  async reset(): Promise<void> {
    await this.stop();
    this.queue = [];
    this.currentIndex = -1;
    this.currentState = State.None;
  }

  async refreshAudioSession(): Promise<void> {
    // No-op on web
  }

  async getCastState(): Promise<CastState> {
    return 'NO_DEVICES';
  }

  async showCastDialog(): Promise<void> {
    // No-op on web
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
    return this.emitter.addListener(event, handler);
  }

  removeAllListeners() {
    Object.values(Event).forEach(eventName => {
      this.emitter.removeAllListeners(eventName);
    });
  }

  // --- Private helpers ---

  private setState(state: State) {
    this.currentState = state;
    this.emitter.emit(Event.PlaybackState, { state });
  }

  private async loadCurrentTrack(autoPlay: boolean): Promise<void> {
    const track = this.queue[this.currentIndex];
    if (!track) return;

    this.stopProgressLoop();
    this.setState(State.Buffering);

    // Reuse or create audio element
    if (!this.audio) {
      this.audio = new Audio();
      this.setupAudioListeners(this.audio);
    }

    this.audio.src = track.url;
    this.audio.load();
    this.updateMediaSession(track);

    if (autoPlay) {
      try {
        await this.audio.play();
        this.setState(State.Playing);
        this.startProgressLoop();
      } catch (error) {
        this.emitter.emit(Event.PlaybackError, {
          error: error instanceof Error ? error.message : 'Playback failed',
        });
      }
    } else {
      this.setState(State.Ready);
    }
  }

  private setupAudioListeners(audio: HTMLAudioElement) {
    audio.addEventListener('ended', () => {
      this.stopProgressLoop();
      // Auto-advance to next track
      if (this.currentIndex < this.queue.length - 1) {
        this.currentIndex++;
        this.loadCurrentTrack(true);
        this.emitter.emit(Event.PlaybackTrackChanged, { trackIndex: this.currentIndex });
      } else {
        this.emitter.emit(Event.PlaybackQueueEnded, {});
      }
    });

    audio.addEventListener('error', () => {
      const errorMsg = audio.error?.message || 'Unknown audio error';
      this.emitter.emit(Event.PlaybackError, { error: errorMsg });
    });

    audio.addEventListener('waiting', () => {
      if (this.currentState === State.Playing) {
        this.setState(State.Buffering);
      }
    });

    audio.addEventListener('playing', () => {
      if (this.currentState === State.Buffering) {
        this.setState(State.Playing);
      }
    });
  }

  private preloadNext() {
    const nextIndex = this.currentIndex + 1;
    if (nextIndex >= this.queue.length) return;

    const nextTrack = this.queue[nextIndex];
    if (!nextTrack) return;

    // Create or reuse preload element
    if (!this.preloadAudio) {
      this.preloadAudio = new Audio();
    }
    this.preloadAudio.src = nextTrack.url;
    this.preloadAudio.preload = 'auto';
    this.preloadAudio.load();
  }

  private startProgressLoop() {
    this.stopProgressLoop();
    const loop = () => {
      if (!this.audio) return;
      const now = performance.now();
      // Emit progress at ~250ms intervals
      if (now - this.lastProgressTime >= 250) {
        this.lastProgressTime = now;
        this.emitter.emit(Event.PlaybackProgress, {
          position: this.audio.currentTime || 0,
          duration: this.audio.duration || 0,
        });
      }
      this.progressRAF = requestAnimationFrame(loop);
    };
    this.progressRAF = requestAnimationFrame(loop);
  }

  private stopProgressLoop() {
    if (this.progressRAF !== null) {
      cancelAnimationFrame(this.progressRAF);
      this.progressRAF = null;
    }
  }

  private updateMediaSession(track: Track) {
    if (!('mediaSession' in navigator)) return;

    navigator.mediaSession.metadata = new MediaMetadata({
      title: track.title,
      artist: track.artist || 'Grateful Dead',
      artwork: track.artwork
        ? [{ src: track.artwork, sizes: '512x512', type: 'image/png' }]
        : [],
    });

    navigator.mediaSession.setActionHandler('play', () => this.play());
    navigator.mediaSession.setActionHandler('pause', () => this.pause());
    navigator.mediaSession.setActionHandler('previoustrack', () => this.skipToPrevious());
    navigator.mediaSession.setActionHandler('nexttrack', () => this.skipToNext());
    navigator.mediaSession.setActionHandler('seekto', (details) => {
      if (details.seekTime !== undefined) {
        this.seekTo(details.seekTime);
      }
    });
  }

  private clearMediaSession() {
    if (!('mediaSession' in navigator)) return;
    navigator.mediaSession.metadata = null;
    navigator.mediaSession.setActionHandler('play', null);
    navigator.mediaSession.setActionHandler('pause', null);
    navigator.mediaSession.setActionHandler('previoustrack', null);
    navigator.mediaSession.setActionHandler('nexttrack', null);
  }
}

export const nativeAudioPlayer = new NativeAudioPlayer();
export default nativeAudioPlayer;
