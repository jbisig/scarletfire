import React, { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { RADIUS } from '../constants/theme';

interface GradientCardBackgroundProps {
  width: number;
  height: number;
  seed?: string;
  index?: number;
  color?: 'blue' | 'red';
}

// Simple hash function to get a number from a string
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

const BLUE = '#0F5BA8';
const BLUE_LIGHT = '#2A7FD0';
const RED = '#ED1F27';
const RED_LIGHT = '#F54049';

/**
 * A gradient background component for cards.
 */
export const GradientCardBackground = React.memo<GradientCardBackgroundProps>(
  function GradientCardBackground({ width, height, seed = 'default', index, color }) {
    const colors = useMemo(() => {
      // Use explicit color if provided
      if (color === 'blue') return [BLUE, BLUE_LIGHT] as const;
      if (color === 'red') return [RED, RED_LIGHT] as const;

      // Otherwise alternate based on index or seed
      if (index !== undefined) {
        return index % 2 === 0 ? [BLUE, BLUE_LIGHT] as const : [RED, RED_LIGHT] as const;
      }
      return (hashString(seed) & 1) === 0 ? [BLUE, BLUE_LIGHT] as const : [RED, RED_LIGHT] as const;
    }, [seed, index, color]);

    return (
      <LinearGradient
        colors={colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.container,
          { width, height },
        ]}
      />
    );
  }
);

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    borderRadius: RADIUS.md,
  },
});
