import { Image } from 'react-native';
import nativeAudioPlayer, { Track as NativeTrack, State } from './nativeAudioPlayer';
import { Track, ShowDetail } from '../types/show.types';

// Resolve app icon for Now Playing artwork
const appIcon = require('../../assets/icon.png');
const appIconUri = Image.resolveAssetSource(appIcon).uri;

/**
 * Convert our Track format to Native Audio Player's Track format
 */
function convertToNativeTrack(track: Track, show?: ShowDetail): NativeTrack {
  return {
    id: track.id,
    url: track.streamUrl,
    title: track.title,
    artist: show?.venue || 'Grateful Dead',
    duration: track.duration,
    artwork: appIconUri,
  };
}

/**
 * Service for managing audio playback using native iOS AVQueuePlayer
 * Handles loading, playing, pausing, and seeking audio tracks with
 * full support for lock screen controls and gapless playback
 */
class AudioService {
  private isSetup = false;
  private currentTrackId: string | null = null;

  /**
   * Initialize native audio player for background playback
   */
  async initialize(): Promise<void> {
    try {
      if (!this.isSetup) {
        await nativeAudioPlayer.setupPlayer();
        this.isSetup = true;
      }
    } catch (error) {
      console.error(`Audio initialization error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  /**
   * Load a track for playback with Now Playing metadata
   * @param track Track to load
   * @param show Show information for metadata
   * @param queue Optional full queue for gapless playback
   */
  async loadTrack(track: Track, show?: ShowDetail, queue?: Track[]): Promise<void> {
    try {
      // Ensure player is initialized
      if (!this.isSetup) {
        await this.initialize();
      }

      if (queue && queue.length > 0) {
        // Find the index of the current track in the queue
        const startIndex = queue.findIndex(t => t.id === track.id);

        // Pass the full queue and start index to native player
        const nativeTracks = queue.map(t => convertToNativeTrack(t, show));
        await nativeAudioPlayer.setQueue(nativeTracks, startIndex >= 0 ? startIndex : 0);
      } else {
        // Load single track
        const nativeTrack = convertToNativeTrack(track, show);
        await nativeAudioPlayer.setQueue([nativeTrack], 0);
      }

      this.currentTrackId = track.id;
    } catch (error) {
      throw new Error(`Failed to load track: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Add multiple tracks to the queue for gapless playback
   * @param tracks Array of tracks to add
   * @param show Show information for metadata
   */
  async addTracksToQueue(tracks: Track[], show?: ShowDetail): Promise<void> {
    try {
      const nativeTracks = tracks.map(track => convertToNativeTrack(track, show));
      await nativeAudioPlayer.setQueue(nativeTracks, 0);
    } catch (error) {
      throw new Error(`Failed to add tracks to queue: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Play the currently loaded track
   */
  async play(): Promise<void> {
    try {
      await nativeAudioPlayer.play();
    } catch (error) {
      throw new Error(`Failed to play track: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Pause the currently playing track
   */
  async pause(): Promise<void> {
    try {
      await nativeAudioPlayer.pause();
    } catch (error) {
      throw new Error(`Failed to pause track: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Stop and clear the current track
   */
  async stop(): Promise<void> {
    try {
      await nativeAudioPlayer.stop();
      this.currentTrackId = null;
    } catch (error) {
      throw new Error(`Failed to stop track: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Seek to a specific position in the track
   * @param positionMillis Position in milliseconds
   */
  async seekTo(positionMillis: number): Promise<void> {
    try {
      // Convert milliseconds to seconds for native player
      await nativeAudioPlayer.seekTo(positionMillis / 1000);
    } catch (error) {
      throw new Error(`Failed to seek: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Skip to the next track in the queue
   */
  async skipToNext(): Promise<void> {
    try {
      await nativeAudioPlayer.skipToNext();
    } catch (error) {
      throw new Error(`Failed to skip to next: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Skip to the previous track in the queue
   */
  async skipToPrevious(): Promise<void> {
    try {
      await nativeAudioPlayer.skipToPrevious();
    } catch (error) {
      throw new Error(`Failed to skip to previous: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get current playback state
   */
  async getState(): Promise<State> {
    return await nativeAudioPlayer.getState();
  }

  /**
   * Get current position in milliseconds
   */
  async getPosition(): Promise<number> {
    const progress = await nativeAudioPlayer.getProgress();
    return progress.position * 1000; // Convert seconds to milliseconds
  }

  /**
   * Get current track duration in milliseconds
   */
  async getDuration(): Promise<number> {
    const progress = await nativeAudioPlayer.getProgress();
    return progress.duration * 1000; // Convert seconds to milliseconds
  }
}

export const audioService = new AudioService();
