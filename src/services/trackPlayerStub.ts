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
    console.log('TrackPlayer stub: setup');
    return Promise.resolve();
  },
  async updateOptions() {
    console.log('TrackPlayer stub: updateOptions');
  },
  async add() {
    console.log('TrackPlayer stub: add');
  },
  async reset() {
    console.log('TrackPlayer stub: reset');
  },
  async play() {
    console.log('TrackPlayer stub: play');
  },
  async pause() {
    console.log('TrackPlayer stub: pause');
  },
  async stop() {
    console.log('TrackPlayer stub: stop');
  },
  async skip() {
    console.log('TrackPlayer stub: skip');
  },
  async skipToNext() {
    console.log('TrackPlayer stub: skipToNext');
  },
  async skipToPrevious() {
    console.log('TrackPlayer stub: skipToPrevious');
  },
  async seekTo() {
    console.log('TrackPlayer stub: seekTo');
  },
  async setRepeatMode() {
    console.log('TrackPlayer stub: setRepeatMode');
  },
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

export function useTrackPlayerEvents(events: any, handler: any) {
  // Stub - no-op
}

export function useProgress(updateInterval?: number) {
  return { position: 0, duration: 0, buffered: 0 };
}

export default TrackPlayer;
