import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '../constants/theme';

export interface PlayCountBadgeProps {
  count: number;
  /** Size variant. Defaults to 'medium' */
  size?: 'small' | 'medium';
}

/**
 * Reusable badge showing play count.
 * Used in show cards, song items, and detail screens.
 */
export const PlayCountBadge = React.memo<PlayCountBadgeProps>(function PlayCountBadge({
  count,
  size = 'medium',
}) {
  if (count <= 0) return null;

  const label = count === 1 ? 'play' : 'plays';

  return (
    <View style={[styles.badge, size === 'small' && styles.badgeSmall]}>
      <Text style={[styles.text, size === 'small' && styles.textSmall]}>
        {count} {label}
      </Text>
    </View>
  );
});

const styles = StyleSheet.create({
  badge: {
    backgroundColor: COLORS.cardBackground,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  badgeSmall: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
  },
  text: {
    ...TYPOGRAPHY.labelSmall,
    fontWeight: '400',
    color: COLORS.textSecondary,
  },
  textSmall: {
    ...TYPOGRAPHY.caption,
  },
});
