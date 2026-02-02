import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '../constants/theme';

interface ActionPillButtonProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  loading?: boolean;
  fullWidth?: boolean;
}

export const ActionPillButton = React.memo<ActionPillButtonProps>(function ActionPillButton({
  icon,
  label,
  onPress,
  loading = false,
  fullWidth = false,
}) {
  return (
    <TouchableOpacity
      style={[styles.button, fullWidth && styles.fullWidth]}
      onPress={onPress}
      disabled={loading}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: loading }}
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
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.accent,
    paddingVertical: SPACING.md + 2,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.md,
    minHeight: 48,
  },
  fullWidth: {
    flex: 0,
    width: '100%',
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
