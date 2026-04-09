import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Track } from '../types/show.types';
import { formatDuration } from '../utils/formatters';
import { useResponsive } from '../hooks/useResponsive';
import { StarRating } from './StarRating';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '../constants/theme';

interface TrackItemProps {
  track: Track;
  isPlaying: boolean;
  onPress: (track: Track) => void;
  rating?: 1 | 2 | 3 | null;
  /** Web only: whether this song is saved as a favorite */
  isSaved?: boolean;
  /** Web only: callback to toggle save state */
  onToggleSave?: (track: Track) => void;
}

/**
 * Individual track item component
 * Memoized to prevent unnecessary re-renders
 */
export const TrackItem = React.memo<TrackItemProps>(({ track, isPlaying, onPress, rating, isSaved, onToggleSave }) => {
  const { isDesktop } = useResponsive();
  const [isHovered, setIsHovered] = useState(false);
  const duration = formatDuration(track.duration);
  const ratingText = rating ? `${4 - rating} star performance` : '';
  const playingText = isPlaying ? 'Now playing. ' : '';
  const accessibilityLabel = `${playingText}${track.title}, ${duration}${ratingText ? `. ${ratingText}` : ''}`;

  const hasSave = !!onToggleSave;
  const showSaveButton = hasSave && (Platform.OS === 'web' ? ((isDesktop && isHovered) || isSaved) : isSaved);

  return (
    <TouchableOpacity
      style={[
        styles.container,
        isDesktop && styles.containerDesktop,
        isPlaying && styles.playing,
        isPlaying && isDesktop && styles.playingDesktop,
        isDesktop && isHovered && !isPlaying && styles.hovered,
      ]}
      onPress={() => onPress(track)}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint="Double tap to play this track"
      accessibilityState={{ selected: isPlaying }}
      // @ts-ignore - web only mouse events
      onMouseEnter={isDesktop ? () => setIsHovered(true) : undefined}
      onMouseLeave={isDesktop ? () => setIsHovered(false) : undefined}
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
      {/* Always reserve space for save button on web to prevent layout shift */}
      {hasSave && (
        <TouchableOpacity
          style={[
            styles.saveButton,
            isSaved && styles.saveButtonActive,
            !showSaveButton && styles.saveButtonHidden,
          ]}
          onPress={(e) => {
            e.stopPropagation();
            onToggleSave(track);
          }}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={isSaved ? 'Remove from favorites' : 'Add to favorites'}
          accessibilityState={{ selected: isSaved }}
        >
          <Ionicons
            name={isSaved ? 'checkmark-sharp' : 'add'}
            size={13}
            color={COLORS.textPrimary}
          />
        </TouchableOpacity>
      )}
      <Text style={[styles.duration, isPlaying && styles.playingText, hasSave && styles.durationWeb]}>
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
  containerDesktop: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginVertical: 2,
    borderRadius: 12,
  },
  playing: {
    backgroundColor: `${COLORS.accent}20`,
  },
  playingDesktop: {
    borderRadius: 12,
  },
  hovered: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 12,
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
    ...(Platform.OS === 'web' ? { fontSize: 16, fontWeight: '400' as const } : {}),
  },
  ratingContainer: {
    marginLeft: SPACING.sm,
  },
  duration: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginLeft: SPACING.md,
    marginTop: 2,
    ...(Platform.OS === 'web' ? {
      fontSize: 14,
      color: COLORS.textPrimary,
      opacity: 0.66,
    } : {}),
  },
  durationWeb: {
    width: 48,
    textAlign: 'right',
  },
  playingText: {
    color: COLORS.accent,
    fontWeight: '600',
  },
  saveButton: {
    width: 22,
    height: 22,
    borderRadius: RADIUS.full,
    borderWidth: 1.5,
    borderColor: COLORS.textPrimary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: SPACING.md,
  },
  saveButtonActive: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  saveButtonHidden: {
    opacity: 0,
  },
});
