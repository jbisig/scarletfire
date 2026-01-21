import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { GratefulDeadShow } from '../types/show.types';
import { formatDate } from '../utils/formatters';
import { usePlayCounts } from '../contexts/PlayCountsContext';
import { useShows } from '../contexts/ShowsContext';
import { StarRating } from './StarRating';
import { COLORS, FONTS } from '../constants/theme';

interface ShowCardProps {
  show: GratefulDeadShow;
  onPress: (show: GratefulDeadShow) => void;
}

/**
 * Show card component for displaying Grateful Dead show information
 * Memoized to prevent unnecessary re-renders in lists
 */
export const ShowCard = React.memo<ShowCardProps>(({ show, onPress }) => {
  const { hasShowBeenPlayed, getShowPlayCount } = usePlayCounts();
  const { getShowDetail, showDetailsCache } = useShows();
  const [playCount, setPlayCount] = useState<number>(0);

  // Calculate play count for this show
  useEffect(() => {
    // Quick check: does show have any played tracks?
    if (!hasShowBeenPlayed(show.primaryIdentifier)) {
      setPlayCount(0);
      return;
    }

    // Check cache first
    const cachedDetails = showDetailsCache.get(show.primaryIdentifier);
    if (cachedDetails) {
      const count = getShowPlayCount(show.primaryIdentifier, cachedDetails.tracks.length);
      setPlayCount(count);
      return;
    }

    // Fetch show details to get track count
    const fetchPlayCount = async () => {
      try {
        const details = await getShowDetail(show.primaryIdentifier);
        const count = getShowPlayCount(show.primaryIdentifier, details.tracks.length);
        setPlayCount(count);
      } catch (error) {
        console.error('Failed to fetch show details for play count:', error);
        setPlayCount(0);
      }
    };

    fetchPlayCount();
  }, [show.primaryIdentifier, hasShowBeenPlayed, showDetailsCache, getShowDetail, getShowPlayCount]);

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress(show)}
      activeOpacity={0.7}
    >
      <View style={styles.contentRow}>
        <View style={styles.infoContainer}>
          {/* Venue name - large and bold */}
          {show.venue && (
            <Text style={styles.venue} numberOfLines={1}>
              {show.venue}
            </Text>
          )}

          {/* Date with stars */}
          <View style={styles.dateRow}>
            <Text style={styles.date}>{formatDate(show.date)}</Text>
            {show.classicTier && (
              <StarRating tier={show.classicTier} size={14} />
            )}
          </View>

          {/* Location */}
          {show.location && (
            <Text style={styles.location} numberOfLines={1}>
              {show.location}
            </Text>
          )}
        </View>

        {/* Play count badge on the right */}
        {playCount > 0 && (
          <View style={styles.playCountBadge}>
            <Text style={styles.playCountText}>
              {playCount} {playCount === 1 ? 'play' : 'plays'}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
});

ShowCard.displayName = 'ShowCard';

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: COLORS.background,
  },
  contentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  infoContainer: {
    flex: 1,
    marginRight: 12,
  },
  venue: {
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: FONTS.primary,
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 2,
  },
  date: {
    fontSize: 14,
    fontFamily: FONTS.secondary,
    color: COLORS.textSecondary,
  },
  location: {
    fontSize: 14,
    fontFamily: FONTS.secondary,
    color: COLORS.textSecondary,
  },
  playCountBadge: {
    backgroundColor: COLORS.cardBackground,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  playCountText: {
    fontSize: 12,
    fontFamily: FONTS.secondary,
    color: COLORS.textSecondary,
  },
});
