import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '../constants/theme';

interface OfficialReleaseBadgeProps {
  onPress: () => void;
  compact?: boolean;  // Smaller version for ShowCard
  releaseTitle?: string;  // Display actual release name instead of "Official Release"
}

/**
 * Badge component that indicates a show has an official release
 * Tapping opens the OfficialReleaseModal
 */
export const OfficialReleaseBadge: React.FC<OfficialReleaseBadgeProps> = ({
  onPress,
  compact = false,
  releaseTitle,
}) => {
  const fullText = releaseTitle || 'Official Release';
  const displayText = fullText.length > 25 ? `${fullText.slice(0, 25)}...` : fullText;

  if (compact) {
    return (
      <TouchableOpacity
        style={styles.compactContainer}
        onPress={onPress}
        activeOpacity={0.7}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="disc" size={12} color={COLORS.accent} />
        <Text style={styles.compactText} numberOfLines={1}>{displayText}</Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Ionicons name="disc" size={14} color={COLORS.accent} />
      <Text style={styles.text} numberOfLines={1}>{displayText}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.accentTransparent,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    gap: SPACING.sm - 2,
  },
  text: {
    ...TYPOGRAPHY.labelSmall,
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.accent,
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.accentTransparent,
    paddingHorizontal: 10,
    paddingVertical: SPACING.sm - 2,
    borderRadius: RADIUS.full,
    gap: SPACING.xs,
    flexShrink: 1,
    minWidth: 0,
  },
  compactText: {
    ...TYPOGRAPHY.labelSmall,
    fontWeight: '600',
    color: COLORS.accent,
    flexShrink: 1,
  },
});
