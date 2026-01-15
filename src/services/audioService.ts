import { Audio, AVPlaybackStatus } from 'expo-av';
import { Track } from '../types/show.types';

class AudioService {
  private sound: Audio.Sound | null = null;
  private onStatusUpdate?: (status: AVPlaybackStatus) => void;

  async initialize() {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      shouldDuckAndroid: true,
    });
  }

  async loadTrack(track: Track, onStatusUpdate?: (status: AVPlaybackStatus) => void) {
    try {
      // Unload previous track
      if (this.sound) {
        console.log('[AUDIO SERVICE] Unloading previous track');
        await this.sound.unloadAsync();
        this.sound = null;
      }

      console.log('[AUDIO SERVICE] Setting new status update callback');
      this.onStatusUpdate = onStatusUpdate;

      console.log('[AUDIO SERVICE] Loading track:', track.title);
      console.log('[AUDIO SERVICE] Stream URL:', track.streamUrl);

      const { sound } = await Audio.Sound.createAsync(
        { uri: track.streamUrl },
        { shouldPlay: false },
        this.handlePlaybackStatusUpdate
      );

      this.sound = sound;
      console.log('[AUDIO SERVICE] Track loaded successfully');
      return sound;
    } catch (error) {
      console.error('[AUDIO SERVICE] Failed to load track:', error);
      throw error;
    }
  }

  async play() {
    if (this.sound) {
      await this.sound.playAsync();
    }
  }

  async pause() {
    if (this.sound) {
      await this.sound.pauseAsync();
    }
  }

  async stop() {
    if (this.sound) {
      await this.sound.stopAsync();
      await this.sound.unloadAsync();
      this.sound = null;
    }
  }

  async seekTo(positionMillis: number) {
    if (this.sound) {
      await this.sound.setPositionAsync(positionMillis);
    }
  }

  async setRate(rate: number) {
    if (this.sound) {
      await this.sound.setRateAsync(rate, true);
    }
  }

  private handlePlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (this.onStatusUpdate) {
      this.onStatusUpdate(status);
    }
  };

  getSound() {
    return this.sound;
  }
}

export const audioService = new AudioService();
