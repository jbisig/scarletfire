import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StyleProp,
  ViewStyle,
  Animated,
  Easing,
  Platform,
  LayoutChangeEvent,
} from 'react-native';
import { COLORS, SPACING, RADIUS, FONTS } from '../constants/theme';

export interface SegmentedTabItem<T extends string = string> {
  key: T;
  label: string;
}

export interface SegmentedTabsProps<T extends string = string> {
  tabs: SegmentedTabItem<T>[];
  activeTab: T;
  onTabChange: (tab: T) => void;
  /** Merged after the base container style — used for the margin differences between screens. */
  containerStyle?: StyleProp<ViewStyle>;
  /** Only FavoritesScreen sets a hint today; omit to match PublicProfileScreen's behavior. */
  getAccessibilityHint?: (tab: T) => string;
}

/** Inset between the container edge and the sliding thumb. */
const THUMB_INSET = 4;

/**
 * Toggle-style tab bar shared by FavoritesScreen and PublicProfileScreen: one
 * container with an accent thumb that springs between segments. Includes the
 * Android `paddingTop: 2` text-baseline hack. Container margins/padding differ
 * per screen, so callers pass those in via `containerStyle`.
 */
export function SegmentedTabs<T extends string = string>({
  tabs,
  activeTab,
  onTabChange,
  containerStyle,
  getAccessibilityHint,
}: SegmentedTabsProps<T>) {
  const activeIndex = Math.max(0, tabs.findIndex((t) => t.key === activeTab));
  const [innerWidth, setInnerWidth] = useState(0);
  const segmentWidth = tabs.length > 0 ? innerWidth / tabs.length : 0;

  const translateX = useRef(new Animated.Value(0)).current;
  // Until the first layout, jump straight to the active segment — a slide on
  // mount would animate from a stale position.
  const hasMeasured = useRef(false);

  useEffect(() => {
    if (segmentWidth <= 0) return;
    const target = activeIndex * segmentWidth;
    if (!hasMeasured.current) {
      hasMeasured.current = true;
      translateX.setValue(target);
      return;
    }
    Animated.timing(translateX, {
      toValue: target,
      duration: 220,
      // Decelerates into place with no overshoot — a smooth settle, not a bounce.
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [activeIndex, segmentWidth, translateX]);

  const handleLayout = (e: LayoutChangeEvent) => {
    setInnerWidth(Math.max(0, e.nativeEvent.layout.width - THUMB_INSET * 2));
  };

  return (
    <View
      style={[styles.tabContainer, containerStyle]}
      accessibilityRole="tablist"
      testID="segmented-tabs"
      onLayout={handleLayout}
    >
      <Animated.View
        testID="segmented-tabs-thumb"
        pointerEvents="none"
        style={[styles.thumb, { width: segmentWidth, transform: [{ translateX }] }]}
      />
      {tabs.map(({ key, label }) => (
        <TouchableOpacity
          key={key}
          style={styles.tab}
          onPress={() => onTabChange(key)}
          activeOpacity={0.7}
          accessibilityRole="tab"
          accessibilityLabel={`${label} tab`}
          accessibilityState={{ selected: activeTab === key }}
          accessibilityHint={getAccessibilityHint?.(key)}
        >
          <Text style={activeTab === key ? styles.activeTabText : styles.inactiveTabText}>
            {label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.cardBackground,
    borderRadius: RADIUS.xl,
    padding: THUMB_INSET,
  },
  thumb: {
    position: 'absolute',
    top: THUMB_INSET,
    bottom: THUMB_INSET,
    left: THUMB_INSET,
    borderRadius: RADIUS.xl - THUMB_INSET,
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
  },
  tab: {
    flex: 1,
    paddingTop: 6,
    paddingBottom: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.xl - THUMB_INSET,
  },
  activeTabText: {
    fontSize: 16,
    fontFamily: FONTS.primarySemiBold,
    fontWeight: '600',
    color: COLORS.textPrimary,
    ...(Platform.OS === 'android' && {
      paddingTop: 2,
    }),
  },
  inactiveTabText: {
    fontSize: 16,
    fontFamily: FONTS.primarySemiBold,
    fontWeight: '600',
    color: COLORS.textSecondary,
    ...(Platform.OS === 'android' && {
      paddingTop: 2,
    }),
  },
});
