import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { COLORS } from '../constants/theme';

interface MiniSwitchProps {
  value: boolean;
}

const TRACK_WIDTH = 30;
const TRACK_HEIGHT = 18;
const THUMB = 14;
const INSET = 2;

/**
 * A compact, purely visual switch for use inside a pill or row that is itself
 * the tap target — the parent owns `onPress`, `accessibilityRole="switch"`,
 * and `accessibilityState.checked`; this just makes the affordance obvious.
 * Sized to sit beside 13px label text without growing the pill.
 */
export const MiniSwitch = React.memo(function MiniSwitch({ value }: MiniSwitchProps) {
  const anim = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: value ? 1 : 0,
      duration: 160,
      useNativeDriver: true,
    }).start();
  }, [value, anim]);

  const translateX = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, TRACK_WIDTH - THUMB - INSET * 2],
  });

  return (
    <View
      style={[styles.track, value ? styles.trackOn : styles.trackOff]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Animated.View style={[styles.thumb, { transform: [{ translateX }] }]} />
    </View>
  );
});

const styles = StyleSheet.create({
  track: {
    pointerEvents: 'none',
    width: TRACK_WIDTH,
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    padding: INSET,
    justifyContent: 'center',
  },
  trackOn: {
    backgroundColor: COLORS.accent,
  },
  trackOff: {
    backgroundColor: COLORS.surfaceLight,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    // Keep the thumb travel identical with and without the border.
    padding: INSET - 1,
  },
  thumb: {
    width: THUMB,
    height: THUMB,
    borderRadius: THUMB / 2,
    backgroundColor: COLORS.textPrimary,
  },
});
