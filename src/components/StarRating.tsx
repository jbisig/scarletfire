import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';

export type PerformanceRatingTier = 1 | 2 | 3;

interface StarRatingProps {
  tier: PerformanceRatingTier;
  size?: number;
  color?: string;
  style?: object;
}

/**
 * Renders star rating based on tier
 * Tier 1 = 3 stars (legendary)
 * Tier 2 = 2 stars (excellent)
 * Tier 3 = 1 star (notable)
 *
 * Follows the same tier-to-star mapping as ShowCard
 * Memoized to prevent unnecessary re-renders
 */
export const StarRating = React.memo<StarRatingProps>(function StarRating({
  tier,
  size = 16,
  color = COLORS.accent,
  style
}) {
  const starCount = 4 - tier; // Tier 1 → 3 stars, Tier 2 → 2 stars, Tier 3 → 1 star

  return (
    <View style={[styles.starsContainer, style]}>
      {Array.from({ length: starCount }, (_, i) => (
        <Ionicons
          key={i}
          name="star"
          size={size}
          color={color}
          style={{ marginRight: i < starCount - 1 ? 2 : 0 }}
        />
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  starsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
