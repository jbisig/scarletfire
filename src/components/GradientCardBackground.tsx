import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { RADIUS } from '../constants/theme';

interface GradientCardBackgroundProps {
  width: number;
  height: number;
  seed?: string;
}

// Simple seeded random number generator
function seededRandom(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash |= 0;
  }

  return () => {
    hash = (hash * 1103515245 + 12345) & 0x7fffffff;
    return (hash % 1000) / 1000;
  };
}

/**
 * A gradient background component that creates a colorful radial gradient effect
 * using positioned color blobs, approximating the CSS radial-gradient pattern.
 * Pass a seed prop to get consistent but unique gradients per card.
 */
export const GradientCardBackground = React.memo<GradientCardBackgroundProps>(
  function GradientCardBackground({ width, height, seed = 'default' }) {
    // Colors from the CSS gradient
    const BLUE = '#0F5BA8';
    const RED = '#ED1F27';
    const WHITE = '#ffffff';

    // Generate randomized positions based on seed
    const positions = useMemo(() => {
      const random = seededRandom(seed);

      // Base positions with randomization (+/- 20%)
      const randomize = (base: number, variance = 0.2) => {
        const offset = (random() - 0.5) * 2 * variance;
        return Math.max(0.1, Math.min(0.9, base + offset));
      };

      return {
        blue1: { x: randomize(0.21), y: randomize(0.66) },
        red1: { x: randomize(0.75), y: randomize(0.81) },
        red2: { x: randomize(0.35), y: randomize(0.30) },
        blue2: { x: randomize(0.71), y: randomize(0.35) },
        white: { x: randomize(0.54), y: randomize(0.60) },
      };
    }, [seed]);

    // Blob size relative to card dimensions
    const blobSize = Math.max(width, height) * 0.8;

    return (
      <View style={[styles.container, { width, height }]}>
        {/* Base black background */}
        <View style={[styles.base, { width, height }]} />

        {/* Blue blob 1 */}
        <View
          style={[
            styles.blob,
            {
              backgroundColor: BLUE,
              width: blobSize,
              height: blobSize,
              left: width * positions.blue1.x - blobSize / 2,
              top: height * positions.blue1.y - blobSize / 2,
            },
          ]}
        />

        {/* Red blob 1 */}
        <View
          style={[
            styles.blob,
            {
              backgroundColor: RED,
              width: blobSize,
              height: blobSize,
              left: width * positions.red1.x - blobSize / 2,
              top: height * positions.red1.y - blobSize / 2,
            },
          ]}
        />

        {/* Red blob 2 */}
        <View
          style={[
            styles.blob,
            {
              backgroundColor: RED,
              width: blobSize,
              height: blobSize,
              left: width * positions.red2.x - blobSize / 2,
              top: height * positions.red2.y - blobSize / 2,
            },
          ]}
        />

        {/* Blue blob 2 */}
        <View
          style={[
            styles.blob,
            {
              backgroundColor: BLUE,
              width: blobSize,
              height: blobSize,
              left: width * positions.blue2.x - blobSize / 2,
              top: height * positions.blue2.y - blobSize / 2,
            },
          ]}
        />

        {/* White blob */}
        <View
          style={[
            styles.blob,
            {
              backgroundColor: WHITE,
              width: blobSize * 0.6,
              height: blobSize * 0.6,
              left: width * positions.white.x - (blobSize * 0.6) / 2,
              top: height * positions.white.y - (blobSize * 0.6) / 2,
              opacity: 0.5,
            },
          ]}
        />

        {/* Blur overlay to blend the colors */}
        <BlurView intensity={80} style={styles.blur} tint="default" />
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    overflow: 'hidden',
    borderRadius: RADIUS.md,
  },
  base: {
    position: 'absolute',
    backgroundColor: '#000000',
  },
  blob: {
    position: 'absolute',
    borderRadius: 9999,
    opacity: 0.85,
  },
  blur: {
    ...StyleSheet.absoluteFillObject,
  },
});
