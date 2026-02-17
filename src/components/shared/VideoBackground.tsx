import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../../constants/theme';

interface VideoBackgroundProps {
  source: number | { uri: string };
  videoId: string;
  shouldPlay?: boolean;
  onError?: (error: string) => void;
  children?: React.ReactNode;
}

export function VideoBackground({ source, videoId, shouldPlay = true, onError, children }: VideoBackgroundProps) {
  if (Platform.OS === 'web') {
    // On web, use a gradient background instead of video for performance
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={[COLORS.backgroundSecondary, COLORS.background]}
          style={StyleSheet.absoluteFill}
        />
        {children}
      </View>
    );
  }

  // Native: use expo-av Video
  const { Video, ResizeMode } = require('expo-av');
  return (
    <View style={styles.container}>
      <Video
        key={`video-${videoId}`}
        source={source}
        style={StyleSheet.absoluteFillObject}
        resizeMode={ResizeMode.COVER}
        shouldPlay={shouldPlay}
        isLooping
        isMuted
        onError={onError}
      />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
  },
});
