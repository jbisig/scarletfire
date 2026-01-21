import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { FONTS } from '../constants/theme';

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
      <BlurView intensity={10} tint="dark" style={StyleSheet.absoluteFill} />

      {/* Gradient overlay */}
      <LinearGradient
        colors={['rgba(18, 18, 18, 0)', 'rgba(18, 18, 18, 0.76)']}
        style={StyleSheet.absoluteFill}
      />

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
          const color = isFocused ? '#FFFFFF' : '#999999';

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              testID={options.tabBarTestID}
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
  tabContainer: {
    flexDirection: 'row',
    paddingTop: 12,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  tabLabel: {
    fontSize: 10,
    fontFamily: FONTS.secondary,
  },
});
