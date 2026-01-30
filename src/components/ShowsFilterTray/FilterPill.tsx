import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '../../constants/theme';

interface FilterPillProps {
  label: string;
  isSelected: boolean;
  isDisabled?: boolean;
  showCheckmark?: boolean;
  onPress: () => void;
}

export const FilterPill = React.memo<FilterPillProps>(function FilterPill({
  label,
  isSelected,
  isDisabled = false,
  showCheckmark = false,
  onPress,
}) {
  return (
    <TouchableOpacity
      style={[
        styles.pill,
        isSelected && styles.pillSelected,
        isDisabled && styles.pillDisabled,
      ]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
    >
      {showCheckmark && isSelected && (
        <Ionicons name="checkmark" size={14} color={COLORS.textPrimary} style={styles.checkmark} />
      )}
      <Text
        style={[
          styles.pillText,
          isSelected && styles.pillTextSelected,
          isDisabled && styles.pillTextDisabled,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBackground,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    marginRight: SPACING.sm - 2,
    marginBottom: SPACING.sm,
  },
  pillSelected: {
    backgroundColor: COLORS.accent,
  },
  pillDisabled: {
    opacity: 0.4,
  },
  pillText: {
    ...TYPOGRAPHY.label,
    fontWeight: '500',
  },
  pillTextSelected: {
    color: COLORS.textPrimary,
  },
  pillTextDisabled: {
    color: COLORS.textSecondary,
  },
  checkmark: {
    marginRight: SPACING.xs,
  },
});
