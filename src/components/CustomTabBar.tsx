import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { COLORS, TYPOGRAPHY, SPACING } from '../constants/theme';
import { haptics } from '../services/hapticService';

const TAB_ICONS: Record<string, { active: keyof typeof Ionicons.glyphMap; inactive: keyof typeof Ionicons.glyphMap }> = {
  ShowsTab: { active: 'albums', inactive: 'albums-outline' },
  SongsTab: { active: 'musical-notes', inactive: 'musical-notes-outline' },
  DiscoverTab: { active: 'compass', inactive: 'compass-outline' },
  FavoritesTab: { active: 'heart', inactive: 'heart-outline' },
};

const TAB_LABELS: Record<string, string> = {
  ShowsTab: 'Shows',
  SongsTab: 'Songs',
  DiscoverTab: 'Discover',
  FavoritesTab: 'Favorites',
};

export function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      {/* Blur background */}
      <BlurView intensity={24} tint="dark" style={StyleSheet.absoluteFill} />

      {/* Semi-transparent overlay */}
      <View style={styles.overlay} />

      {/* Tab buttons */}
      <View style={[styles.tabContainer, { paddingBottom: insets.bottom || 16 }]}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              haptics.selection();
              navigation.navigate(route.name, route.params);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          const icons = TAB_ICONS[route.name] || { active: 'help', inactive: 'help-outline' };
          const iconName = isFocused ? icons.active : icons.inactive;
          const label = TAB_LABELS[route.name] || route.name;
          const color = isFocused ? COLORS.textPrimary : COLORS.textSecondary;

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              testID={(options as { tabBarTestID?: string }).tabBarTestID}
              onPress={onPress}
              onLongPress={onLongPress}
              style={styles.tabButton}
              activeOpacity={0.7}
            >
              <Ionicons name={iconName} size={24} color={color} />
              <Text style={[styles.tabLabel, { color }]}>{label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    overflow: 'hidden',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(18, 18, 18, 0.76)',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingTop: SPACING.md,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
  },
  tabLabel: {
    ...TYPOGRAPHY.captionSmall,
  },
});
