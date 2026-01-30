import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONTS } from '../../constants/theme';

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

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + 16 }]}>
      {/* Reset Button */}
      <TouchableOpacity style={styles.resetButton} onPress={onReset} activeOpacity={0.7}>
        <Ionicons name="refresh" size={16} color={COLORS.textPrimary} />
        <Text style={styles.resetText}>Reset</Text>
      </TouchableOpacity>

      {/* Matching Count */}
      <Text style={styles.matchingText}>{matchingCount} shows</Text>

      {/* Apply Button */}
      <TouchableOpacity style={styles.applyButton} onPress={onApply} activeOpacity={0.7}>
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
    paddingHorizontal: 20,
    paddingTop: 16,
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBackground,
    borderRadius: 50,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 6,
  },
  resetText: {
    fontSize: 15,
    fontWeight: '500',
    fontFamily: FONTS.secondary,
    color: COLORS.textPrimary,
  },
  matchingText: {
    fontSize: 14,
    fontWeight: '400',
    fontFamily: FONTS.secondary,
    color: COLORS.textSecondary,
  },
  applyButton: {
    backgroundColor: COLORS.accent,
    borderRadius: 50,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  applyText: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: FONTS.secondary,
    color: COLORS.textPrimary,
  },
});
