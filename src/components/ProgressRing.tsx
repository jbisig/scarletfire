import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';

interface ProgressRingProps {
  /** Outer diameter in points. */
  size: number;
  /** Stroke width of the ring. */
  thickness: number;
  /** 0..1; values outside the range are clamped. */
  progress: number;
  /** Arc (progress) color. */
  color: string;
  /** Full-circle track color behind the arc. */
  trackColor: string;
  /** Rendered centered inside the ring (e.g. a small icon). */
  children?: React.ReactNode;
}

/**
 * A circular progress ring in pure React Native views — no SVG dependency.
 *
 * Technique: two full-size circles whose borders are colored on exactly two
 * adjacent sides (a half-ring each, since a circle's border quadrants split
 * on the 45° diagonals), each clipped to one half of the ring and rotated by
 * the sweep angle. The right clip reveals 0–180° of progress (from 12
 * o'clock, clockwise), the left clip the remaining 180–360°.
 */
export function ProgressRing({ size, thickness, progress, color, trackColor, children }: ProgressRingProps) {
  const deg = Math.max(0, Math.min(1, progress)) * 360;
  const rightDeg = Math.min(deg, 180);
  const leftDeg = Math.max(deg - 180, 0);
  const half = size / 2;

  const circle: ViewStyle = {
    position: 'absolute',
    width: size,
    height: size,
    borderRadius: half,
    borderWidth: thickness,
  };

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View style={[circle, { borderColor: trackColor }]} />
      {deg > 0 ? (
        // Right half: a left-half-ring piece rotated clockwise into view.
        <View style={[styles.clip, { left: half, width: half, height: size }]}>
          <View
            testID="progress-ring-arc"
            style={[
              circle,
              {
                left: -half,
                borderColor: 'transparent',
                borderBottomColor: color,
                borderLeftColor: color,
                transform: [{ rotate: `${45 + rightDeg}deg` }],
              },
            ]}
          />
        </View>
      ) : null}
      {deg > 180 ? (
        // Left half: a right-half-ring piece rotated on past 6 o'clock.
        <View style={[styles.clip, { left: 0, width: half, height: size }]}>
          <View
            testID="progress-ring-arc"
            style={[
              circle,
              {
                left: 0,
                borderColor: 'transparent',
                borderTopColor: color,
                borderRightColor: color,
                transform: [{ rotate: `${45 + leftDeg}deg` }],
              },
            ]}
          />
        </View>
      ) : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  clip: {
    position: 'absolute',
    overflow: 'hidden',
  },
});
