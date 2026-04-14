import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { FavoriteSong } from '../contexts/FavoritesContext';
import { formatDate } from '../utils/formatters';
import { useResponsive } from '../hooks/useResponsive';
import { StarRating } from './StarRating';
import { PlayCountBadge } from './PlayCountBadge';
import { getSongPerformanceRating } from '../data/songPerformanceRatings';
import { COLORS, TYPOGRAPHY, SPACING } from '../constants/theme';

interface SongCardProps {
  song: FavoriteSong;
  playCount?: number;
  isLoading?: boolean;
  onPress: (song: FavoriteSong) => void;
  onLongPress?: (song: FavoriteSong) => void;
}

/**
 * Shared "song" row used in favorites, collection playlists, and anywhere
 * we render a saved track. Shows title, performance date + star rating,
 * venue, and play count badge. On web, supports hover highlight.
 */
export const SongCard = React.memo<SongCardProps>(function SongCard({
  song,
  playCount = 0,
  isLoading = false,
  onPress,
  onLongPress,
}) {
  const { isDesktop } = useResponsive();
  const performanceRating = getSongPerformanceRating(song.trackTitle, song.showDate);
  const venue = song.venue;
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Pressable
      style={({ pressed }) => [
        styles.songItem,
        isDesktop && isHovered && styles.songItemHovered,
        pressed && styles.songItemPressed,
      ]}
      onPress={() => onPress(song)}
      onLongPress={onLongPress ? () => onLongPress(song) : undefined}
      disabled={isLoading}
      // @ts-ignore - web only mouse events
      onMouseEnter={isDesktop ? () => setIsHovered(true) : undefined}
      onMouseLeave={isDesktop ? () => setIsHovered(false) : undefined}
    >
      <View style={styles.songContentRow}>
        <View style={styles.songInfo}>
          <Text style={styles.songTitle} numberOfLines={1}>
            {song.trackTitle}
          </Text>

          <View style={styles.songDateRow}>
            <Text style={styles.songDate}>{formatDate(song.showDate)}</Text>
            {performanceRating && <StarRating tier={performanceRating} size={14} />}
          </View>

          {venue && (
            <Text style={styles.songVenue} numberOfLines={1}>
              {venue}
            </Text>
          )}
        </View>

        <PlayCountBadge count={playCount} size="small" />
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  songItem: {
    paddingVertical: 8,
    paddingHorizontal: SPACING.xxl,
    backgroundColor: COLORS.background,
    ...(Platform.OS === 'web'
      ? {
          backgroundColor: 'transparent',
          paddingVertical: 10,
          paddingHorizontal: 16,
          borderRadius: 12,
          marginVertical: 2,
        }
      : {}),
  },
  songItemHovered: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  songItemPressed: {
    opacity: 0.6,
  },
  songContentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  songInfo: {
    flex: 1,
    marginRight: SPACING.md,
  },
  songTitle: {
    ...TYPOGRAPHY.heading4,
    marginBottom: SPACING.xs,
  },
  songDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 2,
  },
  songDate: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
  },
  songVenue: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
  },
});
