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
  /** Web only: callback to open Add-to-Playlist picker for this track */
  onAddToPlaylist?: (track: Track) => void;
  /** Web only: number of playlists this track is currently in (for pill badge) */
  playlistCount?: number;
  /**
   * True when this track was selected by URL-driven navigation (share link
   * or pasted URL). Renders a sustained highlight distinct from `isPlaying`.
   * When `isPlaying` becomes true on the same track, the playing state wins
   * and the selected highlight is hidden.
   */
  isSelected?: boolean;
}

/**
 * Individual track item component
 * Memoized to prevent unnecessary re-renders
 */
export const TrackItem = React.memo<TrackItemProps>(({ track, isPlaying, onPress, rating, isSaved, onToggleSave, onAddToPlaylist, playlistCount = 0, isSelected }) => {
  const { isDesktop } = useResponsive();
  const [isHovered, setIsHovered] = useState(false);
  const duration = formatDuration(track.duration);
  const ratingText = rating ? `${4 - rating} star performance` : '';
  const playingText = isPlaying ? 'Now playing. ' : '';
  const selectedText = isSelected && !isPlaying ? 'Selected. ' : '';
  const accessibilityLabel = `${playingText}${selectedText}${track.title}, ${duration}${ratingText ? `. ${ratingText}` : ''}`;

  const hasSave = !!onToggleSave;
  const showSaveButton = hasSave && (Platform.OS === 'web' ? ((isDesktop && isHovered) || isSaved) : isSaved);
  const hasAdd = !!onAddToPlaylist;
  const showAddButton = hasAdd && Platform.OS === 'web' && (((isDesktop && isHovered) || playlistCount > 0));

  return (
    <TouchableOpacity
      style={[
        styles.container,
        isDesktop && styles.containerDesktop,
        isPlaying && styles.playing,
        isPlaying && isDesktop && styles.playingDesktop,
        isSelected && !isPlaying && styles.selected,
        isDesktop && isHovered && !isPlaying && !isSelected && styles.hovered,
      ]}
      onPress={() => onPress(track)}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint="Double tap to play this track"
      accessibilityState={{ selected: isPlaying || isSelected }}
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
      {/* Add-to-playlist button (web only) — plus icon. */}
      {hasAdd && (
        <TouchableOpacity
          style={[
            styles.iconButton,
            playlistCount > 0 && styles.iconButtonActive,
            !showAddButton && styles.iconButtonHidden,
          ]}
          onPress={(e) => {
            e.stopPropagation();
            onAddToPlaylist?.(track);
          }}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={
            playlistCount > 0
              ? `Track is in ${playlistCount} ${playlistCount === 1 ? 'playlist' : 'playlists'}. Add or remove.`
              : 'Add to playlist'
          }
        >
          <Ionicons name="add" size={14} color={COLORS.textPrimary} />
        </TouchableOpacity>
      )}
      {/* Save button — heart icon, red when saved. Reserves space to prevent layout shift. */}
      {hasSave && (
        <TouchableOpacity
          style={[
            styles.iconButton,
            isSaved && styles.iconButtonSaved,
            !showSaveButton && styles.iconButtonHidden,
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
            name={isSaved ? 'heart' : 'heart-outline'}
            size={14}
            color={isSaved ? COLORS.accent : COLORS.textPrimary}
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
    flexShrink: 1,
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
  iconButton: {
    width: 26,
    height: 26,
    borderRadius: RADIUS.full,
    borderWidth: 1.5,
    borderColor: COLORS.textPrimary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: SPACING.sm,
  },
  iconButtonActive: {
    borderColor: COLORS.textPrimary,
  },
  iconButtonSaved: {
    borderColor: COLORS.accent,
  },
  iconButtonHidden: {
    opacity: 0,
  },
  selected: {
    backgroundColor: `${COLORS.accent}12`,  // ~7% alpha — lighter than playing's 20
    borderLeftWidth: 3,
    borderLeftColor: COLORS.accent,
    paddingLeft: SPACING.xxl - 3,  // compensate so content doesn't shift
  },
});
