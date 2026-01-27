import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS } from '../constants/theme';

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
        <Ionicons name="disc" size={12} color="#FFD700" />
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
      <Ionicons name="disc" size={14} color="#FFD700" />
      <Text style={styles.text} numberOfLines={1}>{displayText}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  text: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: FONTS.secondary,
    color: '#FFD700',
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  compactText: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: FONTS.secondary,
    color: '#FFD700',
  },
});
