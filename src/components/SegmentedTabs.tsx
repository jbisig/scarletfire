import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { Platform } from 'react-native';
import { COLORS, SPACING, RADIUS } from '../constants/theme';

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

/**
 * Pill tab bar shared by FavoritesScreen and PublicProfileScreen, including the
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
  return (
    <View style={[styles.tabContainer, containerStyle]} accessibilityRole="tablist">
      {tabs.map(({ key, label }) => (
        <TouchableOpacity
          key={key}
          style={[styles.tab, activeTab === key ? styles.activeTab : styles.inactiveTab]}
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
    gap: SPACING.sm,
  },
  tab: {
    flex: 1,
    paddingTop: 6,
    paddingBottom: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.xl,
  },
  activeTab: {
    backgroundColor: COLORS.accent,
  },
  inactiveTab: {
    backgroundColor: COLORS.cardBackground,
  },
  activeTabText: {
    fontSize: 16,
    fontFamily: 'FamiljenGrotesk',
    fontWeight: '600',
    color: COLORS.textPrimary,
    ...(Platform.OS === 'android' && {
      paddingTop: 2,
    }),
  },
  inactiveTabText: {
    fontSize: 16,
    fontFamily: 'FamiljenGrotesk',
    fontWeight: '600',
    color: COLORS.textSecondary,
    ...(Platform.OS === 'android' && {
      paddingTop: 2,
    }),
  },
});
