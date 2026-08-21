import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '../../constants/theme';
import { haptics } from '../../services/hapticService';

interface FilterPillProps {
  label: string;
  isSelected: boolean;
  isDisabled?: boolean;
  showCheckmark?: boolean;
  count?: number;
  testID?: string;
  onPress: () => void;
}

export const FilterPill = React.memo<FilterPillProps>(function FilterPill({
  label,
  isSelected,
  isDisabled = false,
  showCheckmark = false,
  count,
  testID,
  onPress,
}) {
  const handlePress = () => {
    haptics.light();
    onPress();
  };

  return (
    <TouchableOpacity
      testID={testID}
      style={[
        styles.pill,
        isSelected && styles.pillSelected,
        isDisabled && styles.pillDisabled,
      ]}
      onPress={handlePress}
      disabled={isDisabled}
      accessibilityState={{ selected: isSelected, disabled: !!isDisabled }}
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
      {typeof count === 'number' && (
        <Text style={[styles.count, isSelected && styles.countSelected]}>{count}</Text>
      )}
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
  count: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginLeft: SPACING.xs,
  },
  countSelected: {
    color: '#FFFFFF',
    opacity: 0.85,
  },
});
