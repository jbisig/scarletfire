import TrackPlayer, {
  AppKilledPlaybackBehavior,
  Capability,
  RepeatMode,
  IOSCategory,
  IOSCategoryMode,
} from 'react-native-track-player';

/**
 * Setup function for react-native-track-player
 * This must be registered in index.js before the app starts
 */
export async function setupPlayer() {
  try {
    await TrackPlayer.setupPlayer({
      autoHandleInterruptions: true,
      iosCategory: IOSCategory.Playback,
      iosCategoryMode: IOSCategoryMode.Default,
      waitForBuffer: true,
    });

    await TrackPlayer.updateOptions({
      // Stop playback when app is closed
      android: {
        appKilledPlaybackBehavior: AppKilledPlaybackBehavior.StopPlaybackAndRemoveNotification,
      },

      // Capabilities that will be enabled
      capabilities: [
        Capability.Play,
        Capability.Pause,
        Capability.SkipToNext,
        Capability.SkipToPrevious,
        Capability.SeekTo,
      ],

      // Capabilities that will be shown even when unavailable
      compactCapabilities: [
        Capability.Play,
        Capability.Pause,
        Capability.SkipToNext,
      ],

      // Notification metadata
      notificationCapabilities: [
        Capability.Play,
        Capability.Pause,
        Capability.SkipToNext,
        Capability.SkipToPrevious,
      ],

      progressUpdateEventInterval: 1,
    });

    console.log('TrackPlayer setup complete');
  } catch (error) {
    console.error('TrackPlayer setup failed:', error);
    throw error;
  }
}

/**
 * Playback service for handling remote events (lock screen, headphones, etc.)
 * This must be registered in index.js
 */
export async function PlaybackService() {
  TrackPlayer.addEventListener('remote-play', () => TrackPlayer.play());
  TrackPlayer.addEventListener('remote-pause', () => TrackPlayer.pause());
  TrackPlayer.addEventListener('remote-next', () => TrackPlayer.skipToNext());
  TrackPlayer.addEventListener('remote-previous', () => TrackPlayer.skipToPrevious());
  TrackPlayer.addEventListener('remote-seek', ({ position }) => TrackPlayer.seekTo(position));
}
