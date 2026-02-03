import React, { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { RADIUS, BRAND_COLORS } from '../constants/theme';

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

/**
 * A gradient background component for cards.
 */
export const GradientCardBackground = React.memo<GradientCardBackgroundProps>(
  function GradientCardBackground({ width, height, seed = 'default', index, color }) {
    const colors = useMemo(() => {
      // Use explicit color if provided
      if (color === 'blue') return [BRAND_COLORS.gradientBlue, BRAND_COLORS.gradientBlueLight] as const;
      if (color === 'red') return [BRAND_COLORS.gradientRed, BRAND_COLORS.gradientRedLight] as const;

      // Otherwise alternate based on index or seed
      if (index !== undefined) {
        return index % 2 === 0
          ? [BRAND_COLORS.gradientBlue, BRAND_COLORS.gradientBlueLight] as const
          : [BRAND_COLORS.gradientRed, BRAND_COLORS.gradientRedLight] as const;
      }
      return (hashString(seed) & 1) === 0
        ? [BRAND_COLORS.gradientBlue, BRAND_COLORS.gradientBlueLight] as const
        : [BRAND_COLORS.gradientRed, BRAND_COLORS.gradientRedLight] as const;
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
