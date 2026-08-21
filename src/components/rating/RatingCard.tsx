import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ImageBackground } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { RatingItem } from '../../contexts/RatingOverlayContext';
import { formatDate } from '../../utils/formatters';
import { StarPicker } from '../StarPicker';
import { COLORS, FONTS, TYPOGRAPHY, SPACING } from '../../constants/theme';
import { getShareBackground } from '../share/shareBackgrounds';

interface RatingCardProps {
  item: RatingItem;
  bgIndex: number;
  /** System (community) rating in stars, or null when none exists. */
  systemStars: 1 | 2 | 3 | null;
  /** Current user rating (0–3) or null when no override exists. */
  userStars: 0 | 1 | 2 | 3 | null;
  onSelect: (stars: 0 | 1 | 2 | 3) => void;
  onReset: () => void;
}

/**
 * The rating tray's entire body: same visual container as ShareCard
 * (image background, gradient, 32px radius) but rating-focused — no logo,
 * with the show/performance info, the community rating (or "No community
 * rating" placeholder), the 0–3 star picker, and a fixed-height reset slot
 * all inside the card.
 */
export function RatingCard({ item, bgIndex, systemStars, userStars, onSelect, onReset }: RatingCardProps) {
  const bgSource = getShareBackground(bgIndex);

  const kicker = item.kind === 'show' ? 'RATE THIS SHOW' : 'RATE THIS PERFORMANCE';
  const title = item.kind === 'show' ? (item.venue ?? 'Show') : item.songTitle;
  const subtitle =
    item.kind === 'show'
      ? [formatDate(item.date), item.location].filter(Boolean).join(' · ')
      : [formatDate(item.date), item.venue].filter(Boolean).join(' · ');

  // No community rating counts as 0 stars so the label stays consistent.
  const communityStarCount = systemStars ?? 0;
  const resetLabel = `Reset to community rating (${communityStarCount} ${communityStarCount === 1 ? 'star' : 'stars'})`;

  return (
    <View style={styles.card}>
      <ImageBackground source={bgSource} style={styles.bg} imageStyle={styles.bgImage}>
        <LinearGradient
          colors={['rgba(0, 0, 0, 0.45)', 'rgba(0, 0, 0, 0.65)', 'rgba(0, 0, 0, 0.85)']}
          locations={[0, 0.5, 1]}
          style={styles.gradient}
        />
        <View style={styles.content}>
          <Text style={styles.kicker}>{kicker}</Text>
          <View style={styles.info}>
            <Text style={styles.title} numberOfLines={2}>
              {title}
            </Text>
            {!!subtitle && (
              <Text style={styles.subtitle} numberOfLines={1}>
                {subtitle}
              </Text>
            )}
          </View>

          {/* The picker shows the community rating pre-filled in red until
              the user rates, then the user's rating in gold. */}
          <View style={styles.pickerSection}>
            <StarPicker value={userStars} communityStars={systemStars} onSelect={onSelect} />
          </View>

          {/* Fixed-height slot so the card doesn't grow when the reset button appears */}
          <View style={styles.resetSlot}>
            {userStars !== null && (
              <TouchableOpacity
                style={styles.resetButton}
                onPress={onReset}
                activeOpacity={0.7}
                testID="reset-rating-button"
                accessibilityRole="button"
                accessibilityLabel={resetLabel}
              >
                <Text style={styles.resetText}>{resetLabel}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    borderRadius: 32,
    overflow: 'hidden',
    backgroundColor: '#121212',
  },
  bg: {
    width: '100%',
  },
  bgImage: {
    borderRadius: 32,
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '100%',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  content: {
    padding: 24,
    gap: 32,
  },
  kicker: {
    color: '#fff',
    fontSize: 12,
    fontFamily: FONTS.primarySemiBold,
    fontWeight: '600',
    letterSpacing: 1.5,
    opacity: 0.8,
  },
  info: {
    gap: 4,
  },
  title: {
    color: '#fff',
    fontSize: 22,
    fontFamily: FONTS.primary,
    fontWeight: '500',
  },
  subtitle: {
    color: '#fff',
    fontSize: 15,
    fontFamily: FONTS.primary,
    fontWeight: '500',
    opacity: 0.9,
  },
  pickerSection: {
    marginTop: SPACING.sm,
  },
  resetSlot: {
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
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
