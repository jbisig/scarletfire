import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '../../constants/theme';
import { haptics } from '../../services/hapticService';

interface FilterActionBarProps {
  matchingCount: number;
  onReset: () => void;
  onApply: () => void;
}

export const FilterActionBar = React.memo<FilterActionBarProps>(function FilterActionBar({
  matchingCount,
  onReset,
  onApply,
}) {
  const insets = useSafeAreaInsets();

  const handleReset = () => {
    haptics.light();
    onReset();
  };

  const handleApply = () => {
    haptics.medium();
    onApply();
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + 16 }]}>
      {/* Reset Button */}
      <TouchableOpacity style={styles.resetButton} onPress={handleReset} activeOpacity={0.7}>
        <Ionicons name="refresh" size={16} color={COLORS.textPrimary} />
        <Text style={styles.resetText}>Reset</Text>
      </TouchableOpacity>

      {/* Matching Count */}
      <Text style={styles.matchingText}>{matchingCount} shows</Text>

      {/* Apply Button */}
      <TouchableOpacity style={styles.applyButton} onPress={handleApply} activeOpacity={0.7}>
        <Text style={styles.applyText}>Apply</Text>
      </TouchableOpacity>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.lg,
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBackground,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    gap: SPACING.sm - 2,
  },
  resetText: {
    ...TYPOGRAPHY.bodySmall,
    fontSize: 15,
    fontWeight: '500',
  },
  matchingText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
  },
  applyButton: {
    backgroundColor: COLORS.accent,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.xxl,
    paddingVertical: SPACING.md,
  },
  applyText: {
    ...TYPOGRAPHY.bodySmall,
    fontSize: 15,
    fontWeight: '600',
  },
});
