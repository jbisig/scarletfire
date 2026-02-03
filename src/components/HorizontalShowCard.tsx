import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';

const FLOWER_IMAGE = require('../../assets/images/flower.png');
import { LinearGradient } from 'expo-linear-gradient';
import { GratefulDeadShow } from '../types/show.types';
import { formatDate, getVenueFromShow } from '../utils/formatters';
import { StarRating } from './StarRating';
import { OfficialReleaseBadge } from './OfficialReleaseBadge';
import { OfficialReleaseModal } from './OfficialReleaseModal';
import { GradientCardBackground } from './GradientCardBackground';
import { getOfficialReleasesForDate } from '../data/officialReleases';
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
  const [modalVisible, setModalVisible] = useState(false);

  const officialReleases = useMemo(() => {
    return getOfficialReleasesForDate(show.date);
  }, [show.date]);

  const handleBadgePress = () => {
    setModalVisible(true);
  };

  const accessibilityLabel = useMemo(() => {
    const venue = getVenueFromShow(show);
    const date = formatDate(show.date);
    const rating = show.classicTier ? `${4 - show.classicTier} star rating` : '';
    const location = show.location || '';
    return `${venue}, ${date}${location ? `, ${location}` : ''}${rating ? `. ${rating}` : ''}`;
  }, [show]);

  return (
    <>
      <TouchableOpacity
        style={styles.container}
        onPress={() => onPress(show)}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint="Double tap to view show details"
      >
        <GradientCardBackground width={LAYOUT.horizontalCardWidth} height={LAYOUT.horizontalCardHeight} seed={show.primaryIdentifier} index={index} color={color} />
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
              {show.classicTier && (
                <StarRating tier={show.classicTier} size={12} />
              )}
            </View>

            {show.location && (
              <Text style={styles.location} numberOfLines={1}>
                {show.location}
              </Text>
            )}
          </View>

          {officialReleases.length > 0 && (
            <View style={styles.badgesRow}>
              <OfficialReleaseBadge
                onPress={handleBadgePress}
                compact
                releaseTitle={officialReleases[0].name}
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
