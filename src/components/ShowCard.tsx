import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GratefulDeadShow } from '../types/show.types';
import { formatDate } from '../utils/formatters';

interface ShowCardProps {
  show: GratefulDeadShow;
  onPress: (show: GratefulDeadShow) => void;
}

/**
 * Show card component for displaying Grateful Dead show information
 * Memoized to prevent unnecessary re-renders in lists
 */
export const ShowCard = React.memo<ShowCardProps>(({ show, onPress }) => {
  // Render star icons based on tier
  // Tier 1 = 3 stars, Tier 2 = 2 stars, Tier 3 = 1 star
  const renderStars = (tier: 1 | 2 | 3) => {
    const stars = [];
    const starCount = 4 - tier; // tier 1 → 3 stars, tier 2 → 2 stars, tier 3 → 1 star
    for (let i = 0; i < starCount; i++) {
      stars.push(
        <Ionicons
          key={i}
          name="star"
          size={16}
          color="#FFD700"
          style={{ marginRight: 2 }}
        />
      );
    }
    return stars;
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress(show)}
      activeOpacity={0.7}
    >
      <View style={styles.headerRow}>
        <Text style={styles.date}>{formatDate(show.date)}</Text>
        {show.classicTier && (
          <View style={styles.starsContainer}>
            {renderStars(show.classicTier)}
          </View>
        )}
      </View>
      {show.venue && (
        <Text style={styles.venue} numberOfLines={1}>
          {show.venue}
        </Text>
      )}
      {show.location && (
        <Text style={styles.location} numberOfLines={1}>
          {show.location}
        </Text>
      )}
    </TouchableOpacity>
  );
});

ShowCard.displayName = 'ShowCard';

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#2a2a2a',
    marginVertical: 4,
    marginHorizontal: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  date: {
    fontSize: 14,
    color: '#ff6b6b',
    fontWeight: '600',
  },
  starsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  venue: {
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: 'FamiljenGrotesk',
    color: '#ffffff',
    marginBottom: 4,
  },
  location: {
    fontSize: 14,
    color: '#999999',
  },
});
