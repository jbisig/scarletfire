import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ShareButtonProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  bgColor: string;
  onPress: () => void;
}

/**
 * Single destination button in the share tray: a colored circle with
 * an icon and a label below. Four of these sit in a row inside the
 * native tray (Copy link / WhatsApp / Instagram / Messages). Layout
 * matches Figma 138:287 / 138:324.
 */
export function ShareButton({ icon, label, bgColor, onPress }: ShareButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={styles.container}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <View style={[styles.circle, { backgroundColor: bgColor }]}>
        <Ionicons name={icon} size={28} color="#fff" />
      </View>
      <Text style={styles.label} numberOfLines={1}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 8,
    width: 72,
  },
  circle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
});
