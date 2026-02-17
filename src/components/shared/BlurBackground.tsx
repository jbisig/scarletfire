import React from 'react';
import { View, StyleSheet, Platform, ViewStyle } from 'react-native';

interface BlurBackgroundProps {
  intensity?: number;
  tint?: 'dark' | 'light' | 'default';
  style?: ViewStyle;
  children?: React.ReactNode;
}

export function BlurBackground({ intensity = 24, tint = 'dark', style, children }: BlurBackgroundProps) {
  if (Platform.OS === 'web') {
    // CSS backdrop-filter on web
    const blurAmount = Math.round((intensity / 100) * 20); // Scale to reasonable blur range
    return (
      <View
        style={[
          styles.webBlur,
          {
            // @ts-ignore - web-specific CSS properties
            backdropFilter: `blur(${blurAmount}px)`,
            WebkitBackdropFilter: `blur(${blurAmount}px)`,
          },
          tint === 'dark' && styles.darkTint,
          tint === 'light' && styles.lightTint,
          style,
        ]}
      >
        {children}
      </View>
    );
  }

  if (Platform.OS === 'ios') {
    // Use expo-blur on iOS
    const { BlurView } = require('expo-blur');
    const blurTint = tint === 'dark' ? 'systemThinMaterialDark' : tint === 'light' ? 'systemThinMaterialLight' : 'default';
    return (
      <BlurView intensity={intensity} tint={blurTint} style={[StyleSheet.absoluteFill, style]}>
        {children}
      </BlurView>
    );
  }

  // Android: semi-transparent overlay
  return (
    <View style={[StyleSheet.absoluteFill, styles.androidOverlay, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  webBlur: {
    ...StyleSheet.absoluteFillObject,
  },
  darkTint: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  lightTint: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  androidOverlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
});
