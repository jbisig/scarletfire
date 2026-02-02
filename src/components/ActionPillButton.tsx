import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '../constants/theme';

interface ActionPillButtonProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
}

export const ActionPillButton = React.memo<ActionPillButtonProps>(function ActionPillButton({
  icon,
  label,
  onPress,
  loading = false,
  disabled = false,
  fullWidth = false,
}) {
  const isDisabled = loading || disabled;

  return (
    <TouchableOpacity
      style={[styles.button, fullWidth && styles.fullWidth, isDisabled && styles.disabled]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: isDisabled }}
    >
      {loading ? (
        <ActivityIndicator size="small" color={COLORS.textPrimary} />
      ) : (
        <View style={styles.content}>
          <Ionicons name={icon} size={20} color={COLORS.textPrimary} />
          <Text style={styles.label}>{label}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.accent,
    paddingVertical: SPACING.md + 2,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.md,
    height: 48,
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  label: {
    ...TYPOGRAPHY.label,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
});
