import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { GratefulDeadShow } from '../types/show.types';
import { formatDate, getVenueFromShow } from '../utils/formatters';
import { StarRating } from './StarRating';
import { getShareBackground, shareBackgroundIndexForId } from './share/shareBackgrounds';
import { useResponsive } from '../hooks/useResponsive';
import { useResolvedShowRating } from '../contexts/UserRatingsContext';
import { TYPOGRAPHY, SPACING, RADIUS, LAYOUT, BRAND_COLORS } from '../constants/theme';

interface HorizontalShowCardProps {
  show: GratefulDeadShow;
  onPress: (show: GratefulDeadShow) => void;
  /** 1–6, from assignShareBackgrounds() over the whole row so neighbours differ. */
  bgIndex?: number;
}

/**
 * Discover carousel card. Same artwork family as the share cards, chosen per
 * row so neighbours never match, darkened enough for white type to hold up
 * on the brighter nebulae.
 */
export const HorizontalShowCard = React.memo<HorizontalShowCardProps>(function HorizontalShowCard({
  show,
  onPress,
  bgIndex,
}) {
  const { isDesktop } = useResponsive();
  const resolvedRating = useResolvedShowRating(show.date);
  const background = useMemo(
    () => getShareBackground(bgIndex ?? shareBackgroundIndexForId(show.primaryIdentifier)),
    [bgIndex, show.primaryIdentifier],
  );

  const accessibilityLabel = useMemo(() => {
    const venue = getVenueFromShow(show);
    const date = formatDate(show.date);
    const rating = resolvedRating
      ? resolvedRating.isUserRating
        ? `Your rating: ${resolvedRating.stars} stars`
        : `${resolvedRating.stars} star rating`
      : '';
    const location = show.location || '';
    return `${venue}, ${date}${location ? `, ${location}` : ''}${rating ? `. ${rating}` : ''}`;
  }, [show, resolvedRating]);

  return (
    <View style={[styles.container, isDesktop && styles.containerDesktop]}>
      <Image source={background} style={styles.background} resizeMode="cover" />
      <View style={styles.overlay} />

      <Pressable
        style={({ pressed }) => [styles.cardHit, pressed && styles.cardHitPressed]}
        onPress={() => onPress(show)}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint="Double tap to view show details"
      />

      {/* Text sits on the left; the gradient buys contrast there and lets the
          artwork show through on the right. */}
      <LinearGradient
        colors={['rgba(0,0,0,0.5)', 'rgba(0,0,0,0)']}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={[styles.gradient, styles.passive]}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        <Text style={styles.venue} numberOfLines={2} ellipsizeMode="tail">
          {getVenueFromShow(show)}
        </Text>

        <View style={styles.dateRow}>
          <Text style={styles.date}>{formatDate(show.date)}</Text>
          {resolvedRating && <StarRating rating={resolvedRating} size={12} />}
        </View>

        {show.location && (
          <Text style={styles.location} numberOfLines={1}>
            {show.location}
          </Text>
        )}
      </LinearGradient>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    width: LAYOUT.horizontalCardWidth,
    height: LAYOUT.horizontalCardHeight,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
  },
  containerDesktop: {
    width: 300,
    height: 150,
  },
  background: {
    ...StyleSheet.absoluteFillObject,
    width: undefined,
    height: undefined,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  cardHit: {
    ...StyleSheet.absoluteFillObject,
  },
  cardHitPressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  passive: {
    pointerEvents: 'none',
  },
  gradient: {
    flex: 1,
    padding: SPACING.md,
    justifyContent: 'flex-start',
  },
  venue: {
    ...TYPOGRAPHY.label,
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 1,
  },
  date: {
    ...TYPOGRAPHY.caption,
    fontSize: 13,
    color: BRAND_COLORS.textSoft,
  },
  location: {
    ...TYPOGRAPHY.caption,
    fontSize: 13,
    color: BRAND_COLORS.textSoft,
  },
});
