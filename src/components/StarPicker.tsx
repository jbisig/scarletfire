import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING } from '../constants/theme';
import { haptics } from '../services/hapticService';

interface StarPickerProps {
  /** The user's rating, or null when no override exists. */
  value: 0 | 1 | 2 | 3 | null;
  /** Community rating shown pre-filled in red when the user hasn't rated. */
  communityStars?: 1 | 2 | 3 | null;
  onSelect: (stars: 0 | 1 | 2 | 3) => void;
}

/**
 * 0–3 star picker for the rating tray. The picker itself displays the
 * current resolved state: the community rating pre-filled in red until the
 * user rates, then the user's rating in gold. Tapping star N rates N stars;
 * the leading struck-through star rates 0 (an explicit "no stars" rating).
 */
export function StarPicker({ value, communityStars = null, onSelect }: StarPickerProps) {
  const handleSelect = (stars: 0 | 1 | 2 | 3) => {
    haptics.light();
    onSelect(stars);
  };

  // What the stars show: the user's rating when set, else the community's.
  const isUserValue = value !== null;
  const displayStars = isUserValue ? value : (communityStars ?? 0);
  const fillColor = isUserValue ? COLORS.userRating : COLORS.accent;

  return (
    <View style={styles.row}>
      <TouchableOpacity
        style={styles.zeroButton}
        onPress={() => handleSelect(0)}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel="Rate 0 stars"
        accessibilityState={{ selected: value === 0 }}
      >
        <MaterialCommunityIcons
          name={value === 0 ? 'star-off' : 'star-off-outline'}
          size={44}
          color={value === 0 ? COLORS.userRating : COLORS.textSecondary}
        />
      </TouchableOpacity>
      {([1, 2, 3] as const).map(stars => {
        const filled = displayStars >= stars;
        return (
          <TouchableOpacity
            key={stars}
            style={styles.starButton}
            onPress={() => handleSelect(stars)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={`Rate ${stars} ${stars === 1 ? 'star' : 'stars'}`}
            accessibilityState={{ selected: value === stars }}
          >
            <Ionicons
              name={filled ? 'star' : 'star-outline'}
              size={44}
              color={filled ? fillColor : COLORS.textSecondary}
            />
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.md,
  },
  starButton: {
    padding: SPACING.xs,
  },
  zeroButton: {
    padding: SPACING.xs,
    marginRight: SPACING.sm,
  },
});
