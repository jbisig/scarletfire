// Temporary stub for TrackPlayer until we implement the custom audio player
// This prevents the app from crashing when TrackPlayer is removed

export const State = {
  None: 0,
  Ready: 1,
  Playing: 2,
  Paused: 3,
  Stopped: 4,
  Buffering: 6,
  Connecting: 8,
};

export const Event = {
  PlaybackState: 'playback-state',
  PlaybackError: 'playback-error',
  PlaybackQueueEnded: 'playback-queue-ended',
  PlaybackTrackChanged: 'playback-track-changed',
};

const TrackPlayer = {
  async setupPlayer() {
    return Promise.resolve();
  },
  async updateOptions() {},
  async add() {},
  async reset() {},
  async play() {},
  async pause() {},
  async stop() {},
  async skip() {},
  async skipToNext() {},
  async skipToPrevious() {},
  async seekTo() {},
  async setRepeatMode() {},
  async getQueue() {
    return [];
  },
  async getActiveTrackIndex() {
    return null;
  },
  async getActiveTrack() {
    return null;
  },
  async getProgress() {
    return { position: 0, duration: 0, buffered: 0 };
  },
  async getPlaybackState() {
    return { state: State.None };
  },
};

export function useTrackPlayerEvents(
  _events: string[],
  _handler: (event: { type: string }) => void
): void {
  // Stub - no-op
}

export function useProgress(_updateInterval?: number) {
  return { position: 0, duration: 0, buffered: 0 };
}

export default TrackPlayer;
