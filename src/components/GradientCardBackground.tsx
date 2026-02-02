import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
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
const RED = '#ED1F27';

/**
 * A solid color background component that alternates between blue and red.
 */
export const GradientCardBackground = React.memo<GradientCardBackgroundProps>(
  function GradientCardBackground({ width, height, seed = 'default', index, color }) {
    const backgroundColor = useMemo(() => {
      // Use explicit color if provided
      if (color === 'blue') return BLUE;
      if (color === 'red') return RED;

      // Otherwise alternate based on index or seed
      if (index !== undefined) {
        return index % 2 === 0 ? BLUE : RED;
      }
      return (hashString(seed) & 1) === 0 ? BLUE : RED;
    }, [seed, index, color]);

    return (
      <View
        style={[
          styles.container,
          { width, height, backgroundColor },
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
