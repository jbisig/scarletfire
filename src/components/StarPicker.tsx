import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING } from '../constants/theme';
import { haptics } from '../services/hapticService';

interface StarPickerProps {
  value: 0 | 1 | 2 | 3 | null;
  onSelect: (stars: 0 | 1 | 2 | 3) => void;
}

/**
 * 0–3 star picker for the rating overlay. Tapping star N rates N stars;
 * the leading circle button rates 0 (an explicit "no stars" rating).
 */
export function StarPicker({ value, onSelect }: StarPickerProps) {
  const handleSelect = (stars: 0 | 1 | 2 | 3) => {
    haptics.light();
    onSelect(stars);
  };

  return (
    <View style={styles.row}>
      <TouchableOpacity
        style={[styles.zeroButton, value === 0 && styles.zeroButtonSelected]}
        onPress={() => handleSelect(0)}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel="Rate 0 stars"
        accessibilityState={{ selected: value === 0 }}
      >
        <Text style={[styles.zeroText, value === 0 && styles.zeroTextSelected]}>0</Text>
      </TouchableOpacity>
      {([1, 2, 3] as const).map(stars => {
        const filled = value !== null && value >= stars;
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
              color={filled ? COLORS.userRating : COLORS.textSecondary}
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
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: COLORS.textSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  zeroButtonSelected: {
    borderColor: COLORS.userRating,
  },
  zeroText: {
    ...TYPOGRAPHY.heading4,
    color: COLORS.textSecondary,
  },
  zeroTextSelected: {
    color: COLORS.userRating,
  },
});
