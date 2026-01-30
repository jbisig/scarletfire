/**
 * Skeleton Loader Component
 *
 * Animated placeholder component for loading states.
 * Provides visual feedback while content is loading.
 */
import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { COLORS, SPACING, RADIUS } from '../constants/theme';

const { width: screenWidth } = Dimensions.get('window');

interface SkeletonLoaderProps {
  /** The type of skeleton to display */
  variant: 'showCard' | 'songItem';
  /** Number of skeleton items to show */
  count?: number;
}

/**
 * Animated shimmer skeleton loader
 * Use in place of LoadingState for list screens
 */
export const SkeletonLoader = React.memo<SkeletonLoaderProps>(function SkeletonLoader({
  variant,
  count = 8,
}) {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [shimmerAnim]);

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.6],
  });

  const renderShowCardSkeleton = () => (
    <View style={styles.showCard}>
      {/* Venue placeholder */}
      <Animated.View style={[styles.skeletonBox, styles.showCardVenue, { opacity }]} />
      {/* Bottom row */}
      <View style={styles.showCardBottomRow}>
        <View style={styles.showCardInfo}>
          {/* Date row */}
          <Animated.View style={[styles.skeletonBox, styles.showCardDate, { opacity }]} />
          {/* Location */}
          <Animated.View style={[styles.skeletonBox, styles.showCardLocation, { opacity }]} />
        </View>
        {/* Badge placeholder */}
        <Animated.View style={[styles.skeletonBox, styles.showCardBadge, { opacity }]} />
      </View>
    </View>
  );

  const renderSongItemSkeleton = () => (
    <View style={styles.songItem}>
      {/* Song title */}
      <Animated.View style={[styles.skeletonBox, styles.songTitle, { opacity }]} />
      {/* Performance count */}
      <Animated.View style={[styles.skeletonBox, styles.songMeta, { opacity }]} />
    </View>
  );

  const items = Array.from({ length: count }, (_, index) => (
    <View key={index}>
      {variant === 'showCard' ? renderShowCardSkeleton() : renderSongItemSkeleton()}
    </View>
  ));

  return <View style={styles.container}>{items}</View>;
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingTop: SPACING.md,
  },
  skeletonBox: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: RADIUS.xs,
  },
  // Show Card skeleton styles
  showCard: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xxl,
  },
  showCardVenue: {
    height: 22,
    width: '70%',
    marginBottom: SPACING.sm,
  },
  showCardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  showCardInfo: {
    flex: 1,
    marginRight: SPACING.md,
  },
  showCardDate: {
    height: 14,
    width: 140,
    marginBottom: SPACING.xs,
  },
  showCardLocation: {
    height: 14,
    width: 100,
  },
  showCardBadge: {
    height: 24,
    width: 60,
    borderRadius: RADIUS.sm,
  },
  // Song Item skeleton styles
  songItem: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xxl,
  },
  songTitle: {
    height: 18,
    width: '60%',
    marginBottom: SPACING.sm,
  },
  songMeta: {
    height: 14,
    width: 80,
  },
});
