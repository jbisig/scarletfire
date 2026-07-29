import React, { useMemo } from 'react';
import { View, Text, Modal, TouchableOpacity, TouchableWithoutFeedback, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurBackground } from './shared/BlurBackground';
import { StarRating } from './StarRating';
import { StarPicker } from './StarPicker';
import { useUserRatings, useUserRatingsVersion } from '../contexts/UserRatingsContext';
import {
  getActiveShowRating,
  getActivePerformanceRating,
} from '../services/userRatingsStore';
import { getClassicTier } from '../data/classicShowsTiers';
import { getSongPerformanceRating } from '../data/songPerformanceRatings';
import { tierToStars } from '../services/ratingResolver';
import type { RatingItem } from '../contexts/RatingOverlayContext';
import { formatDate } from '../utils/formatters';
import { haptics } from '../services/hapticService';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '../constants/theme';

interface RatingOverlayProps {
  item: RatingItem | null;
  onClose: () => void;
}

/**
 * Full-screen rating overlay (provider-owned, one instance near the root —
 * see RatingOverlayContext). Shows the show/performance info, the community
 * rating for reference, a 0–3 star picker (saves immediately), and a reset
 * button when a user override exists.
 */
export function RatingOverlay({ item, onClose }: RatingOverlayProps) {
  const version = useUserRatingsVersion();
  const { setShowRating, setPerformanceRating, resetShowRating, resetPerformanceRating } = useUserRatings();

  const userEntry = useMemo(() => {
    if (!item) return null;
    return item.kind === 'show'
      ? getActiveShowRating(item.date)
      : getActivePerformanceRating(item.songTitle, item.date);
  }, [item, version]);

  const systemStars = useMemo(() => {
    if (!item) return null;
    const tier = item.kind === 'show'
      ? getClassicTier(item.date)
      : getSongPerformanceRating(item.songTitle, item.date);
    return tier ? tierToStars(tier) : null;
  }, [item]);

  if (!item) return null;

  const title = item.kind === 'show' ? (item.venue ?? 'Show') : item.songTitle;
  const subtitle = item.kind === 'show'
    ? [formatDate(item.date), item.location].filter(Boolean).join(' · ')
    : [formatDate(item.date), item.venue].filter(Boolean).join(' · ');

  const handleSelect = (stars: 0 | 1 | 2 | 3) => {
    if (item.kind === 'show') {
      setShowRating(item.date, stars);
    } else {
      setPerformanceRating(item.songTitle, item.date, stars, item.showIdentifier);
    }
  };

  const handleReset = () => {
    haptics.light();
    if (item.kind === 'show') {
      resetShowRating(item.date);
    } else {
      resetPerformanceRating(item.songTitle, item.date);
    }
  };

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.container} testID="rating-overlay">
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={StyleSheet.absoluteFill}>
            <BlurBackground intensity={40} tint="dark" />
          </View>
        </TouchableWithoutFeedback>

        <View style={styles.card}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Close rating overlay"
          >
            <Ionicons name="close" size={26} color={COLORS.textPrimary} />
          </TouchableOpacity>

          <Text style={styles.kicker}>
            {item.kind === 'show' ? 'RATE THIS SHOW' : 'RATE THIS PERFORMANCE'}
          </Text>
          <Text style={styles.title} numberOfLines={2}>{title}</Text>
          {!!subtitle && <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>}

          {systemStars !== null && (
            <View style={styles.communityRow} testID="community-rating-row">
              <Text style={styles.communityLabel}>Community rating</Text>
              <StarRating rating={{ stars: systemStars, isUserRating: false }} size={14} />
            </View>
          )}

          <View style={styles.pickerSection}>
            <StarPicker value={userEntry ? userEntry.stars : null} onSelect={handleSelect} />
          </View>

          {userEntry && (
            <TouchableOpacity
              style={styles.resetButton}
              onPress={handleReset}
              activeOpacity={0.7}
              testID="reset-rating-button"
              accessibilityRole="button"
              accessibilityLabel="Reset to community rating"
            >
              <Text style={styles.resetText}>Reset to community rating</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: COLORS.cardBackground,
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: SPACING.md,
    right: SPACING.md,
    padding: SPACING.xs,
    zIndex: 1,
  },
  kicker: {
    ...TYPOGRAPHY.label,
    color: COLORS.textSecondary,
    letterSpacing: 1.5,
    marginBottom: SPACING.sm,
  },
  title: {
    ...TYPOGRAPHY.heading3,
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  communityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.lg,
  },
  communityLabel: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
  },
  pickerSection: {
    marginTop: SPACING.xl,
    marginBottom: SPACING.lg,
  },
  resetButton: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
  },
  resetText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.accent,
  },
});
