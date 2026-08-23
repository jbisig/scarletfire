import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';
import type { ResolvedRating } from '../services/ratingResolver';

export type PerformanceRatingTier = 1 | 2 | 3;

interface StarRatingProps {
  /** Legacy system-tier path (red stars). Ignored when `rating` is set. */
  tier?: PerformanceRatingTier;
  /** Resolved rating: gold when the user's, red when the system's,
   *  single gold outline star for an explicit 0-star override. */
  rating?: ResolvedRating | null;
  /** When `rating` is null, render 3 dim outline stars (tap target hint). */
  showPlaceholder?: boolean;
  size?: number;
  color?: string;
  style?: object;
  /**
   * Render inside a <Text> rather than a <View>, so the stars flow with the
   * text they follow and land after its last word instead of beside its first
   * line. The icons are glyphs already, so they sit in the run naturally.
   */
  inline?: boolean;
}

/**
 * Renders star rating. Two modes:
 * - `tier` (legacy): tier 1 → 3 stars, tier 2 → 2, tier 3 → 1, in `color`.
 * - `rating` (resolved): user overrides render gold, system red.
 * Memoized to prevent unnecessary re-renders.
 */
export const StarRating = React.memo<StarRatingProps>(function StarRating({
  tier,
  rating,
  showPlaceholder = false,
  size = 16,
  color = COLORS.accent,
  style,
  inline = false,
}) {
  let iconName: 'star' | 'star-outline' = 'star';
  let starCount: number;
  let starColor: string;
  let ratingLabel: string;

  if (rating !== undefined) {
    if (rating === null) {
      if (!showPlaceholder) return null;
      iconName = 'star-outline';
      starCount = 3;
      starColor = COLORS.textMuted;
      ratingLabel = 'Not rated. Tap to rate';
    } else if (rating.stars === 0) {
      iconName = 'star-outline';
      starCount = 1;
      starColor = COLORS.userRating;
      ratingLabel = 'Your rating: 0 stars';
    } else {
      starCount = rating.stars;
      starColor = rating.isUserRating ? COLORS.userRating : COLORS.accent;
      ratingLabel = rating.isUserRating
        ? `Your rating: ${rating.stars} ${rating.stars === 1 ? 'star' : 'stars'}`
        : `${rating.stars} star rating`;
    }
  } else {
    if (!tier) return null;
    starCount = 4 - tier; // Tier 1 → 3 stars, Tier 2 → 2 stars, Tier 3 → 1 star
    starColor = color;
    ratingLabel = starCount === 1 ? '1 star rating' : `${starCount} star rating`;
  }

  const stars = Array.from({ length: starCount }, (_, i) => (
    <Ionicons
      key={i}
      name={iconName}
      size={size}
      color={starColor}
      style={{ marginRight: i < starCount - 1 ? 2 : 0 }}
    />
  ));

  if (inline) {
    return <Text accessibilityLabel={ratingLabel}>{stars}</Text>;
  }

  return (
    <View
      style={[styles.starsContainer, style]}
      accessibilityRole="text"
      accessibilityLabel={ratingLabel}
    >
      {stars}
    </View>
  );
});

const styles = StyleSheet.create({
  starsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
