import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface PlayerControlsProps {
  isPlaying: boolean;
  onPlayPause: () => void;
  onNext: () => void;
  onPrevious: () => void;
  canGoNext: boolean;
  canGoPrevious: boolean;
}

export function PlayerControls({
  isPlaying,
  onPlayPause,
  onNext,
  onPrevious,
  canGoNext,
  canGoPrevious,
}: PlayerControlsProps) {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={onPrevious}
        disabled={!canGoPrevious}
        style={[styles.button, !canGoPrevious && styles.disabled]}
      >
        <Ionicons name="play-skip-back" size={32} color={canGoPrevious ? '#fff' : '#555'} />
      </TouchableOpacity>

      <TouchableOpacity onPress={onPlayPause} style={styles.playButton}>
        <Ionicons
          name={isPlaying ? 'pause' : 'play'}
          size={48}
          color="#fff"
        />
      </TouchableOpacity>

      <TouchableOpacity
        onPress={onNext}
        disabled={!canGoNext}
        style={[styles.button, !canGoNext && styles.disabled]}
      >
        <Ionicons name="play-skip-forward" size={32} color={canGoNext ? '#fff' : '#555'} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  button: {
    padding: 16,
  },
  playButton: {
    padding: 16,
    marginHorizontal: 32,
    backgroundColor: '#E54C4F',
    borderRadius: 40,
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabled: {
    opacity: 0.3,
  },
});
