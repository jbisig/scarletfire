import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '../constants/theme';
import { haptics } from '../services/hapticService';

export interface SortPillButtonProps {
  label: string;
  /** Arrow direction icon. Defaults to 'arrow-down' */
  icon?: 'arrow-down' | 'arrow-up' | 'chevron-down';
  onPress: () => void;
  /** Whether the button is in active/selected state */
  isActive?: boolean;
  testID?: string;
}

/**
 * Reusable pill-shaped sort button with label and directional icon.
 * Used for triggering sort dropdowns and indicating sort direction.
 */
export const SortPillButton = React.memo<SortPillButtonProps>(function SortPillButton({
  label,
  icon = 'arrow-down',
  onPress,
  isActive = false,
  testID,
}) {
  const handlePress = () => {
    haptics.light();
    onPress();
  };

  return (
    <TouchableOpacity
      style={[styles.button, isActive && styles.buttonActive]}
      onPress={handlePress}
      activeOpacity={0.7}
      testID={testID}
    >
      <Text style={[styles.label, isActive && styles.labelActive]}>
        {label}
      </Text>
      <Ionicons
        name={icon}
        size={18}
        color={isActive ? COLORS.textPrimary : COLORS.accent}
      />
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBackground,
    borderRadius: RADIUS.xl,
    paddingHorizontal: SPACING.lg,
    height: 48,
    gap: SPACING.sm - 2,
  },
  buttonActive: {
    backgroundColor: COLORS.accent,
  },
  label: {
    ...TYPOGRAPHY.labelLarge,
    fontWeight: '500',
    color: COLORS.textHint,
  },
  labelActive: {
    color: COLORS.textPrimary,
  },
});
