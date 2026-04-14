import React, { useMemo, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GratefulDeadShow } from '../types/show.types';
import { formatDate, getVenueFromShow } from '../utils/formatters';
import { usePlayCounts } from '../contexts/PlayCountsContext';
import { useFavorites } from '../contexts/FavoritesContext';
import { useCollections } from '../contexts/CollectionsContext';
import { archiveApi } from '../services/archiveApi';
import { useResponsive } from '../hooks/useResponsive';
import { StarRating } from './StarRating';
import { OfficialReleaseBadge } from './OfficialReleaseBadge';
import { OfficialReleaseModal } from './OfficialReleaseModal';
import { PlayCountBadge } from './PlayCountBadge';
import { AddToCollectionPicker } from './collections/AddToCollectionPicker';
import { getOfficialReleasesForDate } from '../data/officialReleases';
import { COLORS, TYPOGRAPHY, SPACING } from '../constants/theme';

interface ShowCardProps {
  show: GratefulDeadShow;
  onPress: (show: GratefulDeadShow) => void;
  /** Override the star rating (use performance rating instead of show rating) */
  overrideRating?: 1 | 2 | 3 | null;
  /** Override the play count (use song-specific count instead of show count) */
  overridePlayCount?: number;
  /** Hide the save/saved heart badge */
  hideSaveBadge?: boolean;
  /** Custom trailing text shown after badges (e.g. "2d ago", "12 plays") */
  trailingText?: string;
}

/**
 * Show card component for displaying Grateful Dead show information
 * Memoized to prevent unnecessary re-renders in lists
 */
export const ShowCard = React.memo<ShowCardProps>(({ show, onPress, overrideRating, overridePlayCount, hideSaveBadge, trailingText }) => {
  const { hasShowBeenPlayed, getShowPlayCount } = usePlayCounts();
  const { isShowFavorite, addFavoriteShow, removeFavoriteShow } = useFavorites();
  const { itemCountsByIdentifier } = useCollections();
  const collectionCount = itemCountsByIdentifier[show.primaryIdentifier] ?? 0;
  const { isDesktop } = useResponsive();
  const [modalVisible, setModalVisible] = useState(false);
  const [addToCollectionVisible, setAddToCollectionVisible] = useState(false);
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
    const cachedDetails = archiveApi.getCachedShowDetail(show.primaryIdentifier);
    if (cachedDetails) {
      return getShowPlayCount(show.primaryIdentifier, cachedDetails.tracks.length);
    }

    // Details not cached - don't show play count yet (will appear after user opens show)
    return 0;
  }, [show.primaryIdentifier, hasShowBeenPlayed, getShowPlayCount, overridePlayCount]);

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
        style={[styles.container, isDesktop && styles.containerDesktop, isDesktop && isHovered && styles.hovered]}
        onPress={() => onPress(show)}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint="Double tap to view show details and track list"
        // @ts-ignore - web only mouse events
        onMouseEnter={isDesktop ? () => setIsHovered(true) : undefined}
        onMouseLeave={isDesktop ? () => setIsHovered(false) : undefined}
      >
        {/* Text content: on desktop wrapped for flex layout */}
        <View style={isDesktop ? styles.cardContentDesktop : undefined}>
          {/* Venue name - full width at top */}
          <Text style={styles.venue} numberOfLines={1}>
            {getVenueFromShow(show)}
          </Text>

          {/* Info row: on mobile includes badges, on desktop just text */}
          <View style={!isDesktop ? styles.bottomRow : undefined}>
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

            {/* Mobile: badges in bottom row */}
            {!isDesktop && (
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
                {trailingText && (
                  <Text style={styles.trailingText}>{trailingText}</Text>
                )}
              </View>
            )}
          </View>
        </View>

        {/* Desktop: badges at card level, vertically centered */}
        {isDesktop && (
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
            {trailingText && (
              <Text style={styles.trailingText}>{trailingText}</Text>
            )}
            {isWeb && !hideSaveBadge && (
              <>
                <TouchableOpacity
                  style={styles.savePill}
                  onPress={(e: any) => {
                    e?.stopPropagation?.();
                    setAddToCollectionVisible(true);
                  }}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel={
                    collectionCount > 0
                      ? `Added to ${collectionCount} ${collectionCount === 1 ? 'collection' : 'collections'}`
                      : 'Add to collection'
                  }
                >
                  <Ionicons
                    name={collectionCount > 0 ? 'folder' : 'folder-open-outline'}
                    size={15}
                    color={COLORS.textPrimary}
                  />
                  {collectionCount > 0 && (
                    <Text style={styles.savePillText}>{collectionCount}</Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.savePill}
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
              </>
            )}
          </View>
        )}
      </TouchableOpacity>

      {/* Official Release Modal */}
      <OfficialReleaseModal
        visible={modalVisible}
        releases={officialReleases}
        show={show}
        onClose={() => setModalVisible(false)}
      />

      {/* Add to Collection Picker (web pill) */}
      {isWeb && (
        <AddToCollectionPicker
          visible={addToCollectionVisible}
          onClose={() => setAddToCollectionVisible(false)}
          type="show_collection"
          itemIdentifier={show.primaryIdentifier}
          itemMetadata={{
            title: show.title,
            date: show.date,
            venue: show.venue,
            location: show.location,
            primaryIdentifier: show.primaryIdentifier,
          }}
        />
      )}
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
  containerDesktop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardContentDesktop: {
    flex: 1,
    marginRight: SPACING.md,
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
  savePillText: {
    ...TYPOGRAPHY.label,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  trailingText: {
    ...TYPOGRAPHY.label,
    color: COLORS.textTertiary,
  },
});
