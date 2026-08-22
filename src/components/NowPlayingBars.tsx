import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { COLORS } from '../constants/theme';

interface NowPlayingBarsProps {
  /** Frozen at rest height when true (track is current but paused). */
  paused?: boolean;
  color?: string;
  size?: number;
}

// Each bar loops between its own low and high point on its own period, so
// the three never sync up into a mechanical pulse.
const BARS = [
  { low: 0.35, high: 1.0, period: 620 },
  { low: 0.25, high: 0.85, period: 480 },
  { low: 0.45, high: 0.9, period: 740 },
];

/**
 * The "this one is playing" mark for list rows: three bars dancing in the
 * accent colour. Purely decorative — the row's own label says "Now playing".
 */
export const NowPlayingBars = React.memo(function NowPlayingBars({
  paused = false,
  color = COLORS.accent,
  size = 14,
}: NowPlayingBarsProps) {
  const scales = useRef(BARS.map(b => new Animated.Value(b.low))).current;

  useEffect(() => {
    if (paused) {
      const rest = BARS.map((b, i) =>
        Animated.timing(scales[i], { toValue: b.low, duration: 160, useNativeDriver: true }),
      );
      Animated.parallel(rest).start();
      return;
    }
    const loops = BARS.map((b, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(scales[i], {
            toValue: b.high,
            duration: b.period,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(scales[i], {
            toValue: b.low,
            duration: b.period,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
      ),
    );
    loops.forEach(l => l.start());
    return () => loops.forEach(l => l.stop());
  }, [paused, scales]);

  const barWidth = Math.max(2, Math.round(size / 5));
  return (
    <View
      style={[styles.row, { height: size, gap: barWidth }]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {scales.map((scale, i) => (
        <Animated.View
          key={i}
          style={[
            styles.bar,
            {
              width: barWidth,
              height: size,
              backgroundColor: color,
              transform: [{ scaleY: scale }],
            },
          ]}
        />
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    pointerEvents: 'none',
  },
  bar: {
    borderRadius: 1,
    // Grow from the baseline, like a meter, not from the middle.
    transformOrigin: 'bottom',
  },
});
