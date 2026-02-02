import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { GratefulDeadShow } from '../types/show.types';
import { formatDate, getVenueFromShow } from '../utils/formatters';
import { StarRating } from './StarRating';
import { OfficialReleaseBadge } from './OfficialReleaseBadge';
import { OfficialReleaseModal } from './OfficialReleaseModal';
import { GradientCardBackground } from './GradientCardBackground';
import { getOfficialReleasesForDate } from '../data/officialReleases';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '../constants/theme';

// Simple hash function to determine gradient direction
function shouldFlipGradient(seed: string): boolean {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash |= 0;
  }
  return (hash & 1) === 1; // Check if odd
}

const CARD_WIDTH = 200;
const CARD_HEIGHT = 100;

interface HorizontalShowCardProps {
  show: GratefulDeadShow;
  onPress: (show: GratefulDeadShow) => void;
}

export const HorizontalShowCard = React.memo<HorizontalShowCardProps>(function HorizontalShowCard({
  show,
  onPress,
}) {
  const [modalVisible, setModalVisible] = useState(false);

  const officialReleases = useMemo(() => {
    return getOfficialReleasesForDate(show.date);
  }, [show.date]);

  const flipGradient = useMemo(() => shouldFlipGradient(show.primaryIdentifier), [show.primaryIdentifier]);

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
        <GradientCardBackground width={CARD_WIDTH} height={CARD_HEIGHT} seed={show.primaryIdentifier} />
        <LinearGradient
          colors={['rgba(0,0,0,0.25)', 'rgba(0,0,0,0)']}
          start={{ x: flipGradient ? 1 : 0, y: 0.5 }}
          end={{ x: flipGradient ? 0 : 1, y: 0.5 }}
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
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
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
    color: 'rgba(255, 255, 255, 0.85)',
  },
  location: {
    ...TYPOGRAPHY.caption,
    color: 'rgba(255, 255, 255, 0.85)',
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    flexWrap: 'wrap',
  },
});
