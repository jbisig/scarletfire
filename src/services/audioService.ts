import { Audio, AVPlaybackStatus } from 'expo-av';
import { Track } from '../types/show.types';

/**
 * Service for managing audio playback using Expo AV
 * Handles loading, playing, pausing, and seeking audio tracks
 */
class AudioService {
  private sound: Audio.Sound | null = null;
  private onStatusUpdate?: (status: AVPlaybackStatus) => void;

  /**
   * Initialize audio mode for background playback
   */
  async initialize(): Promise<void> {
    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
      });
    } catch (error) {
      throw new Error(`Failed to initialize audio: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Load a track for playback
   * @param track Track to load
   * @param onStatusUpdate Optional callback for playback status updates
   */
  async loadTrack(track: Track, onStatusUpdate?: (status: AVPlaybackStatus) => void): Promise<Audio.Sound> {
    try {
      // Unload previous track if exists
      if (this.sound) {
        await this.sound.unloadAsync();
        this.sound = null;
      }

      this.onStatusUpdate = onStatusUpdate;

      const { sound } = await Audio.Sound.createAsync(
        { uri: track.streamUrl },
        { shouldPlay: false },
        this.handlePlaybackStatusUpdate
      );

      this.sound = sound;
      return sound;
    } catch (error) {
      throw new Error(`Failed to load track: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Play the currently loaded track
   */
  async play(): Promise<void> {
    if (!this.sound) {
      throw new Error('No track loaded');
    }

    try {
      await this.sound.playAsync();
    } catch (error) {
      throw new Error(`Failed to play track: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Pause the currently playing track
   */
  async pause(): Promise<void> {
    if (!this.sound) {
      throw new Error('No track loaded');
    }

    try {
      await this.sound.pauseAsync();
    } catch (error) {
      throw new Error(`Failed to pause track: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Stop and unload the current track
   */
  async stop(): Promise<void> {
    if (this.sound) {
      try {
        await this.sound.stopAsync();
        await this.sound.unloadAsync();
        this.sound = null;
      } catch (error) {
        throw new Error(`Failed to stop track: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  }

  /**
   * Seek to a specific position in the track
   * @param positionMillis Position in milliseconds
   */
  async seekTo(positionMillis: number): Promise<void> {
    if (!this.sound) {
      throw new Error('No track loaded');
    }

    try {
      await this.sound.setPositionAsync(positionMillis);
    } catch (error) {
      throw new Error(`Failed to seek: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Set playback rate
   * @param rate Playback rate (1.0 is normal speed)
   */
  async setRate(rate: number): Promise<void> {
    if (!this.sound) {
      throw new Error('No track loaded');
    }

    try {
      await this.sound.setRateAsync(rate, true);
    } catch (error) {
      throw new Error(`Failed to set rate: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get the current sound instance
   */
  getSound(): Audio.Sound | null {
    return this.sound;
  }

  /**
   * Internal handler for playback status updates
   */
  private handlePlaybackStatusUpdate = (status: AVPlaybackStatus): void => {
    if (this.onStatusUpdate) {
      this.onStatusUpdate(status);
    }
  };
}

export const audioService = new AudioService();
