import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Track } from '../types/show.types';
import { formatDuration } from '../utils/formatters';
import { StarRating } from './StarRating';
import { COLORS, TYPOGRAPHY, SPACING } from '../constants/theme';

interface TrackItemProps {
  track: Track;
  isPlaying: boolean;
  onPress: (track: Track) => void;
  rating?: 1 | 2 | 3 | null;
}

/**
 * Individual track item component
 * Memoized to prevent unnecessary re-renders
 */
export const TrackItem = React.memo<TrackItemProps>(({ track, isPlaying, onPress, rating }) => {
  const duration = formatDuration(track.duration);
  const ratingText = rating ? `${4 - rating} star performance` : '';
  const playingText = isPlaying ? 'Now playing. ' : '';
  const accessibilityLabel = `${playingText}${track.title}, ${duration}${ratingText ? `. ${ratingText}` : ''}`;

  return (
    <TouchableOpacity
      style={[styles.container, isPlaying && styles.playing]}
      onPress={() => onPress(track)}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint="Double tap to play this track"
      accessibilityState={{ selected: isPlaying }}
    >
      <View style={styles.infoContainer}>
        <View style={styles.titleRow}>
          <Text
            style={[styles.title, isPlaying && styles.playingText]}
            numberOfLines={2}
          >
            {track.title}
          </Text>
          {rating && (
            <View style={styles.ratingContainer}>
              <StarRating tier={rating} size={14} />
            </View>
          )}
        </View>
      </View>
      <Text style={[styles.duration, isPlaying && styles.playingText]}>
        {duration}
      </Text>
    </TouchableOpacity>
  );
});

TrackItem.displayName = 'TrackItem';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingVertical: 14,
    paddingHorizontal: SPACING.xxl,
    alignItems: 'baseline',
  },
  playing: {
    backgroundColor: `${COLORS.accent}20`,
  },
  infoContainer: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  title: {
    ...TYPOGRAPHY.bodyLarge,
    fontWeight: '500',
  },
  ratingContainer: {
    marginLeft: SPACING.sm,
  },
  duration: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginLeft: SPACING.md,
    marginTop: 2,
  },
  playingText: {
    color: COLORS.accent,
    fontWeight: '600',
  },
});
