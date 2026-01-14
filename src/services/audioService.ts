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
        await this.sound.unloadAsync();
      }

      this.onStatusUpdate = onStatusUpdate;

      console.log('Loading track:', track.title);
      console.log('Stream URL:', track.streamUrl);

      const { sound } = await Audio.Sound.createAsync(
        { uri: track.streamUrl },
        { shouldPlay: false },
        this.handlePlaybackStatusUpdate
      );

      this.sound = sound;
      console.log('Track loaded successfully');
      return sound;
    } catch (error) {
      console.error('Failed to load track:', error);
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
