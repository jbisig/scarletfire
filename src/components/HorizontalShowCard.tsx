import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Platform } from 'react-native';

const FLOWER_IMAGE = require('../../assets/images/flower.png');
import { LinearGradient } from 'expo-linear-gradient';
import { GratefulDeadShow } from '../types/show.types';
import { formatDate, getVenueFromShow } from '../utils/formatters';
import { StarRating } from './StarRating';
import { OfficialReleaseBadge } from './OfficialReleaseBadge';
import { OfficialReleaseModal } from './OfficialReleaseModal';
import { GradientCardBackground } from './GradientCardBackground';
import { getOfficialReleasesForDate, pickDisplayRelease } from '../data/officialReleases';
import { useResponsive } from '../hooks/useResponsive';
import { useResolvedShowRating } from '../contexts/UserRatingsContext';
import { TYPOGRAPHY, SPACING, RADIUS, LAYOUT, BRAND_COLORS } from '../constants/theme';

interface HorizontalShowCardProps {
  show: GratefulDeadShow;
  onPress: (show: GratefulDeadShow) => void;
  index?: number;
  color?: 'blue' | 'red';
}

export const HorizontalShowCard = React.memo<HorizontalShowCardProps>(function HorizontalShowCard({
  show,
  onPress,
  index,
  color,
}) {
  const { isDesktop } = useResponsive();
  const [modalVisible, setModalVisible] = useState(false);
  const resolvedRating = useResolvedShowRating(show.date);

  const officialReleases = useMemo(() => {
    return getOfficialReleasesForDate(show.date);
  }, [show.date]);
  const displayRelease = useMemo(() => pickDisplayRelease(officialReleases), [officialReleases]);

  const handleBadgePress = () => {
    setModalVisible(true);
  };

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
    <>
      <TouchableOpacity
        style={[styles.container, isDesktop && styles.containerDesktop]}
        onPress={() => onPress(show)}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint="Double tap to view show details"
      >
        <GradientCardBackground width={isDesktop ? 300 : LAYOUT.horizontalCardWidth} height={isDesktop ? 150 : LAYOUT.horizontalCardHeight} seed={show.primaryIdentifier} index={index} color={color} />
        <Image source={FLOWER_IMAGE} style={styles.flowerImage} />
        <LinearGradient
          colors={['rgba(0,0,0,0.25)', 'rgba(0,0,0,0)']}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.gradient}
        >
          <View style={styles.topContent}>
            <Text style={styles.venue} numberOfLines={1} ellipsizeMode="tail">
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
          </View>

          {displayRelease && (
            <View style={styles.badgesRow}>
              <OfficialReleaseBadge
                onPress={handleBadgePress}
                compact
                alsoOn
                releaseTitle={displayRelease.release.name}
                more={displayRelease.more}
              />
            </View>
          )}
        </LinearGradient>
      </TouchableOpacity>

      <OfficialReleaseModal
        visible={modalVisible}
        releases={officialReleases}
        show={show}
        onClose={() => setModalVisible(false)}
      />
    </>
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
  flowerImage: {
    position: 'absolute',
    bottom: -10,
    right: -10,
    width: 80,
    height: 80,
    opacity: 1,
  },
  gradient: {
    flex: 1,
    padding: SPACING.md,
    justifyContent: 'space-between',
  },
  topContent: {
    // Content aligned to top by default
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
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    flexWrap: 'wrap',
  },
});
