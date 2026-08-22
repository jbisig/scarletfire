import React, { useMemo, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Pressable, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GratefulDeadShow } from '../types/show.types';
import { formatDate, getVenueFromShow } from '../utils/formatters';
import { usePlayCounts } from '../contexts/PlayCountsContext';
import { useFavorites } from '../contexts/FavoritesContext';
import { useCollections } from '../contexts/CollectionsContext';
import type { ResolvedRating } from '../services/ratingResolver';
import { useResolvedShowRating } from '../contexts/UserRatingsContext';
import { archiveApi } from '../services/archiveApi';
import { useResponsive } from '../hooks/useResponsive';
import { StarRating } from './StarRating';
import { OfficialReleaseModal } from './OfficialReleaseModal';
import { PlayCountBadge } from './PlayCountBadge';
import { AddToCollectionPicker } from './collections/AddToCollectionPicker';
import { getOfficialReleasesForDate, pickDisplayRelease } from '../data/officialReleases';
import { COLORS, TYPOGRAPHY, SPACING, GLASS_PILL } from '../constants/theme';

interface ShowCardProps {
  show: GratefulDeadShow;
  onPress: (show: GratefulDeadShow) => void;
  /** Override the resolved star rating (e.g. show a performance rating
   *  instead of the show rating). undefined = resolve internally. */
  overrideResolvedRating?: ResolvedRating | null;
  /** When set, the star slot becomes a tap target (with placeholder)
   *  that calls this — used on the SongPerformances detail surface. */
  onRatingPress?: () => void;
  /** Override the play count (use song-specific count instead of show count) */
  overridePlayCount?: number;
  /** Hide the save/saved heart badge */
  hideSaveBadge?: boolean;
  /** Custom trailing text shown after badges (e.g. "2d ago", "12 plays") */
  trailingText?: string;
}

/**
 * Non-interactive content layer: taps pass through to the card's hit layer
 * beneath. `hideFromA11y` drops it from the accessibility tree when the
 * card button's own label already announces the same words.
 */
function Passive({ children, hideFromA11y }: { children: React.ReactNode; hideFromA11y?: boolean }) {
  return (
    <View
      style={styles.passive}
      accessibilityElementsHidden={hideFromA11y}
      importantForAccessibility={hideFromA11y ? 'no-hide-descendants' : 'auto'}
    >
      {children}
    </View>
  );
}

/**
 * Show card component for displaying Grateful Dead show information
 * Memoized to prevent unnecessary re-renders in lists
 */
export const ShowCard = React.memo<ShowCardProps>(({ show, onPress, overrideResolvedRating, onRatingPress, overridePlayCount, hideSaveBadge, trailingText }) => {
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
  const displayRelease = useMemo(() => pickDisplayRelease(officialReleases), [officialReleases]);

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

  // Use override rating if provided, otherwise resolve the show's rating
  // (user override wins over the system classicTier, per ratingResolver).
  const resolvedShowRating = useResolvedShowRating(show.date);
  const displayRating = overrideResolvedRating !== undefined ? overrideResolvedRating : resolvedShowRating;

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
    const rating = displayRating
      ? displayRating.isUserRating
        ? `Your rating: ${displayRating.stars} stars`
        : `${displayRating.stars} star rating`
      : '';
    const location = show.location || '';
    return `${venue}, ${date}${location ? `, ${location}` : ''}${rating ? `. ${rating}` : ''}`;
  }, [show, displayRating]);

  const isWeb = Platform.OS === 'web';

  // The official-release note used to be a red pill on the right, which
  // made it the loudest thing on every row and squeezed the location into
  // "Washingto…". It's a footnote: one quiet line under the location, still
  // tappable for the release details. Red is left to the rating stars.
  const releaseNote = displayRelease && (
    <Pressable
      onPress={handleBadgePress}
      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
      style={styles.releaseNote}
      accessibilityRole="button"
      accessibilityLabel={`Official release: also on ${displayRelease.release.name}${displayRelease.more ? ` and ${displayRelease.more} more` : ''}`}
      accessibilityHint="Double tap to view release details"
    >
      <Ionicons name="disc-outline" size={12} color={COLORS.textSecondary} />
      <Text style={styles.releaseNoteText} numberOfLines={1}>
        also on {displayRelease.release.name}
        {displayRelease.more ? ` +${displayRelease.more}` : ''}
      </Text>
    </Pressable>
  );

  const badges = (
    <>
      <Passive><PlayCountBadge count={playCount} size="small" /></Passive>
      {trailingText && (
        <Passive><Text style={styles.trailingText}>{trailingText}</Text></Passive>
      )}
    </>
  );

  return (
    <>
      <View
        style={[styles.container, isDesktop && styles.containerDesktop, isDesktop && isHovered && styles.hovered]}
        // @ts-ignore - web only mouse events
        onMouseEnter={isDesktop ? () => setIsHovered(true) : undefined}
        onMouseLeave={isDesktop ? () => setIsHovered(false) : undefined}
      >
        {/* The card's tap target is a full-bleed layer BENEATH the content
            rather than a wrapper around it, so the release badge and save
            pills are siblings of the card button instead of buttons nested
            inside a button — invalid HTML on web (hydration errors) and
            unreachable by VoiceOver on native, where a parent button merges
            its children. Text layers are `pointerEvents: none` so taps fall
            through to this layer; badge rows are `box-none` so only their
            buttons catch touches. */}
        <Pressable
          style={({ pressed }) => [styles.cardHit, pressed && styles.cardHitPressed]}
          onPress={() => onPress(show)}
          accessibilityRole="button"
          accessibilityLabel={accessibilityLabel}
          accessibilityHint="Double tap to view show details and track list"
        />

        {/* Text content: on desktop wrapped for flex layout */}
        <View style={[styles.passThrough, isDesktop && styles.cardContentDesktop]}>
          {/* Venue name - full width at top */}
          <Passive hideFromA11y>
            <Text style={styles.venue} numberOfLines={1}>
              {getVenueFromShow(show)}
            </Text>
          </Passive>

          {/* Info row: on mobile includes badges, on desktop just text */}
          <View style={[styles.passThrough, !isDesktop && styles.bottomRow]}>
            <View style={[styles.passThrough, styles.infoContainer]}>
              {/* Date with stars */}
              <View style={[styles.passThrough, styles.dateRow]}>
                <Passive hideFromA11y>
                  <Text style={styles.date}>{formatDate(show.date)}</Text>
                </Passive>
                {onRatingPress ? (
                  <TouchableOpacity
                    onPress={(e: any) => { e?.stopPropagation?.(); onRatingPress(); }}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    accessibilityRole="button"
                    accessibilityLabel="Rate this performance"
                  >
                    <StarRating rating={displayRating} showPlaceholder size={14} />
                  </TouchableOpacity>
                ) : (
                  displayRating && (
                    <Passive hideFromA11y>
                      <StarRating rating={displayRating} size={14} />
                    </Passive>
                  )
                )}
              </View>

              {/* Location */}
              {show.location && (
                <Passive hideFromA11y>
                  <Text style={styles.location} numberOfLines={1}>
                    {show.location}
                  </Text>
                </Passive>
              )}
              {releaseNote}
            </View>

            {/* Mobile: badges in bottom row */}
            {!isDesktop && (
              <View style={[styles.passThrough, styles.badgesContainer]}>
                {badges}
              </View>
            )}
          </View>
        </View>

        {/* Desktop: badges at card level, vertically centered */}
        {isDesktop && (
          <View style={[styles.passThrough, styles.badgesContainer]}>
            {badges}
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
                    color={isSaved ? COLORS.accent : COLORS.textPrimary}
                  />
                </TouchableOpacity>
              </>
            )}
          </View>
        )}
      </View>

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
  cardHit: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: Platform.OS === 'web' ? 12 : 0,
  },
  cardHitPressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  passThrough: {
    pointerEvents: 'box-none',
  },
  passive: {
    pointerEvents: 'none',
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
  releaseNote: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: SPACING.xs,
    marginTop: 2,
    // 12px glyph + this padding ≈ a 24pt strip; hitSlop brings it to 36pt.
    paddingVertical: 3,
  },
  releaseNoteText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  savePill: {
    flexDirection: 'row',
    alignItems: 'center',
    ...GLASS_PILL,
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
