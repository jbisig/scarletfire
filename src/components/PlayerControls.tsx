import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS } from '../constants/theme';
import { haptics } from '../services/hapticService';

interface PlayerControlsProps {
  isPlaying: boolean;
  onPlayPause: () => void;
  onNext: () => void;
  onPrevious: () => void;
  canGoNext: boolean;
  canGoPrevious: boolean;
}

export const PlayerControls = React.memo(function PlayerControls({
  isPlaying,
  onPlayPause,
  onNext,
  onPrevious,
  canGoNext,
  canGoPrevious,
}: PlayerControlsProps) {
  const handlePrevious = () => {
    haptics.medium();
    onPrevious();
  };

  const handlePlayPause = () => {
    haptics.heavy();
    onPlayPause();
  };

  const handleNext = () => {
    haptics.medium();
    onNext();
  };

  return (
    <View style={styles.container} accessibilityRole="toolbar" accessibilityLabel="Playback controls">
      <TouchableOpacity
        onPress={handlePrevious}
        disabled={!canGoPrevious}
        style={[styles.button, !canGoPrevious && styles.disabled]}
        accessibilityRole="button"
        accessibilityLabel="Previous track"
        accessibilityHint="Double tap to go to the previous track"
        accessibilityState={{ disabled: !canGoPrevious }}
      >
        <Ionicons name="play-skip-back" size={32} color={canGoPrevious ? COLORS.textPrimary : COLORS.textMuted} />
      </TouchableOpacity>

      <TouchableOpacity
        onPress={handlePlayPause}
        style={styles.playButton}
        accessibilityRole="button"
        accessibilityLabel={isPlaying ? 'Pause' : 'Play'}
        accessibilityHint={isPlaying ? 'Double tap to pause playback' : 'Double tap to start playback'}
      >
        <Ionicons
          name={isPlaying ? 'pause' : 'play'}
          size={48}
          color={COLORS.textPrimary}
        />
      </TouchableOpacity>

      <TouchableOpacity
        onPress={handleNext}
        disabled={!canGoNext}
        style={[styles.button, !canGoNext && styles.disabled]}
        accessibilityRole="button"
        accessibilityLabel="Next track"
        accessibilityHint="Double tap to skip to the next track"
        accessibilityState={{ disabled: !canGoNext }}
      >
        <Ionicons name="play-skip-forward" size={32} color={canGoNext ? COLORS.textPrimary : COLORS.textMuted} />
      </TouchableOpacity>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xl,
  },
  button: {
    padding: SPACING.lg,
  },
  playButton: {
    padding: SPACING.lg,
    marginHorizontal: SPACING.xxxl,
    backgroundColor: COLORS.accent,
    borderRadius: RADIUS.full,
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabled: {
    opacity: 0.3,
  },
});
