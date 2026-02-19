import React, { useMemo, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GratefulDeadShow } from '../types/show.types';
import { formatDate, getVenueFromShow } from '../utils/formatters';
import { usePlayCounts } from '../contexts/PlayCountsContext';
import { useShows } from '../contexts/ShowsContext';
import { useFavorites } from '../contexts/FavoritesContext';
import { useResponsive } from '../hooks/useResponsive';
import { StarRating } from './StarRating';
import { OfficialReleaseBadge } from './OfficialReleaseBadge';
import { OfficialReleaseModal } from './OfficialReleaseModal';
import { PlayCountBadge } from './PlayCountBadge';
import { getOfficialReleasesForDate } from '../data/officialReleases';
import { COLORS, TYPOGRAPHY, SPACING } from '../constants/theme';

interface ShowCardProps {
  show: GratefulDeadShow;
  onPress: (show: GratefulDeadShow) => void;
  /** Override the star rating (use performance rating instead of show rating) */
  overrideRating?: 1 | 2 | 3 | null;
  /** Override the play count (use song-specific count instead of show count) */
  overridePlayCount?: number;
}

/**
 * Show card component for displaying Grateful Dead show information
 * Memoized to prevent unnecessary re-renders in lists
 */
export const ShowCard = React.memo<ShowCardProps>(({ show, onPress, overrideRating, overridePlayCount }) => {
  const { hasShowBeenPlayed, getShowPlayCount } = usePlayCounts();
  const { showDetailsCache } = useShows();
  const { isShowFavorite, addFavoriteShow, removeFavoriteShow } = useFavorites();
  const { isDesktop } = useResponsive();
  const [modalVisible, setModalVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Get official releases for this show
  const officialReleases = useMemo(() => {
    return getOfficialReleasesForDate(show.date);
  }, [show.date]);

  // Use override play count if provided, otherwise calculate from show data
  const playCount = useMemo(() => {
    // If override is provided, use it directly
    if (overridePlayCount !== undefined) {
      return overridePlayCount;
    }

    // Quick check: does show have any played tracks?
    if (!hasShowBeenPlayed(show.primaryIdentifier)) {
      return 0;
    }

    // Only calculate if details are cached (no API fetch)
    const cachedDetails = showDetailsCache.get(show.primaryIdentifier);
    if (cachedDetails) {
      return getShowPlayCount(show.primaryIdentifier, cachedDetails.tracks.length);
    }

    // Details not cached - don't show play count yet (will appear after user opens show)
    return 0;
  }, [show.primaryIdentifier, hasShowBeenPlayed, showDetailsCache, getShowPlayCount, overridePlayCount]);

  // Use override rating if provided, otherwise use show's classicTier
  const displayRating = overrideRating !== undefined ? overrideRating : show.classicTier;

  const isSaved = isShowFavorite(show.primaryIdentifier);

  const handleBadgePress = () => {
    setModalVisible(true);
  };

  const handleToggleSave = useCallback((e: any) => {
    e.stopPropagation();
    if (isSaved) {
      removeFavoriteShow(show.primaryIdentifier);
    } else {
      addFavoriteShow(show);
    }
  }, [isSaved, show, addFavoriteShow, removeFavoriteShow]);

  const accessibilityLabel = useMemo(() => {
    const venue = getVenueFromShow(show);
    const date = formatDate(show.date);
    const rating = displayRating ? `${4 - displayRating} star rating` : '';
    const location = show.location || '';
    return `${venue}, ${date}${location ? `, ${location}` : ''}${rating ? `. ${rating}` : ''}`;
  }, [show, displayRating]);

  const isWeb = Platform.OS === 'web';

  return (
    <>
      <TouchableOpacity
        style={[styles.container, isDesktop && isHovered && styles.hovered]}
        onPress={() => onPress(show)}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint="Double tap to view show details and track list"
        // @ts-ignore - web only mouse events
        onMouseEnter={isDesktop ? () => setIsHovered(true) : undefined}
        onMouseLeave={isDesktop ? () => setIsHovered(false) : undefined}
      >
        {/* Venue name - full width at top */}
        <Text style={styles.venue} numberOfLines={1}>
          {getVenueFromShow(show)}
        </Text>

        {/* Bottom row: info on left, badges on right */}
        <View style={styles.bottomRow}>
          <View style={styles.infoContainer}>
            {/* Date with stars */}
            <View style={styles.dateRow}>
              <Text style={styles.date}>{formatDate(show.date)}</Text>
              {displayRating && (
                <StarRating tier={displayRating} size={14} />
              )}
            </View>

            {/* Location */}
            {show.location && (
              <Text style={styles.location} numberOfLines={1}>
                {show.location}
              </Text>
            )}
          </View>

          {/* Right side badges */}
          <View style={styles.badgesContainer}>
            {officialReleases.length > 0 && (
              <View style={styles.officialReleaseBadgeWrapper}>
                <OfficialReleaseBadge
                  onPress={handleBadgePress}
                  compact
                  releaseTitle={officialReleases[0].name}
                />
              </View>
            )}
            <PlayCountBadge count={playCount} size="small" />
            {isWeb && isDesktop && (
              <TouchableOpacity
                style={[styles.savePill, isSaved && styles.savePillActive]}
                onPress={handleToggleSave}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={isSaved ? 'Remove show from favorites' : 'Save show to favorites'}
                accessibilityState={{ selected: isSaved }}
              >
                <Ionicons
                  name={isSaved ? 'heart' : 'heart-outline'}
                  size={15}
                  color={COLORS.textPrimary}
                />
                <Text style={styles.savePillText}>{isSaved ? 'Saved' : 'Save'}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableOpacity>

      {/* Official Release Modal */}
      <OfficialReleaseModal
        visible={modalVisible}
        releases={officialReleases}
        show={show}
        onClose={() => setModalVisible(false)}
      />
    </>
  );
});

ShowCard.displayName = 'ShowCard';

const styles = StyleSheet.create({
  container: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.xxl,
    backgroundColor: COLORS.background,
    ...(Platform.OS === 'web' ? {
      backgroundColor: 'transparent',
      borderRadius: 12,
      paddingVertical: 10,
      paddingHorizontal: 16,
      marginVertical: 2,
    } : {}),
  },
  hovered: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  venue: {
    ...TYPOGRAPHY.heading4,
    marginBottom: SPACING.xs,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoContainer: {
    flex: 1,
    marginRight: SPACING.md,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm + 2,
    marginBottom: 2,
  },
  date: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
  },
  location: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
  },
  badgesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    flexShrink: 1,
  },
  officialReleaseBadgeWrapper: {
    flexShrink: 1,
    minWidth: 0,
  },
  savePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 342,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.33)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    gap: 6,
  },
  savePillActive: {
    backgroundColor: `${COLORS.accent}33`,
    borderColor: COLORS.accent,
  },
  savePillText: {
    ...TYPOGRAPHY.label,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
});
